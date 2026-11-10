function EditUserPackagesModal({ user, onClose, onSave }) {
  try {
    const [selectedId, setSelectedId] = React.useState('');
    const [ownIds, setOwnIds] = React.useState([]);
    const [year, setYear] = React.useState(STUDY_YEARS.includes(user.year) ? user.year : 'FIRST YEAR');
    const [loading, setLoading] = React.useState(false);

    const packages = getPackagesForYear(year);

    React.useEffect(() => {
      const list = (user.lessonPackages && user.lessonPackages.length > 0) ? user.lessonPackages : (user.lessonPackage ? [user.lessonPackage] : []);
      const own = getOwnCoursePackages('THIRD YEAR').map(o => o.id);
      setOwnIds(list.filter(p => own.includes(p.id)).map(p => p.id));
      const carry = list.find(p => !own.includes(p.id));
      setSelectedId(carry ? carry.id : '');
    }, [user]);

    const multi = isMultiPackageYear(year);
    const ownPackages = getOwnCoursePackages(year);
    const chosenIds = (multi ? ownIds.filter(id => ownPackages.some(o => o.id === id)) : []).concat(selectedId ? [selectedId] : []);
    const chosen = buildSavedPackages(year, chosenIds);
    const selected = chosen.length > 0 ? chosen[0] : null;
    const totalPrice = chosen.reduce((sum, p) => sum + p.price, 0);

    const handleSave = async () => {
      if (chosen.length === 0) {
        alert('Please select a package');
        return;
      }
      setLoading(true);
      try {
        await onSave(chosen, year);
        onClose();
      } catch (error) {
        console.error('Error saving packages:', error);
        alert('Failed to save lesson package');
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-1">Edit Lesson Package</h3>
          <p className="text-sm text-gray-600 mb-3">Choose the lesson package(s) for {user.name}</p>

          <label className="block text-sm font-medium mb-1">Year of Study</label>
          <select
            value={year}
            onChange={e => { setYear(e.target.value); setSelectedId(''); setOwnIds([]); }}
            className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
          >
            {STUDY_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {multi && ownPackages.map(o => (
            <label key={o.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 mb-3">
              <input type="checkbox" checked={ownIds.includes(o.id)} onChange={() => setOwnIds(ownIds.includes(o.id) ? ownIds.filter(i => i !== o.id) : ownIds.concat(o.id))} className="w-5 h-5 accent-[var(--primary-color)]" />
              <div className="flex-1">
                <p className="font-semibold">{o.name}</p>
                <p className="text-sm text-[var(--primary-color)]">TZS {o.price.toLocaleString()}</p>
              </div>
            </label>
          ))}
          <p className="text-sm font-semibold text-gray-700 mb-2">{packageSectionTitle(year)}</p>
          {multi && (
            <label className="flex items-center gap-3 p-2 mb-2 text-sm text-gray-500 cursor-pointer">
              <input type="radio" name="editLessonPackage" checked={selectedId === ''} onChange={() => setSelectedId('')} className="w-4 h-4 accent-[var(--primary-color)]" />
              No carry over package
            </label>
          )}
          <div className="space-y-2 mb-4">
            {packages.map(pkg => (
              <label key={pkg.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio"
                  name="editLessonPackage"
                  checked={selectedId === pkg.id}
                  onChange={() => setSelectedId(pkg.id)}
                  className="w-5 h-5 accent-[var(--primary-color)]"
                />
                <div className="flex-1">
                  <p className="font-semibold">{pkg.name}</p>
                  <p className="text-sm text-[var(--primary-color)]">TZS {pkg.price.toLocaleString()}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="border-t pt-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total/Month:</span>
              <span className="text-lg font-bold text-[var(--primary-color)]">
                TZS {totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-[var(--primary-color)] text-white py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'SAVE'}
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-200 py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('EditUserPackagesModal error:', error);
    return null;
  }
}
