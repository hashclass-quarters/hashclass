// A dropdown drawn by the site itself (instead of the browser's default one).
// options: [{ value, label, right? }]. Opens downwards, or upwards when there is no room below.
function CustomSelect({ value, onChange, options, placeholder, icon, error, allowClear }) {
  const [open, setOpen] = React.useState(false);
  const [up, setUp] = React.useState(false);
  const [maxH, setMaxH] = React.useState(240);
  const [hi, setHi] = React.useState(-1);
  const wrapRef = React.useRef(null);
  const btnRef = React.useRef(null);
  const listRef = React.useRef(null);
  const items = (allowClear ? [{ value: '', label: placeholder || 'Select', placeholderItem: true }] : []).concat(options);
  const current = options.find(o => o.value === value);

  const openList = () => {
    const btn = btnRef.current;
    if (btn) {
      const r = btn.getBoundingClientRect();
      const scale = btn.offsetHeight ? (r.height / btn.offsetHeight) : 1;
      const below = (window.innerHeight - r.bottom - 10) / scale;
      const above = (r.top - 10) / scale;
      const wantUp = below < 200 && above > below;
      setUp(wantUp);
      setMaxH(Math.max(120, Math.min(280, wantUp ? above : below)));
    }
    const idx = items.findIndex(o => o.value === value);
    setHi(idx);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const choose = (o) => { onChange(o.value); close(); if (btnRef.current) btnRef.current.focus(); };

  React.useEffect(() => {
    if (!open) return;
    const away = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) close(); };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, [open]);

  React.useEffect(() => {
    if (!open || !listRef.current || hi < 0) return;
    const el = listRef.current.children[hi];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [hi, open]);

  const onKey = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openList(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(items.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(0, h - 1)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (items[hi]) choose(items[hi]); }
    else if (e.key === 'Tab') close();
  };

  return (
    <div ref={wrapRef} className="relative" onKeyDown={onKey}>
      {icon && <div className={`${icon} absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-[#1D3FD0] pointer-events-none z-[1]`}></div>}
      <button
        type="button"
        ref={btnRef}
        data-no-busy="true"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openList())}
        className={`w-full ${icon ? 'pl-11' : 'pl-4'} pr-10 py-3 rounded-xl border-2 text-left ${error ? 'border-red-500' : (open ? 'border-[var(--primary-color)]' : 'border-gray-200')} focus:outline-none focus:border-[var(--primary-color)] transition-colors bg-white shadow-sm relative`}
        style={{ minHeight: 48 }}
      >
        <span className={`block truncate ${current ? 'text-gray-900' : 'text-gray-400'}`}>{current ? current.label : (placeholder || 'Select')}</span>
        <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, transition: 'transform .2s' }}>
          <path d="M5 7.5l5 5 5-5" stroke="#1D3FD0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className={`absolute left-0 right-0 z-[60] overflow-y-auto rounded-xl border-2 border-[#D5DEFA] bg-white py-1 ${up ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
          style={{ maxHeight: maxH, boxShadow: '0 16px 36px rgba(20,40,140,.22)' }}
        >
          {items.map((o, i) => {
            const selected = o.value === value && !(o.placeholderItem && value);
            return (
              <li
                key={o.value + '|' + i}
                role="option"
                aria-selected={selected}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
                onMouseEnter={() => setHi(i)}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer text-sm ${o.placeholderItem ? 'text-gray-400' : 'font-semibold'} ${selected ? 'bg-[var(--primary-color)] text-white' : (i === hi ? 'bg-[#EEF2FF] text-[#1D3FD0]' : 'text-gray-800')}`}
              >
                <span className="truncate">{o.label}</span>
                {o.right && <span className={`text-xs whitespace-nowrap ${selected ? 'text-white/90' : 'text-gray-500'}`}>{o.right}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
