// SVG shelf logo — violet in light mode, white in dark/light panel mode
export function ShelfLogo({ size = 28, light = false }: { size?: number; light?: boolean }) {
  const c = light
    ? { board: '#fff', brackets: 'rgba(255,255,255,0.8)', items: ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.6)'], feet: 'rgba(255,255,255,0.6)' }
    : { board: '#7c3aed', brackets: '#8b5cf6', items: ['#a78bfa', '#c4b5fd', '#8b5cf6'], feet: '#6d28d9' };

  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ProductShelf logo">
      {/* Shelf board */}
      <rect x="2" y="18" width="24" height="3" rx="1.5" fill={c.board} />
      {/* Left bracket */}
      <rect x="2" y="9" width="2" height="9" rx="1" fill={c.brackets} />
      {/* Right bracket */}
      <rect x="24" y="9" width="2" height="9" rx="1" fill={c.brackets} />
      {/* Items on shelf */}
      <rect x="6" y="11" width="5" height="7" rx="1" fill={c.items[0]} />
      <rect x="13" y="13" width="4" height="5" rx="1" fill={c.items[1]} />
      <rect x="19" y="10" width="3" height="8" rx="1" fill={c.items[2]} />
      {/* Feet */}
      <rect x="5" y="21" width="2" height="4" rx="1" fill={c.feet} />
      <rect x="21" y="21" width="2" height="4" rx="1" fill={c.feet} />
    </svg>
  );
}
