function Sidebar({ activeView, setActiveView, onLogout, mobile, open, onClose }) {
  try {
    const menuItems = [
      { id: 'home', icon: 'layout-dashboard', label: 'Home' },
      { id: 'administration', icon: 'shield', label: 'Administration' },
      { id: 'registered', icon: 'users', label: 'Registered Users' },
      { id: 'months', icon: 'calendar-days', label: 'Months' },
      { id: 'attendance', icon: 'calendar-check', label: 'Attendance' },
      { id: 'news', icon: 'newspaper', label: 'News' },
      { id: 'chat', icon: 'message-circle', label: 'CHAT', href: 'chat.html' },
      { id: 'password-requests', icon: 'key', label: 'Password Requests' },
      { id: 'announcements', icon: 'megaphone', label: 'Announcements' }
    ];

    if (mobile && !open) return null;
    const pick = (id, href) => { if (href) { window.location.href = href; return; } setActiveView(id); if (mobile && onClose) onClose(); };
    const box = (
      <div className={mobile ? 'w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col' : 'w-56 bg-white shadow-lg flex flex-col'} data-name="sidebar" data-file="components/Sidebar.js" onClick={mobile ? (e) => e.stopPropagation() : undefined}>
        <div className="p-4 hc-grad" style={{ borderBottom: '4px solid #F5B400' }}>
          <div className="flex items-center gap-2">
            <img src="https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png" alt="Logo" className="w-11 h-11 object-contain" />
            <div className="flex-1">
              <h2 className="hc-brand font-extrabold text-lg text-white leading-tight">Hash<span className="gold">CLASS</span></h2>
              <p className="text-xs italic" style={{ color: '#FFD24A' }}>The Golden Minds</p>
            </div>
            {mobile && <button onClick={onClose} aria-label="Close menu" className="w-9 h-9 rounded-full bg-white/15 text-white text-xl leading-none">&times;</button>}
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => pick(item.id, item.href)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg mb-1.5 transition-colors ${
                activeView === item.id 
                  ? 'bg-[var(--primary-color)] text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className={`icon-${item.icon} text-lg`}></div>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <div className="icon-log-out text-lg"></div>
            <span className="font-medium text-sm">Log Out</span>
          </button>
        </div>
      </div>
    );
    if (!mobile) return box;
    return <div className="fixed inset-0 z-50 flex" style={{ background: 'rgba(8,16,70,.55)' }} onClick={onClose}>{box}</div>;
  } catch (error) {
    console.error('Sidebar error:', error);
    return null;
  }
}