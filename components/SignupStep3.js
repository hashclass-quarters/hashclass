function SignupStep3({ formData, setFormData, onBack, onNext, loading }) {
  try {
    const [errors, setErrors] = React.useState({});
    const year = formData.yearOfStudy;
    const multi = isMultiPackageYear(year);
    const packages = getPackagesForYear(year);
    const ownPackages = getOwnCoursePackages(year);
    const sectionTitle = packageSectionTitle(year);
    const chosen = buildSavedPackages(year, formData.lessonPackages);
    const totalPrice = chosen.reduce((sum, p) => sum + p.price, 0);
    const hasSelection = chosen.length > 0;

    // first and second year: exactly one package
    const handlePackageSelect = (pkgId) => {
      setFormData({ ...formData, lessonPackages: [pkgId] });
      if (errors.lessonPackages) setErrors({ ...errors, lessonPackages: '' });
    };

    // third year: AF318 can be switched on/off, and one carry over package can be chosen next to it
    const toggleOwn = (pkgId) => {
      const has = formData.lessonPackages.includes(pkgId);
      const rest = formData.lessonPackages.filter(id => id !== pkgId);
      setFormData({ ...formData, lessonPackages: has ? rest : rest.concat(pkgId) });
    };
    const chooseCarryOver = (pkgId) => {
      const own = formData.lessonPackages.filter(id => ownPackages.some(o => o.id === id));
      setFormData({ ...formData, lessonPackages: pkgId ? own.concat(pkgId) : own });
    };
    const carryValue = (formData.lessonPackages.find(id => packages.some(p => p.id === id))) || '';

    const handleNext = () => {
      if (!hasSelection) {
        setErrors({ lessonPackages: 'Please select a package' });
        return;
      }
      setErrors({});
      onNext();
    };

    return (
      <div className="space-y-4">
        {multi ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Lesson Package</label>
              <div className="space-y-2">
                {ownPackages.map(pkg => {
                  const on = formData.lessonPackages.includes(pkg.id);
                  return (
                    <label key={pkg.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${on ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleOwn(pkg.id)} className="w-5 h-5" />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="font-semibold">{pkg.name}</span>
                        <span className="text-sm font-medium">TZS {pkg.price.toLocaleString()}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Carry Over Courses</label>
              <CustomSelect
                icon="icon-book-open"
                value={carryValue}
                placeholder="Select a package"
                allowClear
                options={packages.map(p => ({ value: p.id, label: p.name, right: 'TZS ' + p.price.toLocaleString() }))}
                onChange={chooseCarryOver}
              />
            </div>

            <div className="rounded-xl border-2 border-gray-200 px-4 py-3 bg-gradient-to-br from-[var(--secondary-color)] to-white shadow-sm flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total per Month</span>
              <span className="text-lg font-bold text-[var(--primary-color)]">TZS {totalPrice.toLocaleString()}</span>
            </div>
            {errors.lessonPackages && <p className="text-red-500 text-xs mt-1">{errors.lessonPackages}</p>}
          </div>
        ) : (
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
        )}

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
            disabled={loading || !hasSelection}
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