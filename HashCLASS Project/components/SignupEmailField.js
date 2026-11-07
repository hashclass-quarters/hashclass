function SignupEmailField({ value, onChange, error }) {
  try {
    const handleChange = (e) => {
      let input = e.target.value;
      
      if (input.includes('@')) {
        const parts = input.split('@');
        if (parts.length === 2) {
          if (!parts[1].startsWith('gmail.com')) {
            input = parts[0] + '@gmail.com';
          } else {
            input = parts[0] + '@gmail.com';
          }
        }
      }
      
      onChange(input);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Backspace' && value.includes('@gmail.com')) {
        const beforeAt = value.split('@')[0];
        if (value === beforeAt + '@gmail.com') {
          e.preventDefault();
          onChange(beforeAt);
        }
      }
    };

      return (
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
          <input
            type="email"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="example@gmail.com"
            className={`w-full px-4 py-3 rounded-lg border-2 ${error ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:border-[var(--primary-color)] transition-colors bg-white shadow-sm`}
          />
        </div>
      );
  } catch (error) {
    console.error('SignupEmailField error:', error);
    return null;
  }
}