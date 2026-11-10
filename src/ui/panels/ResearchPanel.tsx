import { RESEARCH, fa, faPercent } from '../../sim';
import { nodeById } from '../../sim/research';
import { sim, useSim } from '../../state/store';
import { Chip, MetricBar, Section } from '../components/ui';

const BRANCHES = [
  { id: 'structure', label: 'مهندسی سازه', glyph: '▤' },
  { id: 'energy', label: 'انرژی و برق', glyph: '⚡' },
  { id: 'life', label: 'پشتیبانی حیات', glyph: '◍' },
  { id: 'deep', label: 'رباتیک و علوم اعماق', glyph: '◈' },
] as const;

export function ResearchPanel() {
  useSim();
  const state = sim.state;
  const active = state.research.activeNodeId ? nodeById(state.research.activeNodeId) : null;

  return (
    <div>
      <div className="card" style={{ marginBottom: 8 }}>
        <div className="card__title">
          <span>پژوهش جاری</span>
          <span>
            داده: {fa(state.resources.data)} • نمونه: {fa(state.resources.samples)}
          </span>
        </div>
        {active ? (
          <>
            <div className="row row--between">
              <strong style={{ fontSize: 13 }}>{active.label}</strong>
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => sim.cancelResearch()}>
                انصراف
              </button>
            </div>
            <MetricBar label="پیشرفت" value={state.research.progress} display={faPercent(state.research.progress)} tone="good" />
            <p className="hint">پژوهش با کار خدمه در آزمایشگاه‌ها پیش می‌رود؛ خدمهٔ بیکار خودکار به آن می‌پیوندند.</p>
          </>
        ) : (
          <p className="hint">پژوهشی فعال نیست. یکی از گره‌های زیر را انتخاب کن.</p>
        )}
      </div>

      {BRANCHES.map((branch) => (
        <Section key={branch.id} title={`${branch.glyph} ${branch.label}`}>
          {RESEARCH.filter((node) => node.branch === branch.id).map((node) => {
            const done = state.research.completed.includes(node.id);
            const locked = !done && !node.requires.every((id) => state.research.completed.includes(id));
            const affordable = state.resources.data >= node.costData && state.resources.samples >= node.costSamples;
            const isActive = state.research.activeNodeId === node.id;
            return (
              <div
                key={node.id}
                className={`research-node ${done ? 'is-done' : locked ? 'is-locked' : ''}`}
                style={{ marginBottom: 6 }}
              >
                <div className="research-node__head">
                  <span className="research-node__name">{node.label}</span>
                  {done ? <Chip tone="good">تکمیل‌شده</Chip> : isActive ? <Chip tone="warn">در حال پژوهش</Chip> : locked ? <Chip>قفل</Chip> : <Chip>آماده</Chip>}
                </div>
                <p className="research-node__desc">{node.description}</p>
                <div className="row row--between">
                  <span className="research-node__cost">
                    هزینه: {fa(node.costData)} داده
                    {node.costSamples > 0 ? ` • ${fa(node.costSamples)} نمونه` : ''}
                  </span>
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => sim.startResearch(node.id)}
                    disabled={done || locked || !affordable || isActive}
                  >
                    {done ? 'انجام شد' : isActive ? 'در جریان' : 'شروع پژوهش'}
                  </button>
                </div>
                {node.requires.length > 0 && !done ? (
                  <span className="hint">
                    پیش‌نیاز: {node.requires.map((id) => nodeById(id)?.label ?? id).join('، ')}
                  </span>
                ) : null}
                <span className="hint" style={{ color: 'var(--cyan)' }}>
                  اثر: {node.unlocks}
                </span>
              </div>
            );
          })}
        </Section>
      ))}
    </div>
  );
}
