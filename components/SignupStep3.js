function SignupStep3({ formData, setFormData, onBack, onNext, loading }) {
  try {
    const [errors, setErrors] = React.useState({});
    const year = formData.yearOfStudy;
    const hasCarry = isMultiPackageYear(year);
    const checkbox = ownCoursesAreCheckbox(year);
    const ownPackages = getOwnCoursePackages(year);
    const carryPackages = getCarryOverPackages(year);
    const chosen = buildSavedPackages(year, formData.lessonPackages);
    const totalPrice = chosen.reduce((sum, p) => sum + p.price, 0);
    const hasSelection = chosen.length > 0;
    const ids = formData.lessonPackages;
    const ownIds = ids.filter(id => ownPackages.some(o => o.id === id));
    const clearError = () => { if (errors.lessonPackages) setErrors({ ...errors, lessonPackages: '' }); };

    // own course(s): first and second year pick one (tap again to un-pick it), third year ticks AF318
    const toggleOwn = (pkgId) => {
      const carry = ids.filter(id => !ownPackages.some(o => o.id === id));
      const has = ids.includes(pkgId);
      let nextOwn;
      if (checkbox) nextOwn = has ? ownIds.filter(id => id !== pkgId) : ownIds.concat(pkgId);
      else nextOwn = has && hasCarry ? [] : [pkgId];
      setFormData({ ...formData, lessonPackages: nextOwn.concat(carry) });
      clearError();
    };
    const chooseCarryOver = (pkgId) => {
      setFormData({ ...formData, lessonPackages: pkgId ? ownIds.concat(pkgId) : ownIds });
      clearError();
    };
    const carryValue = ids.find(id => carryPackages.some(p => p.id === id)) || '';

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
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Lesson Package</label>
          {ownPackages.length === 0 && (
            <p className="text-sm text-gray-600 p-2">Go back and choose your year of study first.</p>
          )}
          {checkbox ? (
            <div className="space-y-2">
              {ownPackages.map(pkg => {
                const on = ids.includes(pkg.id);
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
          ) : (
            <div className={`border-2 ${errors.lessonPackages && !hasCarry ? 'border-red-500' : 'border-gray-200'} rounded-xl p-3 bg-gradient-to-br from-[var(--secondary-color)] to-white shadow-sm`}>
              <div className="space-y-2">
                {ownPackages.map(pkg => {
                  const on = ids.includes(pkg.id);
                  return (
                    <label key={pkg.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${on ? 'bg-[var(--primary-color)] text-white shadow-md' : 'bg-white hover:bg-gray-50'}`}>
                      <input type="radio" name="lessonPackage" checked={on} onChange={() => {}} onClick={() => toggleOwn(pkg.id)} className="w-5 h-5" />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="font-semibold">{pkg.name}</span>
                        <span className="text-sm font-medium">TZS {pkg.price.toLocaleString()}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
              {!hasCarry && (
                <div className="pt-3 mt-3 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total per Month</span>
                    <span className="text-lg font-bold text-[var(--primary-color)]">TZS {totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {hasCarry && (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Carry Over Courses</label>
            <CustomSelect
              icon="icon-book-open"
              value={carryValue}
              placeholder="Select a package"
              allowClear
              options={carryPackages.map(p => ({ value: p.id, label: p.name, right: 'TZS ' + p.price.toLocaleString() }))}
              onChange={chooseCarryOver}
            />
          </div>
        )}

        {hasCarry && (
          <div className="rounded-xl border-2 border-gray-200 px-4 py-3 bg-gradient-to-br from-[var(--secondary-color)] to-white shadow-sm flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total per Month</span>
            <span className="text-lg font-bold text-[var(--primary-color)]">TZS {totalPrice.toLocaleString()}</span>
          </div>
        )}
        {errors.lessonPackages && <p className="text-red-500 text-xs mt-1">{errors.lessonPackages}</p>}

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