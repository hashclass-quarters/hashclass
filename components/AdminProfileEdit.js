function AdminProfileEdit({ user, onClose, onSave }) {
  try {
    const [formData, setFormData] = React.useState({
      profilePic: user.profilePic,
      email: user.email,
      phone: user.phone,
      name: user.name,
      regNumber: user.regNumber,
      course: user.course,
      year: user.year
    });
    const [isEditing, setIsEditing] = React.useState(false);

    const handlePhotoUpload = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const newPhoto = reader.result;
          setFormData({ ...formData, profilePic: newPhoto });
          // Auto-save photo to database
          await onSave({ ...formData, profilePic: newPhoto });
        };
        reader.readAsDataURL(file);
      }
    };

    const handleSave = () => {
      onSave(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4">Admin Profile</h3>
          
          <div className="relative w-32 h-32 mx-auto mb-4">
            <img 
              src={formData.profilePic || 'https://via.placeholder.com/128'} 
              alt="Profile" 
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
            />
            <label className="absolute bottom-0 right-0 bg-[var(--primary-color)] text-white p-2 rounded-full cursor-pointer hover:bg-[var(--accent-color)] transition-colors">
              <div className="icon-upload text-lg"></div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Authority</p>
                <p className="font-semibold text-[var(--primary-color)]">{user.authority}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold">{formData.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-semibold">{formData.phone}</p>
              </div>
              <button 
                onClick={() => setIsEditing(true)} 
                className="w-full bg-[var(--primary-color)] text-white py-2 rounded-lg hover:bg-[var(--accent-color)] transition-colors"
              >
                EDIT
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Registration Number</label>
                <input 
                  type="text" 
                  value={formData.regNumber} 
                  onChange={e => setFormData({...formData, regNumber: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Course</label>
                <input 
                  type="text" 
                  value={formData.course} 
                  onChange={e => setFormData({...formData, course: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year of Study</label>
                <input 
                  type="text" 
                  value={formData.year} 
                  onChange={e => setFormData({...formData, year: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={handleSave} 
                  className="flex-1 bg-[var(--primary-color)] text-white py-2 rounded-lg hover:bg-[var(--accent-color)] transition-colors"
                >
                  SAVE
                </button>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
          
          {!isEditing && (
            <button 
              onClick={onClose} 
              className="w-full mt-3 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              CLOSE
            </button>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('AdminProfileEdit error:', error);
    return null;
  }
}