import { fa, faPercent } from '../../sim';
import { sim, useSim } from '../../state/store';
import { Card, Chip, Section, StatLine } from '../components/ui';

export function LogisticsPanel() {
  useSim();
  const state = sim.state;
  const fabricator = state.equipment['fabricator-1'];

  return (
    <div>
      <div className="grid-3">
        <Card title="قطعات یدکی" value={`${fa(state.resources.partsKg)} kg`} tone={state.resources.partsKg < 10 ? 'warn' : 'default'} foot="مصرف در تعمیرات" />
        <Card title="قراضه" value={`${fa(state.resources.scrapKg)} kg`} foot="مادهٔ اولیهٔ ساخت قطعه" />
        <Card title="نمونه‌های زیستی" value={fa(state.resources.samples)} foot="از سفرهای ROV" />
        <Card title="دادهٔ پژوهشی" value={fa(state.resources.data)} foot="مصرف در درخت فناوری" />
      </div>

      <Section title="کارگاه ساخت">
        <div className="row row--between">
          <div className="row" style={{ gap: 6 }}>
            <Chip tone={fabricator?.tripped ? 'danger' : 'good'}>
              {fabricator?.tripped ? 'از کار افتاده' : 'آماده'}
            </Chip>
            <span className="mini-stat">سلامت {faPercent(fabricator?.health ?? 0)}</span>
            <span className="mini-stat">مصرف {fa(fabricator?.powerDrawKW ?? 0)} kW</span>
          </div>
          <button type="button" className="btn btn--sm btn--primary" onClick={() => sim.craftParts()}>
            ساخت ۲ کیلوگرم قطعه
          </button>
        </div>
        <p className="hint">
          هر بار ساخت ۶ کیلوگرم قراضه مصرف می‌کند و به برق کارگاه نیاز دارد. اگر کارگاه خاموش باشد
          یا قراضه کافی نباشد، فرمان رد می‌شود.
        </p>
      </Section>

      <Section title="منابع مصرفی">
        <StatLine label="سوخت رآکتور" value={`${fa(state.resources.fuelKg)} kg`} />
        <StatLine label="اکسیژن" value={`${fa(state.resources.oxygenKg)} kg`} />
        <StatLine label="آب" value={`${fa(state.resources.waterL)} L`} />
        <StatLine label="جیرهٔ غذایی" value={`${fa(state.resources.foodKg)} kg`} />
        <StatLine label="قراضه" value={`${fa(state.resources.scrapKg)} kg`} />
        <StatLine label="نمونه" value={fa(state.resources.samples)} />
        <StatLine label="داده" value={fa(state.resources.data)} />
      </Section>

      <Section title="تولید و مصرف روزانه">
        <p className="hint">
          خدمه روزانه حدود {fa(state.crew.filter((c) => c.alive).length * 11.5, 1)} کیلوگرم جیره و{' '}
          {fa(state.crew.filter((c) => c.alive).length * 28.8, 1)} لیتر آب مصرف می‌کنند. الکترولیز
          نیز آب مصرف می‌کند؛ موجودی آب را زیر نظر داشته باش.
        </p>
      </Section>
    </div>
  );
}
