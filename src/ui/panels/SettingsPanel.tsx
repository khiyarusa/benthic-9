import { useState } from 'react';
import { deleteSave } from '../../sim/save';
import { isAudioEnabled, playConfirm, setAudioEnabled } from '../../audio/sfx';
import { getVolumes, isMixEnabled, setMixEnabled, setVolumes } from '../../audio/mixer';
import { sim, useSim } from '../../state/store';
import { Section, StatLine, Toggle } from '../components/ui';

const AUTOSAVE_KEY = 'benthic9.autosave';
export const ADVANCED_KEY = 'benthic9.advanced';

export function readAdvanced(): boolean {
  try {
    return localStorage.getItem(ADVANCED_KEY) === 'on';
  } catch {
    return false;
  }
}

function readAutosave(): boolean {
  try {
    return localStorage.getItem(AUTOSAVE_KEY) !== 'off';
  } catch {
    return true;
  }
}

const BUSES: Array<{ key: 'master' | 'music' | 'ambience' | 'sfx' | 'voice'; label: string }> = [
  { key: 'master', label: 'کل' },
  { key: 'music', label: 'موسیقی' },
  { key: 'ambience', label: 'محیط' },
  { key: 'sfx', label: 'جلوه‌ها' },
  { key: 'voice', label: 'روایت' },
];

export function SettingsPanel({ onQuit }: { onQuit: () => void }) {
  useSim();
  const [audio, setAudio] = useState(isAudioEnabled());
  const [mix, setMix] = useState(isMixEnabled());
  const [autosave, setAutosave] = useState(readAutosave());
  const [advanced, setAdvanced] = useState(readAdvanced());
  const [levels, setLevels] = useState(getVolumes());

  const update = (key: (typeof BUSES)[number]['key'], value: number) => {
    setLevels(setVolumes({ [key]: value }));
  };

  return (
    <div>
      <Section title="صدا">
        <Toggle
          label="جلوه‌های صوتی"
          hint="کلیک پنل‌ها، هشدارها و صدای موتور با فایل‌های ضبط‌شده پخش می‌شوند."
          checked={audio}
          onChange={(next) => {
            setAudio(next);
            setAudioEnabled(next);
            if (next) playConfirm();
          }}
        />
        <Toggle
          label="موسیقی و روایت"
          hint="موسیقی تطبیقی و صدای فرمانده. در صورت خاموش‌کردن، زیرنویس‌ها باقی می‌مانند."
          checked={mix}
          onChange={(next) => {
            setMix(next);
            setMixEnabled(next);
          }}
        />
        {BUSES.map((bus) => (
          <label key={bus.key} className="mix-row">
            <span>{bus.label}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(levels[bus.key] * 100)}
              onChange={(event) => update(bus.key, Number(event.target.value) / 100)}
            />
            <span>{Math.round(levels[bus.key] * 100)}٪</span>
          </label>
        ))}
      </Section>

      <Section title="نمایش">
        <Toggle
          label="حالت پیشرفته"
          hint="همهٔ تب‌های فنی (برق، حیات، انبار، پژوهش) را نشان می‌دهد. در حالت ساده، فقط ایستگاه، خدمه، اکتشاف، مأموریت و کدکس دیده می‌شود."
          checked={advanced}
          onChange={(next) => {
            setAdvanced(next);
            try {
              localStorage.setItem(ADVANCED_KEY, next ? 'on' : 'off');
            } catch {
              /* ignore */
            }
            window.dispatchEvent(new CustomEvent('benthic:advanced', { detail: next }));
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
        <StatLine label="نسخه" value="۰٫۶٫۰ — V6" />
        <StatLine label="موتور" value="Phaser 4 + React 19 + TypeScript" />
        <StatLine label="عمق ایستگاه" value="۵۸۰۰ متر" />
        <p className="hint">
          بافت‌های فلز، سنگ و رسوب از ambientCG (CC0) و صداهای محیط، سونار، کلاکسون و موسیقی از
          ویکی‌مدیا کامانز با مجوزهای CC0/CC BY هستند. فهرست کامل با نشانی و سازنده در
          <code> docs/V6_ASSET_CATALOG.md </code>
          آمده است.
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
