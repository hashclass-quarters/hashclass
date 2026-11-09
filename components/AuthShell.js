function AuthShell({ title, subtitle, step, onBack, roomy, children }) {
  const desktop = useIsDesktop();
  if (desktop) {
    return (
      <div className="h-[100dvh] w-full flex overflow-hidden" style={{ background: '#fff' }} data-name="auth-shell-desktop">
        <div style={{ width: '48%', minWidth: 460 }}>
          <DesktopBrandPanel headline={<>Hello <span style={{ color: '#FFD24A' }}>Genius</span> Student!</>} sub="Welcome to the community of The Golden Minds - an endless learning environment for UDOM business and economics students.">
            <DesktopHighlights />
          </DesktopBrandPanel>
        </div>
        <div className="flex-1 relative bg-white" style={{ borderLeft: '5px solid #F5B400' }}>
          {onBack && (
            <button onClick={onBack} aria-label="Back" className="absolute left-8 top-8 z-20 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-[#1D3FD0]" style={{ border: '1px solid #D5DEFA' }}>
              <div className="icon-arrow-left text-xl"></div>
            </button>
          )}
          <FitToScreen className="h-full bg-white" innerClassName="items-center justify-center">
            <div className="hc-sheet-desktop w-full px-8 py-8" style={{ maxWidth: 520 }}>
              <div className="mb-6">
                <h2 className="text-4xl font-extrabold text-[#1D3FD0]">{title}</h2>
                <div className="mt-2 h-1 w-14 rounded-full" style={{ background: '#F5B400' }}></div>
                {subtitle && <p className="text-base text-gray-600 mt-3">{subtitle}</p>}
                {step && (
                  <div className="mt-4">
                    <p className="text-sm text-[#1D3FD0] font-medium mb-3">Step {step} of 3</p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((n, i) => (
                        <React.Fragment key={n}>
                          <div className={`hc-step ${n <= step ? 'on' : ''}`}>{n}</div>
                          {i < 2 && <div className="hc-dots"><i></i><i></i><i></i></div>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="hc-sheet flex flex-col gap-4" style={{ background: '#fff', border: 'none', borderTop: 'none', boxShadow: 'none' }}>{children}</div>
            </div>
          </FitToScreen>
        </div>
      </div>
    );
  }
  return (
    <div className="hc-grad" data-name="auth-shell">
    <FitToScreen
      className="h-[100dvh] hc-grad"
      innerClassName="items-center"
      behind={
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md overflow-hidden pointer-events-none" style={{ height: 'max(20rem, 44%)', WebkitMaskImage: 'linear-gradient(180deg,#000 72%,transparent 100%)', maskImage: 'linear-gradient(180deg,#000 72%,transparent 100%)' }}>
        <img src="assets/students.jpg" alt="" className="w-full h-full object-cover" style={{ objectPosition: '50% 20%' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(10,26,122,.78) 0%,rgba(18,46,176,.72) 55%,rgba(10,26,122,.95) 100%)' }}></div>
      </div>
      }
    >
      <div className={`w-full max-w-md px-6 text-center relative z-10 ${roomy ? 'flex-1 flex flex-col justify-center pt-8 pb-14' : 'pt-5 pb-12'}`}>
        {onBack && (
          <button onClick={onBack} aria-label="Back" className="absolute left-5 top-6 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-[#1D3FD0]">
            <div className="icon-arrow-left text-xl"></div>
          </button>
        )}
        <img src="https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png" alt="HashCLASS" className={`${roomy ? 'h-28' : 'h-20'} w-auto mx-auto object-contain`} />
        <h1 className={`hc-brand font-extrabold text-white tracking-tight ${roomy ? 'text-5xl mt-2' : 'text-4xl mt-1'}`}>Hash<span className="gold">CLASS</span></h1>
        <p className={`hc-tag mt-1 ${roomy ? 'text-base' : 'text-sm'}`}>The Golden Minds</p>
      </div>
      <div className={`hc-sheet relative z-10 w-full max-w-md ${roomy ? 'flex-none -mt-6' : 'flex-1 -mt-8'} flex flex-col rounded-t-[2.25rem] px-6 pt-6 pb-6 hc-fade`} style={roomy ? { paddingBottom: 'clamp(24px, calc((100dvh - 700px) * 0.42), 150px)' } : undefined}>
        <div className="text-center mb-3">
          <h2 className="text-3xl font-extrabold text-[#1D3FD0]">{title}</h2>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          {step && (
            <div className="mt-3">
              <p className="text-sm text-[#1D3FD0] font-medium mb-3">Step {step} of 3</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3].map((n, i) => (
                  <React.Fragment key={n}>
                    <div className={`hc-step ${n <= step ? 'on' : ''}`}>{n}</div>
                    {i < 2 && <div className="hc-dots"><i></i><i></i><i></i></div>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className={`flex flex-col gap-3 ${roomy ? 'gap-4' : 'flex-1 justify-around'}`}>{children}</div>
      </div>
    </FitToScreen>
    </div>
  );
}
