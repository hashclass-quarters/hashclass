function EmailField({ value, onChange, error }) {
  try {
    const handleChange = (e) => {
      let input = e.target.value;
      
      if (input.includes('@') && !input.includes('@gmail.com')) {
        const parts = input.split('@');
        if (parts.length === 2 && parts[1].length === 0) {
          input = parts[0] + '@gmail.com';
        }
      }
      
      onChange(input);
    };

    return (
      <div className="space-y-1" data-name="email-field" data-file="components/EmailField.js">
        <label className="block text-sm font-medium text-[var(--text-dark)]">Email</label>
        <input
          type="email"
          value={value}
          onChange={handleChange}
          placeholder="example@gmail.com"
          className={`w-full px-4 py-3 rounded-lg border ${
            error ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]`}
        />
      </div>
    );
  } catch (error) {
    console.error('EmailField component error:', error);
    return null;
  }
}