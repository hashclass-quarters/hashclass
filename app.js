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
          window.location.href = 'admin.html';
          return;
        }

        const user = await getRegisteredUser(result.user.regNumber);
        localStorage.setItem('currentUser', JSON.stringify({ ...user, isAdmin: false }));
        localStorage.setItem('user_online_' + user.regNumber, Date.now());
        window.location.href = 'user-dashboard.html';
      } catch (error) {
        console.error('Error signing in:', error);
        setErrors({ regNumber: true, password: true });
        setErrorMessage(error.message || 'An error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-library flex flex-col items-center justify-center p-4 relative" data-name="app" data-file="app.js">
        <div className="fixed inset-0 bg-library-overlay"></div>
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <img src="https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png" alt="HashCLASS Logo" className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-[var(--primary-color)] mb-2">HashCLASS</h1>
            <p className="text-[var(--text-light)] text-sm italic">The Golden Minds</p>
          </div>

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
          </div>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full mt-6 bg-[var(--primary-color)] text-white py-3 rounded-lg font-semibold hover:bg-[var(--accent-color)] transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="mt-4 text-center">
            <a href="forgot-password.html" className="text-[var(--primary-color)] hover:underline text-sm">
              Forgot Password?
            </a>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-700">Don't have an account? </span>
            <a href="signup.html" className="text-[var(--primary-color)] hover:underline font-semibold">Sign Up</a>
          </div>
        </div>
        <ContactIcons />
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
              <p className="text-sm text-green-600 mb-4">Welcome {successName}, You have been successfully registered to HashCLASS. Enjoy the services. Now, Login with the details you provided. You will be contacted by the CEO soon for confirmation.</p>
              <button onClick={() => setShowSuccess(false)} className="w-full bg-[var(--primary-color)] text-white py-2 rounded-lg">OK</button>
            </div>
          </div>
        )}
      </div>
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