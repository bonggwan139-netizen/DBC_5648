type IsometricCityGraphicProps = {
  className?: string;
  subdued?: boolean;
};

export function IsometricCityGraphic({ className, subdued = false }: IsometricCityGraphicProps) {
  return (
    <svg
      viewBox="0 0 720 420"
      role="img"
      aria-label="한국 도시 스타일 아이소메트릭 다이어그램"
      className={className}
      style={{ opacity: subdued ? 0.4 : 1 }}
    >
      <defs>
        <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8f2ff" />
          <stop offset="100%" stopColor="#e7f8ef" />
        </linearGradient>
        <linearGradient id="river" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>

      <polygon points="80,360 360,200 640,360 360,520" fill="url(#ground)" />
      <polygon points="200,350 380,245 530,330 350,435" fill="url(#river)" opacity="0.85" />

      <polygon points="105,278 185,232 230,260 150,306" fill="#bbf7d0" />
      <circle cx="145" cy="272" r="12" fill="#4ade80" />
      <circle cx="170" cy="255" r="9" fill="#34d399" />
      <circle cx="195" cy="270" r="10" fill="#22c55e" />

      <g>
        <polygon points="280,250 330,220 380,250 330,280" fill="#bfdbfe" />
        <polygon points="280,250 280,320 330,350 330,280" fill="#93c5fd" />
        <polygon points="380,250 380,320 330,350 330,280" fill="#60a5fa" />
      </g>
      <g>
        <polygon points="360,222 420,188 482,224 420,258" fill="#dbeafe" />
        <polygon points="360,222 360,310 420,344 420,258" fill="#93c5fd" />
        <polygon points="482,224 482,312 420,344 420,258" fill="#3b82f6" />
      </g>

      <g>
        <polygon points="210,300 250,278 288,300 248,322" fill="#e2e8f0" />
        <polygon points="210,300 210,338 248,360 248,322" fill="#cbd5e1" />
        <polygon points="288,300 288,338 248,360 248,322" fill="#94a3b8" />
      </g>
      <g>
        <polygon points="470,280 520,252 562,278 512,306" fill="#e2e8f0" />
        <polygon points="470,280 470,322 512,346 512,306" fill="#cbd5e1" />
        <polygon points="562,278 562,322 512,346 512,306" fill="#94a3b8" />
      </g>

      <g>
        <polygon points="140,325 180,304 220,326 180,347" fill="#f8d7c1" />
        <polygon points="140,325 140,347 180,369 180,347" fill="#f3c3a4" />
        <polygon points="220,326 220,347 180,369 180,347" fill="#e8a67f" />
        <polygon points="140,325 180,287 220,326 180,347" fill="#b45309" />
      </g>

      <g>
        <rect x="500" y="190" width="8" height="30" fill="#16a34a" transform="skewY(26)" />
        <circle cx="514" cy="190" r="12" fill="#86efac" />
      </g>
      <g>
        <rect x="540" y="214" width="8" height="26" fill="#16a34a" transform="skewY(26)" />
        <circle cx="554" cy="214" r="10" fill="#6ee7b7" />
      </g>

      <path d="M210 334 L355 252 L514 340" stroke="#cbd5e1" strokeWidth="3" fill="none" />
      <path d="M234 347 L378 266 L535 352" stroke="#cbd5e1" strokeWidth="2" fill="none" />
    </svg>
  );
}
