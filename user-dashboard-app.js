class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-4">Something went wrong</div>;
    }
    return this.props.children;
  }
}

function UserDashboardApp() {
  try {
    const [user, setUser] = React.useState(null);
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [newsPosts, setNewsPosts] = React.useState([]);
    const [showWelcome, setShowWelcome] = React.useState(true);
    const [showBlocked, setShowBlocked] = React.useState(false);
    const [showAccount, setShowAccount] = React.useState(false);
    const [showPhotoUpload, setShowPhotoUpload] = React.useState(false);
    const [showRecordAttendance, setShowRecordAttendance] = React.useState(false);

    React.useEffect(() => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser.regNumber || !window.HC.getToken()) {
        window.location.href = 'index.html';
        return;
      }
      if (currentUser.isAdmin) {
        window.location.href = 'admin.html';
        return;
      }
      
      setUser(currentUser);
      loadUserData(currentUser.regNumber);
      
      const updateOnlineStatus = () => {
        localStorage.setItem('user_online_' + currentUser.regNumber, Date.now());
      };
      
      updateOnlineStatus();
      const interval = setInterval(updateOnlineStatus, 30000);
      
      const hasSeenWelcome = localStorage.getItem('welcome_seen_' + currentUser.regNumber);
      if (!hasSeenWelcome) {
        setShowWelcome(true);
        localStorage.setItem('welcome_seen_' + currentUser.regNumber, 'true');
      } else {
        setShowWelcome(false);
      }
      
      loadNews();
      
      return () => clearInterval(interval);
    }, []);

    const loadUserData = async (regNumber) => {
      try {
        const userData = await getRegisteredUser(regNumber);
        
        if (userData) {
          const full = { ...userData, isAdmin: false };
          setUser(full);
          localStorage.setItem('currentUser', JSON.stringify(full));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    const loadNews = async () => {
      const posts = await getAllNews();
      setNewsPosts(posts.sort((a, b) => b.timestamp - a.timestamp));
    };



    const handleLogout = async () => {
      if (user) {
        localStorage.removeItem('user_online_' + user.regNumber);
      }
      await appLogout();
      sessionStorage.setItem('just_logged_out', 'true');
      window.location.href = 'index.html';
    };

    const handleBlockedClick = () => {
      setShowBlocked(true);
    };

    const handleMenuClick = (label) => {
      if (label === 'Dashboard') {
        setMenuOpen(false);
        setShowRecordAttendance(false);
      } else if (label === 'Account') {
        setShowAccount(true);
        setMenuOpen(false);
      } else if (label === 'Record' && user.regNumber === 'T08-01-02001') {
        setShowRecordAttendance(true);
        setMenuOpen(false);
      } else {
        handleBlockedClick();
      }
    };

    const handlePasswordChange = async () => {
      // the password is verified and changed on the server by the Account dialog
    };

    const handlePhotoUpload = async (newPhoto) => {
      const saved = await trickleUpdateObject('registered_user', user.objectId, { profilePic: newPhoto });
      const updatedUser = { ...user, profilePic: saved.objectData.profilePic };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    };

    if (!user) return null;

    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar 
          menuOpen={menuOpen} 
          setMenuOpen={setMenuOpen} 
          onLogout={handleLogout}
          onMenuClick={handleMenuClick}
          showRecordOption={user.regNumber === 'T08-01-02001'}
        />
        {showRecordAttendance ? (
          <RecordAttendanceView />
        ) : (
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <UserProfile user={user} onClick={(e) => { e.stopPropagation(); setShowAccount(true); }} />
          <QuickActions onBlockedClick={handleBlockedClick} />
          <div>
            <h2 className="text-xl font-bold mb-3">Latest News</h2>
            {newsPosts.map(post => (
              <NewsPost key={post.objectId} post={post} user={user} onRefresh={loadNews} />
            ))}
          </div>
        </div>
        )}
        {showWelcome && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
              <p className="text-sm mb-4">Hello {user.name.split(' ')[0]}, Thank you for joining The Golden Minds. This application is not functional for now until the registration closes. Please wait and you will be able to use all features soon.</p>
              <button onClick={() => setShowWelcome(false)} className="w-full bg-[var(--primary-color)] text-white py-2 rounded-lg">OK</button>
            </div>
          </div>
        )}
        {showBlocked && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
              <p className="text-sm mb-4">Hello {user.name.split(' ')[0]}, Thank you for joining The Golden Minds. This application is not functional for now until the registration closes. Please wait and you will be able to use all features soon.</p>
              <button onClick={() => setShowBlocked(false)} className="w-full bg-[var(--primary-color)] text-white py-2 rounded-lg">OK</button>
            </div>
          </div>
        )}
        {showAccount && (
          <AccountView user={user} onClose={() => setShowAccount(false)} onPasswordChange={handlePasswordChange} />
        )}
      </div>
    );
  } catch (error) {
    console.error('UserDashboardApp error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><UserDashboardApp /></ErrorBoundary>);