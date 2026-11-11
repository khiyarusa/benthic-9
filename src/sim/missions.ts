import { codexStatus } from './codex';
import type { GameState } from './types';

export type ActId = 'survive' | 'investigate' | 'descend';

export interface Mission {
  id: string;
  act: ActId;
  title: string;
  why: string;
  steps: string[];
  /** 0..1 — derived from live simulation state, never stored. */
  progress: (state: GameState) => number;
  reward: string;
}

export const ACTS: Record<ActId, { title: string; subtitle: string; goal: string }> = {
  survive: {
    title: 'پردهٔ یکم — زنده بمان',
    subtitle: 'ایستگاه را پایدار کن',
    goal: 'سه سامانهٔ حیاتی آسیب دیده‌اند. تا وقتی برق، هوا و بدنه پایدار نشوند، هیچ کاوشی معنا ندارد.',
  },
  investigate: {
    title: 'پردهٔ دوم — بررسی کن',
    subtitle: 'منبع سیگنال را پیدا کن',
    goal: 'سیگنال هر ۴۷ دقیقه تکرار می‌شود. باید نمونه بگیری، لاشه را پیدا کنی و داده‌های گم‌شده را برگردانی.',
  },
  descend: {
    title: 'پردهٔ سوم — پایین برو',
    subtitle: 'به منبع برس',
    goal: 'منبع در عمق ۵۶۰۰ متری است. ایستگاه باید آماده باشد، وگرنه برگشتی در کار نیست.',
  },
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function minRoomO2(state: GameState): number {
  return Math.min(...Object.values(state.rooms).map((room) => room.o2));
}

export const MISSIONS: Mission[] = [
  // ---- ACT 1 ----
  {
    id: 'm-power',
    act: 'survive',
    title: 'برق را پایدار کن',
    why: 'بدون برق، هواساز و پمپ‌ها از کار می‌افتند و خدمه در چند ساعت از دست می‌روند.',
    steps: ['پنل برق را باز کن', 'خروجی رآکتور را بالا ببر', 'باتری را از حالت قطع خارج کن'],
    progress: (state) => {
      // Three independent signals must all be healthy, so the mission cannot
      // complete on the first tick with default values.
      const supply = state.power.demandKW <= 0 ? 0 : clamp01(state.power.suppliedKW / state.power.demandKW);
      const battery = clamp01(state.power.batteryKWh / Math.max(1, state.power.batteryCapacityKWh));
      const thermal = state.power.reactorTempC < 240 ? 1 : clamp01(1 - (state.power.reactorTempC - 240) / 120);
      const steady = state.power.brownout ? 0 : 1;
      return clamp01((supply * 0.45 + battery * 0.3 + thermal * 0.25) * steady);
    },
    reward: 'ظرفیت برق پایدار؛ چراغ همهٔ اتاق‌ها روشن می‌ماند.',
  },
  {
    id: 'm-flood',
    act: 'survive',
    title: 'آب‌گرفتگی راهرو را بخوابان',
    why: 'راهروی مرکزی ستون فقرات ایستگاه است؛ اگر پر شود، دسترسی به قفل خروج قطع می‌شود.',
    steps: ['پمپ راهرو را روشن کن', 'دریچهٔ نشتی را ببند', 'سطح آب را زیر ۵٪ نگه دار'],
    progress: (state) => clamp01(1 - state.rooms.corridor.water / 26),
    reward: 'دسترسی به قفل خروج ROV باز می‌ماند.',
  },
  {
    id: 'm-repair',
    act: 'survive',
    title: 'سه تجهیز را ترمیم کن',
    why: 'هر تجهیز خراب، یک زنجیره را می‌شکند: تصفیه، خنک‌کاری، یا فشار بدنه.',
    steps: ['از انبار قطعه بردار', 'به اتاق آسیب‌دیده برو', 'تعمیر را کامل کن'],
    progress: (state) => clamp01(state.stats.repairs / 3),
    reward: 'قابلیت اطمینان سامانه‌ها بالا می‌رود؛ خرابی‌های تصادفی کمتر می‌شوند.',
  },
  {
    id: 'm-day',
    act: 'survive',
    title: 'یک شب کامل را زنده بمان',
    why: 'چرخهٔ ۲۴ ساعته نشان می‌دهد ایستگاه بدون کمک بیرونی دوام می‌آورد یا نه.',
    steps: ['ذخیرهٔ اکسیژن را کنترل کن', 'خدمه را از خستگی خارج کن', 'تا دقیقهٔ ۱۴۴۰ ادامه بده'],
    progress: (state) => clamp01(state.minute / 1440),
    reward: 'پردهٔ دوم باز می‌شود: سیگنال جدی گرفته می‌شود.',
  },

  // ---- ACT 2 ----
  {
    id: 'm-dive',
    act: 'investigate',
    title: 'نخستین شیرجه را انجام بده',
    why: 'تنها راه دیدن بستر، فرستادن ROV است. سیگنال از پایین‌تر می‌آید.',
    steps: ['پنل اکتشاف را باز کن', 'یک زیستگاه را انتخاب کن', 'با لمس آب هدایت کن و برگرد'],
    progress: (state) => clamp01(state.stats.expeditions / 1),
    reward: 'دسترسی به زیستگاه‌های عمیق‌تر.',
  },
  {
    id: 'm-samples',
    act: 'investigate',
    title: 'ده نمونهٔ زیستی جمع کن',
    why: 'بدون نمونه، فرضیهٔ «حیات مستقل از خورشید» فقط یک حدس است.',
    steps: ['در شیرجه به نشانه‌های سبز نزدیک شو', 'باتری را برای بازگشت نگه دار', 'نمونه‌ها را به آزمایشگاه ببر'],
    progress: (state) => clamp01(state.resources.samples / 10),
    reward: 'پژوهش زیستی سطح ۲ قابل انجام می‌شود.',
  },
  {
    id: 'm-wreck',
    act: 'investigate',
    title: 'لاشه را پیدا کن',
    why: 'گروه پژوهشی پیشین ناپدید شد. اگر لاشه‌شان اینجاست، سوابقش هم اینجاست.',
    steps: ['در پنل اکتشاف «لاشهٔ تحقیقاتی» را انتخاب کن', 'در شیرجه دو نشانه پیدا کن'],
    progress: (state) => (state.flags['codex.clue-wreck-0'] ? (state.flags['codex.clue-wreck-1'] ? 1 : 0.6) : 0),
    reward: 'ضبط‌کنندهٔ داده به کدکس اضافه می‌شود.',
  },
  {
    id: 'm-research',
    act: 'investigate',
    title: 'دو پژوهش را کامل کن',
    why: 'برد سونار و بازوی رباتیک، تفاوت بین یک نگاه و یک کشف است.',
    steps: ['پنل پژوهش را باز کن', 'نمونه و داده را خرج کن', 'دو فناوری را تکمیل کن'],
    progress: (state) => clamp01(state.research.completed.length / 2),
    reward: 'برد سونار و ظرفیت نمونه افزایش می‌یابد.',
  },

  // ---- ACT 3 ----
  {
    id: 'm-depth',
    act: 'descend',
    title: 'به عمق ۵۴۰۰ متر برس',
    why: 'منبع سیگنال زیر لایهٔ رسوبی است؛ ROV باید تا آنجا تحمل کند.',
    steps: ['بدنهٔ ROV را تعمیر کن', 'باتری را کامل شارژ کن', 'شیرجهٔ عمیق را آغاز کن'],
    progress: (state) => clamp01(state.rov.depthM / 5400),
    reward: 'منطقهٔ سیگنال روی نقشه باز می‌شود.',
  },
  {
    id: 'm-signal',
    act: 'descend',
    title: 'دو نشانهٔ سیگنال را ثبت کن',
    why: 'یک نشانه اتفاق است؛ دو نشانه الگو. الگو یعنی منبع.',
    steps: ['در منطقهٔ سیگنال دو نشانه پیدا کن', 'به هشدار کابل توجه کن'],
    progress: (state) => {
      const a = state.flags['codex.clue-signal-0'] ? 1 : 0;
      const b = state.flags['codex.clue-signal-1'] ? 1 : 0;
      return (a + b) / 2;
    },
    reward: 'کدکس «منبع» باز می‌شود.',
  },
  {
    id: 'm-codex',
    act: 'descend',
    title: 'شش یادداشت کدکس را باز کن',
    why: 'تصمیم آخر بدون شش تکه از پازل، حدس است نه انتخاب.',
    steps: ['شیرجه‌های هدفمند انجام بده', 'پژوهش را کامل کن', 'کدکس را مرور کن'],
    progress: (state) => clamp01(codexStatus(state).unlocked.length / 6),
    reward: 'گزینهٔ تصمیم نهایی باز می‌شود.',
  },
  {
    id: 'm-final',
    act: 'descend',
    title: 'تصمیم نهایی را بگیر',
    why: 'ایستگاه می‌تواند بماند و نگه‌داری کند، یا داده را بیرون ببرد و رها کند. هر دو هزینه دارند.',
    steps: ['همهٔ مأموریت‌های پردهٔ سوم را کامل کن', 'به منبع برس', 'انتخاب را ثبت کن'],
    progress: (state) => {
      const others = MISSIONS.filter((m) => m.act === 'descend' && m.id !== 'm-final');
      const done = others.every((m) => m.progress(state) >= 1);
      return done ? 1 : Math.min(0.9, others.reduce((sum, m) => sum + m.progress(state), 0) / others.length);
    },
    reward: 'پایان کمپین — یکی از دو سرنوشت ایستگاه.',
  },
];

export interface MissionView extends Mission {
  value: number;
  done: boolean;
  locked: boolean;
}

export function missionBoard(state: GameState): { acts: Array<{ id: ActId; missions: MissionView[]; done: number; total: number }> } {
  const order: ActId[] = ['survive', 'investigate', 'descend'];
  let previousDone = true;
  const acts = order.map((act) => {
    const missions = MISSIONS.filter((m) => m.act === act).map<MissionView>((m) => {
      const value = m.progress(state);
      return { ...m, value, done: value >= 1, locked: !previousDone };
    });
    const done = missions.filter((m) => m.done).length;
    if (done < missions.length) previousDone = false;
    return { id: act, missions, done, total: missions.length };
  });
  return { acts };
}

/** The single objective the HUD shows: first mission that is not finished. */
export function primaryMission(state: GameState): MissionView | null {
  for (const mission of MISSIONS) {
    const value = mission.progress(state);
    if (value >= 1) continue;
    return { ...mission, value, done: false, locked: false };
  }
  return null;
}

export function missionById(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function minOxygenHint(state: GameState): number {
  return minRoomO2(state);
}
