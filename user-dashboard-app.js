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

// Popups on the student dashboard have no dark layer behind them (the clear layer still closes them on tap).
(function () {
  const st = document.createElement('style');
  st.textContent = '.fixed.inset-0.bg-black.flex{background:transparent!important;--tw-bg-opacity:0!important}' +
    '.fixed.inset-0.bg-black.flex>div{box-shadow:0 18px 50px rgba(15,27,77,.28),0 0 0 1px rgba(29,63,208,.12)!important}';
  document.head.appendChild(st);
})();

function UserDashboardApp() {
  try {
    const desktop = useIsDesktop();
    const [user, setUser] = React.useState(null);
    const [, setMonthsVersion] = React.useState(0);
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
      loadMonthPeriods().then(() => setMonthsVersion(v => v + 1)).catch(e => console.error('Months error:', e));
      
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
      <div className={showRecordAttendance ? 'min-h-screen' : 'h-[100dvh] flex flex-col overflow-hidden'} style={{ background: '#EEF2FF' }}>
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
        desktop ? (
        <div className="max-w-[1280px] w-full mx-auto px-6 py-5 flex-1 min-h-0 flex gap-6" data-name="dashboard-desktop">
          <aside className="shrink-0 flex flex-col min-h-0" style={{ width: 'clamp(380px,32vw,460px)' }}>
            <ShrinkToFit maxRatio={1}>
              <div className="space-y-4">
                <UserProfile user={user} onClick={(e) => { e.stopPropagation(); setShowAccount(true); }} />
                <TutorBanner />
                <QuickActions onBlockedClick={handleBlockedClick} />
              </div>
            </ShrinkToFit>
          </aside>
          <section className="flex-1 min-w-0 min-h-0 flex flex-col hc-card p-6" style={{ borderTop: '4px solid #F5B400' }}>
            <h2 className="text-2xl font-extrabold mb-4 text-[#0F1B4D] flex items-center gap-3 shrink-0">Latest News <span className="h-1.5 w-12 rounded-full" style={{ background: '#F5B400' }}></span></h2>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-2">
              {newsPosts.map(post => (
                <NewsPost key={post.objectId} post={post} user={user} onRefresh={loadNews} />
              ))}
            </div>
          </section>
        </div>
        ) : (
        <div className="max-w-2xl w-full mx-auto px-4 pt-3 flex-1 min-h-0 flex flex-col gap-3">
          <ShrinkToFit maxRatio={0.66}>
            <div className="space-y-3">
              <UserProfile user={user} onClick={(e) => { e.stopPropagation(); setShowAccount(true); }} />
              <TutorBanner />
              <QuickActions onBlockedClick={handleBlockedClick} />
            </div>
          </ShrinkToFit>
          <div className="flex-1 min-h-0 flex flex-col">
            <h2 className="text-xl font-extrabold mb-3 text-[#0F1B4D] flex items-center gap-2 shrink-0">Latest News <span className="h-1 w-8 rounded-full" style={{ background: '#F5B400' }}></span></h2>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-4 pr-0.5" style={{ WebkitOverflowScrolling: 'touch' }}>
            {newsPosts.map(post => (
              <NewsPost key={post.objectId} post={post} user={user} onRefresh={loadNews} />
            ))}
            </div>
          </div>
        </div>
        )
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