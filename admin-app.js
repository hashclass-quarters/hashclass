const ChartJS = window.Chart;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4">Something went wrong</div>;
    }
    return this.props.children;
  }
}

function AdminApp() {
  try {
    const [currentUser, setCurrentUser] = React.useState(null);
    const [activeView, setActiveView] = React.useState('home');
    const phone = useIsPhone();
    const [navOpen, setNavOpen] = React.useState(false);
    const [validUsers, setValidUsers] = React.useState([]);
    const [registeredUsers, setRegisteredUsers] = React.useState([]);
    const [editingUser, setEditingUser] = React.useState(null);
    const [showPasswordChange, setShowPasswordChange] = React.useState(false);
    const [showProfilePopup, setShowProfilePopup] = React.useState(false);
    const [, setMonthsVersion] = React.useState(0);

    const loadData = async () => {
      try {
        const validPromise = getAllValidUsers();
        const registeredPromise = getAllRegisteredUsers();
        
        const [valid, registered] = await Promise.all([
          validPromise.catch(err => { console.error('Valid users error:', err); return []; }),
          registeredPromise.catch(err => { console.error('Registered users error:', err); return []; })
        ]);
        
        setValidUsers(valid);
        setRegisteredUsers(registered);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    React.useEffect(() => {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!user.regNumber || !window.HC.getToken()) {
        window.location.href = 'index.html';
        return;
      }
      if (!user.isAdmin) {
        window.location.href = 'user-dashboard.html';
        return;
      }
      // confirm with the server that the session is real and refresh role/profile
      appMe().then(me => {
        if (me.kind !== 'admin') { window.location.href = 'user-dashboard.html'; return; }
        const fresh = { ...user, ...me.user, objectId: me.objectId, isAdmin: true };
        localStorage.setItem('currentUser', JSON.stringify(fresh));
        setCurrentUser(fresh);
        loadData();
        loadMonthPeriods().then(() => setMonthsVersion(v => v + 1)).catch(e => console.error('Months error:', e));
      }).catch(() => { window.location.href = 'index.html'; });
    }, []);

    React.useEffect(() => {
      if (currentUser && activeView) {
        loadData();
      }
    }, [activeView]);

    const handleLogout = async () => {
      await appLogout();
      sessionStorage.setItem('just_logged_out', 'true');
      window.location.href = 'index.html';
    };

    const handlePasswordChange = async () => {
      // the password itself is changed (and checked) on the server by the dialog
      setShowPasswordChange(false);
    };

    const handleProfileSave = async (updatedData) => {
      const saved = await updateAdminProfile(currentUser.objectId, updatedData);
      const updatedUser = { ...currentUser, ...saved.objectData, isAdmin: true };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setShowProfilePopup(false);
    };

    return (
      <div className={phone ? 'flex flex-col h-[100dvh] bg-gray-50' : 'flex h-screen bg-gray-50'}>
        {!phone && <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />}
        {phone && <Sidebar mobile open={navOpen} onClose={() => setNavOpen(false)} activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {phone ? (
            <header className="hc-grad px-3 py-2.5 flex justify-between items-center shrink-0" style={{ borderBottom: '3px solid #F5B400' }}>
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={() => setNavOpen(true)} aria-label="Menu" className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center"><div className="icon-menu text-2xl text-white"></div></button>
                <div className="min-w-0">
                  <h1 className="hc-brand text-lg font-extrabold text-white leading-tight">Hash<span className="gold">CLASS</span> <span className="text-xs font-semibold text-white/80">Admin</span></h1>
                  <p className="text-[11px] truncate" style={{ color: '#FFD24A' }}>{({ home: 'Home', administration: 'Administration', registered: 'Registered Users', months: 'Months', attendance: 'Attendance', news: 'News', 'password-requests': 'Password Requests', announcements: 'Announcements' })[activeView]}</p>
                </div>
              </div>
              {currentUser && (
                <button className="flex items-center gap-2" onClick={() => setShowProfilePopup(true)} aria-label="Profile">
                  <div className="text-right leading-tight max-w-[110px]">
                    <p className="text-xs font-semibold text-white truncate">{(currentUser.name || '').split(' ')[0]}</p>
                    <p className="text-[10px] truncate" style={{ color: '#FFD24A' }}>{currentUser.authority || 'ADMIN'}</p>
                  </div>
                  <img src={currentUser.profilePic || 'https://via.placeholder.com/40'} alt="Profile" className="w-10 h-10 rounded-full object-cover" style={{ boxShadow: '0 0 0 2px #F5B400' }} />
                </button>
              )}
            </header>
          ) : (
          <header className="bg-white shadow-sm p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[var(--primary-color)]">HashCLASS Admin</h1>
            {currentUser && (
              <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors" onClick={() => setShowProfilePopup(true)}>
                <img 
                  src={currentUser.profilePic || 'https://via.placeholder.com/40'} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.authority || 'ADMIN'}</p>
                </div>
              </div>
            )}
          </header>
          )}
          <main className={'hc-admin-main flex-1 min-h-0 overflow-auto ' + (phone ? 'p-3' : 'p-6')} style={phone ? { overflowX: 'auto' } : undefined}>
            {activeView === 'home' && <HomeView validUsers={validUsers} registeredUsers={registeredUsers} />}
            {activeView === 'administration' && <AdministrationView onEdit={setEditingUser} onRefresh={loadData} />}
            {activeView === 'registered' && <RegisteredView users={registeredUsers} onEdit={setEditingUser} onRefresh={loadData} />}
            {activeView === 'months' && <MonthsView canEdit={['FOUNDER & CEO', 'Chief Financial Officer'].includes(currentUser && currentUser.authority)} onChanged={() => setMonthsVersion(v => v + 1)} />}
            {activeView === 'attendance' && <AttendanceView />}
            {activeView === 'news' && <NewsView />}
            {activeView === 'password-requests' && <PasswordRequestsView />}
            {activeView === 'announcements' && <div className="text-center text-gray-500 py-20">Announcements - Coming Soon</div>}
          </main>
          {phone && (
            <nav className="shrink-0 bg-white grid grid-cols-5 px-1 pt-1 pb-1" style={{ borderTop: '1px solid #D5DEFA', boxShadow: '0 -6px 18px rgba(20,40,140,.10)', paddingBottom: 'max(4px, env(safe-area-inset-bottom))' }}>
              {[['home', 'layout-dashboard', 'Home'], ['registered', 'users', 'Users'], ['months', 'calendar-days', 'Months'], ['news', 'newspaper', 'News']].map(([id, ic, lb]) => (
                <button key={id} onClick={() => setActiveView(id)} className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl" style={activeView === id ? { color: '#1D3FD0', background: '#EEF2FF' } : { color: '#6B7280' }}>
                  <div className={`icon-${ic} text-xl`}></div>
                  <span className="text-[10px] font-bold">{lb}</span>
                </button>
              ))}
              <button onClick={() => setNavOpen(true)} className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl" style={{ color: '#6B7280' }}>
                <div className="icon-menu text-xl"></div>
                <span className="text-[10px] font-bold">More</span>
              </button>
            </nav>
          )}
        </div>
        {editingUser && <EditModal user={editingUser} onClose={() => setEditingUser(null)} onSave={loadData} />}
        {showPasswordChange && currentUser && (
          <AdminPasswordChange 
            user={currentUser} 
            onClose={() => setShowPasswordChange(false)} 
            onPasswordChange={handlePasswordChange}
          />
        )}
        {showProfilePopup && currentUser && (
          <AdminProfilePopup 
            admin={currentUser} 
            onClose={() => setShowProfilePopup(false)} 
            onChangePassword={() => {
              setShowProfilePopup(false);
              setShowPasswordChange(true);
            }}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('AdminApp error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><AdminApp /></ErrorBoundary>);