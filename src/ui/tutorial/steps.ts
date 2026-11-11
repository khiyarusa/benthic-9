import type { GameState, RoomId } from '../../sim/types';

export interface StepCompletion {
  /** telemetry event that proves the action, e.g. "panel:power" */
  event?: string;
  /** state predicate proving the action happened */
  state?: (state: GameState) => boolean;
  /** steps that only need acknowledgement */
  manual?: boolean;
}

export interface TutorialStep {
  id: string;
  title: string;
  room: RoomId;
  /** CSS selector for the control that must stay visible and clickable */
  target?: string;
  /** fallback wording when the target cannot be found on screen */
  fallback?: string;
  lines: string[];
  completion: StepCompletion;
}

/**
 * Short lines by design: the card must fit in ~14% of a phone screen. Anything
 * longer belongs in the commander's handbook, not in the coaching card.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'arrival',
    title: 'ورود به ایستگاه',
    room: 'command',
    lines: ['فرمانده، خوش اومدی. ایستگاه وضعیت مطمئنی نداره.', 'یه نگاه به کل ایستگاه بندازیم.'],
    completion: { manual: true },
  },
  {
    id: 'crew',
    title: 'خدمه را بشناس',
    room: 'quarters',
    target: '[data-panel="crew"]',
    fallback: 'نوار پایین → «خدمه»',
    lines: ['چهار نفریم؛ هر کدوم یک تخصص اصلی دارن.', 'پنل خدمه رو باز کن.'],
    completion: { event: 'panel:crew' },
  },
  {
    id: 'station',
    title: 'وضعیت ایستگاه',
    room: 'command',
    target: '[data-panel="overview"]',
    fallback: 'نوار پایین → «ایستگاه»',
    lines: ['این‌جا خلاصهٔ همهٔ سامانه‌ها و هشدارهاست.', 'بازش کن.'],
    completion: { event: 'panel:overview' },
  },
  {
    id: 'room',
    title: 'یک اتاق را بررسی کن',
    room: 'life',
    target: '.room-card',
    fallback: 'پنل «ایستگاه» → روی کارت یک اتاق بزن',
    lines: ['هر اتاق سازه، آب، دما و اکسیژن خودش رو داره.', 'یکی از کارت‌ها رو لمس کن.'],
    completion: { event: 'room:open' },
  },
  {
    id: 'power',
    title: 'برق، خون ایستگاه',
    room: 'reactor',
    target: '[data-panel="power"]',
    fallback: 'نوار پایین → «برق»',
    lines: ['اگه برق کم بیاد، پمپ و حیات نیمه‌جان کار می‌کنن.', 'اولویت‌ها این‌جاست.'],
    completion: { event: 'panel:power' },
  },
  {
    id: 'repair',
    title: 'کار بسپار',
    room: 'life',
    target: '[data-panel="crew"]',
    fallback: 'پنل خدمه → وظیفهٔ دستی',
    lines: ['خدمه خودشون کار فوری برمی‌دارن، ولی تو می‌تونی مستقیم بسپاری.', 'یک نفر رو به تعمیر بگمار.'],
    completion: {
      state: (state) =>
        state.crew.some((member) => ['repair', 'seal', 'weld', 'pump'].includes(member.task.kind)) ||
        state.stats.repairs > 0,
    },
  },
  {
    id: 'life',
    title: 'پشتیبانی حیات',
    room: 'life',
    target: '[data-panel="life"]',
    fallback: 'نوار پایین → «حیات»',
    lines: ['اکسیژن از آب و برق ساخته می‌شه؛ ذخیره چند ساعت بیشتر نیست.', 'غلظت اکسیژن هر اتاق این‌جاست.'],
    completion: { event: 'panel:life' },
  },
  {
    id: 'research',
    title: 'پژوهش را شروع کن',
    room: 'geolab',
    target: '[data-panel="research"]',
    fallback: 'نوار پایین → «پژوهش»',
    lines: ['بدون فناوری، ایستگاه فقط دوام می‌آره.', 'یک گره انتخاب کن.'],
    completion: {
      state: (state) => state.research.activeNodeId !== null || state.research.completed.length > 0,
    },
  },
  {
    id: 'storage',
    title: 'انبار و ساخت',
    room: 'storage',
    target: '[data-panel="storage"]',
    fallback: 'نوار پایین → «انبار»',
    lines: ['قطعات یدکی تموم‌شدنی‌ان.', 'موجودی و ساخت رو ببین.'],
    completion: { event: 'panel:storage' },
  },
  {
    id: 'expedition',
    title: 'اولین سفر ROV',
    room: 'rov',
    target: '[data-panel="rov"]',
    fallback: 'نوار پایین → «اکتشاف»',
    lines: ['ROV تنها چشم ما بیرونه.', 'یک عمق انتخاب کن و بفرست.'],
    completion: {
      state: (state) => state.rov.deployed || state.stats.expeditions > 0,
    },
  },
  {
    id: 'reports',
    title: 'گزارش‌ها',
    room: 'command',
    target: '[data-panel="log"]',
    fallback: 'نوار پایین → «گزارش»',
    lines: ['هر اتفاقی این‌جا ثبت می‌شه.', 'وقتی گم شدی، اول همین رو باز کن.'],
    completion: { event: 'panel:log' },
  },
  {
    id: 'first-shift',
    title: 'پایان شیفت اول',
    room: 'corridor',
    lines: ['ایستگاه هنوز سرپاست و خدمه بهت اعتماد دارن.', 'از این به بعد خودت تصمیم می‌گیری.'],
    completion: { manual: true },
  },
];

export const GUIDE = {
  name: 'آرمان کیانی',
  role: 'مهندس ارشد',
};

export const TUTORIAL_TITLE = 'اولین شیفت فرمانده';

const STORAGE_KEY = 'benthic9.tutorial.v3';

export interface TutorialProgress {
  index: number;
  done: boolean;
  paused: boolean;
  minimized: boolean;
}

export const EMPTY_PROGRESS: TutorialProgress = { index: 0, done: false, paused: false, minimized: false };

export function loadProgress(): TutorialProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<TutorialProgress>;
    return {
      index: Math.max(0, Math.min(TUTORIAL_STEPS.length, Number(parsed.index) || 0)),
      done: Boolean(parsed.done),
      paused: Boolean(parsed.paused),
      minimized: Boolean(parsed.minimized),
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export function saveProgress(progress: TutorialProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* private browsing */
  }
}
