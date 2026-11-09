function SignupStep3({ formData, setFormData, onBack, onNext, loading }) {
  try {
    const [errors, setErrors] = React.useState({});
    const packages = getPackagesForYear(formData.yearOfStudy);
    const sectionTitle = packageSectionTitle(formData.yearOfStudy);
    const selected = packages.find(p => formData.lessonPackages.includes(p.id));
    const totalPrice = selected ? selected.price : 0;

    // only one package can be chosen
    const handlePackageSelect = (pkgId) => {
      setFormData({ ...formData, lessonPackages: [pkgId] });
      if (errors.lessonPackages) setErrors({ ...errors, lessonPackages: '' });
    };

    const handleNext = () => {
      if (formData.lessonPackages.length === 0) {
        setErrors({ lessonPackages: 'Please select one package' });
        return;
      }
      setErrors({});
      onNext();
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">{sectionTitle}</label>
          <div className={`border-2 ${errors.lessonPackages ? 'border-red-500' : 'border-gray-200'} rounded-xl p-3 bg-gradient-to-br from-[var(--secondary-color)] to-white shadow-sm`}>
            {packages.length === 0 && (
              <p className="text-sm text-gray-600 p-2">Go back and choose your year of study first.</p>
            )}
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
                    type="radio"
                    name="lessonPackage"
                    checked={formData.lessonPackages.includes(pkg.id)}
                    onChange={() => handlePackageSelect(pkg.id)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-semibold">{pkg.name}</span>
                    <span className="text-sm font-medium">TZS {pkg.price.toLocaleString()}</span>
                  </div>
                </label>
              ))}
            </div>
            
            <div className="pt-3 mt-3 border-t border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total per Month</span>
                <span className="text-lg font-bold text-[var(--primary-color)]">TZS {totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
          {errors.lessonPackages && <p className="text-red-500 text-xs mt-1">{errors.lessonPackages}</p>}
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
            onClick={handleNext}
            disabled={loading}
            className="flex-1 bg-[var(--primary-color)] text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            NEXT
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('SignupStep3 error:', error);
    return null;
  }
}