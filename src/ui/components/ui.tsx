import type { ReactNode } from 'react';
import { faPercent } from '../../sim/format';

type Tone = 'default' | 'good' | 'warn' | 'danger';

export function Card({
  title,
  value,
  foot,
  tone = 'default',
}: {
  title: string;
  value: ReactNode;
  foot?: ReactNode;
  tone?: Tone;
}) {
  const toneClass = tone === 'danger' ? 'is-danger' : tone === 'warn' ? 'is-warn' : tone === 'good' ? 'is-good' : '';
  return (
    <div className="card">
      <div className="card__title">{title}</div>
      <div className={`card__value ${toneClass}`}>{value}</div>
      {foot ? <div className="card__foot">{foot}</div> : null}
    </div>
  );
}

export function MetricBar({
  label,
  value,
  max = 100,
  display,
  tone,
}: {
  label: string;
  value: number;
  max?: number;
  display?: string;
  tone?: Tone;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const barTone = tone === 'danger' ? 'bar--danger' : tone === 'warn' ? 'bar--warn' : tone === 'good' ? 'bar--good' : '';
  return (
    <div className="bar-row">
      <span className="bar-row__label">{label}</span>
      <div className={`bar ${barTone}`}>
        <div className="bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="bar-row__value">{display ?? faPercent(pct)}</span>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="toggle-row" style={disabled ? { opacity: 0.5 } : undefined}>
      <div
        role="presentation"
        style={{ cursor: disabled ? 'default' : 'pointer' }}
        onClick={() => {
          if (!disabled) onChange(!checked);
        }}
      >
        {label}
        {hint ? <small>{hint}</small> : null}
      </div>
      <button
        type="button"
        className={`switch ${checked ? 'is-on' : ''}`}
        aria-pressed={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      />
    </div>
  );
}

export function Chip({ tone, children }: { tone?: 'good' | 'warn' | 'danger'; children: ReactNode }) {
  const cls = tone ? `chip chip--${tone}` : 'chip';
  return <span className={cls}>{children}</span>;
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <>
      <div className="section-title">
        {title}
        {action ? <span style={{ marginInlineStart: 'auto' }}>{action}</span> : null}
      </div>
      {children}
    </>
  );
}

export function StatLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="stat-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="hint">{children}</p>;
}
