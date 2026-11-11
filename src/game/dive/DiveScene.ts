import Phaser from 'phaser';
import { paintCaustics, paintDarkness, paintRov, paintSeabed, makeTexSet, DIVE_THEMES, type DiveTheme } from './scenery';
import { hazardsFor, paintCreature, paintHazardGlow, type HazardZone } from './hazards';
import { surface } from '../art/painter';

export interface DiveResult {
  themeId: DiveTheme['id'];
  depthM: number;
  samples: number;
  data: number;
  discoveries: string[];
  hullDamage: number;
  batteryUsed: number;
}

export interface DiveHud {
  depthM: number;
  targetDepthM: number;
  battery: number;
  hull: number;
  samples: number;
  data: number;
  tether: number;
  lights: boolean;
  sonarReady: boolean;
  warning: string | null;
  discoveries: string[];
}

const WORLD_W = 900;
const WORLD_H = 1800;
const START_Y = 140;
const FLOOR_Y = 1600;

interface Pickup {
  sprite: Phaser.GameObjects.Image;
  kind: 'sample' | 'clue';
  id: string;
  taken: boolean;
}

/**
 * The dive: a real, controllable ROV descent. Movement, battery, tether, lights,
 * sonar, pickups and hazards all feed back into the station simulation.
 */
