// Keeps a screen on ONE non-scrolling page: the content is shrunk (never enlarged) to the phone's
// height and, on tall phones, stretched to fill the whole screen.
function useFit(outerRef, innerRef, opts) {
  React.useLayoutEffect(() => {
    const outer = outerRef.current, inner = innerRef.current;
    if (!outer || !inner) return;
    const min = (opts && opts.min) || 0.55;
    let raf = 0;
    const fit = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        inner.style.zoom = 1;
        inner.style.setProperty('--hc-zoom', 1);
        inner.style.minHeight = '0px';
        const avail = outer.clientHeight;
        const nat = inner.scrollHeight;
        if (!avail || !nat) return;
        const z = Math.max(min, Math.min(1, avail / nat));
        inner.style.zoom = z;
        inner.style.setProperty('--hc-zoom', z);   // lets max-width caps stay the same on screen
        inner.style.minHeight = (avail / z) + 'px';
      });
    };
    fit();
    const mo = new MutationObserver(fit);
    mo.observe(inner, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
    inner.addEventListener('load', fit, true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    return () => {
      cancelAnimationFrame(raf); mo.disconnect();
      window.removeEventListener('resize', fit);
      window.removeEventListener('orientationchange', fit);
      inner.removeEventListener('load', fit, true);
    };
  }, []);
}

function FitToScreen({ children, behind, className, innerClassName, min }) {
  const outerRef = React.useRef(null);
  const innerRef = React.useRef(null);
  useFit(outerRef, innerRef, { min: min });
  return (
    <div ref={outerRef} className={((className || '').includes('absolute') ? '' : 'relative ') + 'overflow-hidden w-full ' + (className || 'h-[100dvh]')}>
      {behind}
      <div ref={innerRef} className={'relative flex flex-col w-full ' + (innerClassName || '')}>
        {children}
      </div>
    </div>
  );
}

// For the dashboard: shrinks only the top block so it never takes more than `maxRatio`
// of the space under it, leaving the rest to the scrolling news list.
function ShrinkToFit({ children, maxRatio, min }) {
  const wrapRef = React.useRef(null);
  const innerRef = React.useRef(null);
  React.useLayoutEffect(() => {
    const wrap = wrapRef.current, inner = innerRef.current;
    if (!wrap || !inner) return;
    let raf = 0;
    const fit = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        inner.style.zoom = 1; wrap.style.height = 'auto';
        const top = wrap.getBoundingClientRect().top;
        const avail = window.innerHeight - top;
        const nat = inner.scrollHeight;
        if (!nat || avail <= 0) return;
        const z = Math.max(min || 0.55, Math.min(1, ((maxRatio || 0.65) * avail) / nat));
        inner.style.zoom = z;
        wrap.style.height = Math.ceil(nat * z) + 'px';
      });
    };
    fit();
    const mo = new MutationObserver(fit);
    mo.observe(inner, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', fit);
    inner.addEventListener('load', fit, true);
    return () => { cancelAnimationFrame(raf); mo.disconnect(); window.removeEventListener('resize', fit); inner.removeEventListener('load', fit, true); };
  }, []);
  return (
    <div ref={wrapRef} className="shrink-0 overflow-hidden">
      <div ref={innerRef}>{children}</div>
    </div>
  );
}


// true on laptop / desktop screens (wide + landscape) - those get their own split layout
function useIsDesktop() {
  const q = '(min-width: 900px) and (min-aspect-ratio: 5/4)';
  const [d, setD] = React.useState(() => window.matchMedia ? window.matchMedia(q).matches : false);
  React.useEffect(() => {
    if (!window.matchMedia) return;
    const m = window.matchMedia(q), on = () => setD(m.matches);
    on();
    m.addEventListener ? m.addEventListener('change', on) : m.addListener(on);
    return () => { m.removeEventListener ? m.removeEventListener('change', on) : m.removeListener(on); };
  }, []);
  return d;
}

// Left-hand brand panel used by the desktop layouts
function DesktopBrandPanel({ headline, sub, children }) {
  const logo = 'https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png';
  return (
    <div className="hc-grad relative h-full overflow-hidden">
      <img src="assets/students.jpg" alt="" className="hc-parallax absolute inset-0 w-full h-full object-cover" style={{ objectPosition: '50% 30%' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,rgba(10,26,122,.92) 0%,rgba(18,46,176,.80) 55%,rgba(10,26,122,.95) 100%)' }}></div>
      <div className="hc-orb" style={{ width: 420, height: 420, right: -140, top: -120 }}></div>
      <div className="hc-orb" style={{ width: 300, height: 300, left: -100, bottom: -90 }}></div>
      <div className="relative z-10 h-full flex flex-col justify-between" style={{ padding: 'clamp(28px,5dvh,64px) clamp(32px,4.5vw,80px)' }}>
        <div className="flex items-center gap-4">
          <img src={logo} alt="HashCLASS" className="object-contain" style={{ height: 'clamp(64px,10dvh,104px)' }} />
          <div>
            <div className="hc-brand font-extrabold text-white tracking-tight leading-none" style={{ fontSize: 'clamp(30px,4.6dvh,46px)' }}>Hash<span className="gold">CLASS</span></div>
            <div className="hc-tag mt-1" style={{ fontSize: 'clamp(13px,1.8dvh,17px)' }}>The Golden Minds</div>
          </div>
        </div>
        <div>
          <h2 className="font-extrabold text-white leading-[1.08]" style={{ fontSize: 'clamp(34px,6dvh,62px)' }}>{headline}</h2>
          {sub && <p className="text-white/90 mt-4 max-w-xl leading-relaxed" style={{ fontSize: 'clamp(15px,2.2dvh,20px)' }}>{sub}</p>}
          {children}
        </div>
        <p className="text-white/70 text-sm">&copy; HashCLASS &middot; University of Dodoma, College of Business and Economics</p>
      </div>
    </div>
  );
}

function DesktopHighlights() {
  const items = [['Lessons & tutorials', 'Learn from top finalists, any time.'], ['Attendance, news & class chat', 'Everything your class needs in one place.'], ['Simple monthly payments', 'See what is paid and what is next.']];
  return (
    <div className="mt-8 flex flex-col" style={{ gap: 'clamp(10px,2dvh,20px)' }}>
      {items.map(([t, d]) => (
        <div key={t} className="flex items-center gap-4">
          <span className="hc-check">&#10003;</span>
          <div><div className="text-white font-bold" style={{ fontSize: 'clamp(15px,2.1dvh,19px)' }}>{t}</div><div className="text-white/75" style={{ fontSize: 'clamp(12px,1.7dvh,15px)' }}>{d}</div></div>
        </div>
      ))}
    </div>
  );
}


function useIsPhone() {
  const q = '(max-width: 767px)';
  const [d, setD] = React.useState(() => window.matchMedia ? window.matchMedia(q).matches : false);
  React.useEffect(() => {
    if (!window.matchMedia) return;
    const m = window.matchMedia(q), on = () => setD(m.matches);
    on();
    m.addEventListener ? m.addEventListener('change', on) : m.addListener(on);
    return () => { m.removeEventListener ? m.removeEventListener('change', on) : m.removeListener(on); };
  }, []);
  return d;
}
