import { useState } from 'react';
import { hasSave, savedAt } from '../../sim/save';
import type { GameMode } from '../../sim/types';
import { toFaDigits } from '../../sim/format';
import { TitleHero } from '../components/TitleHero';
import { HelpPanel } from '../panels/HelpPanel';
import { SettingsPanel } from '../panels/SettingsPanel';

type Modal = 'help' | 'settings' | 'about' | null;

export function TitleScreen({
  onStart,
  onContinue,
}: {
  onStart: (mode: GameMode) => void;
  onContinue: () => void;
}) {
  const saveExists = hasSave();
  const timestamp = savedAt();
  const [modal, setModal] = useState<Modal>(null);

  return (
    <div className="title-screen">
      <TitleHero />

      <div className="title-screen__body">
        <span className="brand-mark">Deep Ocean Research Facility · 2089</span>
        <h1 className="brand-title">
          BENTHIC<span className="brand-title__num">-9</span>
        </h1>
        <p className="brand-sub">بنتیک ۹: ایستگاه اعماق</p>
        <p className="brand-tag">در اعماق، هیچ اشتباهی کوچک نیست.</p>
      </div>

      <div className="title-actions">
        {saveExists ? (
          <button type="button" className="btn btn--primary title-btn" onClick={onContinue}>
            <span>ادامهٔ مأموریت</span>
            {timestamp ? (
              <small>
                {toFaDigits(new Date(timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}
              </small>
            ) : null}
          </button>
        ) : null}

        <button
          type="button"
          className={`btn title-btn ${saveExists ? '' : 'btn--primary'}`}
          onClick={() => onStart('campaign')}
        >
          <span>شروع کمپین</span>
          <small>۵۸۰۰ متر · چهار نفر</small>
        </button>

        <button type="button" className="btn title-btn" onClick={() => onStart('endless')}>
          <span>بقا</span>
          <small>بدون پایان</small>
        </button>

        <button type="button" className="btn title-btn" onClick={() => onStart('challenge')}>
          <span>مأموریت‌ها</span>
          <small>چالش سیل</small>
        </button>

        <div className="title-actions__row">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setModal('help')}>
            راهنمای فرمانده
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setModal('settings')}>
            تنظیمات
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setModal('about')}>
            درباره سازنده
          </button>
        </div>
      </div>

      <footer className="title-foot">
        <span>BENTHIC-9 · v0.8.0</span>
        <span>ساختهٔ امین · تلگرام @Mozrd · روبیکا @angosht0</span>
      </footer>

      {modal ? (
        <div className="modal-center" role="dialog" aria-modal="true">
          <div className="modal-card modal-card--wide">
            <div className="modal-card__head">
              <h3>
                {modal === 'help' ? 'راهنمای فرمانده' : modal === 'settings' ? 'تنظیمات' : 'درباره سازنده'}
              </h3>
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => setModal(null)}>
                بستن
              </button>
            </div>
            {modal === 'help' ? <HelpPanel /> : null}
            {modal === 'settings' ? <SettingsPanel onQuit={() => setModal(null)} /> : null}
            {modal === 'about' ? (
              <div className="about">
                <p>
                  <strong>BENTHIC-9 — بنتیک ۹: ایستگاه اعماق</strong>
                </p>
                <p>
                  شبیه‌سازی بقا و مدیریت ایستگاه تحقیقاتی در عمق ۵۸۰۰ متری اقیانوس آرام. بازی
                  آفلاین است و همهٔ اعداد از شبیه‌سازی واقعی می‌آیند.
                </p>
                <dl>
                  <div>
                    <dt>طراح و برنامه‌نویس</dt>
                    <dd>امین</dd>
                  </div>
                  <div>
                    <dt>تلگرام</dt>
                    <dd dir="ltr">@Mozrd</dd>
                  </div>
                  <div>
                    <dt>روبیکا</dt>
                    <dd dir="ltr">@angosht0</dd>
                  </div>
                  <div>
                    <dt>موتور</dt>
                    <dd>Phaser 4 · React 19 · TypeScript · Capacitor</dd>
                  </div>
                  <div>
                    <dt>نسخه</dt>
                    <dd>۰٫۵٫۰-alpha.1</dd>
                  </div>
                </dl>
                <p className="hint">
                  بازخورد مستقیم به تلگرام یا روبیکا فرستاده شود؛ هر گزارش باگی که قابل بازتولید
                  باشد در نسخهٔ بعد بررسی می‌شود.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
