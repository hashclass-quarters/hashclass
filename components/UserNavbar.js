function UserNavbar({ menuOpen, setMenuOpen, onLogout, onMenuClick, showRecordOption, userName }) {
  try {
    const desktop = useIsDesktop();
    const menuItems = [
      { label: 'Dashboard', icon: 'layout-dashboard', clickable: true },
      { label: 'Book Lesson', icon: 'book-open', clickable: false },
      { label: 'Book Question', icon: 'message-square', clickable: false },
      { label: 'Quiz', icon: 'clipboard-list', clickable: false },
      { label: 'Exam Results', icon: 'file-text', clickable: false },
      { label: 'Announcements', icon: 'megaphone', clickable: false },
      { label: 'Account', icon: 'user', clickable: true }
    ];

    if (desktop) {
      const logo = 'https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png';
      return (
        <div className="hc-grad shrink-0 sticky top-0 z-40 shadow-lg" style={{ borderBottom: '4px solid #F5B400' }} data-name="user-navbar-desktop">
          <div className="max-w-[1280px] mx-auto px-6 py-2.5 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
              <div className="leading-tight">
                <div className="hc-brand text-xl font-extrabold text-white">Hash<span className="gold">CLASS</span></div>
                <div className="text-xs italic" style={{ color: '#FFD24A' }}>The Golden Minds</div>
              </div>
            </div>
            <nav className="flex-1 flex items-center justify-center gap-1 flex-wrap">
              {menuItems.concat(showRecordOption ? [{ label: 'Record', icon: 'scan', clickable: true }] : []).map(item => (
                <button key={item.label} onClick={() => onMenuClick(item.label)} className="flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-semibold text-white/90 hover:bg-white/15 transition" style={item.label === 'Dashboard' ? { background: 'rgba(255,255,255,.18)', color: '#fff' } : undefined}>
                  <div className={`icon-${item.icon} text-base`}></div>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" style={{ background: 'linear-gradient(180deg,#FFD24A,#F5A800)', color: '#0A1A7A' }}>
              <div className="icon-log-out text-base"></div><span>Logout</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="hc-grad shadow-lg px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2">
              <div className="icon-menu text-2xl text-white"></div>
            </button>
            <h1 className="text-lg font-bold text-white">Dashboard</h1>
          </div>
          <img src="https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png" alt="Logo" className="w-11 h-11 object-contain" />
        </div>
        {menuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setMenuOpen(false)}>
            <div className="w-64 bg-white h-full shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 hc-grad flex items-center gap-3">
                <img src="https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png" alt="Logo" className="w-12 h-12" />
                <div>
                  <h2 className="hc-brand text-xl font-extrabold text-white">Hash<span className="gold">CLASS</span></h2>
                  <p className="text-xs italic" style={{ color: '#FFD24A' }}>The Golden Minds</p>
                </div>
              </div>
              <nav className="p-4 flex-1 flex flex-col">
                {menuItems.map(item => (
                  <button 
                    key={item.label} 
                    onClick={() => onMenuClick(item.label)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--secondary-color)] text-left"
                  >
                    <div className={`icon-${item.icon} text-lg`}></div>
                    <span>{item.label}</span>
                  </button>
                ))}
                {showRecordOption && (
                  <button 
                    onClick={() => onMenuClick('Record')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--secondary-color)] text-left"
                  >
                    <div className="icon-scan text-lg"></div>
                    <span>Record</span>
                  </button>
                )}
              </nav>
              <div className="p-4 border-t">
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 text-left">
                  <div className="icon-log-out text-lg"></div>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error('UserNavbar error:', error);
    return null;
  }
}