import type { RoomId } from '../sim/types';

type RoomHandler = (room: RoomId) => void;

let selectHandler: RoomHandler | null = null;
let focusHandler: RoomHandler | null = null;

export function setRoomSelectHandler(next: RoomHandler | null): void {
  selectHandler = next;
}

export function selectRoom(room: RoomId): void {
  selectHandler?.(room);
}

/** Ask the Phaser scene to highlight and pulse a room (used by the tutorial). */
export function setRoomFocusHandler(next: RoomHandler | null): void {
  focusHandler = next;
}

export function focusRoom(room: RoomId): void {
  focusHandler?.(room);
}
