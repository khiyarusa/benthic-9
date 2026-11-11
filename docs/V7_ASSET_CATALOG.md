# BENTHIC-9 — کاتالوگ دارایی‌های V7

این سند هر دارایی تصویری و صوتیِ بسته‌بندی‌شده را با منبع، مجوز و محل استفاده ثبت می‌کند.

## ۱. رندرهای داخلی اتاق‌ها

| فایل | اتاق | صحنهٔ تولیدشده | حجم |
|---|---|---|---|
| `public/rooms/command.webp` | مرکز فرماندهی | bridge with a curved console wall, sonar display, amber warning lamps | 102KB |
| `public/rooms/corridor.webp` | راهروی مرکزی | one-point perspective steel corridor with an oval pressure door | 107KB |
| `public/rooms/reactor.webp` | نیروگاه | diesel-electric generator, breaker cabinets, copper busbars, grating | 175KB |
| `public/rooms/life.webp` | پشتیبانی حیات | scrubber tanks, electrolysis cells, filtration ducts | 120KB |
| `public/rooms/biolab.webp` | آزمایشگاه زیستی | stainless benches, microscopes, glowing specimen jars | 125KB |
| `public/rooms/geolab.webp` | آزمایشگاه زمین‌شناسی | core trays, rock saw, halogen work lamps, rock dust | 127KB |
| `public/rooms/medbay.webp` | درمانگاه | examination bed, surgical lamp, medicine cabinet, oxygen rack | 74KB |
| `public/rooms/quarters.webp` | اقامتگاه کارکنان | built-in bunks, lockers, fold-down desks, warm reading lamps | 81KB |
| `public/rooms/storage.webp` | انبار مرکزی | industrial shelving, crates, cable drums, caged lamps | 149KB |
| `public/rooms/rov.webp` | محفظهٔ خروج ROV | yellow work-class ROV in a cradle, tether winch, pressure hatch | 121KB |

ابعاد نهایی: ۱۲۸۰×۷۲۰، WebP کیفیت ۸۰. هر تصویر مستقل تولید شده و در بازی به‌صورت برش‌خورده (cover) داخل مستطیل همان اتاق نشسته است؛ هیچ تصویری برای چند اتاق استفاده نشده.

## ۲. بدنهٔ بیرونی

| `public/rooms/exterior.webp` | نمای سه‌چهارم زیردریایی در آب سیاه، با نورافکن‌های خودش | 45KB |

این تصویر پس‌زمینهٔ منوی اصلی است و جایگزین سیلوئت نقاشی‌شدهٔ V3 شده؛ نسخهٔ نقاشی‌شده فقط به‌عنوان لایهٔ نور و fallback باقی مانده است.

## ۳. پرترهٔ خدمه

| فایل | شخصیت | نقش | توضیح |
|---|---|---|---|
| `public/crew/crew-c1.webp` | آرین رادمهر | فرمانده و مهندس ارشد | 50-year-old Iranian commander, navy coveralls, headset · 37KB |
| `public/crew/crew-c2.webp` | نگار سلحشور | زیست‌شناس دریایی | 35-year-old Iranian marine biologist, lab coat, glasses · 29KB |
| `public/crew/crew-c3.webp` | کامران آذرنیا | زمین‌شناس ارشد | 45-year-old Iranian geologist, canvas jacket, headlamp · 39KB |
| `public/crew/crew-c4.webp` | لیلا فرهمند | پزشک ایستگاه | 40-year-old Iranian physician, scrubs and white coat, stethoscope · 27KB |

ابعاد: ۵۶۰×۷۰۰. همین پرتره هم در پنل خدمه و هم به‌صورت دیسک گرد روی نقشهٔ برش‌خورده استفاده می‌شود.

## ۴. بافت‌های CC0 (از V6)

ده بافت فتوگرامتری ambientCG با مجوز CC0 در `public/tex/` باقی مانده‌اند: بستر ماسه‌ای، صخرهٔ دیواره، تخته‌سنگ، ورق بدنه، فلز برس‌خورده، فولاد زنگ‌زده، کف فلزی، بتن، پارچه، رسوب. فهرست کامل با شناسهٔ منبع در `docs/V6_ASSET_CATALOG.md`.

## ۵. صدا (از V6)

۹ فایل ضبط‌شده (CC0/CC BY/PD/CC BY-SA) و ۱۵ خط روایت فارسی. جزئیات و الزامات انتساب در `docs/V6_ASSET_CATALOG.md`. در V7 هیچ فایل صوتی تازه‌ای اضافه نشد.

## ۶. وضعیت مجوز تصاویر تولیدشده — مهم

تصاویر بخش ۱ تا ۳ با مدل تولید تصویر Seedream، از طریق ابزار همین محیط، تولید شده‌اند. هیچ تصویری از بازی تجاری، بانک تصویر یا اثر هنرمند دیگری برداشته نشده است.

پیش از انتشار تجاری، شرایط استفادهٔ سرویس تولید تصویر باید بررسی و تصمیم شما ثبت شود؛ همان‌طور که برای صدای گفتاری در V6 نوشته شد. از نظر فنی، بازی به این فایل‌ها وابسته نیست: اگر تصویری موجود نباشد، هنر وکتور قبلی (`paintRoom`) جایش را می‌گیرد.

هیچ دارایی با مجوز NC یا مجوز نامعلوم در بسته نیست.
