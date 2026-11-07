function AttendanceView() {
  try {
    const [activeTab, setActiveTab] = React.useState('calendar');
    const [currentDate, setCurrentDate] = React.useState(getTanzaniaDate());
    const [selectedDate, setSelectedDate] = React.useState(null);
    const [users, setUsers] = React.useState([]);
    const [attendance, setAttendance] = React.useState({});
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showBulkAction, setShowBulkAction] = React.useState(false);

    React.useEffect(() => {
      loadUsers();
      checkBulkAttendance();
    }, []);

    const checkBulkAttendance = async () => {
      const referenceDate = new Date('2025-12-21');
      const records = await getAttendanceForDate(referenceDate);
      const presentUserIds = records.filter(r => r.isPresent).map(r => r.userId);
      
      if (presentUserIds.length > 0) {
        const startDate = new Date('2025-12-27');
        const endDate = new Date('2026-01-18');
        const hasMarked = localStorage.getItem('bulk_attendance_marked');
        
        if (!hasMarked) {
          setShowBulkAction(true);
        }
      }
    };

    const handleBulkAttendance = async () => {
      if (!confirm('Mark attendance from Dec 27, 2025 to Jan 18, 2026 for students present on Dec 21, 2025?')) {
        return;
      }
      
      try {
        const referenceDate = new Date('2025-12-21');
        const records = await getAttendanceForDate(referenceDate);
        const presentUserIds = records.filter(r => r.isPresent).map(r => r.userId);
        
        if (presentUserIds.length === 0) {
          alert('No students were present on December 21, 2025');
          return;
        }
        
        const startDate = new Date('2025-12-27');
        const endDate = new Date('2026-01-18');
        
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          for (const userId of presentUserIds) {
            await markAttendance(currentDate, userId, true);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        localStorage.setItem('bulk_attendance_marked', 'true');
        setShowBulkAction(false);
        alert('Attendance marked successfully for all dates!');
      } catch (error) {
        console.error('Error marking bulk attendance:', error);
        alert('Failed to mark bulk attendance');
      }
    };

    React.useEffect(() => {
      if (selectedDate) {
        loadAttendance();
      }
    }, [selectedDate]);

    const loadUsers = async () => {
      const allUsers = await getAllRegisteredUsers();
      setUsers(allUsers);
    };

    const handleQRScan = async (userData) => {
      const today = getTanzaniaDate();
      await markAttendance(today, userData.regNumber, true);
      alert(`Attendance recorded for ${userData.name}`);
      setActiveTab('calendar');
    };

    const loadAttendance = async () => {
      const records = await getAttendanceForDate(selectedDate);
      const attendanceMap = {};
      records.forEach(record => {
        attendanceMap[record.userId] = record.isPresent;
      });
      setAttendance(attendanceMap);
    };

    const handleToggle = async (userId) => {
      const newValue = !attendance[userId];
      setAttendance(prev => ({
        ...prev,
        [userId]: newValue
      }));
      await markAttendance(selectedDate, userId, newValue);
    };

    const handleApprove = () => {
      setSelectedDate(null);
    };

    const renderCalendar = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const days = [];
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} className="h-12"></div>);
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = formatDateKey(date) === formatDateKey(getTanzaniaDate());
        days.push(
          <button
            key={day}
            onClick={() => setSelectedDate(date)}
            className={`h-12 flex items-center justify-center rounded-lg font-semibold ${
              isToday ? 'bg-[var(--primary-color)] text-white' : 'hover:bg-gray-100'
            }`}
          >
            {day}
          </button>
        );
      }
      
      return days;
    };

    const filteredUsers = users.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.regNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Attendance</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'calendar' ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-200'}`}
            >
              ATTENDANCE
            </button>
            <button 
              onClick={() => setActiveTab('record')}
              className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'record' ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-200'}`}
            >
              RECORD
            </button>
          </div>
        </div>
        
        {activeTab === 'record' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">Scan QR Code</h3>
            <AttendanceQRScanner onScan={handleQRScan} />
          </div>
        )}
        
        {activeTab === 'calendar' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Calendar View</h2>
          {showBulkAction && (
            <button 
              onClick={handleBulkAttendance}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Mark Dec 27 - Jan 18
            </button>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2">
              <div className="icon-chevron-left text-xl"></div>
            </button>
            <h3 className="text-xl font-bold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2">
              <div className="icon-chevron-right text-xl"></div>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>
        </div>
        {selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedDate(null)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Attendance - {selectedDate.toLocaleDateString()}</h3>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search students..."
                className="w-full px-4 py-2 border rounded-lg mb-4"
              />
              <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                {filteredUsers.map(user => (
                  <div key={user.regNumber} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.regNumber}</p>
                    </div>
                    <button
                      onClick={async () => await handleToggle(user.regNumber)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        attendance[user.regNumber] ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        attendance[user.regNumber] ? 'translate-x-6' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleApprove} className="flex-1 bg-[var(--primary-color)] text-white py-2 rounded-lg">
                  APPROVE
                </button>
                <button onClick={() => setSelectedDate(null)} className="flex-1 bg-gray-200 py-2 rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('AttendanceView error:', error);
    return null;
  }
}