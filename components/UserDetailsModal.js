function UserDetailsModal({ user, packages, onClose, onEdit, onRefresh }) {
  try {
    const [showEditPackages, setShowEditPackages] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    const downloadProfilePicture = () => {
      const link = document.createElement('a');
      link.href = user.profilePic;
      link.download = `${user.name.replace(/\s+/g, '_')}_profile.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleSavePackages = async (newPackages) => {
      setIsSaving(true);
      try {
        if (!user.objectId) {
          alert('Invalid user data. Please refresh and try again.');
          return;
        }
        
        const userObj = await trickleGetObject('registered_user', user.objectId);
        
        if (!userObj) {
          alert('User not found in database');
          return;
        }
        
        const totalPrice = newPackages.reduce((sum, p) => sum + p.price, 0);
        
        let monthlyPayments = {};
        try {
          monthlyPayments = userObj.objectData.monthlyPayments 
            ? JSON.parse(userObj.objectData.monthlyPayments) 
            : {};
        } catch (e) {
          monthlyPayments = {};
        }

        for (let i = 1; i <= 3; i++) {
          const monthKey = `month${i}`;
          const currentMonthData = monthlyPayments[monthKey] || {};
          monthlyPayments[monthKey] = {
            price: totalPrice,
            amountPaid: currentMonthData.amountPaid || 0,
            balance: totalPrice - (currentMonthData.amountPaid || 0),
            status: currentMonthData.status || 'UNPAID'
          };
        }

        await trickleUpdateObject('registered_user', userObj.objectId, {
          ...userObj.objectData,
          lessonPackages: JSON.stringify(newPackages),
          lessonPackage: newPackages.length > 0 ? JSON.stringify(newPackages[0]) : null,
          monthlyPayments: JSON.stringify(monthlyPayments)
        });
        
        setShowEditPackages(false);
        await onRefresh();
        onClose();
      } catch (error) {
        console.error('Error saving packages:', error);
        alert('Failed to save packages: ' + error.message);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">User Details</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <div className="icon-x text-2xl"></div>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={user.profilePic} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                  <button 
                    onClick={downloadProfilePicture}
                    className="absolute bottom-0 right-0 bg-[var(--primary-color)] text-white p-2 rounded-full hover:bg-opacity-90 shadow-lg"
                    title="Download Profile Picture"
                  >
                    <div className="icon-download text-sm"></div>
                  </button>
                </div>
                <div>
                  <h4 className="text-xl font-bold">{user.name}</h4>
                  <p className="text-gray-600">{user.regNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="font-semibold">{user.course}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="font-semibold">{user.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-semibold">{user.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registered Date</p>
                  <p className="font-semibold">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Lesson Packages</p>
                {user.lessonPackages && user.lessonPackages.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    {user.lessonPackages.map((pkg, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <span className="font-medium">{packageLabel(pkg)}</span>
                        <span className="text-[var(--primary-color)]">TZS {pkg.price.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 mt-2 border-t-2">
                      <span className="font-bold">Total/Month:</span>
                      <span className="text-lg font-bold text-[var(--primary-color)]">
                        TZS {user.lessonPackages.reduce((sum, p) => sum + p.price, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : user.lessonPackage ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{user.lessonPackage.name}</span>
                      <span className="text-[var(--primary-color)]">TZS {user.lessonPackage.price.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No packages assigned</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={onEdit}
                disabled={isSaving}
                className="flex-1 bg-[var(--primary-color)] text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                EDIT
              </button>
              <button 
                onClick={() => setShowEditPackages(true)}
                disabled={isSaving}
                className="flex-1 bg-[var(--accent-color)] text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'SAVING...' : 'EDIT PACKAGE'}
              </button>
              <button 
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
        
        {showEditPackages && (
          <EditUserPackagesModal 
            user={user}
            onClose={() => setShowEditPackages(false)}
            onSave={handleSavePackages}
          />
        )}
      </>
    );
  } catch (error) {
    console.error('UserDetailsModal error:', error);
    return null;
  }
}