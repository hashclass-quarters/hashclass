function UserNavbar({ menuOpen, setMenuOpen, onLogout, onMenuClick, showRecordOption }) {
  try {
    const menuItems = [
      { label: 'Dashboard', icon: 'layout-dashboard', clickable: true },
      { label: 'Book Lesson', icon: 'book-open', clickable: false },
      { label: 'Book Question', icon: 'message-square', clickable: false },
      { label: 'Quiz', icon: 'clipboard-list', clickable: false },
      { label: 'Exam Results', icon: 'file-text', clickable: false },
      { label: 'Announcements', icon: 'megaphone', clickable: false },
      { label: 'Account', icon: 'user', clickable: true }
    ];

    return (
      <>
        <div className="bg-[var(--primary-color)] shadow-md px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2">
              <div className="icon-menu text-2xl text-white"></div>
            </button>
            <h1 className="text-lg font-bold text-white">Dashboard</h1>
          </div>
          <img src="https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png" alt="Logo" className="w-10 h-10" />
        </div>
        {menuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setMenuOpen(false)}>
            <div className="w-64 bg-white h-full shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b flex items-center gap-3">
                <img src="https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png" alt="Logo" className="w-12 h-12" />
                <div>
                  <h2 className="text-xl font-bold text-[var(--primary-color)]">HashCLASS</h2>
                  <p className="text-xs text-gray-500 italic">The Golden Minds</p>
                </div>
              </div>
              <nav className="p-4 flex-1 flex flex-col">
                {menuItems.map(item => (
                  <button 
                    key={item.label} 
                    onClick={() => onMenuClick(item.label)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
                  >
                    <div className={`icon-${item.icon} text-lg`}></div>
                    <span>{item.label}</span>
                  </button>
                ))}
                {showRecordOption && (
                  <button 
                    onClick={() => onMenuClick('Record')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
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