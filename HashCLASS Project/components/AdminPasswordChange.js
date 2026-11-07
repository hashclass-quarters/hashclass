function AdminPasswordChange({ user, onClose, onPasswordChange }) {
  try {
    const [oldPassword, setOldPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showOldPassword, setShowOldPassword] = React.useState(false);
    const [showNewPassword, setShowNewPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [isSuccess, setIsSuccess] = React.useState(false);

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
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4">Change Password</h3>
          {message && <p className={`text-sm mb-3 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
          <div className="space-y-3">
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
            <button onClick={onClose} className="w-full bg-gray-200 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AdminPasswordChange error:', error);
    return null;
  }
}