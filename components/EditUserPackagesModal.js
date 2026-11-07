function EditUserPackagesModal({ user, onClose, onSave }) {
  try {
    const [selectedPackages, setSelectedPackages] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    const allPackages = [
      { id: 'AF121', name: 'AF121', price: 10000 },
      { id: 'ST1208', name: 'ST 1208', price: 5000 },
      { id: 'IT111', name: 'IT 111', price: 5000 },
      { id: 'AF227', name: 'AF227', price: 10000 },
      { id: 'AF223', name: 'AF223', price: 10000 }
    ];

    React.useEffect(() => {
      const userPackageIds = user.lessonPackages?.map(p => p.id) || 
                             (user.lessonPackage ? [user.lessonPackage.id] : []);
      setSelectedPackages(userPackageIds);
    }, [user]);

    const handleToggle = (pkgId) => {
      setSelectedPackages(prev => 
        prev.includes(pkgId)
          ? prev.filter(id => id !== pkgId)
          : [...prev, pkgId]
      );
    };

    const handleSave = async () => {
      setLoading(true);
      try {
        const packagesToSave = allPackages
          .filter(pkg => selectedPackages.includes(pkg.id))
          .map(pkg => ({
            id: pkg.id,
            name: pkg.name,
            price: pkg.price
          }));
        
        await onSave(packagesToSave);
        onClose();
      } catch (error) {
        console.error('Error saving packages:', error);
        alert('Failed to save lesson packages');
        setLoading(false);
      }
    };

    const totalAmount = allPackages
      .filter(pkg => selectedPackages.includes(pkg.id))
      .reduce((sum, pkg) => sum + pkg.price, 0);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4">Edit Lesson Packages</h3>
          <p className="text-sm text-gray-600 mb-4">Select packages for {user.name}</p>
          
          <div className="space-y-2 mb-4">
            {allPackages.map(pkg => (
              <label key={pkg.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input 
                  type="checkbox"
                  checked={selectedPackages.includes(pkg.id)}
                  onChange={() => handleToggle(pkg.id)}
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
                TZS {totalAmount.toLocaleString()}
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