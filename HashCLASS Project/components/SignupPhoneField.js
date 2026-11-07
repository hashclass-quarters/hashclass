function SignupPhoneField({ value, onChange, error }) {
  try {
    const handleFocus = () => {
      if (!value) {
        onChange('+255 ');
      }
    };

    const handleChange = (e) => {
      let input = e.target.value;
      
      if (!input.startsWith('+255 ')) {
        input = '+255 ';
      }
      
      const numbers = input.slice(5).replace(/\D/g, '');
      
      if (numbers.length > 0) {
        const firstDigit = numbers[0];
        if (firstDigit !== '6' && firstDigit !== '7') {
          return;
        }
      }
      
      if (numbers.length <= 9) {
        let formatted = '+255 ';
        if (numbers.length > 0) {
          formatted += numbers.slice(0, 3);
        }
        if (numbers.length > 3) {
          formatted += ' ' + numbers.slice(3, 6);
        }
        if (numbers.length > 6) {
          formatted += ' ' + numbers.slice(6, 9);
        }
        onChange(formatted);
      }
    };

      return (
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Phone Number</label>
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            placeholder="+255 XXX XXX XXX"
            maxLength={16}
            className={`w-full px-4 py-3 rounded-lg border-2 ${error ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:border-[var(--primary-color)] transition-colors bg-white shadow-sm`}
          />
        </div>
      );
  } catch (error) {
    console.error('SignupPhoneField error:', error);
    return null;
  }
}