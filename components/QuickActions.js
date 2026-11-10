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
      
      let lastCount = null;
      const checkUnread = async () => {
        if (!currentUser.regNumber) return;
        try {
          const result = await trickleListObjects('chat_message', 100, false);
          const messages = (result.items || []).filter(item => !item.objectData.deleted);
          const unread = messages.filter(msg =>
            msg.objectData.userId !== currentUser.regNumber && !hasReadMessage(msg.objectData.readBy, currentUser.regNumber));
          // a sound when new unread messages arrive (not on the first check)
          if (lastCount !== null && unread.length > lastCount && window.HCSound) window.HCSound.notify();
          lastCount = unread.length;
          setUnreadCount(unread.length);
        } catch (error) {
          console.error('Error checking unread messages:', error);
        }
      };
      
      checkUnread();
      const interval = setInterval(checkUnread, 15000);
      const stopRealtime = window.chatRealtime ? window.chatRealtime.onMessage(() => setTimeout(checkUnread, 400)) : null;
      const onShow = () => { if (document.visibilityState !== 'hidden') checkUnread(); };
      document.addEventListener('visibilitychange', onShow);
      window.addEventListener('pageshow', onShow);
      return () => {
        clearInterval(interval); if (stopRealtime) stopRealtime();
        document.removeEventListener('visibilitychange', onShow);
        window.removeEventListener('pageshow', onShow);
      };
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
      { label: 'CHAT', icon: 'message-circle', blocked: false }
    ];

    return (
      <>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {actions.map(action => (
            <button 
              key={action.label} 
              onClick={() => handleAction(action)} 
              className="hc-tile px-0.5 py-2.5 flex flex-col items-center gap-1.5 relative"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ background: '#DFF5EA' }}>
                <div className={`icon-${action.icon} text-lg sm:text-xl`} style={{ color: '#1F9D6B' }}></div>
              </div>
              {action.label === 'CHAT' && unreadCount > 0 && (
                <div className="absolute -top-1 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
              <span className="text-[9px] sm:text-[11px] leading-none font-bold text-[#0F1B4D] tracking-tight">{action.label === 'ATTENDANCE' ? 'ATTEND' : action.label}</span>
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
                    const regularPackages = user.lessonPackages.filter(pkg => !pkg.carryOver);
                    const carryOverPackages = user.lessonPackages.filter(pkg => pkg.carryOver);
                    
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
                            <p className="text-sm font-semibold text-gray-600 mt-2">Carry Over Courses</p>
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
