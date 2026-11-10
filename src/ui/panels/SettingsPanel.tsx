import { useState } from 'react';
import { deleteSave } from '../../sim/save';
import { isAudioEnabled, playConfirm, setAudioEnabled } from '../../audio/sfx';
import { sim, useSim } from '../../state/store';
import { Section, StatLine, Toggle } from '../components/ui';

const AUTOSAVE_KEY = 'benthic9.autosave';

function readAutosave(): boolean {
  try {
    return localStorage.getItem(AUTOSAVE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function SettingsPanel({ onQuit }: { onQuit: () => void }) {
  useSim();
  const [audio, setAudio] = useState(isAudioEnabled());
  const [autosave, setAutosave] = useState(readAutosave());

  return (
    <div>
      <Section title="صدا">
        <Toggle
          label="جلوه‌های صوتی"
          hint="کلیک پنل‌ها و هشدارهای اضطراری با صدای کوتاه پخش می‌شوند."
          checked={audio}
          onChange={(next) => {
            setAudio(next);
            setAudioEnabled(next);
            if (next) playConfirm();
          }}
        />
      </Section>

      <Section title="ذخیره‌سازی">
        <Toggle
          label="ذخیرهٔ خودکار"
          hint="هر ۳۰ ثانیه وضعیت ایستگاه در حافظهٔ محلی ذخیره می‌شود."
          checked={autosave}
          onChange={(next) => {
            setAutosave(next);
            try {
              localStorage.setItem(AUTOSAVE_KEY, next ? 'on' : 'off');
            } catch {
              /* ignore */
            }
          }}
        />
      </Section>

      <Section title="دربارهٔ بازی">
        <StatLine label="نام" value="BENTHIC-9 | بنتیک-۹" />
        <StatLine label="نسخه" value="۰٫۱٫۰ — ساخت وب پایه" />
        <StatLine label="موتور" value="Phaser 4.2.1 + React 19 + TypeScript" />
        <StatLine label="عمق ایستگاه" value="۵۸۰۰ متر" />
        <p className="hint">
          بنتیک-۹ یک شبیه‌سازی بقا در اعماق اقیانوس است. هر عددی که در پنل‌ها می‌بینی از وضعیت
          واقعی شبیه‌سازی می‌آید؛ هیچ نمایش تزئینی در این نسخه وجود ندارد.
        </p>
      </Section>

      <Section title="پایان مأموریت">
        <div className="row" style={{ gap: 6 }}>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => {
              sim.setPaused(true);
              onQuit();
            }}
          >
            بازگشت به منوی اصلی
          </button>
          <button
            type="button"
            className="btn btn--sm btn--danger"
            onClick={() => {
              deleteSave();
              sim.setPaused(true);
              onQuit();
            }}
          >
            پایان و پاک‌کردن پیشرفت
          </button>
        </div>
      </Section>
    </div>
  );
}
