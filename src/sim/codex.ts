import type { GameState } from './types';

export interface CodexEntry {
  id: string;
  group: 'biology' | 'geology' | 'wreck' | 'signal' | 'crew';
  title: string;
  body: string;
  /** Human-readable hint shown while the entry is still locked. */
  hint: string;
  /** True when the player has actually earned it. */
  unlocked: (state: GameState) => boolean;
}

export const CODEX_GROUPS: Record<CodexEntry['group'], string> = {
  biology: 'زیست‌شناسی اعماق',
  geology: 'زمین‌شناسی بستر',
  wreck: 'لاشه و سوابق',
  signal: 'سیگنال ناشناس',
  crew: 'گزارش خدمه',
};

const flag = (state: GameState, id: string) => Boolean(state.flags[`codex.${id}`]);

export const CODEX: CodexEntry[] = [
  {
    id: 'tube-worms',
    group: 'biology',
    title: 'کرم‌های لوله‌ای چشمه',
    body:
      'در میدان چشمه‌های گرمابی، کرم‌های لوله‌ای در آبِ ۳۸۰ درجه و بدون نور رشد می‌کنند. ' +
      'انرژی آن‌ها از گوگرد باکتری‌های هم‌زیست می‌آید، نه از خورشید. نمونهٔ شما اولین ثبت زندهٔ ' +
      'این گونه در عمق ۴۲۰۰ متری است.',
    hint: 'در میدان چشمه‌های گرمابی نمونه جمع کن.',
    unlocked: (state) => flag(state, 'sample-vents-0') || flag(state, 'clue-vents-0'),
  },
  {
    id: 'bioluminescence',
    group: 'biology',
    title: 'فروزنی زیستی',
    body:
      'در عمق بیش از ۱۰۰۰ متر، نور روز وجود ندارد. بیش از ۷۶٪ جانداران این لایه خود نور تولید ' +
      'می‌کنند: برای شکار، برای هشدار، یا برای فریب. الگوی چشمک‌زدنِ ثبت‌شده با هیچ الگوی ' +
      'شناخته‌شده‌ای هم‌خوانی ندارد.',
    hint: 'در درهٔ تاریک چند نمونه بردار.',
    unlocked: (state) => state.stats.expeditions >= 1 && state.resources.samples >= 3,
  },
  {
    id: 'scanned-fauna',
    group: 'biology',
    title: 'ثبت جانداران درجا',
    body:
      'سه جاندار در عمق‌های مختلف با سونار اسکن شدند. الگوی حرکت دو تای آن‌ها به نور چراغ پاسخ ' +
      'معکوس می‌دهد: با روشن‌شدن چراغ فرار می‌کنند، با خاموش‌شدن نزدیک می‌شوند. یعنی اینجا نور ' +
      'یک تهدید است، نه یک ابزار بی‌طرف.',
    hint: 'با سونار سه جاندار را اسکن کن.',
    unlocked: (state) => Object.keys(state.flags).filter((key) => key.startsWith('codex.scan-')).length >= 3,
  },
  {
    id: 'rift-basalt',
    group: 'geology',
    title: 'بازالت شکاف',
    body:
      'بستر سنگی در این ناحیه از بازالت بالشی تشکیل شده که نشانهٔ فوران آرام در پشتهٔ میان‌اقیانوسی ' +
      'است. سن تخمینی نمونه‌ها با گزارش‌های پیش از فاجعه نمی‌خواند؛ لایهٔ بالایی تازه‌تر است.',
    hint: 'در دشت سنگی اعماق نمونه بگیر.',
    unlocked: (state) => flag(state, 'sample-plain-0') || state.resources.samples >= 5,
  },
  {
    id: 'trench-slope',
    group: 'geology',
    title: 'شیب دره',
    body:
      'شیب ۳۱ درجه با رسوب ناپایدار. هر جریان کوچکی می‌تواند رانش گل ایجاد کند که کابل ROV را ' +
      'می‌شکند. دو مورد رانش در فاصلهٔ ۴۰ متری ثبت شده است.',
    hint: 'در درهٔ تاریک تا عمق هدف پایین برو.',
    unlocked: (state) => flag(state, 'clue-canyon-0'),
  },
  {
    id: 'hull-281',
    group: 'wreck',
    title: 'لاشهٔ شمارهٔ ۲۸۱',
    body:
      'بدنهٔ استوانه‌ای با شمارهٔ ۲۸۱ روی ورقِ کناری. در فهرست ناوگان بنتیک، شمارهٔ ۲۸۱ به یک ' +
      'زیردریایی پشتیبانی اختصاص دارد که سال ۲۰۸۶ «در مأموریت گم شد». پلاک شناسایی عمداً ' +
      'برداشته شده است.',
    hint: 'لاشهٔ تحقیقاتی را در پنل اکتشاف پیدا کن.',
    unlocked: (state) => flag(state, 'clue-wreck-0'),
  },
  {
    id: 'recorder',
    group: 'wreck',
    title: 'ضبط‌کنندهٔ داده',
    body:
      'یک ضبط‌کنندهٔ مقاوم در محفظهٔ فشار. ۴۱ ثانیه صدا باقی مانده: صدای نالهٔ بدنه، سپس یک ' +
      'سیگنال با فرکانس پایین، سپس سکوت. متن پیام آخر: «ما فقط تماشاچی نبودیم.»',
    hint: 'در لاشهٔ تحقیقاتی دو نشانه پیدا کن.',
    unlocked: (state) => flag(state, 'clue-wreck-1'),
  },
  {
    id: 'signal-pattern',
    group: 'signal',
    title: 'الگوی تکرار',
    body:
      'سیگنال هر ۴۷ دقیقه تکرار می‌شود؛ ۴۷ دقیقه دقیقاً برابر چرخهٔ دمایی یکی از تجهیزات ایستگاه ' +
      'است. یا منبع سیگنال به ایستگاه پاسخ می‌دهد، یا ایستگاه بخشی از آن است.',
    hint: 'در منطقهٔ سیگنال ناشناس یک نشانه پیدا کن.',
    unlocked: (state) => flag(state, 'clue-signal-0'),
  },
  {
    id: 'signal-source',
    group: 'signal',
    title: 'منبع',
    body:
      'در عمق ۵۶۰۰ متر، ساختاری منظم با سه حلقهٔ هم‌مرکز. جنس سطح با هیچ آلیاژ موجود در انبار ' +
      'ایستگاه هم‌خوانی ندارد. فاصله تا منبع: ۱۲ متر.',
    hint: 'در منطقهٔ سیگنال دو نشانه پیدا کن.',
    unlocked: (state) => flag(state, 'clue-signal-1'),
  },
  {
    id: 'radmehr',
    group: 'crew',
    title: 'گزارش فرمانده رادمهر',
    body:
      '«اگر این را می‌خوانی، یعنی من نتوانستم برگردم. سه سامانه را دستی نگه داشتم تا ایستگاه زنده ' +
      'بماند. تصمیم آخر با توست: بمان و نگه‌داری کن، یا برو و حقیقت را بیرون ببر.»',
    hint: 'به اکت ۲ برس.',
    unlocked: (state) => state.stats.expeditions >= 3,
  },
  {
    id: 'salahshour',
    group: 'crew',
    title: 'یادداشت دکتر سلحشور',
    body:
      '«نمونه‌ها در فشار پایین می‌میرند. اگر می‌خواهیم چیزی ثابت کنیم، باید همان‌جا مطالعه کنیم. ' +
      'من می‌مانم؛ حتی اگر ایستگاه بالا نیاید.»',
    hint: 'سه پژوهش را کامل کن.',
    unlocked: (state) => state.research.completed.length >= 3,
  },
];

export function codexStatus(state: GameState): { unlocked: CodexEntry[]; locked: CodexEntry[]; total: number } {
  const unlocked: CodexEntry[] = [];
  const locked: CodexEntry[] = [];
  for (const entry of CODEX) {
    if (entry.unlocked(state)) unlocked.push(entry);
    else locked.push(entry);
  }
  return { unlocked, locked, total: CODEX.length };
}
