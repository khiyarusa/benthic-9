import Phaser from 'phaser';
import { ROOMS, roomDef } from '../sim/content';
import type { GameState, RoomId } from '../sim/types';
import { sim } from '../state/store';
import { selectRoom } from './bridge';

/** Cutaway world tuned for a landscape phone (≈3:1 when the HUD is subtracted). */
const WORLD_W = 1920;
const WORLD_H = 640;

const COLORS = {
  oceanTop: 0x0a2b3a,
  oceanBottom: 0x01070c,
  frame: 0x245c6e,
  frameLight: 0x44899f,
  hullDark: 0x0b2029,
  interior: 0x123c4a,
  interiorLight: 0x1e5a6f,
  floor: 0x0a2631,
  cyan: 0x43d7de,
  amber: 0xffb454,
  red: 0xff6152,
  water: 0x2a8fb8,
  green: 0x5fe0a0,
};

const CREW_COLORS = [0x43d7de, 0x9fd35a, 0xffb454, 0xd98cc9];

export class StationScene extends Phaser.Scene {
  private dynamic!: Phaser.GameObjects.Graphics;
  private crewLayer!: Phaser.GameObjects.Container;
  private crewNodes = new Map<string, Phaser.GameObjects.Container>();
  private selected: RoomId | null = null;
  private elapsed = 0;
  private roomRects = new Map<RoomId, Phaser.Geom.Rectangle>();
  private labelNodes = new Map<RoomId, Phaser.GameObjects.Text>();

  constructor() {
    super('station');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x01070c);
    this.drawOcean();
    this.drawStation();
    this.dynamic = this.add.graphics().setDepth(7);
    this.crewLayer = this.add.container(0, 0).setDepth(9);

