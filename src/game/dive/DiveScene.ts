import Phaser from 'phaser';
import { paintCaustics, paintDarkness, paintRov, paintSeabed, makeTexSet, DIVE_THEMES, type DiveTheme } from './scenery';
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
      const { canvas, ctx } = surface(10, 10);
      ctx.fillStyle = '#6fe3a6';
      ctx.fillRect(3, 0, 4, 10);
      ctx.fillStyle = '#c9ffe2';
      ctx.fillRect(4, 2, 2, 5);
      this.textures.addCanvas('pickup-sample', canvas);
    }
    if (!this.textures.exists('pickup-clue')) {
      const { canvas, ctx } = surface(14, 14);
      ctx.strokeStyle = '#4fe0e6';
      ctx.lineWidth = 1;
      ctx.strokeRect(2.5, 2.5, 9, 9);
      ctx.fillStyle = '#4fe0e6';
      ctx.fillRect(6, 6, 2, 2);
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

  private spawnPickups(): void {
    const total = 6 + Math.round(this.theme.richness * 6);
    for (let i = 0; i < total; i += 1) {
      const x = 70 + ((i * 137 + Math.round(this.theme.depthM)) % (WORLD_W - 140));
      const y = i < 3 ? 260 + i * 180 : 420 + ((i * 211 + Math.round(this.theme.depthM / 3)) % (FLOOR_Y - 520));
      const sprite = this.add.image(x, y, 'pickup-sample').setDepth(4).setAlpha(0.95);
      this.tweens.add({ targets: sprite, y: y - 4, duration: 1600 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.pickups.push({ sprite, kind: 'sample', id: `sample-${this.theme.id}-${i}`, taken: false });
    }
    const clues = 2 + Math.round(this.theme.richness * 2);
    for (let i = 0; i < clues; i += 1) {
      const x = 110 + ((i * 327 + Math.round(this.theme.depthM / 7)) % (WORLD_W - 220));
      const y = 420 + ((i * 431 + Math.round(this.theme.depthM / 11)) % (FLOOR_Y - 520));
      const sprite = this.add.image(x, y, 'pickup-clue').setDepth(4);
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
      warning: this.currentWarning(),
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
    } else {
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
