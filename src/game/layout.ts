import type { RoomId } from '../sim/types';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StationLayout {
  width: number;
  height: number;
  rooms: Record<RoomId, Rect>;
  corridorBand: Rect;
  pad: number;
  gap: number;
  roomW: number;
  roomH: number;
  corridorH: number;
  labelFont: number;
  tinyFont: number;
  compact: boolean;
}

const UPPER: RoomId[] = ['command', 'biolab', 'geolab', 'quarters'];
const LOWER: RoomId[] = ['reactor', 'life', 'storage', 'medbay'];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Responsive cutaway layout.
 *
 * The station is laid out from the *actual* viewport size instead of a fixed
 * 1920×640 art board, so a 16:9 phone, a 20:9 phone, a tablet and a desktop
 * window all get a complete, uncropped station with readable labels.
 *
 * Grid: five equal columns (four rooms + the ROV bay), two rows separated by the
 * central corridor, and the bay spanning both rows on the right.
 */
export function computeLayout(width: number, height: number): StationLayout {
  const w = Math.max(360, width);
  const h = Math.max(220, height);

  const pad = clamp(Math.round(Math.min(w, h) * 0.022), 6, 18);
  const gap = clamp(Math.round(Math.min(w, h) * 0.016), 5, 14);
  const corridorH = clamp(Math.round(h * 0.13), 40, 84);
  const roomW = (w - pad * 2 - gap * 4) / 5;
  const roomH = (h - pad * 2 - corridorH - gap * 2) / 2;

  const rooms = {} as Record<RoomId, Rect>;
  UPPER.forEach((id, index) => {
    rooms[id] = { x: pad + index * (roomW + gap), y: pad, w: roomW, h: roomH };
  });
  LOWER.forEach((id, index) => {
    rooms[id] = {
      x: pad + index * (roomW + gap),
      y: pad + roomH + gap + corridorH + gap,
      w: roomW,
      h: roomH,
    };
  });
  rooms.corridor = { x: pad, y: pad + roomH + gap, w: roomW * 4 + gap * 3, h: corridorH };
  rooms.rov = { x: pad + 4 * (roomW + gap), y: pad, w: roomW, h: h - pad * 2 };

  return {
    width: w,
    height: h,
    rooms,
    corridorBand: rooms.corridor,
    pad,
    gap,
    roomW,
    roomH,
    corridorH,
    labelFont: Math.round(clamp(roomW / 15, 10, 19)),
    tinyFont: Math.round(clamp(roomW / 24, 8, 13)),
    compact: roomW < 150,
  };
}

export function centerOf(rect: Rect): { x: number; y: number } {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}
