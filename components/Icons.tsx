const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const SearchIcon = (p: { size?: number }) => (
  <svg {...base} width={p.size ?? 24} height={p.size ?? 24}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
);
export const HeartIcon = () => (
  <svg {...base}><path d="M12 20.5s-7.5-4.6-9-9.6C2 7.6 4.2 5 7.1 5c1.9 0 3.7 1 4.9 2.8C13.2 6 15 5 16.9 5 19.8 5 22 7.6 21 10.9c-1.5 5-9 9.6-9 9.6z" /></svg>
);
export const BagIcon = () => (
  <svg {...base}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
);
export const UserIcon = () => (
  <svg {...base}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.2 4.2-6 8-6s7 1.8 8 6" /></svg>
);
export const FilterIcon = () => (
  <svg {...base} width={18} height={18} strokeWidth={1.8}><path d="M3 5h18M6 12h12M10 19h4" /></svg>
);
export const Caret = () => (
  <svg {...base} width={14} height={14} strokeWidth={2.4} className="caret"><path d="M5 9l7 7 7-7" /></svg>
);
