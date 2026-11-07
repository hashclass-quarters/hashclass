function ConfirmDialog({ message, onConfirm, onCancel }) {
  try {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onCancel}>
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-circle-alert text-3xl text-yellow-600"></div>
            <h3 className="text-xl font-bold">Confirm Action</h3>
          </div>
          <p className="text-gray-700 mb-6">{message}</p>
          <div className="flex gap-3">
            <button 
              onClick={onConfirm}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-semibold"
            >
              CONFIRM
            </button>
            <button 
              onClick={onCancel}
              className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 font-semibold"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ConfirmDialog error:', error);
    return null;
  }
}