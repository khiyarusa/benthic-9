export type PanelId =
  | 'overview'
  | 'power'
  | 'life'
  | 'crew'
  | 'storage'
  | 'research'
  | 'rov'
  | 'missions'
  | 'codex'
  | 'log'
  | 'help';

interface NavItem {
  id: PanelId;
  glyph: string;
  label: string;
}

const ITEMS: NavItem[] = [
  { id: 'overview', glyph: '▦', label: 'ایستگاه' },
  { id: 'power', glyph: '⚡', label: 'برق' },
  { id: 'life', glyph: '◍', label: 'حیات' },
  { id: 'crew', glyph: '☗', label: 'خدمه' },
  { id: 'storage', glyph: '▤', label: 'انبار' },
  { id: 'research', glyph: '⌬', label: 'پژوهش' },
  { id: 'rov', glyph: '◈', label: 'اکتشاف' },
  { id: 'missions', glyph: '◎', label: 'مأموریت' },
  { id: 'codex', glyph: '❖', label: 'کدکس' },
  { id: 'log', glyph: '✎', label: 'گزارش' },
  { id: 'help', glyph: '؟', label: 'راهنما' },
];

/** Panels that only appear in advanced mode. */
const TECHNICAL: PanelId[] = ['power', 'life', 'storage', 'research'];

export function BottomNav({
  active,
  onSelect,
  badge,
  advanced = false,
}: {
  active: PanelId | null;
  onSelect: (id: PanelId) => void;
  badge?: Partial<Record<PanelId, number>>;
  advanced?: boolean;
}) {
  const items = advanced ? ITEMS : ITEMS.filter((item) => !TECHNICAL.includes(item.id));
  return (
    <nav className="navbar" data-ui="nav" aria-label="بخش‌های مدیریت ایستگاه">
      {items.map((item) => {
        const count = badge?.[item.id] ?? 0;
        return (
          <button
            key={item.id}
            type="button"
            data-panel={item.id}
            className={`nav-btn ${active === item.id ? 'is-active' : ''}`}
            onClick={() => onSelect(item.id)}
            aria-pressed={active === item.id}
          >
            <span className="nav-btn__glyph" aria-hidden="true">
              {item.glyph}
            </span>
            <span>{item.label}</span>
            {count > 0 ? <span className="nav-btn__badge">{count}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
