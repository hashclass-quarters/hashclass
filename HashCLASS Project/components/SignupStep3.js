function SignupStep3({ formData, setFormData, getPackagesForYear, onBack, onRegister, loading }) {
  try {
    const [showCarryOver, setShowCarryOver] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const packages = getPackagesForYear(formData.yearOfStudy);
    const carryOverPackages = formData.yearOfStudy === 'SECOND YEAR' ? getPackagesForYear('FIRST YEAR') : [];
    
    const allAvailablePackages = [...packages, ...carryOverPackages];
    const totalPrice = formData.lessonPackages.reduce((sum, pkgId) => {
      const pkg = allAvailablePackages.find(p => p.id === pkgId);
      return sum + (pkg ? pkg.price : 0);
    }, 0);

    const handlePackageToggle = (pkgId) => {
      const newPackages = formData.lessonPackages.includes(pkgId)
        ? formData.lessonPackages.filter(id => id !== pkgId)
        : [...formData.lessonPackages, pkgId];
      setFormData({ ...formData, lessonPackages: newPackages });
      if (errors.lessonPackages) setErrors({ ...errors, lessonPackages: '' });
    };

    const handleRegister = () => {
      const newErrors = {};
      
      if (formData.lessonPackages.length === 0) {
        newErrors.lessonPackages = 'Please select at least one lesson package';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      setErrors({});
      onRegister();
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Lesson Packages</label>
          <div className={`border-2 ${errors.lessonPackages ? 'border-red-500' : 'border-gray-200'} rounded-xl p-3 bg-gradient-to-br from-[var(--secondary-color)] to-white shadow-sm`}>
            <div className="space-y-2">
              {packages.map(pkg => (
                <label 
                  key={pkg.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    formData.lessonPackages.includes(pkg.id) 
                      ? 'bg-[var(--primary-color)] text-white shadow-md' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.lessonPackages.includes(pkg.id)}
                    onChange={() => handlePackageToggle(pkg.id)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-semibold">{pkg.name}</span>
                    <span className="text-sm font-medium">TZS {pkg.price.toLocaleString()}</span>
                  </div>
                </label>
              ))}
            </div>
            
            {formData.yearOfStudy === 'SECOND YEAR' && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setShowCarryOver(!showCarryOver)}
                  className="w-full flex items-center justify-between p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700">If you need Carry Over click here</span>
                  <div className={`icon-chevron-${showCarryOver ? 'up' : 'down'} text-lg text-gray-600`}></div>
                </button>
                
                {showCarryOver && (
                  <div className="mt-2 space-y-2">
                    {carryOverPackages.map(pkg => (
                      <label 
                        key={pkg.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          formData.lessonPackages.includes(pkg.id) 
                            ? 'bg-[var(--primary-color)] text-white shadow-md' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.lessonPackages.includes(pkg.id)}
                          onChange={() => handlePackageToggle(pkg.id)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="font-semibold">{pkg.name}</span>
                          <span className="text-sm font-medium">TZS {pkg.price.toLocaleString()}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="pt-3 mt-3 border-t border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total per Month</span>
                <span className="text-lg font-bold text-[var(--primary-color)]">TZS {totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
          {errors.lessonPackages && <p className="text-red-500 text-xs mt-1">{errors.lessonPackages}</p>}
        </div>

        <div>
          <PasswordField
            value={formData.password}
            onChange={(val) => {
              setFormData({ ...formData, password: val });
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            label="Password"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <div>
          <PasswordField
            value={formData.confirmPassword}
            onChange={(val) => {
              setFormData({ ...formData, confirmPassword: val });
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
            }}
            label="Confirm Password"
          />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold disabled:opacity-50 transition-opacity"
          >
            BACK
          </button>
          <button
            onClick={handleRegister}
            disabled={loading}
            className="flex-1 bg-[var(--primary-color)] text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? 'REGISTERING...' : 'REGISTER'}
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('SignupStep3 error:', error);
    return null;
  }
}