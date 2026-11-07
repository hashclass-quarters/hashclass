function PasswordField({ value, onChange, error, label }) {
  try {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="space-y-1" data-name="password-field" data-file="components/PasswordField.js">
        <label className="block text-sm font-medium text-[var(--text-dark)]">{label}</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your password"
            className={`w-full px-4 py-3 pr-12 rounded-lg bg-white bg-opacity-90 border ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-opacity-50`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          >
            <div className={`icon-${showPassword ? 'eye-off' : 'eye'} text-xl`}></div>
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('PasswordField component error:', error);
    return null;
  }
}