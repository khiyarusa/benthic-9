import { useEffect, useState } from 'react';
import { VOICE_LINES } from '../../audio/lines';

/**
 * Commander subtitle strip. It mirrors the recorded Persian line that is
 * currently playing; the audio itself is a bundled OGG file.
 */
export function Narrator() {
  const [lineId, setLineId] = useState<string | null>(null);

  useEffect(() => {
    let timer = 0;
    const onLine = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (!detail?.id) return;
      setLineId(detail.id);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setLineId(null), 7000);
    };
    window.addEventListener('voice:line', onLine);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('voice:line', onLine);
    };
  }, []);

  const line = lineId ? VOICE_LINES[lineId] : null;
  if (!line) return null;

  return (
    <div className={`narrator narrator--${line.tone ?? 'calm'}`} role="status" aria-live="polite">
      <span className="narrator__who">{line.speaker}</span>
      <p className="narrator__text">{line.text}</p>
    </div>
  );
}
