function ValidView({ users, onEdit, onRefresh }) {
  try {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [uploading, setUploading] = React.useState(false);
    const [uploadMessage, setUploadMessage] = React.useState('');
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [showAddForm, setShowAddForm] = React.useState(false);
    const [newUser, setNewUser] = React.useState({
      regNumber: '', name: '', course: '', year: ''
    });
    const fileInputRef = React.useRef(null);

    const handleDelete = async (objectId) => {
      if (!canManageValidUsers(JSON.parse(localStorage.getItem('currentUser')))) {
        showUnauthorizedAlert();
        return;
      }
      if (confirm('Delete this valid user?')) {
        try {
          await trickleDeleteObject('valid_user', objectId);
          onRefresh();
        } catch (error) {
          console.error('Delete error:', error);
          alert('Failed to delete user: ' + error.message);
        }
      }
    };

    const handleAdd = async () => {
      if (!canManageValidUsers(JSON.parse(localStorage.getItem('currentUser')))) {
        showUnauthorizedAlert();
        return;
      }
      const userData = {
        regNumber: newUser.regNumber || `TEMP-${Date.now()}`,
        name: newUser.name || 'Unknown User',
        course: newUser.course || 'N/A',
        year: newUser.year || 'N/A'
      };
      await addValidUser(userData);
      setNewUser({ regNumber: '', name: '', course: '', year: '' });
      setShowAddForm(false);
      onRefresh();
    };

    const handleExcelUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploading(true);
      setUploadMessage('Processing Excel file...');

      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              defval: '',
              raw: false
            });

            if (!jsonData || jsonData.length === 0) {
              setUploadMessage('Excel file is empty or could not be read');
              setUploading(false);
              return;
            }

            console.log('Excel columns found:', Object.keys(jsonData[0] || {}));
            console.log('First row sample:', jsonData[0]);

            const existingUsers = await getAllValidUsers();
            const existingRegNumbers = new Set(existingUsers.map(u => u.regNumber));

            let addedCount = 0;
            let skippedCount = 0;
            let duplicateCount = 0;
            const maxRows = Math.min(jsonData.length, 1500);
            const batchSize = 100;
            setUploadProgress(0);

            for (let i = 0; i < maxRows; i += batchSize) {
              const batch = jsonData.slice(i, Math.min(i + batchSize, maxRows));
              const batchPromises = [];

              for (const row of batch) {
                const regNumber = row.regNumber || row.RegNumber || row['Reg Number'] || row['Registration Number'] || row.REGNUMBER || row.regnumber || '';
                const name = row.name || row.Name || row['Full Name'] || row.NAME || row.FULLNAME || row.fullname || '';
                const course = row.course || row.Course || row.COURSE || '';
                const year = row.year || row.Year || row['Year of Study'] || row.YEAR || '';

                const trimmedRegNumber = String(regNumber).trim();
                const trimmedName = String(name).trim();
                const trimmedCourse = String(course).trim();
                const trimmedYear = String(year).trim();

                if (trimmedRegNumber && trimmedRegNumber !== 'undefined' && trimmedName && trimmedName !== 'undefined' && trimmedCourse && trimmedCourse !== 'undefined' && trimmedYear && trimmedYear !== 'undefined') {
                  if (existingRegNumbers.has(trimmedRegNumber)) {
                    duplicateCount++;
                  } else {
                    const userData = {
                      regNumber: trimmedRegNumber,
                      name: trimmedName,
                      course: trimmedCourse,
                      year: trimmedYear
                    };
                    batchPromises.push(addValidUser(userData));
                    existingRegNumbers.add(trimmedRegNumber);
                  }
                } else {
                  console.log('Skipped row:', { regNumber: trimmedRegNumber, name: trimmedName, course: trimmedCourse, year: trimmedYear });
                  skippedCount++;
                }
              }

              try {
                await Promise.all(batchPromises);
                addedCount += batchPromises.length;
                const totalProcessed = addedCount + duplicateCount + skippedCount;
                const progressPercent = Math.round((totalProcessed / maxRows) * 100);
                setUploadProgress(progressPercent);
                setUploadMessage(`Uploading: ${addedCount} added (${progressPercent}% complete)`);
              } catch (error) {
                console.error('Batch error:', error);
              }
            }

            setUploadProgress(100);
            if (addedCount > 0 || duplicateCount > 0 || skippedCount > 0) {
              setUploadMessage(`Complete: ${addedCount} added, ${duplicateCount} duplicates skipped, ${skippedCount} invalid rows skipped`);
              onRefresh();
            } else {
              setUploadMessage('No valid users found. Please ensure your Excel has columns: regNumber, name, course, and year with valid data');
            }
          } catch (error) {
            setUploadMessage(`Error processing Excel: ${error.message}`);
            console.error('Excel processing error:', error);
          }
          setUploading(false);
          setTimeout(() => setUploadProgress(0), 2000);
        };
        
        reader.onerror = () => {
          setUploadMessage('Error reading file. Please try again.');
          setUploading(false);
        };
        
        reader.readAsArrayBuffer(file);
      } catch (error) {
        setUploadMessage(`Error: ${error.message}`);
        setUploading(false);
        console.error('File reading error:', error);
      }

      e.target.value = '';
    };

    const splitName = (fullName) => {
      const parts = fullName.split(' ');
      return {
        firstName: parts[0] || '',
        secondName: parts[1] || '',
        lastName: parts.slice(2).join(' ') || ''
      };
    };

    const filteredUsers = users.filter(u => {
      const term = searchTerm.toLowerCase();
      return u.name.toLowerCase().includes(term) ||
             u.regNumber.toLowerCase().includes(term) ||
             u.course.toLowerCase().includes(term) ||
             u.year.toLowerCase().includes(term);
    });

    return (
      <div data-name="valid-view" data-file="components/ValidView.js">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Valid Users</h2>
          {canManageValidUsers(JSON.parse(localStorage.getItem('currentUser'))) && (
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAddForm(true)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                ADD
              </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />
            <button
              onClick={async () => {
                if (confirm(`Delete all ${users.length} valid users? This cannot be undone.`)) {
                  setUploadMessage('Deleting all users...');
                  for (const user of users) {
                    await deleteValidUser(user.objectId);
                  }
                  setUploadMessage(`Successfully deleted ${users.length} users`);
                  onRefresh();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <div className="icon-trash-2 text-lg"></div>
              <span>Delete All</span>
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <div className="icon-upload text-lg"></div>
              <span>{uploading ? 'Uploading...' : 'Upload Excel'}</span>
            </button>
            </div>
          )}
        </div>
        {uploadMessage && (
          <div className={`mb-4 p-3 rounded-lg ${uploadMessage.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span>{uploadMessage}</span>
              {uploading && <span className="font-bold">{uploadProgress}%</span>}
            </div>
            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[var(--primary-color)] h-2 rounded-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
              </div>
            )}
          </div>
        )}
        <div className="mb-4">
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Search users..." 
            className="w-full px-4 py-2 border rounded-lg" 
          />
        </div>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Reg Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">First Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Second Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Last Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Course</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Year</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const { firstName, secondName, lastName } = splitName(user.name);
                  return (
                    <tr key={user.objectId} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedUser(user)}>
                      <td className="px-6 py-4 text-sm">{user.regNumber}</td>
                      <td className="px-6 py-4 text-sm">{firstName}</td>
                      <td className="px-6 py-4 text-sm">{secondName}</td>
                      <td className="px-6 py-4 text-sm">{lastName}</td>
                      <td className="px-6 py-4 text-sm">{user.course}</td>
                      <td className="px-6 py-4 text-sm">{user.year}</td>
                      <td className="px-6 py-4">
                        {canManageValidUsers(JSON.parse(localStorage.getItem('currentUser'))) && (
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); onEdit({ ...user, type: 'valid' }); }} className="text-blue-600 hover:text-blue-800">
                              <div className="icon-edit text-lg"></div>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(user.objectId); }} className="text-red-600 hover:text-red-800">
                              <div className="icon-trash-2 text-lg"></div>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddForm(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Add Valid User</h3>
              <div className="space-y-3">
                <input value={newUser.regNumber} onChange={e => setNewUser({...newUser, regNumber: e.target.value})} placeholder="Registration Number" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Full Name" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input value={newUser.course} onChange={e => setNewUser({...newUser, course: e.target.value})} placeholder="Course" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input value={newUser.year} onChange={e => setNewUser({...newUser, year: e.target.value})} placeholder="Year of Study" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleAdd} className="flex-1 bg-[var(--primary-color)] text-white py-2 rounded-lg">ADD USER</button>
                <button onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">User Details</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Registration Number:</strong> {selectedUser.regNumber}</p>
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Course:</strong> {selectedUser.course}</p>
                <p><strong>Year:</strong> {selectedUser.year}</p>
              </div>
              <div className="flex gap-2 mt-4">
                {canManageValidUsers(JSON.parse(localStorage.getItem('currentUser'))) && (
                  <button onClick={() => { setSelectedUser(null); onEdit({ ...selectedUser, type: 'valid' }); }} className="flex-1 bg-[var(--primary-color)] text-white py-2 rounded-lg">EDIT</button>
                )}
                <button onClick={() => setSelectedUser(null)} className="flex-1 bg-gray-200 py-2 rounded-lg">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('ValidView error:', error);
    return null;
  }
}