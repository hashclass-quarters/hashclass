function EditModal({ user, onClose, onSave }) {
  try {
    const [formData, setFormData] = React.useState({
      regNumber: user.regNumber || '',
      name: user.name || '',
      course: user.course || '',
      year: user.year || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      profilePic: user.profilePic || ''
    });
    const [showPassword, setShowPassword] = React.useState(false);

    const handleSave = async () => {
      try {
        if (user.type === 'valid') {
          await trickleUpdateObject('valid_user', user.objectId, {
            name: formData.name, course: formData.course, year: formData.year
          });
        } else {
          const patch = {
            name: formData.name, course: formData.course, year: formData.year,
            email: formData.email, phone: formData.phone
          };
          if (formData.password) patch.password = formData.password; // blank = keep current
          await trickleUpdateObject('registered_user', user.objectId, patch);
        }
        onSave();
        onClose();
      } catch (error) {
        alert('Could not save: ' + error.message);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-name="edit-modal" data-file="components/EditModal.js">
        <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4">Edit User</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Registration Number</label>
              <input type="text" value={formData.regNumber} onChange={(e) => setFormData({...formData, regNumber: e.target.value})} className="w-full px-3 py-2 border rounded-lg" disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Course</label>
              <input type="text" value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <input type="text" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            {user.type === 'registered' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New Password (leave blank to keep current)</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg pr-10" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      <div className={`icon-${showPassword ? 'eye-off' : 'eye'} text-lg`}></div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} className="flex-1 bg-[var(--primary-color)] text-white py-2 rounded-lg">Save</button>
            <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('EditModal error:', error);
    return null;
  }
}