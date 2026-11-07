function ContactIcons() {
  try {
    const handlePhone = () => {
      window.location.href = 'tel:0617293971';
    };

    const handleMessage = () => {
      window.location.href = 'sms:0617293971';
    };

    const handleEmail = () => {
      window.location.href = 'mailto:hashclass.udom@gmail.com';
    };

    return (
      <div className="relative z-10 mt-6 text-center" data-name="contact-icons" data-file="components/ContactIcons.js">
        <p className="text-sm text-white mb-3 drop-shadow-md">Check us on</p>
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={handlePhone}
            className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors"
            title="Call us"
          >
            <div className="icon-phone text-xl text-green-600"></div>
          </button>
          <button 
            onClick={handleMessage}
            className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
            title="Send message"
          >
            <div className="icon-message-square text-xl text-blue-600"></div>
          </button>
          <button 
            onClick={handleEmail}
            className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors"
            title="Email us"
          >
            <div className="icon-mail text-xl text-red-600"></div>
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ContactIcons component error:', error);
    return null;
  }
}