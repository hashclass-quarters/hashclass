function Sidebar({ activeView, setActiveView, onLogout }) {
  try {
    const menuItems = [
      { id: 'home', icon: 'layout-dashboard', label: 'Home' },
      { id: 'administration', icon: 'shield', label: 'Administration' },
      { id: 'registered', icon: 'users', label: 'Registered Users' },
      { id: 'attendance', icon: 'calendar-check', label: 'Attendance' },
      { id: 'news', icon: 'newspaper', label: 'News' },
      { id: 'password-requests', icon: 'key', label: 'Password Requests' },
      { id: 'announcements', icon: 'megaphone', label: 'Announcements' }
    ];

    return (
      <div className="w-56 bg-white shadow-lg flex flex-col" data-name="sidebar" data-file="components/Sidebar.js">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <img src="https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png" alt="Logo" className="w-10 h-10" />
            <div>
              <h2 className="font-bold text-base text-[var(--primary-color)]">HashCLASS</h2>
              <p className="text-xs text-gray-500 italic">The Golden Minds</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
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
  } catch (error) {
    console.error('Sidebar error:', error);
    return null;
  }
}