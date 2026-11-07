function AlertPopup({ message, type, onClose }) {
  try {
    React.useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }, []);

    const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const iconName = type === 'success' ? 'circle-check' : 'circle-x';
    const iconColor = type === 'success' ? 'text-green-600' : 'text-red-600';

    return (
      <div className="fixed top-4 right-4 z-50 animate-fadeIn">
        <div className={`${bgColor} ${textColor} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md`}>
          <div className={`icon-${iconName} text-2xl ${iconColor}`}></div>
          <p className="font-medium">{message}</p>
          <button onClick={onClose} className="ml-2">
            <div className="icon-x text-lg"></div>
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AlertPopup error:', error);
    return null;
  }
}