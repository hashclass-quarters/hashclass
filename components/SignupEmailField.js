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
          <div className="relative">
          <div className="icon-mail absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-[#1D3FD0] pointer-events-none"></div>
          <input
            type="email"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="example@gmail.com"
            className={`w-full pl-11 pr-4 py-3 rounded-lg border-2 ${error ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:border-[var(--primary-color)] transition-colors bg-white shadow-sm`}
          />
          </div>
        </div>
      );
  } catch (error) {
    console.error('SignupEmailField error:', error);
    return null;
  }
}