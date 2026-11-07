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

function SignupApp() {
  try {
    const [step, setStep] = React.useState(1);
    const [loading, setLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [formData, setFormData] = React.useState({
      fullName: '',
      university: '',
      yearOfStudy: '',
      course: '',
      regNumber: '',
      email: '',
      phone: '',
      profilePic: '',
      lessonPackages: [],
      password: '',
      confirmPassword: ''
    });

    const universities = [
      'University of Dodoma',
      'University of Dar-es-salaam',
      'Institute of Accountancy Arusha',
      'Ardhi University',
      'Mbeya University of Science and Technology',
      'College of Business Education'
    ];

    const courses = [
      'Bachelor of Business Administration',
      'Bachelor of Commerce in Accounting',
      'Bachelor of Commerce in Finance',
      'Bachelor of Commerce in Procurement and Logistics Management',
      'Bachelor of Commerce in Human Resource Management',
      'Bachelor of Commerce in Marketing',
      'Bachelor of Commerce in Tourism and Hospitality Management',
      'Bachelor of Commerce in International Business',
      'Bachelor of Commerce in Enterpreneurship',
      'Bachelor of Commerce in Information Management'
    ];

    const getPackagesForYear = (year) => {
      if (year === 'FIRST YEAR') {
        return [
          { id: 'AF121', name: 'AF121', price: 10000 },
          { id: 'ST1208', name: 'ST 1208', price: 5000 },
          { id: 'IT111', name: 'IT 111', price: 5000 }
        ];
      } else if (year === 'SECOND YEAR') {
        return [
          { id: 'AF227', name: 'AF227', price: 10000 },
          { id: 'AF223', name: 'AF223', price: 10000 }
        ];
      }
      return [];
    };

    const handleStep1Next = () => {
      if (!formData.fullName || !formData.university || !formData.yearOfStudy || !formData.course) {
        setErrorMessage('All fields are required');
        return;
      }
      const nameParts = formData.fullName.trim().split(/\s+/);
      if (nameParts.length !== 3) {
        setErrorMessage('Full Name must contain exactly three names separated by single spaces');
        return;
      }
      setErrorMessage('');
      setStep(2);
    };

    const handleStep2Next = () => {
      if (!formData.regNumber || !formData.email || !formData.phone || !formData.profilePic) {
        setErrorMessage('All fields are required');
        return;
      }
      setErrorMessage('');
      setStep(3);
    };

    const handleRegister = async () => {
      if (formData.lessonPackages.length === 0) {
        setErrorMessage('Please select at least one lesson package');
        return;
      }
      if (!formData.password || !formData.confirmPassword) {
        setErrorMessage('Please enter and confirm your password');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setErrorMessage('Password must be at least 6 characters');
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const firstYearPackages = getPackagesForYear('FIRST YEAR');
        const secondYearPackages = getPackagesForYear('SECOND YEAR');
        const allPackages = [...firstYearPackages, ...secondYearPackages];
        
        const selectedPackages = formData.lessonPackages.map(pkgId => {
          const pkg = allPackages.find(p => p.id === pkgId);
          if (!pkg) {
            console.error('Package not found:', pkgId);
            return null;
          }
          return {
            id: pkg.id,
            name: pkg.name,
            price: pkg.price
          };
        }).filter(Boolean);

        if (selectedPackages.length === 0) {
          throw new Error('No valid packages selected');
        }

        console.log('Registering user with data:', {
          regNumber: formData.regNumber,
          name: formData.fullName,
          packagesCount: selectedPackages.length
        });

        const result = await registerStudent({
          regNumber: formData.regNumber,
          name: formData.fullName,
          course: formData.course,
          year: formData.yearOfStudy,
          email: formData.email,
          phone: formData.phone,
          profilePic: formData.profilePic,
          password: formData.password,
          lessonPackages: selectedPackages,
          paid: false
        });

        console.log('Registration successful:', result);
        localStorage.setItem('registration_success', formData.fullName);
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Registration error:', error);
        setErrorMessage(error.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-library flex items-center justify-center p-4 relative">
        <div className="fixed inset-0 bg-library-overlay"></div>
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <img src="https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png" alt="Logo" className="w-16 h-16 mx-auto mb-3" />
            <h1 className="text-3xl font-bold text-[var(--primary-color)] mb-1">Sign Up</h1>
            <p className="text-sm text-gray-600">Step {step} of 3</p>
          </div>

          {step === 1 && (
            <SignupStep1 
              formData={formData}
              setFormData={setFormData}
              universities={universities}
              courses={courses}
              onNext={handleStep1Next}
              loading={loading}
            />
          )}

          {step === 2 && (
            <SignupStep2
              formData={formData}
              setFormData={setFormData}
              onBack={() => setStep(1)}
              onNext={handleStep2Next}
              loading={loading}
            />
          )}

          {step === 3 && (
            <SignupStep3
              formData={formData}
              setFormData={setFormData}
              getPackagesForYear={getPackagesForYear}
              onBack={() => setStep(2)}
              onRegister={handleRegister}
              loading={loading}
            />
          )}

          <div className="text-center text-sm mt-6">
            <span className="text-gray-700">Already have an account? </span>
            <a href="index.html" className="text-[var(--primary-color)] hover:underline font-semibold">Sign In</a>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('SignupApp error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><SignupApp /></ErrorBoundary>);