import Phaser from 'phaser';
import { ROOM_LABEL } from '../sim/content';
import type { GameState, RoomId } from '../sim/types';
import { sim } from '../state/store';
import { selectRoom, setRoomFocusHandler } from './bridge';
import { computeLayout, type Rect, type StationLayout } from './layout';

const PALETTE = {
  oceanTop: 0x0b2e3d,
  oceanMid: 0x061d28,
  oceanDeep: 0x01070c,
  frame: 0x2a6577,
  frameLight: 0x4d94a9,
  hull: 0x0a1e26,
  interior: 0x113a47,
  interiorLight: 0x1d5669,
  floor: 0x0a2631,
  cyan: 0x4fe0e6,
  amber: 0xffb454,
  red: 0xff5f4f,
  green: 0x6fe3a6,
  water: 0x1f7fa6,
};

interface Crack {
  points: { x: number; y: number }[];
  width: number;
}

const CREW_ACCENT = [0x4fe0e6, 0xa4d95f, 0xffb454, 0xd98cc9];

export class StationScene extends Phaser.Scene {
  private layout!: StationLayout;
  private staticLayer!: Phaser.GameObjects.Container;
  private dynamic!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Graphics;
  private crewLayer!: Phaser.GameObjects.Container;
  private crewNodes = new Map<string, Phaser.GameObjects.Container>();
  private labels = new Map<RoomId, Phaser.GameObjects.Text>();
  private roomCracks = new Map<RoomId, Crack[]>();
  private fish: { node: Phaser.GameObjects.Container; speed: number; phase: number }[] = [];
  private dust?: Phaser.GameObjects.Particles.ParticleEmitter;
  private selected: RoomId | null = null;
  private focus: RoomId | null = null;
  private focusUntil = 0;
  private elapsed = 0;
  private rebuildTimer?: Phaser.Time.TimerEvent;
  private roomRects = new Map<RoomId, Rect>();

  constructor() {
    super('station');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.oceanDeep);
    this.cameras.main.setZoom(1);
    this.staticLayer = this.add.container(0, 0).setDepth(1);
    this.dynamic = this.add.graphics().setDepth(7);
    this.glow = this.add.graphics().setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
    this.crewLayer = this.add.container(0, 0).setDepth(9);

