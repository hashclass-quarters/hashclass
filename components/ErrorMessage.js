function ErrorMessage({ message }) {
  try {
    if (!message) return null;

    return (
      <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-start gap-2" data-name="error-message" data-file="components/ErrorMessage.js">
        <div className="icon-alert-circle text-xl flex-shrink-0 mt-0.5"></div>
        <span className="text-sm">{message}</span>
      </div>
    );
  } catch (error) {
    console.error('ErrorMessage component error:', error);
    return null;
  }
}