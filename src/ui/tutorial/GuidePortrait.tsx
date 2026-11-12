/** Photographic portrait of the commander who narrates the tutorial. */
export function GuidePortrait({ size = 34 }: { size?: number }) {
  return (
    <img
      src="crew/crew-c1.webp"
      width={size}
      height={size}
      alt="آرین رادمهر، فرمانده و مهندس ارشد"
      className="guide-portrait"
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}
