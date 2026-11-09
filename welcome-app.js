function WelcomeApp() {
  const [step, setStep] = React.useState(1);
  const adminPhoto = 'https://app.trickle.so/storage/public/images/usr_1a3cb5b2f8000001/acaeced0-5df0-40e1-950d-789fc68ea53d.jpeg';

  React.useEffect(() => {
    localStorage.setItem('hashclass_device_visited', 'true');
  }, []);

  const desktop = useIsDesktop();
  if (desktop) {
    return (
      <div className="h-[100dvh] w-full flex overflow-hidden" style={{ background: '#0A1A7A' }} data-name="welcome-desktop">
        <div style={{ width: '56%', minWidth: 520 }}>
          <DesktopBrandPanel headline={<>Hello <span style={{ color: '#FFD24A' }}>Genius</span><br />Student!</>} sub={<>Welcome to the Community of <b style={{ color: '#FFD24A' }}>The Golden Minds</b></>}>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <button onClick={() => window.location.href = 'signup.html'} className="hc-gold-btn px-10 py-4 rounded-full text-lg flex items-center gap-2">Get Started <div className="icon-arrow-right text-xl"></div></button>
              <a href="index.html" className="px-9 py-4 rounded-full text-lg font-bold text-white" style={{ border: '2px solid rgba(255,255,255,.7)' }}>Sign In</a>
            </div>
          </DesktopBrandPanel>
        </div>
        <div className="flex-1 hc-grad relative overflow-hidden" style={{ borderLeft: '5px solid #F5B400' }}>
          <div className="hc-orb" style={{ width: 380, height: 380, left: -120, top: -100 }}></div>
          <FitToScreen className="h-full" innerClassName="items-center justify-center">
            <div className="w-full px-8 py-8" style={{ maxWidth: 560 }}>
              <div className="hc-card-desktop text-center">
                <p className="text-sm uppercase tracking-[0.25em] font-semibold" style={{ color: '#FFD24A' }}>Administration</p>
                <div className="mx-auto rounded-full overflow-hidden mt-5 shadow-2xl" style={{ border: '4px solid #F5B400', width: 'clamp(140px,22dvh,200px)', height: 'clamp(140px,22dvh,200px)' }}>
                  <img src={adminPhoto} alt="CEO" className="w-full h-full object-cover" />
                </div>
                <p className="text-base text-white/90 mt-5">Founder &amp; CEO</p>
                <p className="text-white font-extrabold" style={{ fontSize: 'clamp(24px,3.6dvh,34px)' }}>Hashimu Shabani Halifa</p>
                <p className="text-white/95 leading-relaxed mt-4" style={{ fontSize: 'clamp(15px,2.2dvh,19px)' }}>
                  This was initiated to provide an endless learning environment at the University of Dodoma for College of Business and Economics Students.
                </p>
              </div>
            </div>
          </FitToScreen>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex justify-center overflow-hidden" style={{ background: '#0A1A7A' }}>
      <div className="relative h-full w-full max-w-md overflow-hidden hc-grad">
        <img src="assets/students.jpg" alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700`} style={{ objectPosition: '50% 38%', transform: 'translateY(26px)' }} />
        <div className="absolute inset-0" style={{ background: step === 1
          ? 'linear-gradient(180deg,#0A1A7A 0%,rgba(10,26,122,.85) 11%,rgba(10,26,122,.05) 28%,rgba(10,26,122,.35) 62%,rgba(10,26,122,.96) 82%,#0A1A7A 100%)'
          : 'linear-gradient(180deg,rgba(10,26,122,.84) 0%,rgba(14,36,150,.78) 50%,rgba(10,26,122,.93) 100%)' }}></div>

        <FitToScreen className="absolute inset-0 z-10">
          <div className={`text-center hc-fade ${step === 2 ? 'pt-7' : 'pt-2'}`}>
            <img src="https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png" alt="HashCLASS" className={`${step === 2 ? 'h-28' : 'h-20'} w-auto mx-auto object-contain`} />
            <h1 className="hc-brand text-3xl font-extrabold text-white tracking-tight -mt-1">Hash<span className="gold">CLASS</span></h1>
            <p className="hc-tag text-sm mt-0.5">The Golden Minds</p>
          </div>

          <div className="flex-1"></div>

          {step === 1 && (
            <div className="px-7 pb-10 hc-fade">
              <h2 className="text-4xl font-extrabold text-white leading-tight">
                Hello <span style={{ color: '#FFD24A' }}>Genius</span><br />Student!
              </h2>
              <p className="text-lg text-white mt-3 leading-snug">
                Welcome to the Community of <span style={{ color: '#FFD24A' }} className="font-bold">The Golden Minds</span>
              </p>
              <button onClick={() => setStep(2)} className="hc-gold-btn w-full mt-6 py-4 rounded-full text-lg flex items-center justify-center gap-2">
                Get Started <div className="icon-arrow-right text-xl"></div>
              </button>
              <p className="text-center text-sm text-white/80 mt-4">
                Already have an account? <a href="index.html" className="font-bold" style={{ color: '#FFD24A' }}>Sign In</a>
              </p>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="px-7 text-center hc-fade">
                <p className="text-sm uppercase tracking-[0.25em] font-semibold" style={{ color: '#FFD24A' }}>Administration</p>
                <div className="mx-auto rounded-full overflow-hidden mt-4 shadow-2xl" style={{ border: '4px solid #F5B400', width: 'clamp(128px,17dvh,176px)', height: 'clamp(128px,17dvh,176px)' }}>
                  <img src={adminPhoto} alt="CEO" className="w-full h-full object-cover" />
                </div>
                <p className="text-base text-white/90 mt-4">Founder &amp; CEO</p>
                <p className="text-white font-extrabold" style={{ fontSize: 'clamp(24px,3.2dvh,30px)' }}>Hashimu Shabani Halifa</p>
                <p className="text-white/95 leading-relaxed mt-4" style={{ fontSize: 'clamp(16px,2.2dvh,20px)' }}>
                  This was initiated to provide an endless learning environment at the University of Dodoma for College of Business and Economics Students.
                </p>
              </div>
              <div className="flex-1"></div>
              <div className="px-7 pb-14 hc-fade">
                <button onClick={() => window.location.href = 'signup.html'} className="hc-gold-btn w-full py-4 rounded-full text-lg flex items-center justify-center gap-2">
                  Sign Up <div className="icon-arrow-right text-xl"></div>
                </button>
                <p className="text-center text-sm text-white/80 mt-4">
                  Already have an account? <a href="index.html" className="font-bold" style={{ color: '#FFD24A' }}>Sign In</a>
                </p>
              </div>
            </>
          )}
        </FitToScreen>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<WelcomeApp />);
