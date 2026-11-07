function UserProfile({ user, onClick }) {
  try {
    const nameRef = React.useRef(null);
    const [fontSize, setFontSize] = React.useState(18);

    const getCurrentMonth = () => {
      const today = new Date();
      const month1Start = new Date('2026-04-27');
      const month1End = new Date('2026-06-10');
      const month2Start = new Date('2026-06-11');
      const month2End = new Date('2026-07-10');
      const month3Start = new Date('2026-07-11');
      const month3End = new Date('2026-07-24');
      
      if (today >= month1Start && today <= month1End) return 1;
      if (today >= month2Start && today <= month2End) return 2;
      if (today >= month3Start && today <= month3End) return 3;
      if (today > month3End) return 4;
      return 0;
    };

    const getPaymentStatus = () => {
      const currentMonth = getCurrentMonth();
      
      if (currentMonth === 0) return 'NOT STARTED';
      if (currentMonth === 4) return 'COMPLETED';
      
      if (!user.monthlyPayments) {
        return 'UNPAID';
      }
      
      const payments = typeof user.monthlyPayments === 'string' ? JSON.parse(user.monthlyPayments) : user.monthlyPayments;
      const currentPayment = payments[`month${currentMonth}`];
      
      if (currentPayment && currentPayment.status) {
        return currentPayment.status;
      }
      
      return 'UNPAID';
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
      <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50" onClick={onClick}>
        <img src={user.profilePic || 'https://via.placeholder.com/80'} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <h2 ref={nameRef} className="font-bold text-gray-800 whitespace-nowrap overflow-hidden" style={{ fontSize: `${fontSize}px` }}>{user.name}</h2>
          <p className="text-sm text-gray-600 truncate">{user.course}</p>
          <p className="text-sm text-[var(--primary-color)] font-semibold">{user.year}</p>
          <div className="mt-2">
            <span className="text-[10px] uppercase text-gray-500 block mb-1">Status (Month {getCurrentMonth()})</span>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
              paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
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