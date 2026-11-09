function HomeView({ validUsers, registeredUsers }) {
  try {
  const [showPaidUsers, setShowPaidUsers] = React.useState(false);
  const [showPartialUsers, setShowPartialUsers] = React.useState(false);
  const [showUnpaidUsers, setShowUnpaidUsers] = React.useState(false);
  const [showCollectionDetails, setShowCollectionDetails] = React.useState(false);
  const [paidUsers, setPaidUsers] = React.useState([]);
  const [selectedPaidMonth, setSelectedPaidMonth] = React.useState(null);
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);


    const getPaymentRate = () => {
      if (registeredUsers.length === 0) return 0;
      const fullyPaid = registeredUsers.filter(user => {
        if (!user.monthlyPayments) return user.paid === true;
        const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
        for (let i = 1; i <= 3; i++) {
          const payment = payments[`month${i}`];
          if (payment && payment.status === 'PAID') return true;
        }
        return false;
      }).length;
      return ((fullyPaid / registeredUsers.length) * 100).toFixed(1);
    };

    const getUncollectedFunds = () => {
      let total = 0;
      registeredUsers.forEach(user => {
        const totalPrice = user.lessonPackages && user.lessonPackages.length > 0 
          ? user.lessonPackages.reduce((sum, p) => sum + p.price, 0)
          : (user.lessonPackage ? user.lessonPackage.price : 0);
        
        if (!user.monthlyPayments) {
          total += (totalPrice * 3) - (user.amountPaid || 0);
        } else {
          const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
          for (let i = 1; i <= 3; i++) {
            const payment = payments[`month${i}`];
            total += payment ? payment.balance : totalPrice;
          }
        }
      });
      return total;
    };

    const getTotalCollection = () => {
      let total = 0;
      registeredUsers.forEach(user => {
        if (user.monthlyPayments) {
          const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
          Object.values(payments).forEach(payment => {
            total += payment.amountPaid || 0;
          });
        } else {
          total += user.amountPaid || 0;
        }
      });
      return total;
    };

    const getPartialUsers = () => {
      return registeredUsers.filter(user => {
        if (!user.monthlyPayments) {
          return user.paymentStatus === 'PARTIAL';
        }
        const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
        
        // Check if any month is partial (but no month is fully paid)
        let hasPartial = false;
        let hasPaid = false;
        for (let i = 1; i <= 3; i++) {
          const payment = payments[`month${i}`];
          if (payment && payment.status === 'PAID') {
            hasPaid = true;
          }
          if (payment && payment.status === 'PARTIAL') {
            hasPartial = true;
          }
        }
        return hasPartial && !hasPaid;
      });
    };

    const getUnpaidUsers = () => {
      return registeredUsers.filter(user => {
        if (!user.monthlyPayments) {
          return user.paymentStatus === 'UNPAID' || !user.paid;
        }
        const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
        
        // Check if all months are unpaid
        for (let i = 1; i <= 3; i++) {
          const payment = payments[`month${i}`];
          if (payment && (payment.status === 'PAID' || payment.status === 'PARTIAL')) {
            return false;
          }
        }
        return true;
      });
    };

    const getPaidUsers = (monthNum = null) => {
      return registeredUsers.filter(user => {
        if (!user.monthlyPayments) {
          return user.paid === true;
        }
        const monthlyPayments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
        
        // Check if any month is paid
        for (let i = 1; i <= 3; i++) {
          const payment = monthlyPayments[`month${i}`];
          if (payment && payment.status === 'PAID') {
            return true;
          }
        }
        return false;
      });
    };



    React.useEffect(() => {
      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d');
        
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        chartInstance.current = new ChartJS(ctx, {
          type: 'bar',
          data: {
            labels: ['Valid Users', 'Registered Users'],
            datasets: [{
              label: 'User Count',
              data: [validUsers.length, registeredUsers.length],
              backgroundColor: ['#1D3FD0', '#3B63F0']
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } }
          }
        });
      }

      return () => {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
      };
    }, [validUsers, registeredUsers]);

    return (
      <div data-name="home-view" data-file="components/HomeView.js" className="h-[calc(100vh-80px)] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div 
            className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => { setShowCollectionDetails(true); }}
          >
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white mb-2">
                <img src="https://app.trickle.so/storage/public/images/usr_1877ca6910000001/91a05dbc-39e4-4cd6-8fbb-ec60cf3f1a5c.png" alt="CRDB" className="w-12 h-12 object-contain" />
              </div>
              <p className="text-xs text-gray-500 mb-1 text-center">Total Collection</p>
              <p className="text-xl font-bold text-[var(--text-dark)]">TZS {getTotalCollection().toLocaleString()}</p>
            </div>
          </div>
          <div 
            className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => { window.location.href = '#registered'; }}
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 mb-2">
                <div className="icon-users text-xl text-blue-600"></div>
              </div>
              <p className="text-xs text-gray-500 mb-1 text-center">Registered Users</p>
              <p className="text-2xl font-bold text-[var(--text-dark)]">{registeredUsers.length}</p>
            </div>
          </div>
          <div 
            className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => { setShowPaidUsers(true); }}
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 mb-2">
                <div className="icon-circle-check text-xl text-green-600"></div>
              </div>
              <p className="text-xs text-gray-500 mb-1 text-center">Fully Paid Users</p>
              <p className="text-2xl font-bold text-[var(--text-dark)]">{getPaidUsers().length}</p>
            </div>
          </div>
          <div 
            className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => { setShowPartialUsers(true); }}
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100 mb-2">
                <div className="icon-clock text-xl text-yellow-600"></div>
              </div>
              <p className="text-xs text-gray-500 mb-1 text-center">Partially Paid</p>
              <p className="text-2xl font-bold text-[var(--text-dark)]">{getPartialUsers().length}</p>
            </div>
          </div>
          <div 
            className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => { setShowUnpaidUsers(true); }}
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100 mb-2">
                <div className="icon-x-circle text-xl text-red-600"></div>
              </div>
              <p className="text-xs text-gray-500 mb-1 text-center">Unpaid Users</p>
              <p className="text-2xl font-bold text-[var(--text-dark)]">{getUnpaidUsers().length}</p>
            </div>
          </div>
        </div>
        <EnhancedStatsCards validUsers={validUsers} registeredUsers={registeredUsers} />
        {showPaidUsers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPaidUsers(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Fully Paid Users</h3>
              {selectedPaidMonth === null ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(monthNum => {
                    const monthUsers = registeredUsers.filter(user => {
                      if (!user.monthlyPayments) return false;
                      const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
                      return payments[`month${monthNum}`]?.status === 'PAID';
                    });
                    return (
                      <button
                        key={monthNum}
                        onClick={() => {
                          setPaidUsers(monthUsers);
                          setSelectedPaidMonth(monthNum);
                        }}
                        className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-between transition-colors"
                      >
                        <span className="font-semibold">Month {monthNum}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{monthUsers.length} paid</span>
                          <div className="icon-chevron-right text-lg"></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedPaidMonth(null)}
                    className="flex items-center gap-2 text-[var(--primary-color)] mb-3"
                  >
                    <div className="icon-arrow-left text-lg"></div>
                    <span>Back to months</span>
                  </button>
                  <h4 className="font-semibold mb-3">Month {selectedPaidMonth} - {paidUsers.length} users</h4>
                  <input
                    type="text"
                    placeholder="Search user..."
                    className="w-full p-2 border rounded-lg mb-3"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      const allMonthUsers = registeredUsers.filter(user => {
                        if (!user.monthlyPayments) return false;
                        const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
                        return payments[`month${selectedPaidMonth}`]?.status === 'PAID';
                      });
                      setPaidUsers(allMonthUsers.filter(user => 
                        user.name.toLowerCase().includes(searchTerm) || 
                        user.regNumber.toLowerCase().includes(searchTerm)
                      ));
                    }}
                  />
                  <div className="space-y-2">
                    {paidUsers.map(user => {
                      const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
                      const payment = payments[`month${selectedPaidMonth}`];
                      return (
                        <div key={user.objectId} className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                          <img src={user.profilePic} alt="Profile" className="w-10 h-10 rounded-full" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.regNumber}</p>
                            <p className="text-xs text-green-600 mt-1">Amount Paid: TZS {payment?.amountPaid?.toLocaleString() || 0}</p>
                          </div>
                        </div>
                      );
                    })}
                    {paidUsers.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No fully paid users for this month</p>
                    )}
                  </div>
                </>
              )}
              <button 
                onClick={() => { setShowPaidUsers(false); setSelectedPaidMonth(null); }} 
                className="mt-4 w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {showPartialUsers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPartialUsers(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Partially Paid Users</h3>
              {selectedPaidMonth === null ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(monthNum => {
                    const monthUsers = registeredUsers.filter(user => {
                      if (!user.monthlyPayments) return false;
                      const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
                      return payments[`month${monthNum}`]?.status === 'PARTIAL';
                    });
                    return (
                      <button
                        key={monthNum}
                        onClick={() => {
                          setPaidUsers(monthUsers);
                          setSelectedPaidMonth(monthNum);
                        }}
                        className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-between transition-colors"
                      >
                        <span className="font-semibold">Month {monthNum}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{monthUsers.length} partial</span>
                          <div className="icon-chevron-right text-lg"></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedPaidMonth(null)}
                    className="flex items-center gap-2 text-[var(--primary-color)] mb-3"
                  >
                    <div className="icon-arrow-left text-lg"></div>
                    <span>Back to months</span>
                  </button>
                  <h4 className="font-semibold mb-3">Month {selectedPaidMonth} - {paidUsers.length} users</h4>
                  <input
                    type="text"
                    placeholder="Search user..."
                    className="w-full p-2 border rounded-lg mb-3"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      const allMonthUsers = registeredUsers.filter(user => {
                        if (!user.monthlyPayments) return false;
                        const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
                        return payments[`month${selectedPaidMonth}`]?.status === 'PARTIAL';
                      });
                      setPaidUsers(allMonthUsers.filter(user => 
                        user.name.toLowerCase().includes(searchTerm) || 
                        user.regNumber.toLowerCase().includes(searchTerm)
                      ));
                    }}
                  />
                  <div className="space-y-2">
                    {paidUsers.map(user => {
                      const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
                      const payment = payments[`month${selectedPaidMonth}`];
                      const amountPaid = payment?.amountPaid || 0;
                      const totalPrice = payment?.price || 0;
                      const balance = totalPrice - amountPaid;
                      return (
                        <div key={user.objectId} className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                          <img src={user.profilePic} alt="Profile" className="w-10 h-10 rounded-full" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.regNumber}</p>
                            <p className="text-xs text-yellow-600 mt-1">Amount Paid: TZS {amountPaid.toLocaleString()}</p>
                            <p className="text-xs text-red-600">Balance: TZS {balance.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    {paidUsers.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No partially paid users for this month</p>
                    )}
                  </div>
                </>
              )}
              <button 
                onClick={() => { setShowPartialUsers(false); setSelectedPaidMonth(null); }} 
                className="mt-4 w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {showCollectionDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCollectionDetails(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Collection Details</h3>
              <div className="text-center py-8">
                <div className="text-5xl font-bold text-green-600 mb-4">
                  TZS {getTotalCollection().toLocaleString()}
                </div>
                <p className="text-gray-600">Total Collection from All Paid Users</p>
              </div>
              <button 
                onClick={() => setShowCollectionDetails(false)} 
                className="mt-4 w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {showUnpaidUsers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUnpaidUsers(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Unpaid Users</h3>
              {selectedPaidMonth === null ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(monthNum => {
                    const monthUsers = registeredUsers.filter(user => {
                      if (!user.monthlyPayments) return true;
                      const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
                      const payment = payments[`month${monthNum}`];
                      return !payment || payment.status === 'UNPAID';
                    });
                    return (
                      <button
                        key={monthNum}
                        onClick={() => {
                          setPaidUsers(monthUsers);
                          setSelectedPaidMonth(monthNum);
                        }}
                        className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-between transition-colors"
                      >
                        <span className="font-semibold">Month {monthNum}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{monthUsers.length} unpaid</span>
                          <div className="icon-chevron-right text-lg"></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedPaidMonth(null)}
                    className="flex items-center gap-2 text-[var(--primary-color)] mb-3"
                  >
                    <div className="icon-arrow-left text-lg"></div>
                    <span>Back to months</span>
                  </button>
                  <h4 className="font-semibold mb-3">Month {selectedPaidMonth} - {paidUsers.length} users</h4>
                  <input
                    type="text"
                    placeholder="Search user..."
                    className="w-full p-2 border rounded-lg mb-3"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      const allMonthUsers = registeredUsers.filter(user => {
                        if (!user.monthlyPayments) return true;
                        const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
                        const payment = payments[`month${selectedPaidMonth}`];
                        return !payment || payment.status === 'UNPAID';
                      });
                      setPaidUsers(allMonthUsers.filter(user => 
                        user.name.toLowerCase().includes(searchTerm) || 
                        user.regNumber.toLowerCase().includes(searchTerm)
                      ));
                    }}
                  />
                  <div className="space-y-2">
                    {paidUsers.map(user => {
                      const totalPrice = user.lessonPackages && user.lessonPackages.length > 0 
                        ? user.lessonPackages.reduce((sum, p) => sum + p.price, 0)
                        : (user.lessonPackage ? user.lessonPackage.price : 0);
                      const payments = user.monthlyPayments ? (typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments) : {};
                      const payment = payments[`month${selectedPaidMonth}`];
                      const amountPaid = payment?.amountPaid || 0;
                      const balance = totalPrice - amountPaid;
                      return (
                        <div key={user.objectId} className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                          <img src={user.profilePic} alt="Profile" className="w-10 h-10 rounded-full" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.regNumber}</p>
                            <p className="text-xs text-red-600 mt-1">Balance: TZS {balance.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    {paidUsers.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No unpaid users for this month</p>
                    )}
                  </div>
                </>
              )}
              <button 
                onClick={() => { setShowUnpaidUsers(false); setSelectedPaidMonth(null); }} 
                className="mt-4 w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('HomeView error:', error);
    return null;
  }
}