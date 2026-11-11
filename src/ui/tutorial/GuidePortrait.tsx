export function GuidePortrait({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="چهرهٔ آرمان کیانی، مهندس ارشد"
      style={{ imageRendering: 'pixelated', flex: '0 0 auto' }}
      shapeRendering="crispEdges"
    >
      <rect width="64" height="64" fill="#061a22" />
      <rect x="4" y="4" width="56" height="56" fill="#0a2a35" />
      <rect x="8" y="8" width="48" height="48" fill="#0e3441" />

      {/* shoulders */}
      <rect x="8" y="50" width="48" height="10" fill="#123c4a" />
      <rect x="14" y="46" width="10" height="8" fill="#ffb454" opacity="0.6" />
      <rect x="40" y="46" width="10" height="8" fill="#2a6577" />

      {/* helmet */}
      <rect x="14" y="12" width="36" height="34" fill="#cfdde2" />
      <rect x="14" y="12" width="36" height="4" fill="#eef7fa" />
      <rect x="14" y="42" width="36" height="4" fill="#8fa9b3" />
      <rect x="10" y="20" width="4" height="18" fill="#9fb6bf" />
      <rect x="50" y="20" width="4" height="18" fill="#9fb6bf" />

      {/* visor */}
      <rect x="18" y="18" width="28" height="20" fill="#0a3542" />
      <rect x="18" y="18" width="28" height="3" fill="#16505f" />
      <rect x="20" y="22" width="9" height="3" fill="#4fe0e6" opacity="0.55" />
      <rect x="31" y="26" width="6" height="2" fill="#4fe0e6" opacity="0.3" />

      {/* face */}
      <rect x="22" y="30" width="20" height="16" fill="#c98f6a" />
      <rect x="24" y="34" width="5" height="2" fill="#3a2418" />
      <rect x="35" y="34" width="5" height="2" fill="#3a2418" />
      <rect x="29" y="38" width="6" height="2" fill="#b07a58" />
      <rect x="22" y="41" width="20" height="5" fill="#5c4636" />
      <rect x="26" y="42" width="12" height="2" fill="#6f5644" />

      {/* rim light */}
      <rect x="14" y="12" width="2" height="34" fill="#4fe0e6" opacity="0.35" />
      <rect x="48" y="12" width="2" height="34" fill="#2a6577" opacity="0.5" />
    </svg>
  );
}
