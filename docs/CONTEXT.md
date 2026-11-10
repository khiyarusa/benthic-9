# کارت وضعیت BENTHIC-9

آخرین به‌روزرسانی: ۱۰ نوامبر ۲۰۲۶ — این فایل جانشین تاریخچهٔ گفتگو است.

## چه ساخته شد

یک بازی وب کامل و قابل‌بازی به نام **BENTHIC-9 | بنتیک-۹ — ایستگاه اعماق**:

- هستهٔ شبیه‌سازی TypeScript خالص: فشار، سازه، سیل، برق، حیات، حرارت، خدمه، پژوهش، حوادث، ROV.
- رابط React فارسی RTL با ۹ پنل مدیریتی و فونت Vazirmatn لوکال.
- صحنهٔ Phaser 4.2.1: برش جانبی ده اتاق، آب، ترک، خدمه، انتخاب لمسی.
- ذخیرهٔ محلی نسخه‌دار، سه حالت بازی، اهداف کمپین.
- بستهٔ Capacitor 8.6.0 برای اندروید، افقی قفل‌شده و تمام‌صفحه.
- گردش‌کارهای GitHub Actions برای CI و بیلد APK.

## وضعیت تأیید

| مورد | نتیجه |
|---|---|
| `tsc --noEmit` | ✅ |
| `vitest run` | ✅ ۱۶ تست |
| `playwright test` | ✅ ۲ سناریو (Edge) |
| `vite build` | ✅ ~۱٬۷ MB |
| `cap sync android` | ✅ |
| `gradlew assembleDebug` | ⏳ فقط در CI (JDK/SDK محلی نیست) |
| آزمون گوشی واقعی | ❌ |

## بلاکرها

1. **احراز هویت GitHub در محیط غیرتعاملی**: GCM بدون پرسش GUI توکن نمی‌دهد؛ `gh` نصب
   نیست. مخزن ساخته نشده و پوش انجام نشده است.
2. **JDK 21 + Android SDK** نصب نیست؛ بیلد APK محلی ممکن نیست. مسیر درست: Actions.
3. **keystore** برای امضای release وجود ندارد؛ فقط APK دیباگ قابل تولید است.

## فایل‌های کلیدی

- `src/sim/` — قواعد بازی (بدون React/Phaser)
- `src/game/StationScene.ts` — برش جانبی
- `src/ui/` — پنل‌ها و صفحات
- `src/state/store.ts` — پل شبیه‌سازی و React
- `android/` — پروژهٔ Capacitor
- `.github/workflows/` — CI و Android
- `docs/` — معماری، مدل، نقشهٔ راه، وضعیت، اسکرین‌شات‌ها

## گام بعدی

```bash
# ۱) احراز هویت (یک‌بار)
gh auth login   # یا: git push و ورود از پنجرهٔ GitHub

# ۲) ساخت مخزن و پوش
git remote add origin https://github.com/aminatkh0-ship-it/benthic-9.git
git push -u origin main
```

پس از پوش، گردش‌کار Android به‌صورت خودکار APK دیباگ را می‌سازد و در تب Actions قابل
دانلود است.
