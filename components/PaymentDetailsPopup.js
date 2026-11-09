function PaymentDetailsPopup({ user, onClose }) {
  const [expandedMonth, setExpandedMonth] = React.useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = React.useState(false);
  const [copied, setCopied] = React.useState(false);


  const handleCopyNumber = () => {
    navigator.clipboard.writeText('140576405');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTotalPrice = () => {
    if (user.lessonPackages && Array.isArray(user.lessonPackages) && user.lessonPackages.length > 0) {
      return user.lessonPackages.reduce((sum, pkg) => sum + (pkg.price || 0), 0);
    }
    if (user.lessonPackage && user.lessonPackage.price) {
      return user.lessonPackage.price;
    }
    return 0;
  };

  // current month if it is not fully paid, otherwise the next unpaid month
  const getMonthToPay = () => {
    const cur = getCurrentMonth();
    const first = cur >= 1 && cur <= 3 ? cur : 1;
    for (let m = first; m <= 3; m++) {
      if (getMonthPayment(m).status !== 'PAID') return m;
    }
    return null;
  };

  const getMonthPayment = (monthNum) => {
    const totalPrice = getTotalPrice();
    
    if (!user.monthlyPayments) {
      if (monthNum === 1) {
        return {
          price: totalPrice,
          amountPaid: user.amountPaid || 0,
          balance: totalPrice - (user.amountPaid || 0),
          status: user.paymentStatus || (user.paid ? 'PAID' : 'UNPAID')
        };
      }
      return {
        price: totalPrice,
        amountPaid: 0,
        balance: totalPrice,
        status: 'UNPAID'
      };
    }
    const payment = user.monthlyPayments[`month${monthNum}`];
    return payment || {
      price: totalPrice,
      amountPaid: 0,
      balance: totalPrice,
      status: 'UNPAID'
    };
  };

  const toggleMonth = (monthNum) => {
    setExpandedMonth(expandedMonth === monthNum ? null : monthNum);
  };

  const currentMonth = getCurrentMonth();

  const monthToPay = getMonthToPay();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-sm mx-4 w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <div className="icon-dollar-sign text-3xl text-green-600"></div>
        </div>
        <h3 className="text-xl font-bold text-center mb-4">Payment Details</h3>
        {((user.lessonPackages && Array.isArray(user.lessonPackages) && user.lessonPackages.length > 0) || user.lessonPackage) ? (
          <div className="space-y-3">
            {[1, 2, 3].map(monthNum => {
              const payment = getMonthPayment(monthNum);
              const shownStatus = effectiveMonthStatus(monthNum, payment.status);
              const isExpanded = expandedMonth === monthNum;
              const isPastMonth = getMonthState(monthNum) === 'past' && monthNum !== currentMonth;
              const isFutureMonth = getMonthState(monthNum) === 'upcoming';
              return (
                <div key={monthNum} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleMonth(monthNum)}
                    className={`w-full p-4 flex items-center justify-between transition-colors ${
                      monthNum === currentMonth ? 'bg-[var(--secondary-color)] hover:bg-[var(--accent-color)] hover:bg-opacity-20' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-semibold">
                      Month {monthNum} {monthNum === currentMonth && <span className="text-xs text-[var(--primary-color)]">(Current)</span>}
                      {isFutureMonth && <span className="text-xs text-blue-600">(Upcoming)</span>}
                      {isPastMonth && <span className="text-xs text-gray-500">(Past)</span>}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${monthStatusBadgeClass(shownStatus)}`}>
                        {shownStatus}
                      </span>
                      <div className={`icon-chevron-${isExpanded ? 'up' : 'down'} text-lg`}></div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="p-4 space-y-2 bg-white">
                      <div className="text-xs text-gray-500 mb-2 pb-2 border-b">
                        {getMonthDateRange(monthNum)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Price:</span>
                        <span className="font-semibold">TZS {(monthNum === 3 ? payment.price * 0.5 : payment.price).toLocaleString()} {monthNum === 3 && <span className="text-xs text-orange-600 font-bold ml-1">(50% OFF)</span>}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Amount Paid:</span>
                        <span className="font-semibold">TZS {payment.amountPaid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Balance:</span>
                        <span className="font-semibold text-red-600">TZS {payment.balance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`font-semibold ${
                          shownStatus === 'PAID' ? 'text-green-600' :
                          shownStatus === 'PARTIAL' ? 'text-yellow-600' : shownStatus === 'UPCOMING' || shownStatus === 'NOT SET' ? 'text-gray-500' :
                          'text-red-600'
                        }`}>
                          {shownStatus}
                        </span>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No lesson package selected yet</p>
        )}
        <div className="space-y-3 mt-6">
          <button 
            onClick={() => setShowPaymentDetails(true)} 
            disabled={!monthToPay}
            className="w-full bg-[var(--primary-color)] text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {monthToPay ? `PAY FOR MONTH ${monthToPay}` : 'ALL MONTHS PAID'}
          </button>
          <button 
            onClick={() => {
              // Creating a temporary container to render the statement and download it
              const container = document.createElement('div');
              container.style.position = 'fixed';
              container.style.left = '-9999px';
              document.body.appendChild(container);
              
              const root = ReactDOM.createRoot(container);
              root.render(
                <FinancialStatement 
                  user={user} 
                  onClose={() => {
                    document.body.removeChild(container);
                  }} 
                />
              );
              
              // We need to wait for it to render then trigger download
              setTimeout(() => {
                const downloadBtn = container.querySelector('[data-download-btn]');
                if (downloadBtn) downloadBtn.click();
                setTimeout(() => {
                  root.unmount();
                  if (container.parentNode) document.body.removeChild(container);
                }, 1000);
              }, 500);
            }} 
            className="w-full flex items-center justify-center gap-2 border-2 border-[var(--primary-color)] text-[var(--primary-color)] py-3 rounded-lg font-semibold hover:bg-[var(--secondary-color)]"
          >
            <div className="icon-download text-lg"></div>
            DOWNLOAD STATEMENT
          </button>
        </div>
        {showPaymentDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPaymentDetails(false)}>
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4 w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-center mb-4" style={{ color: '#E40000' }}>Airtel Lipa Namba</h3>
              <div className="flex justify-center mb-4">
                <img src="assets/airtel.png" alt="Airtel" className="h-20" onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                <span style={{ display: 'none', color: '#E40000' }} className="text-4xl font-extrabold tracking-tight">airtel</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">PAYMENT NUMBER</p>
                    <p className="text-lg font-bold">140576405</p>
                  </div>
                  <button 
                    onClick={handleCopyNumber} 
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${copied ? 'bg-green-500 text-white' : 'text-white'}`}
                    style={copied ? undefined : { backgroundColor: '#E40000' }}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">NAME</p>
                  <p className="text-sm font-semibold">SADATI HAMISI KHALIFA</p>
                </div>
              </div>
              <p className="text-sm text-center text-gray-700 mb-6">
                Lipia kupitia namba hiyo ya Airtel na umjulishe kiongozi kuhusu malipo yako.
              </p>
              <button 
                onClick={() => { setShowPaymentDetails(false); onClose(); }} 
                className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90"
                style={{ backgroundColor: '#E40000' }}
              >
                OKAY
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}