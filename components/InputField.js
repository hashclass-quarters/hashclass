function InputField({ value, onChange, error, label, placeholder = '' }) {
  try {
    return (
      <div className="space-y-1" data-name="input-field" data-file="components/InputField.js">
        <label className="block text-sm font-medium text-[var(--text-dark)]">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-lg border ${
            error ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]`}
        />
      </div>
    );
  } catch (error) {
    console.error('InputField component error:', error);
    return null;
  }
}