function UserProfile({ user, onClick }) {
  try {
    const nameRef = React.useRef(null);
    const [fontSize, setFontSize] = React.useState(18);


    const getPaymentStatus = () => {
      const currentMonth = getCurrentMonth();
      
      if (currentMonth === 0) return 'NOT STARTED';
      if (currentMonth === 4) return 'COMPLETED';
      
      if (!user.monthlyPayments) {
        return effectiveMonthStatus(currentMonth, 'UNPAID');
      }
      
      const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
      const currentPayment = payments[`month${currentMonth}`];
      return effectiveMonthStatus(currentMonth, currentPayment && currentPayment.status);
    };

    const paymentStatus = getPaymentStatus();

    React.useEffect(() => {
      if (nameRef.current) {
        let size = 18;
        nameRef.current.style.fontSize = `${size}px`;
        while (nameRef.current.scrollWidth > nameRef.current.offsetWidth && size > 10) {
          size -= 0.5;
          nameRef.current.style.fontSize = `${size}px`;
        }
        setFontSize(size);
      }
    }, [user.name]);

    return (
      <div className="hc-card p-4 flex items-center gap-4 cursor-pointer hover:shadow-xl transition" onClick={onClick}>
        <img src={user.profilePic || 'https://via.placeholder.com/80'} alt="Profile" className="w-20 h-20 rounded-full object-cover" style={{ boxShadow: '0 0 0 3px #fff, 0 0 0 5px #C9D6FB' }} />
        <div className="flex-1 min-w-0">
          <h2 ref={nameRef} className="font-bold text-[#1D3FD0] whitespace-nowrap overflow-hidden" style={{ fontSize: `${fontSize}px` }}>{user.name}</h2>
          <p className="text-sm text-gray-600 truncate">{user.course}</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-sm font-extrabold" style={{ color: '#E0A100' }}>{user.year}</span>
            <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${monthStatusBadgeClass(paymentStatus)}`}>
              {paymentStatus}
            </span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('UserProfile error:', error);
    return null;
  }
}