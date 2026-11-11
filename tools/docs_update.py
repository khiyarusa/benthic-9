import io

p = 'docs/PROGRESS.md'
s = io.open(p, encoding='utf-8').read()
s = s.replace(
    'آخرین به‌روزرسانی: ۱۱ نوامبر ۲۰۲۶ — نسخهٔ ۰٫۲٫۰-alpha.1',
    'آخرین به‌روزرسانی: ۱۱ نوامبر ۲۰۲۶ — نسخهٔ ۰٫۳٫۰-alpha.1',
)
marker = '## V2 — بازطراحی بصری و آموزش'
v3 = """## V3 — بازسازی صحنه، وضوح تصویر، آیکون

- [x] رندر با DPR واقعی (بوم ۲×) و `image-rendering: pixelated` — رفع نرمی تصویر روی گوشی
- [x] رفع جابه‌جایی دوربین بعد از zoom (`centerOn` پس از هر resize)
- [x] بازنویسی صحنه روی بافت‌های پخته‌شده: `art/painter.ts`، `art/rooms.ts`، `art/vessel.ts`، `art/crew.ts`
- [x] نوار بیرونی شناور: بدنهٔ فشاری، برج فرمان، دکل، نورافکن، دریچهٔ آشیانهٔ ROV
- [x] ۱۰ نقاشی مستقل اتاق + دکور مشترک (لوله، گیج، کپسول آتش‌نشانی، علائم)
- [x] خدمهٔ پیکسلی ۶ فریمی با انیمیشن راه‌رفتن
- [x] گرید رنگی، وینیت و دانهٔ ظریف برای یکدستی تصویر
- [x] نوار «اقدام بعدی» بر پایهٔ وضعیت واقعی شبیه‌سازی
- [x] آموزش: دکمهٔ عبور در همهٔ گام‌ها + بسته‌نشدن پنل هدف
- [x] آیکون و اسپلش اختصاصی در پنج چگالی + adaptive icon + manifest
- [x] بازبینی واقعی در سه اندازه و ثبت نتایج در `docs/V3_AUDIT.md`
- [x] گزارش کیفیت در `docs/V3_FINAL_QA.md`

""" + marker
s = s.replace(marker, v3, 1)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)

r = 'README.md'
t = io.open(r, encoding='utf-8').read()
t = t.replace('![نمای ایستگاه](docs/screenshots/v2-station.png)', '![نمای ایستگاه](docs/screenshots/v3-phone-station.png)')
t = t.replace('| آموزش «اولین شیفت فرمانده» | پنل اتاق |\n|---|---|\n| ![آموزش](docs/screenshots/v2-tutorial.png) | ![اتاق](docs/screenshots/v2-room.png) |',
              '| آموزش «اولین شیفت فرمانده» | نمای ایستگاه در ۲۰:۹ |\n|---|---|\n| ![آموزش](docs/screenshots/v3-tutorial.png) | ![ایستگاه](docs/screenshots/v3-wide-station.png) |')
t = t.replace('## تازه در V2', '## تازه در V3\n\n- رندر در وضوح واقعی صفحه (DPR) و رفع نرمی تصویر روی گوشی\n- صحنهٔ بازنویسی‌شده روی بافت‌های پخته: بدنهٔ شناور، برج فرمان، نورافکن، ۱۰ اتاق نقاشی‌شده\n- خدمهٔ پیکسلی متحرک و دکور کارگاهی در همهٔ اتاق‌ها\n- نوار «اقدام بعدی» که از وضعیت واقعی شبیه‌سازی محاسبه می‌شود\n- آیکون و اسپلش اختصاصی\n\n## تازه در V2')
t = t.replace('- **ریلیز v0.2.0-alpha.1 (APK دیباگ):** https://github.com/khiyarusa/benthic-9/releases/tag/v0.2.0-alpha.1',
              '- **ریلیز v0.3.0-alpha.1 (APK دیباگ):** https://github.com/khiyarusa/benthic-9/releases/tag/v0.3.0-alpha.1')
io.open(r, 'w', encoding='utf-8', newline='\n').write(t)
print('docs updated')
