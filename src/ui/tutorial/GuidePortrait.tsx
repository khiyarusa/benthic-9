import { useMemo } from 'react';
import { paintPortrait } from '../../game/art/crew';

/**
 * Pixel-art portrait of آرمان, generated from the same painter as the in-world
 * sprite so the face on the card is the face in the station.
 */
export function GuidePortrait({ size = 34 }: { size?: number }) {
  const url = useMemo(() => paintPortrait(48).toDataURL('image/png'), []);
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt="آرمان کیانی، مهندس ارشد"
      className="guide-portrait"
      style={{ width: size, height: size }}
    />
  );
}
