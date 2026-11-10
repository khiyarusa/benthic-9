import type { ReactNode } from 'react';

export function Sheet({
  title,
  onClose,
  children,
  extra,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__handle" />
        <header className="sheet__head">
          <div className="sheet__title">{title}</div>
          {extra}
          <button type="button" className="sheet__close" onClick={onClose} aria-label="بستن">
            ✕
          </button>
        </header>
        <div className="sheet__body">{children}</div>
      </section>
    </>
  );
}
