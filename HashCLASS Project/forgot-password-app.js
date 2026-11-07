function ForgotPasswordApp() {
  const [regNumber, setRegNumber] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleRequest = async () => {
    if (!regNumber) {
      setMessage('Please enter your registration number');
      setIsSuccess(false);
      return;
    }

    try {
      const result = await appRequestPasswordReset(regNumber);
      if (result.status === 'pending') {
        setMessage('You have already requested a password reset. Please wait for CEO approval.');
        setIsSuccess(false);
      } else if (result.status === 'created') {
        setMessage('Request sent. Once the CEO approves it, a temporary password will be sent to your email or phone. You can change it after you sign in.');
        setIsSuccess(true);
      } else {
        setMessage('This registration number is not registered');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Password request error:', error);
      setMessage('Connection error. Please try again.');
      setIsSuccess(false);
    }
  };

  return (
    <div className="min-h-screen bg-library flex items-center justify-center p-4 relative">
      <div className="fixed inset-0 bg-library-overlay"></div>
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png" alt="Logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[var(--primary-color)] mb-2">Forgot Password</h1>
          <p className="text-gray-600 text-sm">Enter your registration number</p>
        </div>
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${isSuccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}
        <RegistrationField value={regNumber} onChange={setRegNumber} label="Registration Number" />
        <button onClick={handleRequest} className="w-full mt-6 bg-[var(--primary-color)] text-white py-3 rounded-lg font-semibold hover:opacity-90">
          REQUEST PASSWORD
        </button>
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-700">Remember your password? </span>
          <a href="index.html" className="text-[var(--primary-color)] hover:underline font-semibold">Sign In</a>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ForgotPasswordApp />);