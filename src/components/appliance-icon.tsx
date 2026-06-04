import type { CollectionTile, ServiceTile } from "@/lib/site-content";

type ApplianceIconProps = {
  icon: ServiceTile["icon"] | CollectionTile["icon"];
  className?: string;
};

export function ApplianceIcon({ icon, className = "h-6 w-6" }: ApplianceIconProps) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (icon === "truck") {
    return (
      <svg {...common}>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <path d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        <path d="M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      </svg>
    );
  }

  if (icon === "shield") {
    return (
      <svg {...common}>
        <path d="M12 3 5 6v5c0 4.4 2.9 8.3 7 10 4.1-1.7 7-5.6 7-10V6z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  if (icon === "support") {
    return (
      <svg {...common}>
        <path d="M4 12a8 8 0 0 1 16 0" />
        <path d="M4 12v4a2 2 0 0 0 2 2h2v-6H4z" />
        <path d="M20 12v4a2 2 0 0 1-2 2h-2v-6h4z" />
        <path d="M9 20h4" />
      </svg>
    );
  }

  if (icon === "install") {
    return (
      <svg {...common}>
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8" />
        <path d="M8 12h5" />
        <path d="m15 17 2 2 4-5" />
      </svg>
    );
  }

  if (icon === "clean") {
    return (
      <svg {...common}>
        <path d="M8 3h8l1 14H7z" />
        <path d="M9 7h6" />
        <path d="M10 20h4" />
        <path d="M5 14h14" />
      </svg>
    );
  }

  if (icon === "cook") {
    return (
      <svg {...common}>
        <path d="M6 4h12v16H6z" />
        <path d="M9 8h6" />
        <circle cx="12" cy="14" r="3" />
        <path d="M15 4v3" />
      </svg>
    );
  }

  if (icon === "cool") {
    return (
      <svg {...common}>
        <path d="M8 3h8a2 2 0 0 1 2 2v16H6V5a2 2 0 0 1 2-2z" />
        <path d="M6 10h12" />
        <path d="M10 7h1" />
        <path d="M10 14h1" />
      </svg>
    );
  }

  if (icon === "blend") {
    return (
      <svg {...common}>
        <path d="M9 3h6" />
        <path d="M10 6h4l1 5H9z" />
        <path d="M8 11h8l-1.5 7h-5z" />
        <path d="M10 21h4" />
        <path d="m11 14 3 2" />
      </svg>
    );
  }

  if (icon === "laundry") {
    return (
      <svg {...common}>
        <path d="M7 4h10v16H7z" />
        <circle cx="12" cy="13" r="3" />
        <path d="M10 7h1" />
        <path d="M14 7h1" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M7 4h10v16H7z" />
      <path d="M10 4v16" />
      <path d="M14 7h1" />
      <path d="M14 13h1" />
    </svg>
  );
}

export function ApplianceVisual({
  tone,
  label,
  imageUrl,
}: {
  tone: string;
  label: string;
  imageUrl?: string;
}) {
  return (
    <div className={`relative min-h-72 overflow-hidden rounded-[2rem] bg-gradient-to-br ${tone}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_25%,rgba(255,255,255,0.72),transparent_18rem)]" />
      {imageUrl ? (
        <div className="absolute inset-0">
          <div className="absolute inset-x-7 bottom-7 top-8 rounded-[1.6rem] bg-white/70 shadow-2xl ring-1 ring-white/85 backdrop-blur-sm transition duration-700 group-hover:scale-[1.01]" />
          <div className="absolute inset-x-9 bottom-7 h-14 rounded-full bg-slate-900/20 blur-2xl" />
          <div className="absolute inset-x-8 bottom-8 top-9 flex items-center justify-center p-4">
            <img
              src={encodeURI(imageUrl)}
              alt={label}
              className="h-full w-full object-contain drop-shadow-[0_18px_24px_rgba(2,6,23,0.28)] transition duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="absolute bottom-8 left-1/2 h-40 w-48 -translate-x-1/2 rounded-[2rem] bg-white/45 shadow-2xl ring-1 ring-white/50 backdrop-blur-md transition duration-700 group-hover:scale-105" />
          <div className="absolute bottom-14 left-1/2 h-28 w-36 -translate-x-1/2 rounded-[1.5rem] bg-[rgba(3,28,54,0.20)] shadow-inner" />
        </>
      )}
      <div className="absolute right-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-blue)] shadow-sm">
        {label}
      </div>
    </div>
  );
}
