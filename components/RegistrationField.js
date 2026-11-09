function RegistrationField({ value, onChange, error, label, errorMessage }) {
  try {
    const handleKeyDown = (e) => {
      if (e.key === 'Backspace' && value.length > 0) {
        const lastChar = value[value.length - 1];
        if (lastChar === '-') {
          // Delete both the dash and the character before it
          e.preventDefault();
          onChange(value.slice(0, -2));
        }
      }
    };

    const handleChange = (e) => {
      let input = e.target.value.toUpperCase().replace(/[^T0-9-]/g, '');
      
      if (input.length === 0) {
        onChange('');
        return;
      }
      
      // Ensure first character is 'T'
      if (!input.startsWith('T')) {
        input = 'T' + input.slice(1);
      }
      
      // Remove all dashes first
      let cleaned = input.replace(/-/g, '');
      
      // Build the formatted string with immediate dash addition
      let formatted = '';
      
      if (cleaned.length <= 3) {
        formatted = cleaned;
        // Add dash immediately after completing TXX
        if (cleaned.length === 3) {
          formatted += '-';
        }
      } else if (cleaned.length <= 5) {
        formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
        // Add dash immediately after completing XX
        if (cleaned.length === 5) {
          formatted += '-';
        }
      } else {
        formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3, 5) + '-' + cleaned.slice(5, 10);
      }
      
      onChange(formatted);
    };

    return (
      <div className="space-y-1" data-name="registration-field" data-file="components/RegistrationField.js">
        <label className="block text-sm font-medium text-[var(--text-dark)]">{label}</label>
        <div className="relative">
        <div className="icon-id-card absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-[#1D3FD0] pointer-events-none"></div>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="TXX-XX-XXXXX"
          maxLength={12}
          className={`w-full pl-11 pr-4 py-3 rounded-xl bg-white bg-opacity-90 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-opacity-50`}
        />
        </div>
      </div>
    );
  } catch (error) {
    console.error('RegistrationField component error:', error);
    return null;
  }
}
