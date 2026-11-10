export type PanelId = 'overview' | 'power' | 'life' | 'crew' | 'storage' | 'research' | 'rov' | 'log';

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
  { id: 'log', glyph: '✎', label: 'گزارش' },
];

export function BottomNav({
  active,
  onSelect,
  badge,
}: {
  active: PanelId | null;
  onSelect: (id: PanelId) => void;
  badge?: Partial<Record<PanelId, number>>;
}) {
  return (
    <nav className="navbar" aria-label="بخش‌های مدیریت ایستگاه">
      {ITEMS.map((item) => {
        const count = badge?.[item.id] ?? 0;
        return (
          <button
            key={item.id}
            type="button"
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
