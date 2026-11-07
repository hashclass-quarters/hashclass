function RecordAttendanceView() {
  try {
    const [alert, setAlert] = React.useState(null);

    const handleScan = async (userData) => {
      try {
        const today = getTanzaniaDate();
        const success = await recordAttendance(userData.regNumber, userData.name, userData.profilePic, today, true);
        if (success !== false) {
          setAlert({ message: 'Attendance recorded successfully!', type: 'success' });
          setTimeout(() => setAlert(null), 3000);
        } else {
          setAlert({ message: 'Failed to record attendance', type: 'error' });
          setTimeout(() => setAlert(null), 3000);
        }
      } catch (error) {
        console.error('Record attendance error:', error);
        setAlert({ message: 'Failed to record attendance', type: 'error' });
        setTimeout(() => setAlert(null), 3000);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Record Attendance</h2>
          <AttendanceQRScanner onScan={handleScan} />
        </div>
        {alert && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`${alert.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3`}>
              <div className={`icon-${alert.type === 'success' ? 'circle-check' : 'circle-x'} text-2xl`}></div>
              <p className="font-medium">{alert.message}</p>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('RecordAttendanceView error:', error);
    return null;
  }
}