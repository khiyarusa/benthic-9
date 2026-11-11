import type { GameState, RoomId } from '../../sim/types';

export interface TutorialStep {
  id: string;
  title: string;
  room: RoomId;
  /** CSS selector that receives the spotlight, when the element is on screen */
  target?: string;
  /** telemetry event that proves the player performed the action */
  action?: string;
  /** state predicate that proves the player performed the action */
  done?: (state: GameState) => boolean;
  /** if true the player advances with the «ادامه» button */
  manual?: boolean;
  lines: string[];
  hint?: string;
}

export const GUIDE = {
  name: 'آرمان کیانی',
  role: 'مهندس ارشد ایستگاه',
};

export const TUTORIAL_TITLE = 'اولین شیفت فرمانده';
export const TUTORIAL_SUBTITLE =
  'به بنتیک-۹ خوش آمدی. از این لحظه، زنده ماندن این ایستگاه به تصمیم‌های تو بستگی دارد.';

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'arrival',
    title: 'ورود به ایستگاه',
    room: 'command',
    manual: true,
    lines: [
      'فرمانده، خوش اومدی. من آرمان کیانی‌ام، مهندس ارشد. از این به بعد کنارتم.',
      'ارتباط با سطح قطع شده و سه سامانه وضعیت مطمئنی ندارن. اول یه نگاه به ایستگاه بندازیم.',
    ],
    hint: 'برای شروع، دکمهٔ «ادامه» را بزن.',
  },
  {
    id: 'crew',
    title: 'آشنایی با خدمه',
    room: 'quarters',
    target: '[data-panel="crew"]',
    action: 'panel:crew',
    lines: [
      'چهار نفریم: نگار زیست‌شناس، کامران زمین‌شناس، لیلا پزشک و خودم.',
      'هر کدام یک تخصص اصلی دارن. پنل خدمه رو باز کن تا وضعیت و مهارت‌هاشون رو ببینی.',
    ],
    hint: 'نوار پایین → «خدمه».',
  },
  {
    id: 'station',
    title: 'شناخت ایستگاه',
    room: 'corridor',
    target: '[data-panel="overview"]',
    action: 'panel:overview',
    lines: [
      'ایستگاه ده اتاق داره؛ دو عرشه که با راهروی مرکزی به هم وصلن.',
      'پنل «ایستگاه» وضعیت کلی، هشدارها و اهداف رو نشون می‌ده.',
    ],
    hint: 'نوار پایین → «ایستگاه».',
  },
  {
    id: 'room',
    title: 'بررسی یک اتاق',
    room: 'life',
    target: '.room-card',
    action: 'room:open',
    lines: [
      'هر اتاق وضعیت خودش رو داره: سازه، آب، دما، اکسیژن و تجهیزات.',
      'روی یکی از کارت‌های اتاق ضربه بزن. یا مستقیم روی خود اتاق در نمای ایستگاه بزن.',
    ],
    hint: 'کارت اتاق را لمس کن.',
  },
  {
    id: 'power',
    title: 'مدیریت برق',
    room: 'reactor',
    target: '[data-panel="power"]',
    action: 'panel:power',
    lines: [
      'برق، خون ایستگاهه. اگه کم بیاد، پمپ‌ها و پشتیبانی حیات نیمه‌جان کار می‌کنن.',
      'اولویت اتاق‌ها رو اینجا تعیین می‌کنیم. راکتور رو هم از همین پنل می‌شه راه‌اندازی کرد.',
    ],
    hint: 'نوار پایین → «برق».',
  },
  {
    id: 'repair',
    title: 'سپردن کار به خدمه',
    room: 'life',
    target: '[data-panel="overview"]',
    done: (state) =>
      state.crew.some((member) => ['repair', 'seal', 'weld', 'pump'].includes(member.task.kind)) ||
      state.stats.repairs > 0,
    lines: [
      'خدمه خودشون کار فوری رو برمی‌دارن، ولی تو می‌تونی مستقیم هم بهشون کار بسپاری.',
      'توی پنل اتاق، تب «تعمیرات»: یک تجهیز رو به مهندس بسپار یا بدنه رو تقویت کن.',
    ],
    hint: 'پنل اتاق → تب تعمیرات → سپردن به مهندس.',
  },
  {
    id: 'life',
    title: 'پشتیبانی حیات',
    room: 'life',
    target: '[data-panel="life"]',
    action: 'panel:life',
    lines: [
      'اکسیژن از آب و برق ساخته می‌شه. اگه الکترولیز بخوابه، ذخیره فقط چند ساعت کافیه.',
      'این پنل غلظت اکسیژن و CO₂ هر اتاق رو نشون می‌ده.',
    ],
    hint: 'نوار پایین → «حیات».',
  },
  {
    id: 'research',
    title: 'پژوهش',
    room: 'geolab',
    target: '[data-panel="research"]',
    done: (state) => state.research.activeNodeId !== null || state.research.completed.length > 0,
    lines: [
      'بدون پژوهش، ایستگاه فقط دوام می‌آره؛ بهتر نمی‌شه.',
      'با دادهٔ پژوهشی یک گره رو شروع کن. آلیاژ فشار بالا فرسایش بدنه رو کم می‌کنه.',
    ],
    hint: 'نوار پایین → «پژوهش» → شروع پژوهش.',
  },
  {
    id: 'storage',
    title: 'انبار و ساخت',
    room: 'storage',
    target: '[data-panel="storage"]',
    action: 'panel:storage',
    lines: [
      'قطعات یدکی تموم‌شدنی‌اند. کارگاه ساخت می‌تونه از قراضه، قطعهٔ تازه بسازه.',
      'هر تعمیر قطعه مصرف می‌کنه؛ موجودی رو زیر نظر داشته باش.',
    ],
    hint: 'نوار پایین → «انبار».',
  },
  {
    id: 'expedition',
    title: 'اولین سفر ROV',
    room: 'rov',
    target: '[data-panel="rov"]',
    done: (state) => state.rov.deployed || state.stats.expeditions > 0,
    lines: [
      'بیرون ایستگاه، دنیایی هست که باید بشناسیمش. ROV تنها چشم ما در اونه.',
      'یک عمق انتخاب کن و رها کن. مراقب باتری باش؛ برگشت هم بخشی از مأموریته.',
    ],
    hint: 'نوار پایین → «اکتشاف» → انتخاب عمق.',
  },
  {
    id: 'reports',
    title: 'گزارش‌ها',
    room: 'command',
    target: '[data-panel="log"]',
    action: 'panel:log',
    lines: [
      'هر اتفاقی که می‌افته اینجا ثبت می‌شه؛ از ترک بدنه تا تعمیر موفق.',
      'وقتی گم شدی، گزارش‌ها و «راهنمای فرمانده» بهترین مرجع‌اند.',
    ],
    hint: 'نوار پایین → «گزارش».',
  },
  {
    id: 'first-shift',
    title: 'پایان شیفت اول',
    room: 'corridor',
    manual: true,
    done: (state) => state.minute >= 20,
    lines: [
      'بیست دقیقه دوام آوردی. ایستگاه هنوز سرپاست و خدمه بهت اعتماد دارن.',
      'از این به بعد خودت تصمیم می‌گیری. اگه نیاز شد، «راهنمای فرمانده» همیشه در دسترسه.',
    ],
    hint: 'وقتی آماده بودی، «پایان آموزش» را بزن.',
  },
];

const STORAGE_KEY = 'benthic9.tutorial.v2';

export interface TutorialProgress {
  index: number;
  done: boolean;
  paused: boolean;
}

export function loadTutorialProgress(): TutorialProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { index: 0, done: false, paused: false };
    const parsed = JSON.parse(raw) as TutorialProgress;
    return {
      index: Number.isFinite(parsed.index) ? Math.max(0, Math.min(TUTORIAL_STEPS.length, parsed.index)) : 0,
      done: Boolean(parsed.done),
      paused: Boolean(parsed.paused),
    };
  } catch {
    return { index: 0, done: false, paused: false };
  }
}

export function saveTutorialProgress(progress: TutorialProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* storage can be unavailable in private browsing */
  }
}
