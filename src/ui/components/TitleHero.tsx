import { useEffect, useRef, useState } from 'react';
import { paintMenuScene } from '../../game/art/menu';

/**
 * Static hero painted once per size, plus CSS light shafts and drifting
 * particles so the menu breathes without running a second Phaser instance.
 */
export function TitleHero() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let frame = 0;
    const paint = () => {
      const w = Math.max(480, host.clientWidth);
      const h = Math.max(280, host.clientHeight);
      const scale = Math.min(2, window.devicePixelRatio || 1);
      const canvas = paintMenuScene(Math.round(w * scale), Math.round(h * scale));
      setUrl(canvas.toDataURL('image/jpeg', 0.86));
    };
    const schedule = () => {
      window.clearTimeout(frame);
      frame = window.setTimeout(paint, 120);
    };
    paint();
    const observer = new ResizeObserver(schedule);
    observer.observe(host);
    return () => {
      window.clearTimeout(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="title-hero" ref={hostRef} aria-hidden="true">
      {url ? <img className="title-hero__art" src={url} alt="" /> : null}
      <div className="title-hero__shafts" />
      <div className="title-hero__snow" />
      <div className="title-hero__lights">
        <i style={{ left: '31%', top: '47%' }} />
        <i style={{ left: '44%', top: '46%' }} />
        <i style={{ left: '57%', top: '47%' }} />
        <i style={{ left: '70%', top: '48%' }} />
        <i className="is-red" style={{ left: '53%', top: '21%' }} />
      </div>
      <div className="title-hero__grade" />
    </div>
  );
}
