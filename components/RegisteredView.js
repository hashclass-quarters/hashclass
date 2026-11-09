function RegisteredView({ users, onEdit, onRefresh }) {
  try {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [visiblePasswords, setVisiblePasswords] = React.useState({});
    const [showAddForm, setShowAddForm] = React.useState(false);
    const [packages, setPackages] = React.useState([]);
    const [showPaymentPopup, setShowPaymentPopup] = React.useState(false);
    const [paymentUser, setPaymentUser] = React.useState(null);
    const [amountPaid, setAmountPaid] = React.useState('');
    const [recordingPayment, setRecordingPayment] = React.useState(false);
    const [showCancelPaymentPopup, setShowCancelPaymentPopup] = React.useState(false);
    const [cancelPaymentData, setCancelPaymentData] = React.useState(null);
    const [alert, setAlert] = React.useState(null);
    const [confirmDialog, setConfirmDialog] = React.useState(null);
    const [showFinancialStatement, setShowFinancialStatement] = React.useState(null);
    const [newUser, setNewUser] = React.useState({
      regNumber: '', name: '', course: '', year: '',
      email: '', phone: '', password: '', lessonPackageId: ''
    });


    // Passwords are stored encrypted and can never be read back; an admin can set a new one.
    const handleResetPassword = async (user) => {
      if (!canManageRegisteredUsers(JSON.parse(localStorage.getItem('currentUser')))) {
        showUnauthorizedAlert();
        return;
      }
      if (!confirm('Create a new temporary password for ' + user.name + '?')) return;
      try {
        const tmp = generateTempPassword();
        await trickleUpdateObject('registered_user', user.objectId, { password: tmp });
        setAlert({ message: 'New temporary password for ' + user.name + ': ' + tmp + '  (send it to them now; it will not be shown again)', type: 'success' });
      } catch (error) {
        setAlert({ message: 'Could not reset password: ' + error.message, type: 'error' });
      }
    };

    const handleDelete = async (objectId) => {
      if (!canManageRegisteredUsers(JSON.parse(localStorage.getItem('currentUser')))) {
        showUnauthorizedAlert();
        return;
      }
      setConfirmDialog({
        message: 'Are you sure you want to delete this registered user? Their package slot will be released.',
        onConfirm: async () => {
          try {
            await trickleDeleteObject('registered_user', objectId);
            
            setConfirmDialog(null);
            setAlert({ message: 'User deleted successfully!', type: 'success' });
            setTimeout(() => {
              onRefresh();
            }, 500);
          } catch (error) {
            console.error('Delete error:', error);
            setAlert({ message: 'Failed to delete user: ' + error.message, type: 'error' });
            setConfirmDialog(null);
          }
        },
        onCancel: () => setConfirmDialog(null)
      });
    };

    const generateProfilePic = (name) => {
      const firstLetter = (name || 'U').trim()[0].toUpperCase();
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      const colors = ['#1D3FD0', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#1D3FD0'];
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

    const handleCancelPayment = async () => {
      if (!cancelPaymentData) return;
      
      try {
        if (!cancelPaymentData.user.objectId) {
          alert('Invalid user data. Please refresh the page.');
          return;
        }
        
        const userObj = await trickleGetObject('registered_user', cancelPaymentData.user.objectId);
        
        if (userObj) {
          const monthNum = cancelPaymentData.monthNum;
          const monthlyPayments = userObj.objectData.monthlyPayments ? JSON.parse(userObj.objectData.monthlyPayments) : {};
          
          const totalPrice = cancelPaymentData.user.lessonPackages && cancelPaymentData.user.lessonPackages.length > 0 
            ? cancelPaymentData.user.lessonPackages.reduce((sum, p) => sum + p.price, 0)
            : (cancelPaymentData.user.lessonPackage ? cancelPaymentData.user.lessonPackage.price : 0);
          
          monthlyPayments[`month${monthNum}`] = {
            price: totalPrice,
            amountPaid: 0,
            balance: totalPrice,
            status: 'UNPAID'
          };
          
          let legacyAmountPaid = userObj.objectData.amountPaid || 0;
          let legacyStatus = userObj.objectData.paymentStatus || 'UNPAID';
          let legacyPaid = userObj.objectData.paid || false;
          
          if (monthNum === 1) {
            legacyAmountPaid = 0;
            legacyStatus = 'UNPAID';
            legacyPaid = false;
          }
          
          await trickleUpdateObject('registered_user', userObj.objectId, {
            ...userObj.objectData,
            monthlyPayments: JSON.stringify(monthlyPayments),
            amountPaid: legacyAmountPaid,
            paid: legacyPaid,
            paymentStatus: legacyStatus
          });
          
          setShowCancelPaymentPopup(false);
          setCancelPaymentData(null);
          onRefresh();
        }
      } catch (error) {
        console.error('Cancel payment error:', error);
        alert('Failed to cancel payment. Please try again.');
      }
    };

    const handlePayment = async () => {
      if (!paymentUser || !amountPaid) {
        alert('Please enter amount paid');
        return;
      }
      
      const amount = parseFloat(amountPaid);
      const totalPrice = paymentUser.totalMonthlyPrice || 0;
      
      if (amount <= 0 || isNaN(amount)) {
        alert('Please enter a valid amount');
        return;
      }
      
      if (amount > totalPrice) {
        alert('Amount paid cannot exceed the total price');
        return;
      }
      
      setRecordingPayment(true);
      
      try {
        if (!paymentUser.objectId) {
          alert('Invalid user data. Please refresh the page.');
          setRecordingPayment(false);
          return;
        }
        
        const userObj = await Promise.race([
          trickleGetObject('registered_user', paymentUser.objectId),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 15000))
        ]);
        
        if (!userObj) {
          alert('User not found in database');
          setRecordingPayment(false);
          return;
        }
        
        const monthNum = paymentUser.selectedMonth || 1;
        let monthlyPayments = {};
        
        try {
          monthlyPayments = userObj.objectData.monthlyPayments ? JSON.parse(userObj.objectData.monthlyPayments) : {};
        } catch (e) {
          monthlyPayments = {};
        }
        
        const currentMonthPayment = monthlyPayments[`month${monthNum}`] || {
          price: totalPrice,
          amountPaid: 0,
          balance: totalPrice,
          status: 'UNPAID'
        };
        
        const newAmountPaid = currentMonthPayment.amountPaid + amount;
        const newBalance = totalPrice - newAmountPaid;
        const isPaid = newAmountPaid >= totalPrice;
        const isPartial = newAmountPaid > 0 && newAmountPaid < totalPrice;
        
        monthlyPayments[`month${monthNum}`] = {
          price: totalPrice,
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: isPaid ? 'PAID' : (isPartial ? 'PARTIAL' : 'UNPAID')
        };
        
        const updateData = {
          ...userObj.objectData,
          monthlyPayments: JSON.stringify(monthlyPayments)
        };
        
        if (monthNum === 1) {
          updateData.amountPaid = newAmountPaid;
          updateData.paid = isPaid;
          updateData.paymentStatus = monthlyPayments[`month${monthNum}`].status;
        }
        
        await trickleUpdateObject('registered_user', userObj.objectId, updateData);
        
        setShowPaymentPopup(false);
        setPaymentUser(null);
        setAmountPaid('');
        setRecordingPayment(false);
        setAlert({ message: 'Payment recorded successfully!', type: 'success' });
        onRefresh();
      } catch (error) {
        console.error('Payment recording error:', error);
        setAlert({ message: 'Failed to record payment: ' + error.message, type: 'error' });
        setRecordingPayment(false);
      }
    };

    const handleAdd = async () => {
      if (!canManageRegisteredUsers(JSON.parse(localStorage.getItem('currentUser')))) {
        showUnauthorizedAlert();
        return;
      }
      if (!newUser.name || !newUser.regNumber) {
        setAlert({ message: 'Name and Registration Number are required', type: 'error' });
        return;
      }

      let selectedPackage = null;
      if (newUser.lessonPackageId) {
        const pkg = getPackagesForYear(newUser.year).find(p => p.id === newUser.lessonPackageId);
        if (pkg) {
          selectedPackage = { id: pkg.id, name: pkg.name, price: pkg.price };
          if (pkg.carryOver) selectedPackage.carryOver = true;
        }
      }

      const profilePic = generateProfilePic(newUser.name);
      
      const userData = {
        regNumber: newUser.regNumber || `TEMP-${Date.now()}`,
        name: newUser.name || 'Unknown User',
        course: newUser.course || 'N/A',
        year: newUser.year || 'N/A',
        email: newUser.email || 'noemail@gmail.com',
        phone: newUser.phone || '+255000000000',
        profilePic: profilePic,
        password: newUser.password || '',
        lessonPackage: selectedPackage,
        paid: false
      };
      let created;
      try {
        created = await addRegisteredUser(userData);
      } catch (error) {
        setAlert({ message: 'Could not add user: ' + error.message, type: 'error' });
        return;
      }
      if (created && created.generatedPassword) {
        setAlert({ message: 'User added. Temporary password: ' + created.generatedPassword + '  (send it to them now; it will not be shown again)', type: 'success' });
      }
      setNewUser({
        regNumber: '', name: '', course: '', year: '',
        email: '', phone: '', password: '', lessonPackageId: ''
      });
      setShowAddForm(false);
      onRefresh();
    };

    const handleDownloadExcel = () => {
      try {
        const excelData = users.map(user => {
          const nameParts = (user.name || '').trim().split(/\s+/);
          const firstName = nameParts.length > 0 ? nameParts[0] : '';
          const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

          return {
            'FIRST NAME': firstName,
            'LAST NAME': lastName,
            'PHONE NUMBER': user.phone || ''
          };
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registered Users");
        XLSX.writeFile(workbook, `HashCLASS_Registered_Users_${new Date().toISOString().split('T')[0]}.xlsx`);
      } catch (error) {
        console.error('Excel download error:', error);
        setAlert({ message: 'Failed to download Excel file', type: 'error' });
      }
    };

    const filteredUsers = users.filter(u => {
      const term = searchTerm.toLowerCase();
      return u.name.toLowerCase().includes(term) ||
             u.regNumber.toLowerCase().includes(term) ||
             u.email.toLowerCase().includes(term) ||
             u.phone.toLowerCase().includes(term) ||
             u.course.toLowerCase().includes(term) ||
             u.year.toLowerCase().includes(term);
    });

    return (
      <div data-name="registered-view" data-file="components/RegisteredView.js">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Registered Users</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadExcel} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
            >
              <div className="icon-download text-lg"></div>
              DOWNLOAD EXCEL
            </button>
            {canManageRegisteredUsers(JSON.parse(localStorage.getItem('currentUser'))) && (
              <button onClick={() => setShowAddForm(true)} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                ADD
              </button>
            )}
          </div>
        </div>
        <div className="mb-4">
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Search users..." 
            className="w-full px-4 py-2 border rounded-lg" 
          />
        </div>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto" style={{ overflowX: 'scroll' }}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Profile</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Reg Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Full Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Course</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Year of Study</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Password</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Lesson Package</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.objectId} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedUser({...user, objectId: user.objectId})}>
                    <td className="px-6 py-4">
                      <img src={user.profilePic} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                    </td>
                    <td className="px-6 py-4 text-sm">{user.regNumber}</td>
                    <td className="px-6 py-4 text-sm">{user.name}</td>
                    <td className="px-6 py-4 text-sm">{user.course}</td>
                    <td className="px-6 py-4 text-sm">{user.year}</td>
                    <td className="px-6 py-4 text-sm">{user.email}</td>
                    <td className="px-6 py-4 text-sm">{user.phone}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span>••••••••</span>
                        <button onClick={(e) => { e.stopPropagation(); handleResetPassword(user); }} className="text-xs text-[var(--primary-color)] underline">Reset</button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                      {user.lessonPackages && user.lessonPackages.length > 0 ? (
                        <div>
                          <div className="space-y-1 mb-2">
                            {user.lessonPackages.map((pkg, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="font-medium">{pkg.name}</span>
                                <span className="text-gray-600">TZS {(pkg.price || 0).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t pt-1 mt-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold">Total/Month:</span>
                              <span className="text-xs font-bold text-[var(--primary-color)]">
                                TZS {user.lessonPackages.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Paid: TZS {(user.amountPaid || 0).toLocaleString()}</p>
                          <p className={`text-xs font-semibold mt-1 ${
                            user.paymentStatus === 'PAID' || user.paid ? 'text-green-600' :
                            user.paymentStatus === 'PARTIAL' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {user.paymentStatus || (user.paid ? 'PAID' : 'UNPAID')}
                          </p>
                        </div>
                      ) : user.lessonPackage ? (
                        <div>
                          <p className="font-semibold">{user.lessonPackage.name}</p>
                          <p className="text-xs text-gray-500">{user.lessonPackage.description}</p>
                          <p className="text-xs text-[var(--primary-color)]">TZS {(user.lessonPackage.price || 0).toLocaleString()}/month</p>
                          <p className="text-xs text-gray-600 mt-1">Paid: TZS {(user.amountPaid || 0).toLocaleString()}</p>
                          <p className={`text-xs font-semibold mt-1 ${
                            user.paymentStatus === 'PAID' || user.paid ? 'text-green-600' :
                            user.paymentStatus === 'PARTIAL' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {user.paymentStatus || (user.paid ? 'PAID' : 'UNPAID')}
                          </p>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {[1, 2, 3].map(monthNum => {
                          const monthPayment = user.monthlyPayments?.[`month${monthNum}`];
                          const storedStatus = monthPayment?.status || (monthNum === 1 ? (user.paymentStatus || (user.paid ? 'PAID' : 'UNPAID')) : 'UNPAID');
                          const status = effectiveMonthStatus(monthNum, storedStatus);
                          return (
                            <button 
                              key={monthNum}
                              title={getMonthDateRange(monthNum)}
                              onClick={(e) => { 
                                e.stopPropagation();
                                if (storedStatus === 'PAID') {
                                  setCancelPaymentData({ user, monthNum });
                                  setShowCancelPaymentPopup(true);
                                } else {
                                  const totalPrice = user.lessonPackages && user.lessonPackages.length > 0 
                                    ? user.lessonPackages.reduce((sum, p) => sum + p.price, 0)
                                    : (user.lessonPackage ? user.lessonPackage.price : 0);
                                  setPaymentUser({...user, selectedMonth: monthNum, totalMonthlyPrice: totalPrice});
                                  setShowPaymentPopup(true);
                                }
                              }}
                              className={`px-3 py-1 rounded text-xs font-semibold ${
                                status === 'PAID' ? 'bg-green-600 text-white' :
                                status === 'PARTIAL' ? 'bg-yellow-500 text-white' :
                                status === 'UNPAID' ? 'bg-red-100 text-red-700' :
                                'bg-gray-200 text-gray-600'
                              }`}
                            >
                              M{monthNum}: {status}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 items-center mt-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowFinancialStatement(user); }} 
                          className="text-green-600 hover:text-green-800"
                          title="Financial Statement"
                        >
                          <div className="icon-file-text text-lg"></div>
                        </button>
                        {canManageRegisteredUsers(JSON.parse(localStorage.getItem('currentUser'))) && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onEdit({ ...user, type: 'registered' }); }} 
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <div className="icon-edit text-lg"></div>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(user.objectId); }} 
                              className="text-red-600 hover:text-red-800"
                            >
                              <div className="icon-trash-2 text-lg"></div>
                            </button>
                          </>
                        )}
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
              <h3 className="text-xl font-bold mb-4">Add Registered User</h3>
              <div className="space-y-3">
                <input value={newUser.regNumber} onChange={e => setNewUser({...newUser, regNumber: e.target.value})} placeholder="Registration Number" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Full Name" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input value={newUser.course} onChange={e => setNewUser({...newUser, course: e.target.value})} placeholder="Course" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <select value={newUser.year} onChange={e => setNewUser({...newUser, year: e.target.value, lessonPackageId: ''})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select Year of Study</option>
                  {STUDY_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="Email" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} placeholder="Phone" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Password" className="w-full px-3 py-2 border rounded-lg text-sm" type="password" />
                <div>
                  <label className="block text-sm font-medium mb-1">{packageSectionTitle(newUser.year)}</label>
                  <select 
                    value={newUser.lessonPackageId} 
                    onChange={e => setNewUser({...newUser, lessonPackageId: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">{newUser.year ? 'Select a package' : 'Select the year of study first'}</option>
                    {getPackagesForYear(newUser.year).map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - TZS {pkg.price.toLocaleString()}/month
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleAdd} className="flex-1 bg-[var(--primary-color)] text-white py-2 rounded-lg">ADD USER</button>
                <button onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}
        {showPaymentPopup && paymentUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPaymentPopup(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Payment Processing - Month {paymentUser.selectedMonth || 1}</h3>
              <div className="space-y-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Student Name</p>
                  <p className="font-semibold">{paymentUser.name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Package(s)</p>
                  {paymentUser.lessonPackages && paymentUser.lessonPackages.length > 0 ? (
                    <div className="space-y-1">
                      {paymentUser.lessonPackages.map((pkg, idx) => (
                        <p key={idx} className="font-semibold text-sm">{pkg.name}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="font-semibold">{paymentUser.lessonPackage?.name || 'N/A'}</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Total Price</p>
                  <p className="font-semibold text-[var(--primary-color)]">TZS {(paymentUser.totalMonthlyPrice || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Amount Already Paid (This Month)</p>
                  <p className="font-semibold">TZS {(paymentUser.monthlyPayments?.[`month${paymentUser.selectedMonth || 1}`]?.amountPaid || (paymentUser.selectedMonth === 1 ? paymentUser.amountPaid : 0) || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Remaining Balance (This Month)</p>
                  <p className="font-semibold text-red-600">TZS {((paymentUser.totalMonthlyPrice || 0) - (paymentUser.monthlyPayments?.[`month${paymentUser.selectedMonth || 1}`]?.amountPaid || (paymentUser.selectedMonth === 1 ? paymentUser.amountPaid : 0) || 0)).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Enter Amount Paid</label>
                  <input 
                    type="number" 
                    value={amountPaid} 
                    onChange={e => setAmountPaid(e.target.value)}
                    placeholder="Enter amount in TZS"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handlePayment} 
                  disabled={recordingPayment}
                  className="flex-1 bg-[var(--primary-color)] text-white py-2 rounded-lg hover:bg-[var(--accent-color)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {recordingPayment ? 'RECORDING...' : 'RECORD'}
                </button>
                <button 
                  onClick={() => { setShowPaymentPopup(false); setAmountPaid(''); setRecordingPayment(false); }} 
                  className="flex-1 bg-gray-200 py-2 rounded-lg"
                  disabled={recordingPayment}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {showCancelPaymentPopup && cancelPaymentData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCancelPaymentPopup(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4 text-center">Cancel Payment</h3>
              <p className="text-center mb-6">Do you want to cancel this month's payment and mark Month {cancelPaymentData.monthNum} as UNPAID?</p>
              <div className="flex gap-2">
                <button 
                  onClick={handleCancelPayment}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                >
                  CONFIRM
                </button>
                <button 
                  onClick={() => { setShowCancelPaymentPopup(false); setCancelPaymentData(null); }}
                  className="flex-1 bg-gray-200 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {alert && <AlertPopup message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
        {confirmDialog && <ConfirmDialog {...confirmDialog} />}
        {showFinancialStatement && <FinancialStatement user={showFinancialStatement} onClose={() => setShowFinancialStatement(null)} />}
        {selectedUser && (
          <UserDetailsModal 
            user={selectedUser} 
            packages={packages}
            onClose={() => setSelectedUser(null)} 
            onEdit={(user) => { setSelectedUser(null); onEdit({ ...user, type: 'registered' }); }}
            onRefresh={onRefresh}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('RegisteredView error:', error);
    return null;
  }
}