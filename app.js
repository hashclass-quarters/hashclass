class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg">
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  try {
    const [regNumber, setRegNumber] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [redirecting, setRedirecting] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [errorMessage, setErrorMessage] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [successName, setSuccessName] = React.useState('');

    React.useEffect(() => {
      const name = localStorage.getItem('registration_success');
      if (name) {
        setSuccessName(name);
        setShowSuccess(true);
        localStorage.removeItem('registration_success');
      }
    }, []);

    const handleSignIn = async () => {
      const newErrors = {};
      let message = '';

      if (!regNumber) {
        newErrors.regNumber = true;
        message = 'Please enter your registration number';
      } else if (!password) {
        newErrors.password = true;
        message = 'Please enter your password';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setErrorMessage(message);
        return;
      }

      setLoading(true);
      setErrorMessage('');
      setErrors({});
      let leaving = false;
      
      try {
        const result = await appLogin(regNumber, password);

        if (result.kind === 'admin') {
          const a = result.user;
          const adminUser = {
            objectId: result.objectId,
            isAdmin: true,
            regNumber: a.regNumber,
            name: a.name,
            email: a.email,
            phone: a.phone,
            profilePic: a.profilePic,
            course: a.course,
            year: a.year,
            authority: a.authority
          };
          localStorage.setItem('currentUser', JSON.stringify(adminUser));
          localStorage.setItem('user_online_' + adminUser.regNumber, Date.now());
          leaving = true; setRedirecting(true);
          window.location.href = 'admin.html';
          return;
        }

        // app_login already returns the full record, so there is no second request
        const user = shapeRegisteredUser({ objectId: result.objectId, objectData: result.user });
        localStorage.setItem('currentUser', JSON.stringify({ ...user, isAdmin: false }));
        localStorage.setItem('user_online_' + user.regNumber, Date.now());
        leaving = true; setRedirecting(true);
        window.location.href = 'user-dashboard.html';
      } catch (error) {
        console.error('Error signing in:', error);
        setErrors({ regNumber: true, password: true });
        setErrorMessage(error.message || 'An error occurred. Please try again.');
      } finally {
        // after a successful sign in the spinner stays until the next page opens
        if (!leaving) setLoading(false);
      }
    };

    return (
      <>
        {redirecting && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4" style={{ background: '#fff' }} role="status" aria-live="polite">
            <div style={{ width: 56, height: 56, border: '5px solid #D5DEFA', borderTopColor: '#1D3FD0', borderRadius: '9999px', animation: 'hcspin .8s linear infinite' }}></div>
            <p className="text-[#1D3FD0] font-semibold">Signing you in...</p>
          </div>
        )}
        <AuthShell title="Sign In" subtitle="Welcome back, Genius!" roomy>
          <ErrorMessage message={errorMessage} />

          <div className="space-y-4">
            <RegistrationField
              value={regNumber}
              onChange={setRegNumber}
              error={errors.regNumber}
              label="Registration Number"
            />
            <PasswordField
              value={password}
              onChange={setPassword}
              error={errors.password}
              label="Password"
            />
          <div className="flex justify-end -mt-1">
            <a href="forgot-password.html" className="text-[#1D3FD0] hover:underline text-sm font-semibold">
              Forgot Password?
            </a>
          </div>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full bg-[var(--primary-color)] text-white py-3.5 rounded-full text-lg font-semibold shadow-lg shadow-blue-700/30 hover:opacity-95 transition disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-black">Don't have an account? </span>
            <a href="signup.html" className="text-[#1D3FD0] hover:underline font-semibold">Sign Up</a>
          </div>
          <ContactIcons />
        </AuthShell>
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
              <p className="text-sm text-green-600 mb-4">Welcome {successName}, You have been successfully registered to HashCLASS. Enjoy the services. Now, Login with the details you provided. You will be contacted by the CEO soon for confirmation.</p>
              <button onClick={() => setShowSuccess(false)} className="w-full bg-[var(--primary-color)] text-white py-2 rounded-lg">OK</button>
            </div>
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error('App component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);