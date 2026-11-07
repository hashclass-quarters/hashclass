function AdminProfilePopup({ admin, onClose, onChangePassword }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[var(--text-dark)]">Admin Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <div className="icon-x text-xl"></div>
          </button>
        </div>
        
        <div className="flex flex-col items-center mb-6">
          <img 
            src={admin.profilePic || 'https://via.placeholder.com/100'} 
            alt="Admin" 
            className="w-24 h-24 rounded-full object-cover mb-4"
          />
          <h4 className="text-lg font-semibold text-[var(--text-dark)]">{admin.name}</h4>
          <p className="text-sm text-[var(--text-light)]">{admin.regNumber}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="icon-mail text-lg text-[var(--primary-color)]"></div>
            <span className="text-sm text-[var(--text-dark)]">{admin.email}</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="icon-phone text-lg text-[var(--primary-color)]"></div>
            <span className="text-sm text-[var(--text-dark)]">{admin.phone}</span>
          </div>
        </div>

        <button
          onClick={onChangePassword}
          className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary-color)] text-white rounded-lg hover:opacity-90"
        >
          <div className="icon-lock text-lg"></div>
          <span>Change Password</span>
        </button>
      </div>
    </div>
  );
}