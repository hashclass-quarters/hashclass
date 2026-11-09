function AccountView({ user, onClose, onPasswordChange }) {
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showOldPassword, setShowOldPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [showPasswordChange, setShowPasswordChange] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [profilePic, setProfilePic] = React.useState(user.profilePic);
  const [uploading, setUploading] = React.useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage('Photo size must be less than 5MB');
        setIsSuccess(false);
        return;
      }
      
      setUploading(true);
      setMessage('Uploading photo...');
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const newPhoto = reader.result;
          
          const stored = await trickleUpdateObject('registered_user', user.objectId, { profilePic: newPhoto });
          const newPhotoUrl = stored.objectData.profilePic;

          setProfilePic(newPhotoUrl);
          const updatedUser = { ...user, profilePic: newPhotoUrl };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          setMessage('Photo updated successfully!');
          setIsSuccess(true);
          setTimeout(() => {
            setMessage('');
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error('Photo upload error:', error);
          setMessage('Failed to upload photo');
          setIsSuccess(false);
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async () => {
    if (!oldPassword) {
      setMessage('Enter your old password');
      setIsSuccess(false);
      return;
    }
    if (newPassword.length < 6) {
      setMessage('New password must be at least 6 characters');
      setIsSuccess(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setIsSuccess(false);
      return;
    }
    try {
      await appChangePassword(oldPassword, newPassword);
    } catch (error) {
      setMessage(error.message || 'Could not change password');
      setIsSuccess(false);
      return;
    }
    setMessage('Password changed successfully');
    setIsSuccess(true);
    setTimeout(() => onClose(), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">Account Information</h3>
        {message && (
          <div className={`mb-3 p-2 rounded-lg text-sm text-center ${isSuccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <img src={profilePic} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
            <label className={`absolute bottom-0 right-0 bg-[var(--primary-color)] text-white p-1.5 rounded-full transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--accent-color)]'}`}>
              <div className="icon-upload text-sm"></div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
          <div>
            <p className="font-bold">{user.name}</p>
            <p className="text-sm text-gray-600">{user.regNumber}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm mb-6">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p><strong>Course:</strong> {user.course}</p>
          <p><strong>Year:</strong> {user.year}</p>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p className="font-semibold mb-2">Lesson Packages</p>
            {user.lessonPackages && user.lessonPackages.length > 0 ? (
              <>
                {user.lessonPackages.map((pkg, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b last:border-b-0">
                    <span className="text-sm">{packageLabel(pkg)}</span>
                    <span className="text-sm text-[var(--primary-color)]">TZS {pkg.price.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 mt-2 border-t-2">
                  <span className="font-bold">Total Price/Month:</span>
                  <span className="font-bold text-[var(--primary-color)]">
                    TZS {user.lessonPackages.reduce((sum, p) => sum + p.price, 0).toLocaleString()}
                  </span>
                </div>
              </>
            ) : user.lessonPackage ? (
              <>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm">{user.lessonPackage.name}</span>
                  <span className="text-sm text-[var(--primary-color)]">TZS {user.lessonPackage.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t-2">
                  <span className="font-bold">Total Price/Month:</span>
                  <span className="font-bold text-[var(--primary-color)]">TZS {user.lessonPackage.price.toLocaleString()}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No packages assigned</p>
            )}
            <div className="mt-3 space-y-1">
              <p className="font-semibold text-sm">Payment Status (Current Month):</p>
              {(() => {
                const currentMonth = getCurrentMonth();
                let status = 'UNPAID';
                if (currentMonth === 0) return <div className="text-xs text-gray-500">Not started yet</div>;
                if (currentMonth === 4) return <div className="text-xs text-gray-500">All months completed</div>;
                
                if (user.monthlyPayments) {
                  const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
                  const payment = payments[`month${currentMonth}`];
                  if (payment && payment.status) {
                    status = payment.status;
                  }
                }
                
                const statusColor = status === 'PAID' ? 'text-green-600' : status === 'PARTIAL' ? 'text-yellow-600' : 'text-red-600';
                return (
                  <div className="text-xs flex justify-between">
                    <span>Month {currentMonth}:</span>
                    <span className={`font-semibold ${statusColor}`}>{status}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
        {!showPasswordChange ? (
          <button onClick={() => setShowPasswordChange(true)} className="w-full bg-[var(--primary-color)] text-white py-2 rounded-lg">
            Change Password
          </button>
        ) : (
          <div className="space-y-3">
            <h4 className="font-semibold">Change Password</h4>
            {message && <p className={`text-sm ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
            <div className="relative">
              <input type={showOldPassword ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Old Password" className="w-full px-3 py-2 pr-10 border rounded-lg" />
              <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className={`icon-${showOldPassword ? 'eye-off' : 'eye'} text-lg text-gray-500`}></div>
              </button>
            </div>
            <div className="relative">
              <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="w-full px-3 py-2 pr-10 border rounded-lg" />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className={`icon-${showNewPassword ? 'eye-off' : 'eye'} text-lg text-gray-500`}></div>
              </button>
            </div>
            <div className="relative">
              <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="w-full px-3 py-2 pr-10 border rounded-lg" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className={`icon-${showConfirmPassword ? 'eye-off' : 'eye'} text-lg text-gray-500`}></div>
              </button>
            </div>
            <button onClick={handlePasswordChange} className="w-full bg-[var(--primary-color)] text-white py-2 rounded-lg">CHANGE PASSWORD</button>
          </div>
        )}
        <button onClick={onClose} className="w-full mt-3 bg-gray-200 py-2 rounded-lg">Close</button>
      </div>
    </div>
  );
}