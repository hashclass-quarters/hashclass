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
    const [validUsers, setValidUsers] = React.useState([]);
    const [registeredUsers, setRegisteredUsers] = React.useState([]);
    const [editingUser, setEditingUser] = React.useState(null);
    const [showPasswordChange, setShowPasswordChange] = React.useState(false);
    const [showProfilePopup, setShowProfilePopup] = React.useState(false);

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
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
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
          <main className="flex-1 overflow-auto p-6">
            {activeView === 'home' && <HomeView validUsers={validUsers} registeredUsers={registeredUsers} />}
            {activeView === 'administration' && <AdministrationView onEdit={setEditingUser} onRefresh={loadData} />}
            {activeView === 'registered' && <RegisteredView users={registeredUsers} onEdit={setEditingUser} onRefresh={loadData} />}
            {activeView === 'attendance' && <AttendanceView />}
            {activeView === 'news' && <NewsView />}
            {activeView === 'password-requests' && <PasswordRequestsView />}
            {activeView === 'announcements' && <div className="text-center text-gray-500 py-20">Announcements - Coming Soon</div>}
          </main>
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