export class DiveScene extends Phaser.Scene {
  private theme!: DiveTheme;
  private rov!: Phaser.GameObjects.Image;
  private dark!: Phaser.GameObjects.Image;
  private caustics!: Phaser.GameObjects.TileSprite;
  private pickups: Pickup[] = [];
  private zones: HazardZone[] = [];
  private creatures: Array<{
    sprite: Phaser.GameObjects.Image;
    vx: number;
    vy: number;
    kind: number;
    scanned: boolean;
    phase: number;
  }> = [];
  private zoneWarning = '';
  private target = new Phaser.Math.Vector2(0, 0);
  private velocity = new Phaser.Math.Vector2(0, 0);
  private battery = 100;
  private hull = 100;
  private samples = 0;
  private dataPoints = 0;
  private discoveries: string[] = [];
  private lightsOn = true;
  private sonarUntil = 0;
  private tetherStrain = 0;
  private startedAt = 0;
  private ended = false;
  private hudTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('dive');
  }

  init(data?: { themeId?: DiveTheme['id']; battery?: number; hull?: number }): void {
    const themeId = data?.themeId ?? (this.registry.get('diveTheme') as DiveTheme['id']) ?? 'canyon';
    const battery = data?.battery ?? (this.registry.get('diveBattery') as number) ?? 100;
    const hull = data?.hull ?? (this.registry.get('diveHull') as number) ?? 100;
    this.theme = DIVE_THEMES.find((entry) => entry.id === themeId) ?? DIVE_THEMES[0]!;
    this.battery = Math.max(12, battery);
    this.hull = Math.max(20, hull);
    this.pickups = [];
    this.zones = [];
    this.creatures = [];
    this.zoneWarning = '';
    this.samples = 0;
    this.dataPoints = 0;
    this.discoveries = [];
    this.lightsOn = true;
    this.sonarUntil = 0;
    this.tetherStrain = 0;
    this.ended = false;
    this.startedAt = 0;
  }

  preload(): void {
    this.load.image('tex-seabed', 'tex/seabed-a.jpg');
    this.load.image('tex-cliff', 'tex/rock-cliff.jpg');
    this.load.image('tex-boulder', 'tex/rock-boulder.jpg');
    this.load.image('tex-plates', 'tex/hull-plates.jpg');
    this.load.image('tex-rust', 'tex/rust-steel.jpg');
    this.load.image('tex-walkway', 'tex/walkway.jpg');
  }

  create(): void {
    this.makeTextures();

    const seabed = this.textures.exists('seabed')
      ? 'seabed'
      : 'seabed';
    this.add.image(0, 0, seabed).setOrigin(0, 0).setDepth(0);

    this.spawnPickups();

    this.rov = this.add.image(WORLD_W / 2, START_Y, 'rov').setDepth(5).setScale(1.9);
    this.tweens.add({
      targets: this.rov,
      angle: { from: -1.5, to: 1.5 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.caustics = this.add
      .tileSprite(0, 0, WORLD_W, WORLD_H, 'caustics')
      .setOrigin(0, 0)
      .setDepth(2)
      .setAlpha(0.22);
    this.dark = this.add.image(0, 0, 'darkness').setScrollFactor(0).setDepth(8).setScale(2.4);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.startFollow(this.rov, true, 0.12, 0.12);
    cam.setZoom(this.scale.width < 700 ? 1.7 : 1.9);

    this.target.set(this.rov.x, this.rov.y);


    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const step = 80;
      if (event.key === 'ArrowUp' || event.key === 'w') this.target.y -= step;
      if (event.key === 'ArrowDown' || event.key === 's') this.target.y += step;
      if (event.key === 'ArrowLeft' || event.key === 'a') this.target.x -= step;
      if (event.key === 'ArrowRight' || event.key === 'd') this.target.x += step;
    });

    this.makeLife();
    this.makeHazards();
    this.makeCreatures();

    this.startedAt = this.time.now;
    this.hudTimer = this.time.addEvent({ delay: 120, loop: true, callback: () => this.emitHud() });
    this.emitHud();

    // The React layer talks to the scene through window events: it survives
    // StrictMode remounts and never depends on a stale ref.
    const onMove = (event: Event) => {
      const detail = (event as CustomEvent<{ nx: number; ny: number }>).detail;
      if (detail) this.moveToNormalized(detail.nx, detail.ny);
    };
    const onLights = () => this.toggleLights();
    const onSonar = () => this.ping();
    const onSurface = () => this.requestSurface();
    window.addEventListener('dive:move', onMove);
    window.addEventListener('dive:lights', onLights);
    window.addEventListener('dive:sonar', onSonar);
    window.addEventListener('dive:surface', onSurface);
    this.events.once('shutdown', () => {
      window.removeEventListener('dive:move', onMove);
      window.removeEventListener('dive:lights', onLights);
      window.removeEventListener('dive:sonar', onSonar);
      window.removeEventListener('dive:surface', onSurface);
    });

  }

  private makeTextures(): void {
    if (!this.textures.exists('rov')) {
      this.textures.addCanvas('rov', paintRov());
    }
    if (!this.textures.exists('darkness')) {
      this.textures.addCanvas('darkness', paintDarkness(512));
    }
    if (!this.textures.exists('seabed')) {
      const img = (key: string) => {
        const src = this.textures.get(key).getSourceImage();
        return src instanceof HTMLImageElement ? src : undefined;
      };
      const tex = makeTexSet({
        seabed: img('tex-seabed'),
        cliff: img('tex-cliff'),
        boulder: img('tex-boulder'),
        plates: img('tex-plates'),
        rust: img('tex-rust'),
        walkway: img('tex-walkway'),
      });
      this.textures.addCanvas('seabed', paintSeabed(this.theme, WORLD_W, WORLD_H, tex));
    }
    if (!this.textures.exists('caustics')) {
      this.textures.addCanvas('caustics', paintCaustics(256));
    }
    if (!this.textures.exists('pickup-sample')) {
      // a soft biological glow with a bright core, so it reads at a glance
      const { canvas, ctx } = surface(24, 24);
      const halo = ctx.createRadialGradient(12, 12, 1, 12, 12, 12);
      halo.addColorStop(0, 'rgba(160, 255, 205, 0.85)');
      halo.addColorStop(0.45, 'rgba(111, 227, 166, 0.35)');
      halo.addColorStop(1, 'rgba(111, 227, 166, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, 24, 24);
      ctx.fillStyle = '#e6fff1';
      ctx.beginPath();
      ctx.ellipse(12, 12, 3.4, 2.2, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200, 255, 230, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(9, 13);
      ctx.quadraticCurveTo(12, 16, 15, 13);
      ctx.stroke();
      this.textures.addCanvas('pickup-sample', canvas);
    }
    if (!this.textures.exists('pickup-clue')) {
      // a data beacon: diamond outline with an inner ring
      const { canvas, ctx } = surface(26, 26);
      const halo = ctx.createRadialGradient(13, 13, 1, 13, 13, 13);
      halo.addColorStop(0, 'rgba(79, 224, 230, 0.55)');
      halo.addColorStop(1, 'rgba(79, 224, 230, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, 26, 26);
      ctx.strokeStyle = '#8ff2f7';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(13, 3);
      ctx.lineTo(23, 13);
      ctx.lineTo(13, 23);
      ctx.lineTo(3, 13);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(79, 224, 230, 0.9)';
      ctx.beginPath();
      ctx.arc(13, 13, 2.2, 0, Math.PI * 2);
      ctx.fill();
      this.textures.addCanvas('pickup-clue', canvas);
    }
    if (!this.textures.exists('sonar')) {
      const { canvas, ctx } = surface(220, 220);
      const grad = ctx.createRadialGradient(110, 110, 10, 110, 110, 108);
      grad.addColorStop(0, 'rgba(79, 224, 230, 0.32)');
      grad.addColorStop(0.75, 'rgba(79, 224, 230, 0.12)');
      grad.addColorStop(1, 'rgba(79, 224, 230, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 220, 220);
      this.textures.addCanvas('sonar', canvas);
    }
  }

  /** Plankton motes and slow jellyfish: cheap, but the water stops feeling empty. */
  private makeLife(): void {
    if (!this.textures.exists('mote')) {
      const { canvas, ctx } = surface(8, 8);
      const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
      g.addColorStop(0, 'rgba(200, 240, 250, 0.9)');
      g.addColorStop(1, 'rgba(200, 240, 250, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 8, 8);
      this.textures.addCanvas('mote', canvas);
    }
    this.add.particles(0, 0, 'mote', {
      x: { min: 20, max: WORLD_W - 20 },
      y: { min: 0, max: FLOOR_Y },
      lifespan: 14000,
      speedY: { min: -9, max: -3 },
      speedX: { min: -6, max: 6 },
      scale: { start: 0.9, end: 0.2 },
      alpha: { start: 0.55, end: 0 },
      quantity: 1,
      frequency: 320,
      blendMode: 'ADD',
    }).setDepth(3);

    for (let i = 0; i < 4; i += 1) {
      const gfx = this.add.circle(0, 0, 7, 0x9fe6f2, 0.14).setDepth(3);
      gfx.setPosition(120 + i * 190, 260 + i * 210);
      this.tweens.add({
        targets: gfx,
        y: `+= ${90 + i * 30}`,
        duration: 9000 + i * 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({ targets: gfx, alpha: { from: 0.08, to: 0.2 }, duration: 2400, yoyo: true, repeat: -1 });
    }
  }

  /** Named hazards, drawn as faint coloured water plus a warning in the HUD. */
  private makeHazards(): void {
    this.zones = hazardsFor(this.theme, WORLD_W, WORLD_H);
    for (const zone of this.zones) {
      const key = `zone-${zone.kind}`;
      if (!this.textures.exists(key)) {
        const { canvas, ctx } = surface(128, 128);
        const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
        const colour = paintHazardGlow(zone.kind).replace('ALPHA', '0.32');
        const edge = paintHazardGlow(zone.kind).replace('ALPHA', '0');
        grad.addColorStop(0, colour);
        grad.addColorStop(0.6, paintHazardGlow(zone.kind).replace('ALPHA', '0.12'));
        grad.addColorStop(1, edge);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        this.textures.addCanvas(key, canvas);
      }
      const img = this.add.image(zone.x, zone.y, key).setDepth(1).setAlpha(0.62);
      img.setDisplaySize(zone.r * 2, zone.r * 2);
      this.tweens.add({ targets: img, alpha: { from: 0.36, to: 0.6 }, duration: 3200, yoyo: true, repeat: -1 });
    }
  }

  /** Marine life that reacts to the ROV lamp and can be scanned for data. */
  private makeCreatures(): void {
    for (let i = 0; i < 9; i += 1) {
      const kind = i % 3;
      const key = `creature-${kind}`;
      if (!this.textures.exists(key)) this.textures.addCanvas(key, paintCreature(kind, i));
      const x = 120 + ((i * 173 + Math.round(this.theme.depthM / 5)) % (WORLD_W - 240));
      const y = 320 + ((i * 251 + Math.round(this.theme.depthM / 9)) % (FLOOR_Y - 520));
      const sprite = this.add.image(x, y, key).setDepth(4).setAlpha(0.9).setScale(2.1);
      this.creatures.push({ sprite, vx: 8 + (i % 3) * 4, vy: 2, kind, scanned: false, phase: i * 1.7 });
    }
  }

  private spawnPickups(): void {
    const total = 6 + Math.round(this.theme.richness * 6);
    for (let i = 0; i < total; i += 1) {
      const x = 70 + ((i * 137 + Math.round(this.theme.depthM)) % (WORLD_W - 140));
      const y = i < 3 ? 260 + i * 180 : 420 + ((i * 211 + Math.round(this.theme.depthM / 3)) % (FLOOR_Y - 520));
      const sprite = this.add.image(x, y, 'pickup-sample').setDepth(4).setAlpha(0.95).setScale(1.05);
      this.tweens.add({ targets: sprite, y: y - 4, duration: 1600 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.pickups.push({ sprite, kind: 'sample', id: `sample-${this.theme.id}-${i}`, taken: false });
    }
    const clues = 2 + Math.round(this.theme.richness * 2);
    for (let i = 0; i < clues; i += 1) {
      const x = 110 + ((i * 327 + Math.round(this.theme.depthM / 7)) % (WORLD_W - 220));
      const y = 420 + ((i * 431 + Math.round(this.theme.depthM / 11)) % (FLOOR_Y - 520));
      const sprite = this.add.image(x, y, 'pickup-clue').setDepth(4).setScale(1.0);
      this.tweens.add({ targets: sprite, alpha: { from: 0.55, to: 1 }, duration: 1200, yoyo: true, repeat: -1 });
      this.pickups.push({ sprite, kind: 'clue', id: `clue-${this.theme.id}-${i}`, taken: false });
    }
  }

  /** Normalised screen coordinates (0..1) from the React layer. */
  moveToNormalized(nx: number, ny: number): void {
    const camera = this.cameras?.main;
    if (!camera) return;
    const view = camera.worldView;
    if (!view || view.width <= 0) return;
    this.target.set(
      Phaser.Math.Clamp(view.x + nx * view.width, 20, WORLD_W - 20),
      Phaser.Math.Clamp(view.y + ny * view.height, 20, WORLD_H - 20),
    );
  }

  toggleLights(): void {
    this.lightsOn = !this.lightsOn;
  }

  ping(): void {
    if (this.battery < 6) return;
    this.battery = Math.max(0, this.battery - 4);
    this.sonarUntil = this.time.now + 3200;
    const ring = this.add.image(this.rov.x, this.rov.y, 'sonar').setDepth(6).setScale(0.2);
    this.tweens.add({
      targets: ring,
      scale: 2.2,
      alpha: 0,
      duration: 1400,
      onComplete: () => ring.destroy(),
    });
  }

  requestSurface(): DiveResult {
    return this.finish(false);
  }

  private finish(aborted: boolean): DiveResult {
    if (this.ended) {
      return {
        themeId: this.theme.id,
        depthM: 0,
        samples: this.samples,
        data: this.dataPoints,
        discoveries: this.discoveries,
        hullDamage: 0,
        batteryUsed: 0,
      };
    }
    this.ended = true;
    const elapsed = (this.time.now - this.startedAt) / 1000;
    const depthFraction = Phaser.Math.Clamp((this.rov.y - START_Y) / (FLOOR_Y - START_Y), 0, 1);
    const result: DiveResult = {
      themeId: this.theme.id,
      depthM: Math.round(600 + depthFraction * (this.theme.depthM - 600)),
      samples: this.samples,
      data: this.dataPoints,
      discoveries: [...this.discoveries],
      hullDamage: Math.round(Phaser.Math.Clamp(100 - this.hull + (aborted ? 8 : 0), 0, 70)),
      batteryUsed: Math.round(Phaser.Math.Clamp(100 - this.battery + elapsed * 0.05, 0, 100)),
    };
    this.hudTimer?.remove();
    window.dispatchEvent(new CustomEvent('dive:finished', { detail: result }));
    return result;
  }

  private emitHud(): void {
    const depthFraction = Phaser.Math.Clamp((this.rov.y - START_Y) / (FLOOR_Y - START_Y), 0, 1);
    const tether = Phaser.Math.Clamp((this.rov.y - START_Y) / 1450, 0, 1.2);
    const hud: DiveHud = {
      depthM: Math.round(600 + depthFraction * (this.theme.depthM - 600)),
      targetDepthM: this.theme.depthM,
      battery: Math.round(this.battery),
      hull: Math.round(this.hull),
      samples: this.samples,
      data: this.dataPoints,
      tether: Math.round(tether * 100),
      lights: this.lightsOn,
      sonarReady: this.battery >= 6,
      warning: this.zoneWarning || this.currentWarning(),
      discoveries: [...this.discoveries],
    };
    window.dispatchEvent(new CustomEvent('dive:hud', { detail: hud }));
  }

  private currentWarning(): string | null {
    if (this.tetherStrain > 0.9) return 'کابل نزدیک حد کشش است؛ برگرد.';
    if (this.battery < 18) return 'باتری کم است؛ برای بازگشت وقت داری.';
    if (this.hull < 45) return 'بدنه آسیب دیده؛ از برخورد دوری کن.';
    return null;
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;
    const dt = Math.min(64, delta) / 1000;

    // steering: proportional pull with damping
    const dx = this.target.x - this.rov.x;
    const dy = this.target.y - this.rov.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 4) {
      const accel = 320;
      this.velocity.x += (dx / dist) * accel * dt;
      this.velocity.y += (dy / dist) * accel * dt;
      this.rov.setFlipX(dx < 0);
    }
    this.velocity.scale(Math.pow(0.02, dt));
    const maxSpeed = this.lightsOn ? 130 : 165;
    if (this.velocity.length() > maxSpeed) this.velocity.setLength(maxSpeed);
    this.rov.x = Phaser.Math.Clamp(this.rov.x + this.velocity.x * dt, 16, WORLD_W - 16);
    this.rov.y = Phaser.Math.Clamp(this.rov.y + this.velocity.y * dt, 40, WORLD_H - 60);

    // battery
    this.battery = Math.max(0, this.battery - dt * (this.lightsOn ? 0.42 : 0.2));
    if (this.battery <= 0) {
      this.finish(true);
      return;
    }

    // tether strain
    this.tetherStrain = Phaser.Math.Clamp((this.rov.y - START_Y) / 1450, 0, 1.2);
    if (this.tetherStrain > 1) {
      this.hull = Math.max(0, this.hull - dt * 3);
      this.rov.setTint(0xff8a7a);
    } else if (!this.zoneWarning) {
      this.rov.clearTint();
    }

    // hazard: touching the floor or the cliff walls
    if (this.rov.y > FLOOR_Y - 12) {
      this.hull = Math.max(0, this.hull - dt * 4);
      this.rov.y = FLOOR_Y - 12;
    }
    if (this.rov.x < 26 || this.rov.x > WORLD_W - 26) {
      this.hull = Math.max(0, this.hull - dt * 2.5);
    }

    // hazards: each zone has a different, named consequence
    let warning = '';
    for (const zone of this.zones) {
      const d = Phaser.Math.Distance.Between(this.rov.x, this.rov.y, zone.x, zone.y);
      if (d > zone.r) continue;
      const intensity = 1 - d / zone.r;
      warning = zone.label;
      if (zone.kind === 'heat') {
        this.hull = Math.max(0, this.hull - dt * 2.6 * intensity);
        this.battery = Math.max(0, this.battery - dt * 0.5 * intensity);
        this.rov.setTint(0xffb08a);
      } else if (zone.kind === 'current') {
        this.velocity.y += 26 * intensity * dt * 10;
        this.velocity.x += Math.sin(this.time.now / 700 + zone.x) * 18 * intensity;
        this.tetherStrain = Math.min(1.2, this.tetherStrain + dt * 0.05 * intensity);
      } else if (zone.kind === 'debris') {
        this.hull = Math.max(0, this.hull - dt * 1.8 * intensity);
      } else {
        this.dataPoints += dt * 1.1 * intensity;
      }
    }
    this.zoneWarning = warning;

    // creatures: flee the lamp, drift closer in the dark, scan on sonar
    for (const creature of this.creatures) {
      const d = Phaser.Math.Distance.Between(this.rov.x, this.rov.y, creature.sprite.x, creature.sprite.y);
      const lit = this.lightsOn && d < 150;
      if (lit) {
        const away = Math.atan2(creature.sprite.y - this.rov.y, creature.sprite.x - this.rov.x);
        creature.vx = Math.cos(away) * 46;
        creature.vy = Math.sin(away) * 30;
        creature.sprite.setScale(2.3);
      } else {
        creature.vx += Math.sin(this.time.now / 1600 + creature.phase) * 3 * dt;
        creature.vy = Math.sin(this.time.now / 1100 + creature.phase) * 8;
        creature.sprite.setScale(2.1);
      }
      creature.sprite.x = Phaser.Math.Clamp(creature.sprite.x + creature.vx * dt, 30, WORLD_W - 30);
      creature.sprite.y = Phaser.Math.Clamp(creature.sprite.y + creature.vy * dt, 60, WORLD_H - 40);
      creature.sprite.setFlipX(creature.vx < 0);
      if (this.time.now < this.sonarUntil && d < 60 && !creature.scanned) {
        creature.scanned = true;
        this.dataPoints += 3;
        this.discoveries.push(`scan-${this.theme.id}-${creature.kind}-${Math.round(creature.sprite.x)}`);
        this.floatText(creature.sprite.x, creature.sprite.y, 'ثبت جاندار', '#c9a0ff');
      }
    }

    // pickups
    for (const pickup of this.pickups) {
      if (pickup.taken) continue;
      const near = Phaser.Math.Distance.Between(this.rov.x, this.rov.y, pickup.sprite.x, pickup.sprite.y) < 26;
      const revealed = this.time.now < this.sonarUntil;
      pickup.sprite.setAlpha(revealed || near ? 1 : 0.28);
      if (!near) continue;
      pickup.taken = true;
      pickup.sprite.setVisible(false);
      if (pickup.kind === 'sample') {
        this.samples += 1;
        this.dataPoints += 2;
        this.floatText(pickup.sprite.x, pickup.sprite.y, 'نمونه +۱');
      } else {
        this.discoveries.push(pickup.id);
        this.dataPoints += 6;
        this.floatText(pickup.sprite.x, pickup.sprite.y, 'کشف جدید', '#4fe0e6');
      }
    }

    this.caustics.tilePositionX += dt * 6;
    this.caustics.tilePositionY -= dt * 3;

    // darkness follows the ROV on screen
    const cam = this.cameras.main;
    const sx = (this.rov.x - cam.worldView.x) * cam.zoom;
    const sy = (this.rov.y - cam.worldView.y) * cam.zoom;
    this.dark.setPosition(sx, sy);
    this.dark.setScale(this.lightsOn ? 2.6 : 1.25);
    this.dark.setAlpha(this.lights ? 0.95 : 1);
  }

  private floatText(x: number, y: number, text: string, color = '#6fe3a6'): void {
    const label = this.add
      .text(x, y - 10, text, {
        fontFamily: 'Vazirmatn, Tahoma, sans-serif',
        fontSize: '11px',
        color,
      })
      .setOrigin(0.5)
      .setDepth(7);
    this.tweens.add({
      targets: label,
      y: y - 34,
      alpha: 0,
      duration: 1100,
      onComplete: () => label.destroy(),
    });
  }
}
