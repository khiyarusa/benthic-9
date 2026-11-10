import { ROOM_LABEL } from './content';
import { fa, faPercent } from './format';
import type { GameState, RoomId } from './types';

export interface Alert {
  level: 'critical' | 'warning' | 'info';
  text: string;
  room?: RoomId;
}

export function stationAlerts(state: GameState): Alert[] {
  const alerts: Alert[] = [];
  const rooms = Object.values(state.rooms);

  for (const room of rooms) {
    if (room.breached) {
      alerts.push({
        level: 'critical',
        text: `ترک بدنه در «${ROOM_LABEL[room.id]}» — آب وارد می‌شود`,
        room: room.id,
      });
    }
    if (room.water > 25) {
      alerts.push({
        level: 'warning',
        text: `آب‌گرفتگی ${faPercent(room.water)} در «${ROOM_LABEL[room.id]}»`,
        room: room.id,
      });
    }
    if (room.hull < 45) {
      alerts.push({ level: 'critical', text: `سازهٔ «${ROOM_LABEL[room.id]}» زیر ۴۵٪`, room: room.id });
    }
    if (room.o2 < 18) {
      alerts.push({ level: 'critical', text: `اکسیژن «${ROOM_LABEL[room.id]}» به ${faPercent(room.o2, 1)} رسید`, room: room.id });
    }
    if (room.co2 > 2.2) {
      alerts.push({ level: 'warning', text: `دی‌اکسید کربن «${ROOM_LABEL[room.id]}» بالاست (${faPercent(room.co2, 1)})`, room: room.id });
    }
    if (room.tempC > 32 || room.tempC < 7) {
      alerts.push({
        level: 'warning',
        text: `دمای «${ROOM_LABEL[room.id]}» ${fa(room.tempC, 1)} درجه است`,
        room: room.id,
      });
    }
  }

  const reactor = state.equipment['reactor-1'];
  if (reactor?.tripped) alerts.push({ level: 'critical', text: 'رآکتور قطع شده — راه‌اندازی مجدد لازم است', room: 'reactor' });
  if (state.power.brownout) alerts.push({ level: 'warning', text: 'کمبود برق: اولویت مصرف را بازبینی کن' });
  if (state.resources.fuelKg < 60) alerts.push({ level: 'warning', text: `سوخت رآکتور: ${fa(state.resources.fuelKg)} کیلوگرم` });
  if (state.resources.oxygenKg < 60) alerts.push({ level: 'critical', text: `ذخیرهٔ اکسیژن: ${fa(state.resources.oxygenKg)} کیلوگرم` });
  if (state.resources.partsKg < 10) alerts.push({ level: 'warning', text: 'قطعات یدکی رو به اتمام است' });
  if (state.resources.foodKg < 15) alerts.push({ level: 'warning', text: 'جیرهٔ غذایی کم است' });
  if (state.resources.waterL < 150) alerts.push({ level: 'warning', text: 'ذخیرهٔ آب آشامیدنی کم است' });

  for (const member of state.crew) {
    if (!member.alive) {
      alerts.push({ level: 'critical', text: `${member.name} از دست رفته است` });
    } else if (member.health < 45) {
      alerts.push({ level: 'critical', text: `${member.name} آسیب جدی دیده است` });
    }
  }

  const order: Record<Alert['level'], number> = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.level] - order[b.level]).slice(0, 8);
}

export type StationMood = 'stable' | 'strained' | 'critical';

export function stationMood(state: GameState): StationMood {
  const alerts = stationAlerts(state);
  if (alerts.some((alert) => alert.level === 'critical')) return 'critical';
  if (alerts.length > 0) return 'strained';
  return 'stable';
}

export function aliveCrew(state: GameState): number {
  return state.crew.filter((member) => member.alive).length;
}

export function average(hullValues: number[]): number {
  if (hullValues.length === 0) return 0;
  return hullValues.reduce((sum, value) => sum + value, 0) / hullValues.length;
}

export function worstRoom(state: GameState): RoomId | null {
  let worst: RoomId | null = null;
  let score = -Infinity;
  for (const room of Object.values(state.rooms)) {
    const value = -(room.water * 1.4) - (100 - room.hull) + (room.breached ? 60 : 0);
    if (value > score) {
      score = value;
      worst = room.id;
    }
  }
  return worst;
}

export function researchVisibleProgress(state: GameState): number {
  return Math.round(state.research.progress);
}
