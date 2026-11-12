import Phaser from 'phaser';
import { ROOM_LABEL } from '../sim/content';
import type { GameState, RoomId } from '../sim/types';
import { sim } from '../state/store';
import { selectRoom, setRoomFocusHandler } from './bridge';
import { computeLayout, type Rect, type StationLayout } from './layout';
import { paintRoom } from './art/rooms';
import { paintCrewDisc, paintRoomPhoto } from './art/roomArt';
import { paintBackdrop, paintBeams, paintExterior, paintGrade, paintInnerShadow, paintShell } from './art/vessel';
import { CREW_FRAME, CREW_FRAMES, paintCrewSheet, type CrewLook } from './art/crew';
import { C } from './art/painter';

interface CrackPoint {
  x: number;
  y: number;
}

interface Crack {
  points: CrackPoint[];
  width: number;
}

const CREW_LOOKS: CrewLook[] = [
  { accent: '#2f7f86', skin: '#c98f6a', hair: '#241812', helmet: true, build: 'slim' },
  { accent: '#a8702c', skin: '#8d5f42', hair: '#120c09', helmet: true, build: 'broad' },
  { accent: '#b8544c', skin: '#e0b08a', hair: '#2b1a14', helmet: false, build: 'slim' },
  { accent: '#2f6d7a', skin: '#b9835f', hair: '#1b120d', helmet: true, build: 'broad' },
];

const ROOM_ORDER: RoomId[] = [
  'command',
  'biolab',
  'geolab',
  'quarters',
  'reactor',
  'life',
  'storage',
  'medbay',
  'corridor',
  'rov',
];

export class StationScene extends Phaser.Scene {
  private dpr = 1;
  private layout!: StationLayout;
  private base!: Phaser.GameObjects.Container;
  private roomsLayer!: Phaser.GameObjects.Container;
  private crewLayer!: Phaser.GameObjects.Container;
  private gradeLayer!: Phaser.GameObjects.Container;
  private dyn!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Graphics;
  private labels = new Map<RoomId, Phaser.GameObjects.Text>();
  private roomImages = new Map<RoomId, Phaser.GameObjects.Image>();
  private crewSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private crewPhotos = new Map<string, Phaser.GameObjects.Image>();
  private cracks = new Map<RoomId, Crack[]>();
  private fish: { sprite: Phaser.GameObjects.Image; speed: number; phase: number }[] = [];
  private selected: RoomId | null = null;
  private focus: RoomId | null = null;
  private focusUntil = 0;
  private elapsed = 0;
  private generation = 0;
  private rebuildTimer?: Phaser.Time.TimerEvent;
  private staticTextures: string[] = [];

  constructor() {
    super('station');
  }

  preload(): void {
    // Photographic 2.5D renders replace the vector cutaway art when present.
    for (const id of ROOM_ORDER) this.load.image(`photo-${id}`, `rooms/${id}.webp`);
    for (const id of ['c1', 'c2', 'c3', 'c4']) this.load.image(`photo-crew-${id}`, `crew/crew-${id}.webp`);
  }

