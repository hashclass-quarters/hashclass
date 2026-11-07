function WelcomeApp() {
  const [step, setStep] = React.useState(1);
  const adminPhoto = 'https://app.trickle.so/storage/public/images/usr_1a3cb5b2f8000001/acaeced0-5df0-40e1-950d-789fc68ea53d.jpeg';

  React.useEffect(() => {
    localStorage.setItem('hashclass_device_visited', 'true');
  }, []);

  const handleSignIn = () => {
    window.location.href = 'index.html';
  };

    return (
      <div className="h-screen overflow-hidden bg-library flex flex-col items-center justify-between p-4 relative">
        <div className="fixed inset-0 bg-library-overlay"></div>
        
        <div className="relative z-10 text-center pt-20 animate-fadeIn flex-shrink-0">
          <img src="https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png" alt="Logo" className="w-20 h-20 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">HashCLASS</h1>
          <p className="text-sm text-white italic drop-shadow-md">The Golden Minds</p>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center w-full max-w-md overflow-hidden">
          {step === 1 && (
            <div className="animate-fadeIn px-4 w-full">
              <div className="text-6xl mb-6 text-center">👋</div>
              <p className="text-xl text-white mb-3 leading-relaxed text-left font-medium">
                Hello Genius Student!<br />
                Welcome to the Community of The Golden Minds
              </p>
              <button onClick={() => setStep(2)} className="px-10 py-3 bg-white text-[var(--primary-color)] rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transition-all mt-4">
                Get Started
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="text-center animate-fadeIn px-4 w-full -mt-12">
              <p className="text-2xl text-white font-semibold mb-5">Administration</p>
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-3 border-white shadow-lg mb-5">
                <img src={adminPhoto} alt="CEO" className="w-full h-full object-cover" />
              </div>
              <p className="text-lg text-white mb-2 font-medium">Founder & CEO</p>
              <p className="text-xl text-white font-semibold mb-5">Hashimu Shabani Halifa</p>
              <p className="text-lg text-white leading-relaxed mb-8 px-2 font-medium">
                This was initiated to provide an endless learning environment at the University of Dodoma for College of Business and Economics Students.
              </p>
              <button onClick={() => window.location.href = 'signup.html'} className="px-10 py-3 bg-white text-[var(--primary-color)] rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transition-all">
                Sign Up
              </button>
            </div>
          )}
      </div>


    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<WelcomeApp />);