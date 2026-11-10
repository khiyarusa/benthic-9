import type { RoomId } from '../sim/types';

type RoomSelectHandler = (room: RoomId) => void;

let handler: RoomSelectHandler | null = null;

export function setRoomSelectHandler(next: RoomSelectHandler | null): void {
  handler = next;
}

export function selectRoom(room: RoomId): void {
  handler?.(room);
}
