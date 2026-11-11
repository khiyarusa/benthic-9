import { ROOM_LABEL, fa } from '../sim';
import type { GameState, RoomId } from '../sim/types';
import type { PanelId } from '../ui/components/BottomNav';

export interface NextAction {
  /** short imperative shown on the command bar */
  label: string;
  /** why it matters, one sentence */
  reason: string;
  room?: RoomId;
  panel?: PanelId;
  tone: 'critical' | 'warn' | 'normal';
}

/**
 * The single most useful thing the player can do right now, derived only from
 * live simulation state. Ordering is by actual danger, not by script.
 */
export function nextAction(state: GameState): NextAction {
  const rooms = Object.values(state.rooms);

  const breached = rooms.find((room) => room.breached);
  if (breached) {
    return {
      label: `مهار ترک ${ROOM_LABEL[breached.id]}`,
      reason: 'بدنه باز است و آب وارد می‌شود؛ هر دقیقه وضعیت بدتر می‌شود.',
      room: breached.id,
      tone: 'critical',
    };
  }

  const lowestO2 = rooms.reduce((min, room) => (room.o2 < min.o2 ? room : min), rooms[0]!);
  if (lowestO2.o2 < 17 || state.resources.oxygenKg < 40) {
    return {
      label: 'پشتیبانی حیات را بررسی کن',
      reason: `کم‌ترین اکسیژن اتاق ${fa(Math.round(lowestO2.o2))}٪ و ذخیره ${fa(Math.round(state.resources.oxygenKg))} کیلوگرم است.`,
      panel: 'life',
      tone: 'critical',
    };
  }

  const marginPct = state.power.capacityKW > 0
    ? (state.power.capacityKW - state.power.demandKW) / state.power.capacityKW
    : 0;
  if (marginPct < 0.05) {
    return {
      label: 'برق را مدیریت کن',
      reason: `مصرف ${fa(Math.round(state.power.demandKW))} از ${fa(Math.round(state.power.capacityKW))} کیلووات؛ حاشیه‌ای نمانده.`,
      panel: 'power',
      tone: 'critical',
    };
  }

  const flooding = rooms.find((room) => room.water > 26);
  if (flooding) {
    return {
      label: `تخلیهٔ آب ${ROOM_LABEL[flooding.id]}`,
      reason: `سطح آب ${fa(Math.round(flooding.water))}٪ است؛ پمپ و دریچهٔ ضدآب را بررسی کن.`,
      room: flooding.id,
      tone: 'warn',
    };
  }

  const damaged = rooms.find((room) => room.hull < 52);
  if (damaged) {
    return {
      label: `تقویت بدنهٔ ${ROOM_LABEL[damaged.id]}`,
      reason: `سازهٔ این اتاق ${fa(Math.round(damaged.hull))}٪ است؛ جوشکاری ۳ کیلوگرم قطعه می‌خواهد.`,
      room: damaged.id,
      tone: 'warn',
    };
  }

  const brokenGear = Object.values(state.equipment).find((gear) => gear.health < 55 && !gear.running);
  if (brokenGear) {
    return {
      label: `تعمیر ${brokenGear.label}`,
      reason: 'این تجهیز از کار افتاده و در وضعیت فعلی سهم خودش را از شبکه نمی‌گیرد.',
      room: brokenGear.room,
      tone: 'warn',
    };
  }

  if (state.research.activeNodeId === null && state.research.completed.length < 9) {
    return {
      label: 'یک پژوهش را شروع کن',
      reason: 'بدون فناوری تازه، ایستگاه فقط دوام می‌آورد و بهتر نمی‌شود.',
      panel: 'research',
      tone: 'normal',
    };
  }

  if (!state.rov.deployed && state.rov.batteryPct > 45) {
    return {
      label: 'ROV را بفرست',
      reason: 'نمونه‌ها و دادهٔ اعماق، سوخت پژوهش و ارتقا هستند.',
      panel: 'rov',
      tone: 'normal',
    };
  }

  const idle = state.crew.filter((member) => member.alive && member.task.kind === 'idle');
  if (idle.length > 0) {
    return {
      label: 'به خدمهٔ بیکار کار بده',
      reason: `${fa(idle.length)} نفر بی‌کارند؛ کار دستی سریع‌تر از انتظار برای انتخاب خودکار است.`,
      panel: 'crew',
      tone: 'normal',
    };
  }

  return {
    label: 'وضعیت را مرور کن',
    reason: 'همهٔ سامانه‌ها در محدودهٔ امن‌اند؛ وقت خوبی برای برنامه‌ریزی پژوهش و اکتشاف است.',
    panel: 'overview',
    tone: 'normal',
  };
}
