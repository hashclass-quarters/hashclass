function SignupStep4({ formData, setFormData, onBack, onRegister, loading }) {
  try {
    const [errors, setErrors] = React.useState({});

    const handleRegister = () => {
      const newErrors = {};
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
        <p className="text-sm text-gray-600">Create a password for your account. You will use it with your registration number to sign in.</p>
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
    console.error('SignupStep4 error:', error);
    return null;
  }
}
