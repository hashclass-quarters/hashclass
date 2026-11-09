function FullNameField({ value, onChange, error }) {
  try {
    const handleChange = (e) => {
      let input = e.target.value.toUpperCase();
      input = input.replace(/\s{2,}/g, ' ');
      onChange(input);
    };

    return (
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name</label>
        <div className="relative">
        <div className="icon-user absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-[#1D3FD0] pointer-events-none"></div>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          className={`w-full pl-11 pr-4 py-3 rounded-lg bg-white bg-opacity-90 border ${error ? 'border-red-500' : 'border-gray-300'} focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-opacity-50`}
          placeholder="Enter your full name"
        />
        </div>
      </div>
    );
  } catch (err) {
    console.error('FullNameField error:', err);
    return null;
  }
}