    this.buildAll();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const x = pointer.worldX;
      const y = pointer.worldY;
      for (const [id, rect] of this.roomRects) {
        if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
          this.selected = id;
          selectRoom(id);
          this.refresh(0);
          return;
        }
      }
    });

    this.scale.on('resize', () => {
      this.rebuildTimer?.remove();
      this.rebuildTimer = this.time.delayedCall(180, () => this.buildAll());
    });

    this.time.addEvent({ delay: 160, loop: true, callback: () => this.refresh(0) });

    const focusHandler = (room: RoomId) => this.focusRoom(room);
    setRoomFocusHandler(focusHandler);
    this.events.once('shutdown', () => setRoomFocusHandler(null));
  }

  focusRoom(room: RoomId): void {
    this.focus = room;
    this.focusUntil = this.time.now + 7000;
    this.selected = room;
    this.refresh(0);
  }

  private buildAll(): void {
    const width = Math.max(360, this.scale.width);
    const height = Math.max(220, this.scale.height);
    this.layout = computeLayout(width, height);
    this.roomRects.clear();

    this.staticLayer.removeAll(true);
    this.labels.clear();
    this.fish = [];
    this.crewNodes.forEach((node) => node.destroy());
    this.crewNodes.clear();
    this.dust?.destroy();
    this.roomCracks.clear();

    this.drawBackground(width, height);
    this.drawStation();
    this.buildCracks();
    this.spawnCrew();
    this.dynamic.clear();
  }

  // ---------------------------------------------------------------- background

  private drawBackground(width: number, height: number): void {
    const g = this.add.graphics();
    const bands = 22;
    for (let i = 0; i < bands; i += 1) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(PALETTE.oceanTop),
        Phaser.Display.Color.ValueToColor(PALETTE.oceanDeep),
        bands,
        i,
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      g.fillRect(0, (height / bands) * i, width, height / bands + 1);
    }

    // distant geological silhouettes
    g.fillStyle(0x03121a, 0.9);
    g.fillTriangle(-40, height, width * 0.18, height * 0.62, width * 0.34, height);
    g.fillTriangle(width * 0.22, height, width * 0.42, height * 0.74, width * 0.55, height);
    g.fillTriangle(width * 0.7, height, width * 0.86, height * 0.66, width + 40, height);

    // a far-away derelict tower
    g.fillStyle(0x051a24, 0.85);
    const towerX = width * 0.62;
    g.fillRect(towerX, height * 0.34, width * 0.018, height * 0.66);
    g.fillRect(towerX - width * 0.012, height * 0.36, width * 0.042, height * 0.02);
    g.fillStyle(0x2a6577, 0.18);
    g.fillRect(towerX + 3, height * 0.38, 2, 6);

    // light shafts
    const shafts = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    for (let i = 0; i < 6; i += 1) {
      shafts.fillStyle(0x3d92ab, 0.045);
      const x = width * (0.05 + i * 0.17);
      const spread = width * 0.09;
      shafts.fillTriangle(x, -40, x + spread * 0.4, -40, x + spread, height + 40);
      shafts.fillTriangle(x + spread * 0.4, -40, x + spread, -40, x + spread, height + 40);
    }

    // marine snow
    this.dust = this.add.particles(0, 0, 'snow', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 10000,
      speedY: { min: 3, max: 16 },
      speedX: { min: -4, max: 4 },
      scale: { start: 0.7, end: 0.15 },
      alpha: { start: 0.4, end: 0 },
      quantity: 1,
      frequency: 280,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.dust.setDepth(0);

    // fish silhouettes
    for (let i = 0; i < 5; i += 1) {
      const container = this.add.container(
        Math.random() * width,
        height * (0.2 + Math.random() * 0.6),
      );
      const body = this.add.ellipse(0, 0, 14 + i * 2, 5 + i, 0x08222b, 0.9);
      const tail = this.add.triangle(-11, 0, 0, -4, 0, 4, -8, 0, 0x08222b, 0.9);
      container.add([body, tail]);
      container.setAlpha(0.5);
      this.fish.push({ node: container, speed: 6 + Math.random() * 12, phase: Math.random() * 6 });
      this.staticLayer.add(container);
    }

    this.staticLayer.add(g);
    this.staticLayer.add(shafts);
  }

  // ------------------------------------------------------------------- station

  private drawStation(): void {
    const g = this.add.graphics();
    this.staticLayer.add(g);
    const { rooms, gap } = this.layout;

    // structural spine braces behind the corridor
    const corridor = rooms.corridor;
    g.fillStyle(0x061a22, 1);
    g.fillRect(0, corridor.y - gap * 0.5, corridor.x + corridor.w, gap);
    g.fillRect(0, corridor.y + corridor.h + gap * 0.5, corridor.x + corridor.w, gap);

    const order: RoomId[] = ['command', 'biolab', 'geolab', 'quarters', 'reactor', 'life', 'storage', 'medbay', 'corridor', 'rov'];
    for (const id of order) {
      const rect = rooms[id];
      this.roomRects.set(id, rect);
      this.drawRoomFrame(g, id, rect);
      this.drawRoomDetails(g, id, rect);
      this.drawProps(g, id, rect);
      this.drawRoomLabel(id, rect);
    }

    // hatches between rooms and the corridor
    for (const id of ['command', 'biolab', 'geolab', 'quarters', 'reactor', 'life', 'storage', 'medbay'] as RoomId[]) {
      const rect = rooms[id];
      const upper = rect.y < corridor.y;
      const hatchW = Math.min(46, rect.w * 0.16);
      const hatchH = Math.max(8, Math.min(16, gap + 4));
      const hatchX = rect.x + rect.w * 0.5 - hatchW / 2;
      const hatchY = upper ? corridor.y - hatchH - 1 : corridor.y + corridor.h + 1;
      g.fillStyle(0x051820, 1);
      g.fillRect(hatchX, hatchY, hatchW, hatchH);
      g.lineStyle(1, PALETTE.frameLight, 0.75);
      g.strokeRect(hatchX, hatchY, hatchW, hatchH);
      g.fillStyle(PALETTE.cyan, 0.22);
      g.fillRect(hatchX + 3, hatchY + 2, hatchW - 6, Math.max(2, hatchH - 4));
    }

    // exterior mast and antenna above the ROV bay
    const bay = rooms.rov;
    const mastX = bay.x + bay.w * 0.5;
    g.lineStyle(2, 0x2a6577, 0.9);
    g.lineBetween(mastX, bay.y - 2, mastX, bay.y - 18);
    g.lineBetween(mastX - 10, bay.y - 12, mastX + 10, bay.y - 12);
    g.fillStyle(PALETTE.amber, 0.9);
    g.fillRect(mastX - 2, bay.y - 20, 4, 4);
    g.fillStyle(PALETTE.cyan, 0.5);
    g.fillRect(mastX + 10, bay.y - 13, 4, 3);
  }

  private drawRoomFrame(g: Phaser.GameObjects.Graphics, id: RoomId, rect: Rect): void {
    const compact = id === 'corridor';
    const radius = 5;

    // outer hull with bevel
    g.fillStyle(0x071820, 1);
    g.fillRoundedRect(rect.x - 5, rect.y - 5, rect.w + 10, rect.h + 10, radius + 2);
    g.lineStyle(3, PALETTE.frame, 1);
    g.strokeRoundedRect(rect.x - 5, rect.y - 5, rect.w + 10, rect.h + 10, radius + 2);
    g.lineStyle(1, PALETTE.frameLight, 0.5);
    g.strokeRoundedRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4, radius);

    // interior
    g.fillStyle(PALETTE.interior, 1);
    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.fillStyle(PALETTE.interiorLight, 0.45);
    g.fillRect(rect.x, rect.y, rect.w, compact ? 10 : 22);
    g.fillStyle(PALETTE.floor, 1);
    g.fillRect(rect.x, rect.y + rect.h - (compact ? 8 : 18), rect.w, compact ? 8 : 18);

    // panel seams
    g.lineStyle(1, 0x1a4a5a, 0.42);
    const step = Math.max(34, Math.round(rect.w / 7));
    for (let x = rect.x + step; x < rect.x + rect.w - 4; x += step) {
      g.lineBetween(x, rect.y + 18, x, rect.y + rect.h - 16);
    }
    for (let y = rect.y + step; y < rect.y + rect.h - 18; y += step) {
      g.lineBetween(rect.x + 3, y, rect.x + rect.w - 3, y);
    }

    // rivets
    g.fillStyle(0x4d94a9, 0.65);
    for (let x = rect.x + 10; x < rect.x + rect.w - 6; x += 24) {
      g.fillRect(x, rect.y + 2, 2, 2);
      g.fillRect(x, rect.y + rect.h - 4, 2, 2);
    }

    // ceiling lamps
    if (!compact) {
      const lamps = Math.max(1, Math.floor(rect.w / 110));
      for (let i = 0; i < lamps; i += 1) {
        const lx = rect.x + 18 + i * 110;
        if (lx + 48 > rect.x + rect.w) break;
        g.fillStyle(0xffe6bd, 0.8);
        g.fillRect(lx, rect.y + 8, 44, 2);
        g.fillStyle(0xffe6bd, 0.1);
        g.fillRect(lx - 3, rect.y + 10, 50, 4);
      }
    }

    // portholes
    if (!compact && rect.w > 90) {
      const count = Math.max(1, Math.floor(rect.w / 150));
      for (let i = 0; i < count; i += 1) {
        const px = rect.x + rect.w - 24 - i * 40;
        const py = rect.y + 30;
        g.fillStyle(0x041119, 1);
        g.fillCircle(px, py, 7);
        g.lineStyle(2, PALETTE.frameLight, 0.7);
        g.strokeCircle(px, py, 7);
        g.fillStyle(0x0d4557, 0.9);
        g.fillCircle(px, py, 4);
      }
    }

    // wall trim
    g.lineStyle(2, 0x24596a, 0.8);
    g.lineBetween(rect.x + 2, rect.y + rect.h - 18, rect.x + rect.w - 2, rect.y + rect.h - 18);
  }

  private drawRoomDetails(g: Phaser.GameObjects.Graphics, id: RoomId, rect: Rect): void {
    const { x, y, w, h } = rect;

    // contact shadow where walls meet the floor
    g.fillStyle(0x000000, 0.16);
    g.fillRect(x, y + h - 20, w, 4);
    g.fillRect(x, y + 1, w, 3);

    if (id === 'corridor') {
      g.lineStyle(3, 0x1c4d5b, 0.85);
      g.lineBetween(x + 4, y + h - 22, x + w - 4, y + h - 22);
      return;
    }

    // ceiling pipe run with brackets
    g.lineStyle(3, 0x1c4d5b, 0.9);
    g.lineBetween(x + 4, y + 16, x + w - 4, y + 16);
    g.fillStyle(0x357d92, 0.9);
    for (let i = 0; i < 3; i += 1) {
      const bx = x + 14 + i * (Math.max(30, w * 0.18));
      if (bx > x + w - 12) break;
      g.fillRect(bx, y + 13, 5, 7);
    }

    // wall gauge
    const gx = x + w - 26;
    const gy = y + h * 0.44;
    g.fillStyle(0x04141b, 1);
    g.fillCircle(gx, gy, 8);
    g.lineStyle(2, 0x3f8299, 0.85);
    g.strokeCircle(gx, gy, 8);
    g.lineStyle(1, PALETTE.amber, 0.85);
    g.lineBetween(gx, gy, gx + 4, gy - 4);

    // warning placard
    g.fillStyle(0x3a2a0c, 0.85);
    g.fillRect(x + 6, y + h * 0.3, 12, 10);
    g.fillStyle(PALETTE.amber, 0.75);
    g.fillRect(x + 8, y + h * 0.3 + 3, 8, 2);
  }

  private drawProps(g: Phaser.GameObjects.Graphics, id: RoomId, rect: Rect): void {
    const { x, y, w, h } = rect;
    const cx = x + w / 2;
    const bottom = y + h - 20;
    const unit = Math.min(w, h);

    switch (id) {
      case 'command': {
        // main console bank
        g.fillStyle(0x08202a, 1);
        g.fillRect(x + w * 0.1, bottom - unit * 0.32, w * 0.8, unit * 0.22);
        const screens = 3;
        for (let i = 0; i < screens; i += 1) {
          const sw = (w * 0.7) / screens - 6;
          const sx = x + w * 0.15 + i * ((w * 0.7) / screens);
          g.fillStyle(0x0b3c4c, 1);
          g.fillRect(sx, bottom - unit * 0.28, sw, unit * 0.13);
          g.fillStyle(PALETTE.cyan, 0.55);
          g.fillRect(sx + 3, bottom - unit * 0.25, sw - 6, 2);
          g.fillRect(sx + 3, bottom - unit * 0.21, sw * 0.55, 2);
          g.fillStyle(PALETTE.amber, 0.5);
          g.fillRect(sx + 3, bottom - unit * 0.17, sw * 0.3, 2);
        }
        // operator chair
        g.fillStyle(0x123844, 1);
        g.fillRect(cx - 10, bottom - unit * 0.08, 20, unit * 0.08);
        // wall status board
        g.fillStyle(0x061a22, 1);
        g.fillRect(x + 8, y + 26, Math.min(64, w * 0.26), 30);
        g.fillStyle(PALETTE.green, 0.5);
        g.fillRect(x + 12, y + 32, 30, 2);
        g.fillStyle(PALETTE.amber, 0.5);
        g.fillRect(x + 12, y + 38, 22, 2);
        g.fillStyle(PALETTE.red, 0.5);
        g.fillRect(x + 12, y + 44, 26, 2);
        break;
      }
      case 'reactor': {
        const r = Math.min(w, h) * 0.3;
        const cy = y + h * 0.5;
        g.fillStyle(0x061a22, 1);
        g.fillCircle(cx, cy, r + 4);
        g.lineStyle(4, 0x2f6f83, 1);
        g.strokeCircle(cx, cy, r);
        g.lineStyle(2, PALETTE.amber, 0.75);
        g.strokeCircle(cx, cy, r * 0.72);
        g.lineStyle(1, PALETTE.amber, 0.5);
        g.strokeCircle(cx, cy, r * 0.46);
        g.fillStyle(PALETTE.amber, 0.32);
        g.fillCircle(cx, cy, r * 0.28);
        g.fillStyle(0x0d3441, 1);
        g.fillRect(cx - r, y + h - 26, r * 2, 10);
        // cooling pipes
        g.lineStyle(4, 0x255f72, 1);
        g.lineBetween(x + 6, cy - r * 0.6, cx - r - 2, cy - r * 0.6);
        g.lineBetween(x + 6, cy + r * 0.6, cx - r - 2, cy + r * 0.6);
        break;
      }
      case 'life': {
        const tankW = Math.min(34, w * 0.16);
        const tankH = h * 0.52;
        for (let i = 0; i < 2; i += 1) {
          const tx = x + w * 0.12 + i * (tankW + 12);
          g.fillStyle(0x08222c, 1);
          g.fillRoundedRect(tx, bottom - tankH, tankW, tankH, 6);
          g.lineStyle(2, 0x2f7488, 1);
          g.strokeRoundedRect(tx, bottom - tankH, tankW, tankH, 6);
          g.fillStyle(PALETTE.cyan, 0.22);
          g.fillRoundedRect(tx + 4, bottom - tankH * 0.62, tankW - 8, tankH * 0.56, 4);
          g.fillStyle(0x9fe9f9, 0.5);
          g.fillRect(tx + 6, bottom - tankH * 0.62, tankW - 12, 1);
        }
        // scrubber cabinet
        const sx = x + w * 0.62;
        g.fillStyle(0x0a2a35, 1);
        g.fillRect(sx, bottom - h * 0.4, w * 0.26, h * 0.4);
        g.lineStyle(1, 0x2f7488, 1);
        g.strokeRect(sx, bottom - h * 0.4, w * 0.26, h * 0.4);
        g.fillStyle(PALETTE.green, 0.75);
        g.fillRect(sx + 5, bottom - h * 0.34, w * 0.16, 3);
        g.fillStyle(PALETTE.green, 0.35);
        g.fillRect(sx + 5, bottom - h * 0.28, w * 0.11, 3);
        break;
      }
      case 'biolab': {
        g.fillStyle(0x08202a, 1);
        g.fillRect(x + 10, bottom - h * 0.26, w * 0.55, h * 0.18);
        g.fillStyle(0x154655, 1);
        g.fillRect(x + 10, bottom - h * 0.28, w * 0.55, 4);
        for (let i = 0; i < 3; i += 1) {
          g.fillStyle(PALETTE.cyan, 0.5);
          g.fillCircle(x + 26 + i * 26, bottom - h * 0.34, 4);
          g.fillStyle(0x9fe9f9, 0.4);
          g.fillCircle(x + 26 + i * 26, bottom - h * 0.34, 2);
        }
        // specimen tank
        const tx = x + w * 0.72;
        g.fillStyle(0x08222c, 1);
        g.fillRoundedRect(tx, y + h * 0.36, w * 0.2, h * 0.36, 5);
        g.lineStyle(2, 0x2f7488, 1);
        g.strokeRoundedRect(tx, y + h * 0.36, w * 0.2, h * 0.36, 5);
        g.fillStyle(PALETTE.green, 0.3);
        g.fillRoundedRect(tx + 3, y + h * 0.42, w * 0.2 - 6, h * 0.26, 4);
        break;
      }
      case 'geolab': {
        g.fillStyle(0x08202a, 1);
        g.fillRect(x + 10, bottom - h * 0.2, w * 0.5, h * 0.14);
        g.fillStyle(0x2b6172, 1);
        g.fillTriangle(x + 22, bottom - h * 0.22, x + 44, bottom - h * 0.5, x + 66, bottom - h * 0.22);
        g.fillStyle(0x39798c, 1);
        g.fillTriangle(x + 52, bottom - h * 0.22, x + 70, bottom - h * 0.38, x + 88, bottom - h * 0.22);
        // core drill
        g.lineStyle(3, PALETTE.amber, 0.6);
        g.lineBetween(x + w * 0.72, y + h * 0.32, x + w * 0.72, bottom - h * 0.18);
        g.fillStyle(0x184a5a, 1);
        g.fillRect(x + w * 0.72 - 16, y + h * 0.28, 32, 10);
        break;
      }
      case 'medbay': {
        g.fillStyle(0x08202a, 1);
        g.fillRect(x + 10, y + h * 0.55, w * 0.55, h * 0.18);
        g.fillStyle(0x1e5a6f, 1);
        g.fillRect(x + 10, y + h * 0.53, w * 0.55, 5);
        g.fillStyle(0x184a5a, 1);
        g.fillRect(x + 10, y + h * 0.55, 5, h * 0.18);
        // medical cross
        const mx = x + w * 0.78;
        const my = y + h * 0.32;
        g.fillStyle(PALETTE.red, 0.8);
        g.fillRect(mx - 3, my - 12, 7, 24);
        g.fillRect(mx - 12, my - 3, 24, 7);
        break;
      }
      case 'quarters': {
        for (let i = 0; i < 2; i += 1) {
          g.fillStyle(0x08202a, 1);
          g.fillRect(x + 10, y + 30 + i * h * 0.2, w * 0.46, h * 0.14);
          g.fillStyle(0x22596b, 1);
          g.fillRect(x + 10, y + 30 + i * h * 0.2, w * 0.46, 4);
          g.fillStyle(0x2f7488, 1);
          g.fillRect(x + 14, y + 36 + i * h * 0.2, 12, h * 0.1);
        }
        g.fillStyle(0x184a5a, 1);
        g.fillRect(x + w * 0.66, y + h * 0.24, w * 0.24, h * 0.24);
        g.fillStyle(0x2f7488, 1);
        g.fillRect(x + w * 0.68, y + h * 0.26, w * 0.2, h * 0.2);
        break;
      }
      case 'storage': {
        for (let i = 0; i < 6; i += 1) {
          const crateW = w * 0.13;
          g.fillStyle(i % 2 === 0 ? 0x1d5060 : 0x15414f, 1);
          g.fillRect(x + 10 + (i % 3) * (crateW + 4), bottom - 14 - Math.floor(i / 3) * (h * 0.12), crateW, h * 0.1);
          g.lineStyle(1, 0x2f7488, 0.6);
          g.strokeRect(x + 10 + (i % 3) * (crateW + 4), bottom - 14 - Math.floor(i / 3) * (h * 0.12), crateW, h * 0.1);
        }
        g.fillStyle(0x08202a, 1);
        g.fillRect(x + w * 0.62, y + h * 0.3, w * 0.3, h * 0.24);
        g.fillStyle(PALETTE.amber, 0.5);
        g.fillRect(x + w * 0.64, y + h * 0.34, w * 0.24, 2);
        break;
      }
      case 'corridor': {
        g.lineStyle(4, 0x1f4f5f, 1);
        g.lineBetween(x + 4, y + 12, x + w - 4, y + 12);
        g.lineStyle(2, 0x357184, 0.8);
        g.lineBetween(x + 4, y + 20, x + w - 4, y + 20);
        for (let i = 0; i < 10; i += 1) {
          const jx = x + 30 + i * (w / 10);
          g.fillStyle(0x0b3140, 1);
          g.fillRect(jx, y + 26, 14, 12);
          g.fillStyle(i % 2 === 0 ? PALETTE.cyan : PALETTE.amber, 0.7);
          g.fillRect(jx + 3, y + 30, 3, 3);
        }
        // floor hazard markings
        for (let i = 0; i < 18; i += 1) {
          g.fillStyle(i % 2 === 0 ? 0xffb454 : 0x123c4a, 0.28);
          g.fillRect(x + 8 + i * 42, y + h - 10, 22, 3);
        }
        break;
      }
      case 'rov': {
        // launch pool
        g.fillStyle(0x02090f, 1);
        g.fillEllipse(cx, bottom - 6, w * 0.72, h * 0.16);
        g.lineStyle(2, 0x2a6172, 1);
        g.strokeEllipse(cx, bottom - 6, w * 0.72, h * 0.16);
        // ROV itself, docked
        g.fillStyle(PALETTE.amber, 0.85);
        g.fillRect(cx - 12, y + 42, 24, 16);
        g.fillStyle(0x184a5a, 1);
        g.fillRect(cx - 16, y + 58, 32, 5);
        g.lineStyle(1, PALETTE.cyan, 0.5);
        g.strokeRect(cx - 12, y + 42, 24, 16);
        // rails
        g.lineStyle(2, 0x357184, 0.8);
        g.lineBetween(x + 10, y + 66, x + 10, y + h - 26);
        g.lineBetween(x + w - 10, y + 66, x + w - 10, y + h - 26);
        for (let i = 0; i < 5; i += 1) {
          g.fillStyle(0x2a6172, 0.9);
          g.fillRect(x + 10, y + 76 + i * (h / 7), w - 20, 2);
        }
        // control station
        g.fillStyle(0x08202a, 1);
        g.fillRect(x + 8, y + h * 0.3, w * 0.3, h * 0.1);
        break;
      }
      default:
        break;
    }
  }

  private drawRoomLabel(id: RoomId, rect: Rect): void {
    const plateH = Math.max(18, this.layout.labelFont + 10);
    const plateY = rect.y + rect.h - plateH - 2;
    const g = this.add.graphics();
    g.fillStyle(0x02121a, 0.92);
    g.fillRoundedRect(rect.x + 4, plateY, rect.w - 8, plateH, 3);
    g.lineStyle(1, 0x3f8299, 0.8);
    g.strokeRoundedRect(rect.x + 4, plateY, rect.w - 8, plateH, 3);
    this.staticLayer.add(g);

    const label = this.add
      .text(rect.x + rect.w / 2, plateY + plateH / 2, ROOM_LABEL[id], {
        fontFamily: 'Vazirmatn, Tahoma, sans-serif',
        fontSize: `${this.layout.labelFont}px`,
        color: '#d7f1f8',
        padding: { top: 3, bottom: 8, left: 3, right: 3 },
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.staticLayer.add(label);
    this.labels.set(id, label);
  }

  private buildCracks(): void {
    const seedFor = (id: RoomId) => id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    for (const [id, rect] of this.roomRects) {
      const seed = seedFor(id);
      const cracks: Crack[] = [];
      for (let i = 0; i < 3; i += 1) {
        const startX = rect.x + ((seed * (i + 3)) % Math.max(1, rect.w - 30)) + 15;
        const startY = rect.y + ((seed * (i + 5)) % Math.max(1, rect.h - 40)) + 20;
        const points = [{ x: startX, y: startY }];
        let px = startX;
        let py = startY;
        for (let j = 0; j < 4; j += 1) {
          px += ((seed + j * 7) % 18) - 9;
          py += 6 + ((seed + j * 5) % 8);
          points.push({ x: px, y: py });
        }
        cracks.push({ points, width: 1 + (i % 2) });
      }
      this.roomCracks.set(id, cracks);
    }
  }

  private spawnCrew(): void {
    const state = sim.state;
    let index = 0;
    for (const member of state.crew) {
      const accent = CREW_ACCENT[index % CREW_ACCENT.length]!;
      const node = this.add.container(0, 0);
      const shadow = this.add.ellipse(0, 12, 14, 5, 0x000000, 0.35);
      const legs = this.add.rectangle(0, 8, 6, 6, 0x1a3d4a, 1);
      const body = this.add.rectangle(0, 0, 9, 11, accent, 1);
      const pack = this.add.rectangle(-5, 0, 3, 7, 0x0f2c36, 1);
      const head = this.add.rectangle(0, -9, 7, 6, 0xe8f4f7, 1);
      const visor = this.add.rectangle(0, -9, 5, 2, 0x0b3c4c, 1);
      const tag = this.add
        .text(0, 16, member.name.split(' ')[0] ?? '', {
          fontFamily: 'Vazirmatn, Tahoma, sans-serif',
          fontSize: '8px',
          color: '#bfe6ef',
          backgroundColor: 'rgba(2,18,26,0.6)',
          padding: { left: 3, right: 3, top: 1, bottom: 1 },
        })
        .setOrigin(0.5, 0)
        .setAlpha(0.85);
      node.add([shadow, legs, pack, body, head, visor, tag]);
      this.crewLayer.add(node);
      this.crewNodes.set(member.id, node);
      index += 1;
    }
  }

  // ------------------------------------------------------------------ dynamic

  private refresh(_delta: number): void {
    if (!this.layout) return;
    const state: GameState = sim.state;
    const g = this.dynamic;
    const glow = this.glow;
    g.clear();
    glow.clear();
    this.elapsed += 0.16;

    for (const room of Object.values(state.rooms)) {
      const rect = this.roomRects.get(room.id);
      if (!rect) continue;
      const def = this.layout.rooms[room.id];

      if (room.water > 0.5) {
        const height = (rect.h - 4) * (room.water / 100);
        const top = rect.y + rect.h - height;
        g.fillStyle(PALETTE.water, 0.42);
        g.fillRect(rect.x + 2, top, rect.w - 4, height);
        g.fillStyle(0x9fe9f9, 0.6);
        const wobble = Math.sin(this.elapsed * 1.8 + rect.x) * 1.5;
        g.fillRect(rect.x + 2, top + wobble, rect.w - 4, 1.5);
        for (let i = 0; i < 4; i += 1) {
          const bx = rect.x + 10 + ((this.elapsed * 6 + i * 23) % Math.max(1, rect.w - 20));
          const by = top + 6 + ((i * 17) % Math.max(4, height - 6));
          g.fillStyle(0xbfeffa, 0.25);
          g.fillCircle(bx, by, 1.2);
        }
      }

      if (room.breached) {
        const pulse = 0.45 + Math.sin(this.elapsed * 5) * 0.3;
        g.lineStyle(2, PALETTE.red, pulse + 0.25);
        g.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
        g.fillStyle(PALETTE.red, pulse);
        g.fillCircle(rect.x + rect.w - 12, rect.y + 12, 4);
        // spray at the breach edge
        for (let i = 0; i < 3; i += 1) {
          const sy = rect.y + 18 + ((this.elapsed * 90 + i * 40) % Math.max(10, rect.h * 0.4));
          g.fillStyle(0xbfeffa, 0.22);
          g.fillCircle(rect.x + rect.w - 6, sy, 1.6);
        }
      }

      if (room.hull < 72) {
        const cracks = this.roomCracks.get(room.id) ?? [];
        const severity = (72 - room.hull) / 72;
        for (const crack of cracks.slice(0, room.hull < 45 ? 3 : room.hull < 60 ? 2 : 1)) {
          g.lineStyle(crack.width, 0x081a22, 0.75);
          const pts = crack.points;
          for (let i = 1; i < pts.length; i += 1) {
            g.lineBetween(pts[i - 1]!.x, pts[i - 1]!.y, pts[i]!.x, pts[i]!.y);
          }
          if (severity > 0.5) {
            g.lineStyle(1, PALETTE.amber, 0.25);
            g.lineBetween(pts[0]!.x, pts[0]!.y, pts[1]!.x, pts[1]!.y);
          }
        }
      }

      if (room.lightsOn) {
        glow.fillStyle(0xffdfae, 0.05);
        glow.fillRect(rect.x + 3, rect.y + 6, rect.w - 6, 16);
        glow.fillStyle(0x4fe0e6, 0.03);
        glow.fillRect(rect.x + 3, rect.y + rect.h - 24, rect.w - 6, 20);
      } else {
        g.fillStyle(0x000000, 0.28);
        g.fillRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
      }

      const label = this.labels.get(room.id);
      if (label) {
        const icon = room.breached ? '⚠' : room.hull < 45 ? '▲' : '';
        label.setText(icon ? `${icon} ${ROOM_LABEL[room.id]}` : ROOM_LABEL[room.id]);
        label.setColor(room.breached ? '#ffb3ab' : room.hull < 45 ? '#ffd39a' : '#d7f1f8');
      }

      if (this.selected === room.id) {
        this.drawSelection(g, rect);
      }

      void def;
    }

    if (this.focus && this.time.now < this.focusUntil) {
      const rect = this.roomRects.get(this.focus);
      if (rect) {
        const pulse = 0.5 + Math.sin(this.time.now / 180) * 0.4;
        g.lineStyle(3, PALETTE.cyan, pulse);
        g.strokeRoundedRect(rect.x - 8, rect.y - 8, rect.w + 16, rect.h + 16, 7);
        g.lineStyle(1, PALETTE.cyan, pulse * 0.5);
        g.strokeRoundedRect(rect.x - 14, rect.y - 14, rect.w + 28, rect.h + 28, 9);
      }
    } else if (this.focus && this.time.now >= this.focusUntil) {
      this.focus = null;
    }

    this.updateCrew(state);
  }

  private drawSelection(g: Phaser.GameObjects.Graphics, rect: Rect): void {
    const arm = Math.min(14, rect.w * 0.12);
    g.lineStyle(2, PALETTE.cyan, 0.95);
    const { x, y, w, h } = rect;
    // corner brackets
    g.lineBetween(x - 4, y - 4, x - 4 + arm, y - 4);
    g.lineBetween(x - 4, y - 4, x - 4, y - 4 + arm);
    g.lineBetween(x + w + 4, y - 4, x + w + 4 - arm, y - 4);
    g.lineBetween(x + w + 4, y - 4, x + w + 4, y - 4 + arm);
    g.lineBetween(x - 4, y + h + 4, x - 4 + arm, y + h + 4);
    g.lineBetween(x - 4, y + h + 4, x - 4, y + h + 4 - arm);
    g.lineBetween(x + w + 4, y + h + 4, x + w + 4 - arm, y + h + 4);
    g.lineBetween(x + w + 4, y + h + 4, x + w + 4, y + h + 4 - arm);
  }

  private updateCrew(state: GameState): void {
    let index = 0;
    for (const member of state.crew) {
      const node = this.crewNodes.get(member.id);
      if (!node) continue;
      if (!member.alive) {
        node.setVisible(false);
        continue;
      }
      const room = member.travelTo ?? member.room ?? 'corridor';
      const rect = this.roomRects.get(room) ?? this.layout.corridorBand;
      const spread = Math.min(rect.w * 0.34, 64);
      const offset = ((index % 3) - 1) * (spread / 2);
      const bob = Math.sin(this.elapsed * 5 + index) * 1.2;
      const targetX = rect.x + rect.w / 2 + offset;
      const targetY = rect.y + rect.h * 0.62 + bob;
      node.x += (targetX - node.x) * 0.14;
      node.y += (targetY - node.y) * 0.14;
      node.setVisible(true);
      index += 1;
    }
  }

  // ------------------------------------------------------------------- update

  update(_time: number, delta: number): void {
    if (!this.layout) return;
    const dt = Math.min(64, delta) / 1000;
    for (const entry of this.fish) {
      entry.node.x += entry.speed * dt * (entry.speed % 2 > 1 ? -1 : 1);
      entry.node.y += Math.sin(this.elapsed * 0.6 + entry.phase) * 0.06;
      if (entry.node.x < -40) entry.node.x = this.layout.width + 30;
      if (entry.node.x > this.layout.width + 40) entry.node.x = -30;
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
    g.fillRect(0, 0, 3, 3);
    g.generateTexture('snow', 3, 3);
    g.destroy();
    this.scene.start('station');
  }
}