  create(): void {
    this.dpr = (this.registry.get('dpr') as number) || 1;
    this.cameras.main.setBackgroundColor('#02080d');
    this.cameras.main.setZoom(this.dpr);

    this.base = this.add.container(0, 0).setDepth(1);
    this.roomsLayer = this.add.container(0, 0).setDepth(3);
    this.glow = this.add.graphics().setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
    this.dyn = this.add.graphics().setDepth(6);
    this.crewLayer = this.add.container(0, 0).setDepth(7);
    this.gradeLayer = this.add.container(0, 0).setDepth(5);

    this.buildAll();
    this.createCrewAnimations();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const x = pointer.worldX;
      const y = pointer.worldY;
      for (const [id, rect] of Object.entries(this.layout.rooms) as [RoomId, Rect][]) {
        if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
          this.selected = id;
          selectRoom(id);
          this.drawDynamic(0);
          return;
        }
      }
    });

    const onResize = () => {
      this.rebuildTimer?.remove();
      this.rebuildTimer = this.time.delayedCall(120, () => {
        this.dpr = (this.registry.get('dpr') as number) || 1;
        this.cameras.main.setZoom(this.dpr);
        this.buildAll();
        this.createCrewAnimations();
      });
    };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));

    setRoomFocusHandler((room) => this.focusRoom(room));
    this.events.once('shutdown', () => setRoomFocusHandler(null));

    // live layer: 20 Hz is plenty for water and crew
    this.time.addEvent({ delay: 50, loop: true, callback: () => this.drawDynamic(0) });
  }

  focusRoom(room: RoomId): void {
    this.focus = room;
    this.focusUntil = this.time.now + 6500;
    this.selected = room;
    this.drawDynamic(0);
  }

  // ------------------------------------------------------------------ build

  private textureKey(kind: string, id: string): string {
    return `v3-${kind}-${id}-${this.generation}`;
  }

  private buildAll(): void {
    const cssW = Math.max(320, this.scale.width / this.dpr);
    const cssH = Math.max(220, this.scale.height / this.dpr);
    this.layout = computeLayout(cssW, cssH);
    this.generation += 1;
    // Phaser keeps the camera centre when the zoom changes, so re-anchor the
    // view on the world origin after every zoom/size change.
    this.cameras.main.centerOn(cssW / 2, cssH / 2);

    this.base.removeAll(true);
    this.roomsLayer.removeAll(true);
    this.crewLayer.removeAll(true);
    this.gradeLayer.removeAll(true);
    this.labels.clear();
    this.roomImages.clear();
    this.crewSprites.clear();
    this.crewPhotos.clear();
    this.fish = [];
    this.cracks.clear();
    this.staticTextures.forEach((key) => {
      if (this.textures.exists(key)) this.textures.remove(key);
    });
    this.staticTextures = [];

    const box = this.layout.body;
    const extH = Math.round(this.layout.exterior.h);
    this.addCanvasTexture(this.textureKey('bg', 'a'), paintBackdrop(cssW, cssH));
    this.addCanvasTexture(this.textureKey('hull', 'a'), paintShell(cssW, cssH, box));
    this.addCanvasTexture(this.textureKey('ext', 'a'), paintExterior(cssW, extH));
    this.addCanvasTexture(this.textureKey('beams', 'a'), paintBeams(cssW, cssH, extH));
    this.addCanvasTexture(this.textureKey('shadow', 'a'), paintInnerShadow(cssW, cssH, box));
    this.addCanvasTexture(this.textureKey('grade', 'a'), paintGrade(cssW, cssH));

    this.base.add(this.add.image(0, 0, this.textureKey('bg', 'a')).setOrigin(0, 0));
    this.base.add(this.add.image(0, 0, this.textureKey('hull', 'a')).setOrigin(0, 0));
    this.base.add(this.add.image(0, 0, this.textureKey('ext', 'a')).setOrigin(0, 0));
    this.base.add(this.add.image(0, 0, this.textureKey('beams', 'a')).setOrigin(0, 0).setBlendMode(Phaser.BlendModes.ADD));

    for (const id of ROOM_ORDER) {
      const rect = this.layout.rooms[id];
      const photoKey = `photo-${id}`;
      const photo = this.textures.exists(photoKey)
        ? (this.textures.get(photoKey).getSourceImage() as HTMLImageElement)
        : null;
      const canvas = photo
        ? paintRoomPhoto(photo, rect.w, rect.h)
        : paintRoom(id, Math.round(rect.w), Math.round(rect.h));
      const key = this.textureKey('room', id);
      this.addCanvasTexture(key, canvas);
      const image = this.add.image(rect.x, rect.y, key).setOrigin(0, 0);
      this.roomsLayer.add(image);
      this.roomImages.set(id, image);
      this.buildCracks(id, rect);
      this.drawLabel(id, rect);
    }

    this.base.add(
      this.add.image(0, 0, this.textureKey('shadow', 'a')).setOrigin(0, 0).setAlpha(0.9),
    );
    this.gradeLayer.removeAll(true);
    this.gradeLayer.add(this.add.image(0, 0, this.textureKey('grade', 'a')).setOrigin(0, 0).setAlpha(0.85));

    this.spawnCrew();
    this.spawnFish(cssW, cssH);
    this.drawDynamic(0);
  }

  private addCanvasTexture(key: string, canvas: HTMLCanvasElement): void {
    this.textures.addCanvas(key, canvas);
    this.staticTextures.push(key);
  }

  private drawLabel(id: RoomId, rect: Rect): void {
    const size = this.layout.labelFont;
    const text = this.add
      .text(rect.x + 4, rect.y + 3, ROOM_LABEL[id], {
        fontFamily: 'Vazirmatn, Tahoma, sans-serif',
        fontSize: `${size}px`,
        color: '#bfe6ef',
        padding: { top: 1, bottom: 2, left: 4, right: 4 },
        backgroundColor: 'rgba(2, 12, 17, 0.86)',
      })
      .setOrigin(0, 0)
      .setResolution(Math.max(1, this.dpr));
    text.setAlpha(0.92);
    this.roomsLayer.add(text);
    this.labels.set(id, text);
  }

  private buildCracks(id: RoomId, rect: Rect): void {
    const seed = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const cracks: Crack[] = [];
    for (let i = 0; i < 3; i += 1) {
      const startX = rect.x + 12 + ((seed * (i + 3)) % Math.max(1, Math.round(rect.w - 34)));
      const startY = rect.y + 16 + ((seed * (i + 5)) % Math.max(1, Math.round(rect.h - 46)));
      const points: CrackPoint[] = [{ x: startX, y: startY }];
      let px = startX;
      let py = startY;
      for (let j = 0; j < 4; j += 1) {
        px += ((seed + j * 7) % 16) - 8;
        py += 5 + ((seed + j * 5) % 8);
        points.push({ x: px, y: py });
      }
      cracks.push({ points, width: 1 + (i % 2) });
    }
    this.cracks.set(id, cracks);
  }

  private spawnCrew(): void {
    const state = sim.state;
    state.crew.forEach((member, index) => {
      const photoKey = `photo-crew-${member.id}`;
      if (this.textures.exists(photoKey)) {
        const img = this.textures.get(photoKey).getSourceImage() as HTMLImageElement;
        const discKey = `disc-${member.id}`;
        if (!this.textures.exists(discKey)) {
          const rings = ['#4fe0e6', '#6fe3a6', '#ffb454', '#c9a0ff'];
          this.addCanvasTexture(discKey, paintCrewDisc(img, 96, rings[index % rings.length]!));
        }
        const marker = this.add.image(-100, -100, discKey).setDepth(6);
        marker.setScale(0.34);
        this.crewLayer.add(marker);
        this.crewPhotos.set(member.id, marker);
        return;
      }
      const look = CREW_LOOKS[index % CREW_LOOKS.length]!;
      const key = `crew-${index}`;
      if (!this.textures.exists(key)) {
        const canvas = paintCrewSheet(look);
        const texture = this.textures.addCanvas(key, canvas);
        if (texture) {
          CREW_FRAMES.forEach((name, frame) => {
            texture.add(name, 0, frame * CREW_FRAME.w, 0, CREW_FRAME.w, CREW_FRAME.h);
          });
        }
      }
      const sprite = this.add.sprite(-100, -100, key, 'idle0');
      sprite.setScale(1.45);
      this.crewLayer.add(sprite);
      this.crewSprites.set(member.id, sprite);
    });
  }

  private createCrewAnimations(): void {
    for (let i = 0; i < CREW_LOOKS.length; i += 1) {
      const key = `crew-${i}`;
      if (!this.textures.exists(key)) continue;
      const idle = `crew-idle-${i}`;
      const walk = `crew-walk-${i}`;
      if (!this.anims.exists(idle)) {
        this.anims.create({
          key: idle,
          frames: [{ key, frame: 'idle0' }, { key, frame: 'idle1' }],
          frameRate: 2,
          repeat: -1,
        });
      }
      if (!this.anims.exists(walk)) {
        this.anims.create({
          key: walk,
          frames: [
            { key, frame: 'walk0' },
            { key, frame: 'walk1' },
            { key, frame: 'walk2' },
            { key, frame: 'walk3' },
          ],
          frameRate: 8,
          repeat: -1,
        });
      }
    }
  }

  private spawnFish(cssW: number, cssH: number): void {
    if (!this.textures.exists('fish-silhouette')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x0d3a48, 1);
      g.fillEllipse(6, 4, 12, 5);
      g.fillTriangle(0, 4, 4, 0, 4, 8);
      g.generateTexture('fish-silhouette', 14, 9);
      g.destroy();
    }
    for (let i = 0; i < 4; i += 1) {
      const sprite = this.add.image(
        Math.random() * cssW,
        cssH * (0.18 + Math.random() * 0.4),
        'fish-silhouette',
      );
      sprite.setAlpha(0.35).setScale(0.8 + Math.random() * 0.9);
      this.base.add(sprite);
      this.fish.push({ sprite, speed: 5 + Math.random() * 9, phase: Math.random() * 7 });
    }
  }

  // ---------------------------------------------------------------- dynamic

  private drawDynamic(_delta: number): void {
    if (!this.layout) return;
    const state: GameState = sim.state;
    const g = this.dyn;
    const glow = this.glow;
    g.clear();
    glow.clear();
    this.elapsed += 0.05;

    for (const room of Object.values(state.rooms)) {
      const rect = this.layout.rooms[room.id];
      if (!rect) continue;

      if (room.water > 0.5) {
        const depth = (rect.h - 14) * Math.min(1, room.water / 100);
        const top = rect.y + rect.h - depth - 2;
        g.fillStyle(0x1f7fa6, 0.34);
        g.fillRect(rect.x + 1, top, rect.w - 2, depth);
        g.fillStyle(0x0a3446, 0.3);
        g.fillRect(rect.x + 1, top + depth * 0.55, rect.w - 2, depth * 0.45);
        const wobble = Math.sin(this.elapsed * 2.1 + rect.x * 0.05) * 1.5;
        g.fillStyle(0x9fe9f9, 0.55);
        g.fillRect(rect.x + 1, top + wobble, rect.w - 2, 1);
        for (let i = 0; i < 3; i += 1) {
          const bx = rect.x + 6 + ((this.elapsed * 9 + i * 31) % Math.max(4, rect.w - 12));
          const by = top + 4 + ((i * 23 + this.elapsed * 6) % Math.max(4, depth - 4));
          g.fillStyle(0xbfeffa, 0.22);
          g.fillCircle(bx, by, 1);
        }
      }

      if (room.breached) {
        const pulse = 0.35 + Math.sin(this.elapsed * 4) * 0.25;
        g.lineStyle(2, 0xff5f4f, 0.35 + pulse);
        g.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
        glow.fillStyle(0xff5f4f, 0.05 + pulse * 0.06);
        glow.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
        for (let i = 0; i < 4; i += 1) {
          const sy = rect.y + 10 + ((this.elapsed * 60 + i * 27) % Math.max(8, rect.h * 0.5));
          g.fillStyle(0xbfeffa, 0.18);
          g.fillCircle(rect.x + rect.w - 3, sy, 1.5);
        }
      }

      if (room.hull < 74) {
        const list = this.cracks.get(room.id) ?? [];
        const visible = room.hull < 45 ? 3 : room.hull < 60 ? 2 : 1;
        for (const crack of list.slice(0, visible)) {
          g.lineStyle(crack.width, 0x04121a, 0.8);
          for (let i = 1; i < crack.points.length; i += 1) {
            const a = crack.points[i - 1]!;
            const b = crack.points[i]!;
            g.lineBetween(a.x, a.y, b.x, b.y);
          }
          g.lineStyle(1, 0xffb454, 0.2);
          const first = crack.points[0]!;
          const second = crack.points[1]!;
          g.lineBetween(first.x, first.y, second.x, second.y);
        }
      }

      if (room.lightsOn) {
        glow.fillStyle(0xffd9a0, 0.035 + Math.sin(this.elapsed * 1.4 + rect.x) * 0.008);
        glow.fillRect(rect.x + 4, rect.y + 4, rect.w - 8, Math.round(rect.h * 0.32));
        glow.fillStyle(0x4fe0e6, 0.02);
        glow.fillRect(rect.x + 4, rect.y + rect.h - 22, rect.w - 8, 18);
      } else {
        g.fillStyle(0x000308, 0.55);
        g.fillRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
        glow.fillStyle(0xff5f4f, 0.5);
        glow.fillCircle(rect.x + rect.w - 10, rect.y + 10, 2);
      }

      const label = this.labels.get(room.id);
      if (label) {
        const critical = room.breached || room.hull < 40;
        const warn = !critical && (room.hull < 65 || room.water > 18);
        label.setColor(critical ? '#ffb3ab' : warn ? '#ffd39a' : '#d7f1f8');
        label.setText(critical ? `⚠ ${ROOM_LABEL[room.id]}` : ROOM_LABEL[room.id]);
      }

      if (this.selected === room.id) this.drawSelection(g, rect);
    }

    if (this.focus && this.time.now < this.focusUntil) {
      const rect = this.layout.rooms[this.focus];
      if (rect) {
        const pulse = 0.45 + Math.sin(this.time.now / 170) * 0.35;
        g.lineStyle(2, 0x4fe0e6, pulse);
        g.strokeRoundedRect(rect.x - 5, rect.y - 5, rect.w + 10, rect.h + 10, 6);
        g.lineStyle(1, 0x4fe0e6, pulse * 0.4);
        g.strokeRoundedRect(rect.x - 10, rect.y - 10, rect.w + 20, rect.h + 20, 8);
      }
    } else if (this.focus && this.time.now >= this.focusUntil) {
      this.focus = null;
    }

    this.updateCrew(state);
  }

  private drawSelection(g: Phaser.GameObjects.Graphics, rect: Rect): void {
    const arm = Math.min(12, rect.w * 0.1);
    g.lineStyle(2, 0x4fe0e6, 0.95);
    const { x, y, w, h } = rect;
    g.lineBetween(x - 3, y - 3, x - 3 + arm, y - 3);
    g.lineBetween(x - 3, y - 3, x - 3, y - 3 + arm);
    g.lineBetween(x + w + 3, y - 3, x + w + 3 - arm, y - 3);
    g.lineBetween(x + w + 3, y - 3, x + w + 3, y - 3 + arm);
    g.lineBetween(x - 3, y + h + 3, x - 3 + arm, y + h + 3);
    g.lineBetween(x - 3, y + h + 3, x - 3, y + h + 3 - arm);
    g.lineBetween(x + w + 3, y + h + 3, x + w + 3 - arm, y + h + 3);
    g.lineBetween(x + w + 3, y + h + 3, x + w + 3, y + h + 3 - arm);
  }

  private updateCrew(state: GameState): void {
    const dt = 1 / 20;
    state.crew.forEach((member, index) => {
      const marker = this.crewPhotos.get(member.id);
      if (marker) {
        if (!member.alive) {
          marker.setVisible(false);
          return;
        }
        marker.setVisible(true);
        const room = member.travelTo ?? member.room ?? 'corridor';
        const rect = this.layout.rooms[room] ?? this.layout.rooms.corridor;
        const spread = Math.min(rect.w * 0.36, 46);
        const targetX = rect.x + rect.w / 2 + ((index % 2 === 0 ? -1 : 1) * spread) / 2;
        const targetY = rect.y + rect.h - 26;
        const stepX = (targetX - marker.x) * Math.min(1, 0.16);
        const stepY = (targetY - marker.y) * Math.min(1, 0.16);
        marker.x += stepX;
        marker.y += stepY;
        const speed = Math.hypot(stepX, stepY);
        // a small vertical bob while walking: the marker reads as a person
        // moving through the room instead of a sticker sliding on glass
        const bob = speed > 0.35 ? 1 + Math.sin(this.elapsed * 9 + index) * 0.045 : 1;
        marker.setScale(0.34 * bob);
        marker.setFlipX(stepX < -0.05 ? true : stepX > 0.05 ? false : marker.flipX);
        const tired = member.energy < 25 || member.health < 50;
        const working = member.task.kind !== 'idle';
        marker.setAlpha(tired ? 0.72 : working ? 0.96 + Math.sin(this.elapsed * 3) * 0.04 : 1);
        return;
      }
      const sprite = this.crewSprites.get(member.id);
      if (!sprite) return;
      if (!member.alive) {
        sprite.setVisible(false);
        return;
      }
      sprite.setVisible(true);
      const room = member.travelTo ?? member.room ?? 'corridor';
      const rect = this.layout.rooms[room] ?? this.layout.rooms.corridor;
      const spread = Math.min(rect.w * 0.42, 52);
      const targetX = rect.x + rect.w / 2 + ((index % 2 === 0 ? -1 : 1) * spread) / 2;
      const targetY = rect.y + rect.h - 24;
      const dx = targetX - sprite.x;
      const moving = Math.abs(dx) > 1.6;
      sprite.x += dx * Math.min(1, 2.2 * dt * 4);
      sprite.y += (targetY - sprite.y) * Math.min(1, 4 * dt);
      if (moving) sprite.setFlipX(dx < 0);
      const key = `crew-${index % CREW_LOOKS.length}`;
      const walk = `crew-walk-${index % CREW_LOOKS.length}`;
      const idle = `crew-idle-${index % CREW_LOOKS.length}`;
      if (!this.textures.exists(key)) return;
      const want = moving ? walk : idle;
      if (sprite.anims.currentAnim?.key !== want) sprite.play(want);
    });
  }

  // ----------------------------------------------------------------- update

  update(_time: number, delta: number): void {
    if (!this.layout) return;
    const dt = Math.min(64, delta) / 1000;
    const cssW = this.scale.width / this.dpr;
    for (const entry of this.fish) {
      entry.sprite.x += entry.speed * dt;
      entry.sprite.y += Math.sin(this.elapsed * 0.4 + entry.phase) * 0.08;
      if (entry.sprite.x > cssW + 20) entry.sprite.x = -20;
    }
  }
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 2, 2);
    g.generateTexture('snow', 2, 2);
    g.destroy();
    this.scene.start('station');
  }
}

export const STATION_COLORS = C;
