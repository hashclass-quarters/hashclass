function UserAttendancePopup({ user, onClose }) {
  try {
    const [activeTab, setActiveTab] = React.useState('attendance');
    const [attendanceRecords, setAttendanceRecords] = React.useState([]);
    const [currentDate, setCurrentDate] = React.useState(getTanzaniaDate());
    const qrCodeRef = React.useRef(null);

    React.useEffect(() => {
      loadAttendance();
    }, []);

    React.useEffect(() => {
      if (activeTab === 'attend' && qrCodeRef.current) {
        generateQRCode();
      } else if (activeTab === 'attendance') {
        loadAttendance();
      }
    }, [activeTab]);

    const loadAttendance = async () => {
      const records = await getUserAttendance(user.regNumber);
      setAttendanceRecords(records);
    };

    const generateQRCode = () => {
      const qrData = JSON.stringify({
        regNumber: user.regNumber,
        name: user.name,
        course: user.course,
        year: user.year
      });
      
      if (window.QRCode) {
        qrCodeRef.current.innerHTML = '';
        new QRCode(qrCodeRef.current, {
          text: qrData,
          width: 200,
          height: 200
        });
      }
    };

    const renderCalendar = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      const today = getTanzaniaDate();
      
      const days = [];
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} className="h-12"></div>);
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = formatDateKey(date);
        const record = attendanceRecords.find(r => r.date === dateKey);
        const isPast = date < today && formatDateKey(date) !== formatDateKey(today);
        
        let bgColor = '';
        if (record && record.isPresent) {
          bgColor = 'bg-green-500 text-white';
        } else if (isPast && !record) {
          bgColor = 'bg-red-500 text-white';
        } else if (formatDateKey(date) === formatDateKey(today)) {
          bgColor = 'bg-[var(--primary-color)] text-white';
        }
        
        days.push(
          <div key={day} className={`h-12 flex items-center justify-center rounded-lg font-semibold ${bgColor}`}>
            {day}
          </div>
        );
      }
      
      return days;
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4 text-center">My Attendance</h3>
          
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setActiveTab('attendance')}
              className={`flex-1 py-2 rounded-lg font-semibold ${activeTab === 'attendance' ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-200'}`}
            >
              ATTENDANCE
            </button>
            <button 
              onClick={() => setActiveTab('attend')}
              className={`flex-1 py-2 rounded-lg font-semibold ${activeTab === 'attend' ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-200'}`}
            >
              ATTEND
            </button>
          </div>
          
          {activeTab === 'attendance' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2">
                  <div className="icon-chevron-left text-xl"></div>
                </button>
                <h4 className="text-lg font-semibold">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2">
                  <div className="icon-chevron-right text-xl"></div>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-xs font-semibold text-gray-600">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {renderCalendar()}
              </div>
              <div className="flex gap-2 text-xs mb-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-[var(--primary-color)] rounded"></div>
                  <span>Today</span>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'attend' && (
            <div className="text-center">
              <div ref={qrCodeRef} className="flex justify-center mb-4"></div>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <p className="text-sm mb-1"><strong>Name:</strong> {user.name}</p>
                <p className="text-sm mb-1"><strong>Reg No:</strong> {user.regNumber}</p>
                <p className="text-sm mb-1"><strong>Course:</strong> {user.course}</p>
                <p className="text-sm"><strong>Year:</strong> {user.year}</p>
              </div>
              <p className="text-xs text-gray-600 mt-4">Show this QR code to the admin to record your attendance</p>
            </div>
          )}
          
          <button onClick={onClose} className="w-full mt-4 bg-gray-200 py-3 rounded-lg font-semibold">
            Close
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('UserAttendancePopup error:', error);
    return null;
  }
}