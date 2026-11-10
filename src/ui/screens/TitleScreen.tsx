import { hasSave, savedAt } from '../../sim/save';
import type { GameMode } from '../../sim/types';
import { toFaDigits } from '../../sim/format';

export function TitleScreen({
  onStart,
  onContinue,
}: {
  onStart: (mode: GameMode) => void;
  onContinue: () => void;
}) {
  const saveExists = hasSave();
  const timestamp = savedAt();

  return (
    <div className="title-screen">
      <div className="title-screen__haze" />
      <div className="title-screen__spectre" />
      <div className="title-screen__body">
        <span className="brand-mark">Deep Ocean Research Facility</span>
        <h1 className="brand-title">BENTHIC-9</h1>
        <p className="brand-sub">بنتیک-۹ | ایستگاه اعماق</p>
        <p className="brand-tag">در اعماق، هیچ اشتباهی کوچک نیست.</p>
        <p className="brand-tag" style={{ opacity: 0.7 }}>
          عمق ۵۸۰۰ متر — اقیانوس آرام — سال ۲۰۸۹
        </p>
      </div>

      <div className="title-actions">
        {saveExists ? (
          <button type="button" className="btn btn--primary" onClick={onContinue}>
            ادامهٔ مأموریت
            {timestamp ? (
              <small style={{ opacity: 0.7, fontSize: 11 }}>
                {toFaDigits(new Date(timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}
              </small>
            ) : null}
          </button>
        ) : null}
        <button type="button" className={`btn ${saveExists ? '' : 'btn--primary'}`} onClick={() => onStart('campaign')}>
          کمپین جدید
        </button>
        <button type="button" className="btn" onClick={() => onStart('endless')}>
          بقای بی‌پایان
        </button>
        <button type="button" className="btn" onClick={() => onStart('challenge')}>
          مأموریت چالشی: سیل
        </button>
      </div>
    </div>
  );
}