    this.scale.on('resize', () => this.fitCamera());
    this.fitCamera();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      for (const [id, rect] of this.roomRects) {
        if (Phaser.Geom.Rectangle.Contains(rect, world.x, world.y)) {
          this.selected = id;
          selectRoom(id);
          this.refresh();
          return;
        }
      }
    });

    this.time.addEvent({ delay: 180, loop: true, callback: () => this.refresh() });
    this.refresh();
  }

  /** Contain the whole station: nothing important is ever cropped by the HUD. */
  private fitCamera(): void {
    const cam = this.cameras.main;
    const zoom = Math.min(this.scale.width / WORLD_W, this.scale.height / WORLD_H);
    cam.setZoom(zoom);
    cam.centerOn(WORLD_W / 2, WORLD_H / 2);
  }

  private drawOcean(): void {
    const bg = this.add.graphics().setDepth(0);
    const left = -600;
    const top = -400;
    const width = WORLD_W + 1200;
    const height = WORLD_H + 1440;
    const bands = 26;
    for (let i = 0; i < bands; i += 1) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(COLORS.oceanTop),
        Phaser.Display.Color.ValueToColor(COLORS.oceanBottom),
        bands,
        i,
      );
      bg.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      bg.fillRect(left, top + (height / bands) * i, width, height / bands + 1);
    }

    bg.fillStyle(0x020a10, 0.9);
    bg.fillEllipse(280, 690, 820, 260);
    bg.fillEllipse(1560, 720, 900, 300);

    const shafts = this.add.graphics().setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    for (let i = 0; i < 7; i += 1) {
      shafts.fillStyle(0x2d7f96, 0.05);
      const x = 60 + i * 290;
      shafts.fillTriangle(x, -300, x + 110, -300, x + 300, WORLD_H + 200);
      shafts.fillTriangle(x + 110, -300, x + 300, -300, x + 300, WORLD_H + 200);
    }

    this.add
      .particles(0, 0, 'snow', {
        x: { min: -200, max: WORLD_W + 200 },
        y: { min: -100, max: WORLD_H + 100 },
        lifespan: 9000,
        speedY: { min: 4, max: 14 },
        speedX: { min: -3, max: 3 },
        scale: { start: 0.6, end: 0.2 },
        alpha: { start: 0.45, end: 0 },
        quantity: 1,
        frequency: 260,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(1);
  }

  private drawStation(): void {
    const g = this.add.graphics().setDepth(2);

    // structural spine between the decks
    g.fillStyle(0x071820, 1);
    g.fillRect(96, 256, 1730, 26);
    g.fillRect(96, 372, 1730, 22);
    g.lineStyle(2, 0x1d4c5b, 0.8);
    g.lineBetween(100, 268, 1818, 268);
    g.lineBetween(100, 382, 1818, 382);

    // vertical service shafts between decks
    for (const x of [300, 670, 1040, 1400]) {
      g.fillStyle(0x0a2129, 1);
      g.fillRect(x - 12, 250, 24, 140);
      g.lineStyle(1, 0x265a6a, 0.8);
      g.strokeRect(x - 12, 250, 24, 140);
    }

    for (const room of ROOMS) {
      const rect = new Phaser.Geom.Rectangle(room.x, room.y, room.w, room.h);
      this.roomRects.set(room.id, rect);
      const compact = room.id === 'corridor';

      // outer hull
      g.fillStyle(COLORS.hullDark, 1);
      g.fillRoundedRect(room.x - 8, room.y - 8, room.w + 16, room.h + 16, 6);
      g.lineStyle(3, COLORS.frame, 1);
      g.strokeRoundedRect(room.x - 8, room.y - 8, room.w + 16, room.h + 16, 6);
      g.lineStyle(1, COLORS.frameLight, 0.55);
      g.strokeRoundedRect(room.x - 4, room.y - 4, room.w + 8, room.h + 8, 5);

      // interior
      g.fillStyle(COLORS.interior, 1);
      g.fillRect(room.x, room.y, room.w, room.h);
      g.fillStyle(COLORS.interiorLight, 0.5);
      g.fillRect(room.x, room.y, room.w, compact ? 12 : 26);
      g.fillStyle(COLORS.floor, 1);
      g.fillRect(room.x, room.y + room.h - (compact ? 10 : 26), room.w, compact ? 10 : 26);

      // panel grid
      const plate = 44;
      g.lineStyle(1, 0x1a4a5a, 0.5);
      for (let x = room.x + plate; x < room.x + room.w; x += plate) g.lineBetween(x, room.y + 6, x, room.y + room.h - 6);
      for (let y = room.y + plate; y < room.y + room.h; y += plate) g.lineBetween(room.x + 4, y, room.x + room.w - 4, y);

      // ceiling light strips + rivets
      if (!compact) {
        const strips = Math.max(1, Math.floor(room.w / 120));
        for (let i = 0; i < strips; i += 1) {
          const lx = room.x + 26 + i * 120;
          if (lx + 56 > room.x + room.w) break;
          g.fillStyle(0xffe2b4, 0.9);
          g.fillRect(lx, room.y + 10, 56, 3);
          g.fillStyle(0xffe2b4, 0.12);
          g.fillRect(lx - 4, room.y + 13, 64, 6);
        }
      }

      g.fillStyle(0x3f8299, 0.8);
      for (let x = room.x + 14; x < room.x + room.w - 8; x += 28) {
        g.fillRect(x, room.y + 3, 2, 2);
        g.fillRect(x, room.y + room.h - 5, 2, 2);
      }

      // generic wall dressing: vent grille, wall screen, floor caution strip
      if (!compact) {
        const vx = room.x + room.w - 46;
        g.fillStyle(0x0a2029, 1);
        g.fillRect(vx, room.y + 44, 30, 22);
        g.lineStyle(1, 0x3f8299, 0.7);
        for (let i = 0; i < 4; i += 1) g.lineBetween(vx + 4, room.y + 48 + i * 4, vx + 26, room.y + 48 + i * 4);

        g.fillStyle(0x0a2029, 1);
        g.fillRect(room.x + 16, room.y + 44, 42, 26);
        g.fillStyle(0x2f7488, 1);
        g.fillRect(room.x + 20, room.y + 48, 34, 18);
        g.fillStyle(COLORS.cyan, 0.5);
        g.fillRect(room.x + 24, room.y + 58, 26, 2);
        g.fillRect(room.x + 24, room.y + 53, 18, 2);

        for (let i = 0; i < 6; i += 1) {
          g.fillStyle(i % 2 === 0 ? 0xffb454 : 0x123c4a, 0.22);
          g.fillRect(room.x + 90 + i * 28, room.y + room.h - 12, 18, 4);
        }
      }

      this.drawProps(g, room.id, room.x, room.y, room.w, room.h);

      // portholes
      if (!compact) {
        const count = Math.max(1, Math.floor(room.w / 140));
        for (let i = 0; i < count; i += 1) {
          const px = room.x + 52 + i * 132;
          const py = room.y + 30;
          if (px > room.x + room.w - 34) break;
          g.fillStyle(0x041119, 1);
          g.fillCircle(px, py, 10);
          g.lineStyle(3, COLORS.frameLight, 0.75);
          g.strokeCircle(px, py, 10);
          g.fillStyle(0x0d4557, 0.9);
          g.fillCircle(px, py, 6);
        }
      }

      // label plate
      const plateH = 30;
      const plateY = room.y + room.h - plateH - 3;
      g.fillStyle(0x02121a, 0.94);
      g.fillRoundedRect(room.x + 8, plateY, room.w - 16, plateH, 3);
      g.lineStyle(1, 0x3f8299, 0.95);
      g.strokeRoundedRect(room.x + 8, plateY, room.w - 16, plateH, 3);

      const label = this.add
        .text(room.x + room.w / 2, plateY + plateH / 2, room.label, {
          fontFamily: 'Vazirmatn, Tahoma, sans-serif',
          fontSize: '18px',
          color: '#dcf4fa',
          padding: { top: 4, bottom: 10, left: 4, right: 4 },
        })
        .setOrigin(0.5)
        .setDepth(6);
      this.labelNodes.set(room.id, label);

      // connecting hatch between the room and the central spine
      if (room.id !== 'corridor' && room.id !== 'rov') {
        const doorW = 44;
        const doorH = 18;
        const doorX = room.x + room.w / 2 - doorW / 2;
        const doorY = room.y > 300 ? room.y - doorH - 3 : room.y + room.h + 3;
        g.fillStyle(0x071a22, 1);
        g.fillRect(doorX, doorY, doorW, doorH);
        g.lineStyle(2, 0x3f8299, 0.9);
        g.strokeRect(doorX, doorY, doorW, doorH);
        g.fillStyle(0x43d7de, 0.3);
        g.fillRect(doorX + 4, doorY + 4, doorW - 8, doorH - 8);
      }
    }

    // plaque removed: the HUD already carries depth and station identity
  }

  private drawProps(
    g: Phaser.GameObjects.Graphics,
    id: RoomId,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const cx = x + w / 2;
    const bottom = y + h - 30;

    switch (id) {
      case 'command': {
        g.fillStyle(0x0a2029, 1);
        g.fillRect(x + 26, bottom - 54, w - 52, 40);
        for (let i = 0; i < 3; i += 1) {
          g.fillStyle(COLORS.cyan, 0.85);
          g.fillRect(x + 44 + i * 82, bottom - 48, 54, 26);
        }
        g.fillStyle(0x184a5a, 1);
        g.fillRect(cx - 40, bottom - 14, 80, 8);
        break;
      }
      case 'reactor': {
        const cy = y + h * 0.52;
        const radius = Math.min(w, h) * 0.3;
        g.fillStyle(0x0b2129, 1);
        g.fillCircle(cx, cy, radius);
        g.lineStyle(6, 0x2b6478, 1);
        g.strokeCircle(cx, cy, radius);
        g.lineStyle(2, COLORS.amber, 0.85);
        g.strokeCircle(cx, cy, radius * 0.72);
        g.strokeCircle(cx, cy, radius * 0.46);
        g.fillStyle(COLORS.amber, 0.4);
        g.fillCircle(cx, cy, radius * 0.26);
        g.fillStyle(0x184a5a, 1);
        g.fillRect(cx - radius, y + h - 34, radius * 2, 12);
        break;
      }
      case 'life': {
        const tankH = h * 0.58;
        for (let i = 0; i < 2; i += 1) {
          const tx = x + 44 + i * 78;
          g.fillStyle(0x0a2a35, 1);
          g.fillRoundedRect(tx, bottom - tankH, 44, tankH, 8);
          g.lineStyle(2, 0x2f7488, 1);
          g.strokeRoundedRect(tx, bottom - tankH, 44, tankH, 8);
          g.fillStyle(COLORS.cyan, 0.25);
          g.fillRoundedRect(tx + 6, bottom - tankH * 0.62, 32, tankH * 0.55, 6);
        }
        g.fillStyle(0x184a5a, 1);
        g.fillRect(x + w - 106, bottom - 62, 66, 38);
        g.fillStyle(COLORS.green, 0.85);
        g.fillRect(x + w - 96, bottom - 54, 46, 4);
        g.fillRect(x + w - 96, bottom - 44, 46, 4);
        break;
      }
      case 'biolab': {
        g.fillStyle(0x0a2029, 1);
        g.fillRect(x + 22, bottom - 44, w - 44, 34);
        for (let i = 0; i < 4; i += 1) {
          g.fillStyle(COLORS.cyan, 0.6);
          g.fillCircle(x + 52 + i * 44, bottom - 58, 6);
        }
        g.fillStyle(COLORS.green, 0.45);
        g.fillRect(x + 30, bottom - 100, 74, 44);
        g.lineStyle(1, COLORS.green, 0.6);
        g.strokeRect(x + 30, bottom - 100, 74, 44);
        break;
      }
      case 'geolab': {
        g.fillStyle(0x0a2029, 1);
        g.fillRect(x + 22, bottom - 36, w - 44, 26);
        g.fillStyle(0x2b6172, 1);
        g.fillTriangle(x + 44, bottom - 40, x + 82, bottom - 104, x + 120, bottom - 40);
        g.fillStyle(0x39798c, 1);
        g.fillTriangle(x + 100, bottom - 40, x + 132, bottom - 78, x + 164, bottom - 40);
        g.lineStyle(3, COLORS.amber, 0.6);
        g.lineBetween(x + w - 74, bottom - 120, x + w - 74, bottom - 40);
        g.fillStyle(0x1c4d5c, 1);
        g.fillRect(x + w - 92, bottom - 132, 36, 14);
        break;
      }
      case 'medbay': {
        g.fillStyle(0x0a2029, 1);
        g.fillRect(x + 26, bottom - 52, 138, 34);
        g.fillStyle(0x1e5a6f, 1);
        g.fillRect(x + 26, bottom - 60, 138, 10);
        g.fillStyle(COLORS.red, 0.8);
        g.fillRect(x + w - 84, y + 46, 40, 11);
        g.fillRect(x + w - 70, y + 32, 11, 40);
        break;
      }
      case 'quarters': {
        for (let i = 0; i < 2; i += 1) {
          g.fillStyle(0x0a2029, 1);
          g.fillRect(x + 26, y + 44 + i * 46, 132, 28);
          g.fillStyle(0x22596b, 1);
          g.fillRect(x + 26, y + 44 + i * 46, 132, 6);
        }
        g.fillStyle(0x184a5a, 1);
        g.fillRect(x + w - 100, y + 52, 66, 74);
        g.fillStyle(0x2f7488, 1);
        g.fillRect(x + w - 92, y + 60, 50, 58);
        break;
      }
      case 'storage': {
        for (let i = 0; i < 6; i += 1) {
          g.fillStyle(i % 2 === 0 ? 0x1d5060 : 0x15414f, 1);
          g.fillRect(x + 30 + (i % 3) * 54, bottom - 30 - Math.floor(i / 3) * 34, 44, 26);
        }
        g.fillStyle(0x0a2029, 1);
        g.fillRect(x + w - 96, y + 48, 64, 48);
        g.fillStyle(COLORS.amber, 0.65);
        g.fillRect(x + w - 86, y + 58, 44, 4);
        break;
      }
      case 'corridor': {
        // cable trays and pipe runs
        g.lineStyle(6, 0x1f4f5f, 1);
        g.lineBetween(x + 10, y + 14, x + w - 10, y + 14);
        g.lineStyle(2, 0x357184, 0.8);
        g.lineBetween(x + 10, y + 24, x + w - 10, y + 24);
        g.lineStyle(3, 0x2a6172, 0.7);
        g.lineBetween(x + 10, y + 33, x + w - 10, y + 33);

        // hazard strip on the floor
        for (let i = 0; i < 30; i += 1) {
          g.fillStyle(i % 2 === 0 ? 0xffb454 : 0x123c4a, 0.35);
          g.fillRect(x + 12 + i * 46, y + h - 16, 24, 5);
        }

        // junction boxes and bulkhead doors along the spine
        for (let i = 0; i < 9; i += 1) {
          const dx = x + 120 + i * 148;
          g.fillStyle(0x0d3140, 1);
          g.fillRect(dx, y + 40, 26, 20);
          g.lineStyle(1, 0x3f8299, 0.8);
          g.strokeRect(dx, y + 40, 26, 20);
          g.fillStyle(i % 2 === 0 ? 0x43d7de : 0xffb454, 0.8);
          g.fillRect(dx + 5, y + 47, 4, 4);
          g.fillRect(dx + 13, y + 47, 4, 4);
          g.fillStyle(0x184a5a, 1);
          g.fillRect(dx + 46, y + h - 44, 8, 28);
        }
        break;
      }
      case 'rov': {
        g.fillStyle(0x02090f, 1);
        g.fillEllipse(cx, y + h - 54, w - 44, 84);
        g.lineStyle(3, 0x2a6172, 1);
        g.strokeEllipse(cx, y + h - 54, w - 44, 84);
        g.fillStyle(COLORS.amber, 0.85);
        g.fillRect(cx - 22, y + 40, 44, 32);
        g.fillStyle(0x184a5a, 1);
        g.fillRect(cx - 34, y + 72, 68, 10);
        g.lineStyle(2, 0x357184, 0.9);
        g.lineBetween(x + 18, y + 110, x + 18, y + h - 60);
        g.lineBetween(x + w - 18, y + 110, x + w - 18, y + h - 60);
        for (let i = 0; i < 4; i += 1) {
          g.fillStyle(0x2a6172, 1);
          g.fillRect(x + 18, y + 120 + i * 96, w - 36, 3);
        }
        break;
      }
      default:
        break;
    }
  }

  private refresh(): void {
    const state: GameState = sim.state;
    const g = this.dynamic;
    g.clear();
    this.elapsed += 0.18;

    for (const room of Object.values(state.rooms)) {
      const def = roomDef(room.id);

      if (room.water > 0.5) {
        const height = (def.h - 8) * (room.water / 100);
        g.fillStyle(COLORS.water, 0.5);
        g.fillRect(def.x + 2, def.y + def.h - height, def.w - 4, height);
        g.fillStyle(0x9fe9f9, 0.75);
        const wobble = Math.sin(this.elapsed * 1.6 + def.x) * 2;
        g.fillRect(def.x + 2, def.y + def.h - height + wobble, def.w - 4, 2);
      }

      if (room.breached) {
        const pulse = 0.55 + Math.sin(this.elapsed * 4) * 0.35;
        g.lineStyle(3, COLORS.red, pulse);
        g.strokeRect(def.x + 2, def.y + 2, def.w - 4, def.h - 4);
        g.fillStyle(COLORS.red, pulse);
        g.fillCircle(def.x + def.w - 22, def.y + 20, 6);
      }

      if (room.hull < 50) {
        g.lineStyle(2, 0xff8a3c, 0.6);
        g.lineBetween(def.x + 16, def.y + def.h - 40, def.x + 52, def.y + def.h - 76);
        g.lineBetween(def.x + 52, def.y + def.h - 76, def.x + 60, def.y + def.h - 58);
      }

      if (room.lightsOn) {
        g.fillStyle(0xffdfae, 0.05);
        g.fillRect(def.x + 6, def.y + 6, def.w - 12, 14);
      }

      const label = this.labelNodes.get(room.id);
      if (label) {
        const trouble = room.breached ? ' ⚠' : room.hull < 45 ? ' ▲' : '';
        label.setText(`${def.label}${trouble}`);
        label.setColor(room.breached ? '#ffb3ab' : room.hull < 45 ? '#ffcf9b' : '#c6eaf3');
      }

      if (this.selected === room.id) {
        g.lineStyle(3, COLORS.cyan, 0.95);
        g.strokeRoundedRect(def.x - 12, def.y - 12, def.w + 24, def.h + 24, 7);
      }
    }

    this.updateCrew(state);
  }

  private updateCrew(state: GameState): void {
    const corridor = roomDef('corridor');
    let index = 0;
    for (const member of state.crew) {
      let node = this.crewNodes.get(member.id);
      if (!member.alive) {
        node?.setVisible(false);
        continue;
      }
      if (!node) {
        const container = this.add.container(0, 0);
        const halo = this.add.circle(0, 0, 16, CREW_COLORS[index % CREW_COLORS.length]!, 0.22);
        const ring = this.add.circle(0, 0, 9, 0x04141a, 0.92);
        const body = this.add.circle(0, 0, 7, CREW_COLORS[index % CREW_COLORS.length]!, 1);
        const head = this.add.circle(0, -10, 3.5, 0xf2f7f9, 0.95);
        const tag = this.add
          .text(0, 14, member.name.split(' ')[0] ?? '', {
            fontFamily: 'Vazirmatn, Tahoma, sans-serif',
            fontSize: '11px',
            color: '#d8f2f8',
          })
          .setOrigin(0.5, 0);
        container.add([halo, ring, body, head, tag]);
        this.crewLayer.add(container);
        this.crewNodes.set(member.id, container);
        node = container;
        const start = member.room ? roomDef(member.room) : corridor;
        container.setPosition(start.x + start.w / 2, start.y + start.h / 2);
      }

      const targetDef = member.travelTo
        ? roomDef(member.travelTo)
        : member.room
          ? roomDef(member.room)
          : corridor;
      const offset = (index % 3) * 14 - 14;
      const tx = targetDef.x + targetDef.w / 2 + offset;
      const ty = targetDef.y + targetDef.h * 0.62 + (index % 2 === 0 ? -4 : 6);
      node.x += (tx - node.x) * 0.12;
      node.y += (ty - node.y) * 0.12;
      node.setVisible(true);
      index += 1;
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
