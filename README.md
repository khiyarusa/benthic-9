# BENTHIC-9 | بنتیک-۹ — ایستگاه اعماق

شبیه‌سازی بقا و مدیریت ایستگاه تحقیقاتی در عمق ۵۸۰۰ متری اقیانوس آرام.
بازی ابتدا وب است و با Capacitor به اپلیکیشن اندروید (فقط افقی) تبدیل می‌شود.

![نمای ایستگاه](docs/screenshots/phone-game.png)

## اجرا

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # بیلد تولیدی در dist/
npm test           # تست‌های شبیه‌سازی (Vitest)
npx playwright test # تست جریان‌های رابط (نیاز به مرورگر)
```

## ساخت اندروید

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

APK در `android/app/build/outputs/apk/debug/app-debug.apk` ساخته می‌شود. در GitHub Actions
این کار به‌صورت خودکار انجام و APK به‌عنوان artifact (و در صورت انتشار release، به صفحهٔ
انتشار) پیوست می‌شود.

## وضعیت فعلی

| بخش | وضعیت |
|---|---|
| شبیه‌سازی هسته (فشار، سازه، سیل، برق، حیات، حرارت) | پیاده‌سازی و تست‌شده |
| خدمه، وظایف خودکار، ناوبری، نیازها | پیاده‌سازی و تست‌شده |
| پژوهش (۹ گره، ۴ شاخه)، انبار، ساخت قطعه | پیاده‌سازی و تست‌شده |
| ROV و اکتشاف | پیاده‌سازی و تست‌شده |
| رابط فارسی RTL، پنل‌ها، ذخیرهٔ محلی | پیاده‌سازی و در مرورگر تأیید شده |
| برش جانبی ایستگاه در Phaser | پیاده‌سازی و در مرورگر تأیید شده |
| بستهٔ اندروید و قفل چرخش افقی | پیکربندی شده؛ بیلد در CI |
| صدا | جلوه‌های کوتاه WebAudio؛ موسیقی محیطی ندارد |
| محتوای روایی کمپین | حداقلی (شش هدف متنی) |
| آزمون روی دستگاه واقعی | انجام نشده |

## ساختار

```
src/sim/        هستهٔ شبیه‌سازی مستقل از React و Phaser
src/game/       صحنهٔ Phaser و برش جانبی ایستگاه
src/ui/         رابط React، پنل‌های مدیریتی و صفحات
src/state/      پل ارتباطی شبیه‌سازی و React
src/audio/      جلوه‌های صوتی کوتاه
tests/          تست‌های Vitest و Playwright
docs/           معماری، مدل شبیه‌سازی، نقشهٔ راه و وضعیت
android/        پروژهٔ Capacitor اندروید
```

جزئیات بیشتر: [ARCHITECTURE.md](docs/ARCHITECTURE.md) — [SIMULATION_MODEL.md](docs/SIMULATION_MODEL.md) —
[ROADMAP.md](docs/ROADMAP.md) — [PROGRESS.md](docs/PROGRESS.md)
