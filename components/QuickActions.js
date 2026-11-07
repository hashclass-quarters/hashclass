function QuickActions({ onBlockedClick }) {
  try {
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [showBooking, setShowBooking] = React.useState(false);
    const [showPayment, setShowPayment] = React.useState(false);
    const [showAttendance, setShowAttendance] = React.useState(false);
    const [showPaymentDetails, setShowPaymentDetails] = React.useState(false);
    const [user, setUser] = React.useState(null);
    
    React.useEffect(() => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      setUser(currentUser);
      
      const checkUnread = async () => {
        if (!currentUser.regNumber) return;
        
        const chatOpened = localStorage.getItem('chat_opened_' + currentUser.regNumber);
        if (chatOpened) {
          setUnreadCount(0);
          return;
        }
        
        try {
          const result = await trickleListObjects('chat_message', 100, false);
          const messages = result.items.filter(item => !item.objectData.deleted);
          const unread = messages.filter(msg => {
            const readBy = msg.objectData.readBy || '';
            return msg.objectData.userId !== currentUser.regNumber && !readBy.split(',').includes(currentUser.regNumber);
          });
          setUnreadCount(unread.length);
        } catch (error) {
          console.error('Error checking unread messages:', error);
        }
      };
      
      checkUnread();
      const interval = setInterval(checkUnread, 20000);
      const stopRealtime = window.chatRealtime ? window.chatRealtime.onMessage(checkUnread) : null;
      return () => { clearInterval(interval); if (stopRealtime) stopRealtime(); };
    }, []);
    const handleCopyNumber = () => {
      navigator.clipboard.writeText('108199930');
      alert('Payment number copied!');
    };


    
    const handleAction = (action) => {
      if (action.label === 'BOOKINGS') {
        setShowBooking(true);
      } else if (action.label === 'PAYMENT') {
        setShowPayment(true);
      } else if (action.label === 'ATTENDANCE') {
        setShowAttendance(true);
      } else if (action.label === 'CHAT') {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        localStorage.setItem('chat_opened_' + currentUser.regNumber, Date.now());
        setUnreadCount(0);
        window.location.href = 'chat.html';
      } else {
        onBlockedClick();
      }
    };
    
    const actions = [
      { label: 'BOOKINGS', icon: 'calendar', blocked: false },
      { label: 'PAYMENT', icon: 'credit-card', blocked: false },
      { label: 'ATTENDANCE', icon: 'calendar-check', blocked: false },
      { label: 'GRADE', icon: 'award', blocked: true },
      { label: 'AWARDS', icon: 'trophy', blocked: true },
      { label: 'CHAT', icon: 'message-circle', blocked: false }
    ];

    return (
      <>
        <div className="grid grid-cols-3 gap-3">
          {actions.map(action => (
            <button 
              key={action.label} 
              onClick={() => handleAction(action)} 
              className="bg-white rounded-lg shadow p-4 flex flex-col items-center gap-2 hover:bg-gray-50 relative"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <div className={`icon-${action.icon} text-xl text-green-600`}></div>
              </div>
              {action.label === 'CHAT' && unreadCount > 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
              <span className="text-xs font-semibold text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
        {showBooking && user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowBooking(false)}>
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4 w-full" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <div className="icon-book-open text-3xl text-blue-600"></div>
              </div>
              <h3 className="text-xl font-bold text-center mb-4">Your Lesson Packages</h3>
              {user.lessonPackages && user.lessonPackages.length > 0 ? (
                <div className="space-y-3">
                  {(() => {
                    const firstYearPackages = ['AF121', 'ST1208', 'IT111'];
                    const regularPackages = user.lessonPackages.filter(pkg => !firstYearPackages.includes(pkg.id));
                    const carryOverPackages = user.lessonPackages.filter(pkg => firstYearPackages.includes(pkg.id));
                    
                    return (
                      <>
                        {regularPackages.map((pkg, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <p className="font-bold text-lg">{pkg.name}</p>
                              <p className="font-bold text-[var(--primary-color)]">TZS {pkg.price.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                        {carryOverPackages.length > 0 && (
                          <>
                            <p className="text-sm font-semibold text-gray-600 mt-2">Carry Over</p>
                            {carryOverPackages.map((pkg, idx) => (
                              <div key={`co-${idx}`} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                  <p className="font-bold text-lg">{pkg.name}</p>
                                  <p className="font-bold text-[var(--primary-color)]">TZS {pkg.price.toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </>
                    );
                  })()}
                  <div className="bg-[var(--primary-color)] rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-white">Total per Month</p>
                      <p className="font-bold text-xl text-white">
                        TZS {user.lessonPackages.reduce((sum, p) => sum + p.price, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : user.lessonPackage ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Package Name</p>
                    <p className="font-bold text-lg">{user.lessonPackage.name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-sm">{user.lessonPackage.description}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Price</p>
                    <p className="font-bold text-lg text-[var(--primary-color)]">TZS {user.lessonPackage.price.toLocaleString()}/month</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No lesson packages selected yet</p>
              )}
              <div className="mt-4 pt-4 border-t">

              </div>
              <button onClick={() => setShowBooking(false)} className="w-full mt-4 bg-[var(--primary-color)] text-white py-3 rounded-lg font-semibold">
                OKAY
              </button>
            </div>
          </div>
        )}
        {showPayment && user && (
          <PaymentDetailsPopup user={user} onClose={() => setShowPayment(false)} />
        )}
        {showAttendance && user && (
          <UserAttendancePopup user={user} onClose={() => setShowAttendance(false)} />
        )}
        {showPaymentDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPaymentDetails(false)}>
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4 w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-center mb-4">Lipa Namba ya TanQR</h3>
              <div className="flex justify-center mb-4">
                <img src="https://app.trickle.so/storage/public/images/usr_1877ca6910000001/ff96661b-0b33-45d8-9670-a9e8d7ca2e11.png" alt="CRDB" className="h-16" />
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">PAYMENT NUMBER</p>
                    <p className="text-lg font-bold">108199930</p>
                  </div>
                  <button onClick={handleCopyNumber} className="px-3 py-1 bg-[var(--primary-color)] text-white rounded text-xs font-semibold">
                    Copy
                  </button>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">NAME</p>
                  <p className="text-sm font-semibold">HASHIMU SHABANI HALIFA</p>
                </div>
              </div>
              <p className="text-sm text-center text-gray-700 mb-6">
                Lipia kupitia namba hiyo ya Halotel na umjulishe kiongozi kuhusu malipo yako.
              </p>
              <button onClick={() => { setShowPaymentDetails(false); setShowPayment(false); }} className="w-full bg-[var(--primary-color)] text-white py-3 rounded-lg font-semibold">
                OKAY
              </button>
            </div>
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error('QuickActions error:', error);
    return null;
  }
}
