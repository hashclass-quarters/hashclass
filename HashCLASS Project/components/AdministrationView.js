function AdministrationView({ onEdit, onRefresh }) {
  try {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [visiblePasswords, setVisiblePasswords] = React.useState({});
    const [showAddForm, setShowAddForm] = React.useState(false);
    const [admins, setAdmins] = React.useState([]);
    const [newAdmin, setNewAdmin] = React.useState({
      regNumber: '', name: '', course: '', year: '',
      email: '', phone: '', password: '', authority: ''
    });

    React.useEffect(() => {
      loadAdmins();
    }, []);

    const loadAdmins = async () => {
      const allAdmins = await getAllAdmins();
      setAdmins(allAdmins);
    };

    // Passwords are stored encrypted and can never be read back. The CEO can set a new one.
    const handleResetPassword = async (admin) => {
      if (!canManageAdmins(JSON.parse(localStorage.getItem('currentUser')))) {
        showUnauthorizedAlert();
        return;
      }
      if (!confirm('Create a new temporary password for ' + admin.name + '?')) return;
      try {
        const tmp = generateTempPassword();
        await trickleUpdateObject('admin_user', admin.objectId, { password: tmp });
        alert('New temporary password for ' + admin.name + ':\n\n' + tmp + '\n\nSend it to them now. It will not be shown again.');
      } catch (error) {
        alert('Could not reset password: ' + error.message);
      }
    };

    const generateProfilePic = (name) => {
      const firstLetter = (name || 'U').trim()[0].toUpperCase();
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
      const color = colors[firstLetter.charCodeAt(0) % colors.length];
      
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 100px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(firstLetter, 100, 100);
      
      return canvas.toDataURL('image/png');
    };

    const handleAdd = async () => {
      if (!canManageAdmins(JSON.parse(localStorage.getItem('currentUser')))) {
        showUnauthorizedAlert();
        return;
      }
      if (!newAdmin.name || !newAdmin.regNumber || !newAdmin.authority) {
        alert('Name, Registration Number, and Authority are required');
        return;
      }

      const profilePic = generateProfilePic(newAdmin.name);
      
      const adminData = {
        regNumber: newAdmin.regNumber,
        name: newAdmin.name,
        course: newAdmin.course || 'N/A',
        year: newAdmin.year || 'N/A',
        email: newAdmin.email || 'noemail@gmail.com',
        phone: newAdmin.phone || '+255000000000',
        profilePic: profilePic,
        password: newAdmin.password || '',
        authority: newAdmin.authority
      };
      
      try {
        const created = await addAdmin(adminData);
        if (created.generatedPassword) {
          alert('Admin created.\n\nTemporary password: ' + created.generatedPassword + '\n\nSend it to them now. It will not be shown again.');
        }
      } catch (error) {
        alert('Could not add admin: ' + error.message);
        return;
      }
      setNewAdmin({
        regNumber: '', name: '', course: '', year: '',
        email: '', phone: '', password: '', authority: ''
      });
      setShowAddForm(false);
      loadAdmins();
      onRefresh();
    };

    const handleDelete = async (regNumber) => {
      if (!canManageAdmins(JSON.parse(localStorage.getItem('currentUser')))) {
        showUnauthorizedAlert();
        return;
      }
      if (regNumber === 'T22-03-05223') {
        alert('Cannot delete the founder account');
        return;
      }
      if (confirm('Delete this admin?')) {
        try { await deleteAdmin(regNumber); } catch (error) { alert('Could not delete: ' + error.message); return; }
        loadAdmins();
        onRefresh();
      }
    };

    const filteredAdmins = admins.filter(a => {
      const term = searchTerm.toLowerCase();
      return a.name.toLowerCase().includes(term) ||
             a.regNumber.toLowerCase().includes(term) ||
             a.email.toLowerCase().includes(term) ||
             a.authority.toLowerCase().includes(term);
    });

    return (
      <div data-name="administration-view" data-file="components/AdministrationView.js">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Administration</h2>
          {canManageAdmins(JSON.parse(localStorage.getItem('currentUser'))) && (
            <button onClick={() => setShowAddForm(true)} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
              ADD
            </button>
          )}
        </div>
        <div className="mb-4">
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Search admins..." 
            className="w-full px-4 py-2 border rounded-lg" 
          />
        </div>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Profile</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Reg Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Password</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Authority</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.objectId} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedUser(admin)}>
                    <td className="px-6 py-4">
                      <img src={admin.profilePic} alt="Profile" className="w-10 h-10 rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-sm">{admin.regNumber}</td>
                    <td className="px-6 py-4 text-sm">{admin.name}</td>
                    <td className="px-6 py-4 text-sm">{admin.email}</td>
                    <td className="px-6 py-4 text-sm">{admin.phone}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span>••••••••</span>
                        <button onClick={(e) => { e.stopPropagation(); handleResetPassword(admin); }} className="text-xs text-[var(--primary-color)] underline">Reset</button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[var(--primary-color)]">{admin.authority}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(admin.regNumber); }} className="text-red-600 hover:text-red-800">
                          <div className="icon-trash-2 text-lg"></div>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddForm(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Add Administrator</h3>
              <div className="space-y-3">
                <input value={newAdmin.regNumber} onChange={e => setNewAdmin({...newAdmin, regNumber: e.target.value})} placeholder="Registration Number" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} placeholder="Full Name" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input value={newAdmin.course} onChange={e => setNewAdmin({...newAdmin, course: e.target.value})} placeholder="Course" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input value={newAdmin.year} onChange={e => setNewAdmin({...newAdmin, year: e.target.value})} placeholder="Year of Study" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} placeholder="Email" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input value={newAdmin.phone} onChange={e => setNewAdmin({...newAdmin, phone: e.target.value})} placeholder="Phone" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} placeholder="Password (leave blank to auto-generate)" className="w-full px-3 py-2 border rounded-lg text-sm" type="password" />
                <input value={newAdmin.authority} onChange={e => setNewAdmin({...newAdmin, authority: e.target.value})} placeholder="Authority (e.g., General Secretary)" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleAdd} className="flex-1 bg-[var(--primary-color)] text-white py-2 rounded-lg">ADD ADMIN</button>
                <button onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Admin Details</h3>
              <div className="flex items-center gap-3 mb-4">
                <img src={selectedUser.profilePic} alt="Profile" className="w-20 h-20 rounded-full" />
                <div>
                  <p className="font-bold">{selectedUser.name}</p>
                  <p className="text-sm text-gray-600">{selectedUser.regNumber}</p>
                  <p className="text-sm font-semibold text-[var(--primary-color)]">{selectedUser.authority}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Phone:</strong> {selectedUser.phone}</p>
                <p><strong>Course:</strong> {selectedUser.course}</p>
                <p><strong>Year:</strong> {selectedUser.year}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-full mt-4 bg-gray-200 py-2 rounded-lg">Close</button>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('AdministrationView error:', error);
    return null;
  }
}