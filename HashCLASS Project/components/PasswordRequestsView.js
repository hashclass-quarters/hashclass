function PasswordRequestsView() {
  try {
    const [requests, setRequests] = React.useState([]);
    const [reset, setReset] = React.useState(null);

    React.useEffect(() => {
      loadRequests();
    }, []);

    const loadRequests = async () => {
      const allRequests = await getAllPasswordRequests();
      setRequests(allRequests);
    };

    const handleApprove = async (request) => {
      if (!canManagePasswordRequests(JSON.parse(localStorage.getItem('currentUser')))) {
        showUnauthorizedAlert();
        return;
      }
      try {
        const result = await approvePasswordRequest(request.id);
        const subject = 'HashCLASS - Password Recovery';
        const body = `Dear ${result.name},\n\nYour temporary HashCLASS password is: ${result.tempPassword}\n\nPlease sign in and change it from your Account page.\n\nBest regards,\nHashCLASS Team\nThe Golden Minds`;
        setReset({ ...result, subject, body });
        loadRequests();
      } catch (error) {
        alert('Could not approve request: ' + error.message);
      }
    };

    const handleDelete = async (id) => {
      if (!canManagePasswordRequests(JSON.parse(localStorage.getItem('currentUser')))) {
        showUnauthorizedAlert();
        return;
      }
      if (confirm('Delete this password request?')) {
        await deletePasswordRequest(id);
        loadRequests();
      }
    };

    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Password Requests</h2>
        {reset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-2">Temporary password created</h3>
              <p className="text-sm text-gray-600 mb-3">Send this to {reset.name} ({reset.regNumber}). It is shown only once.</p>
              <div className="bg-gray-100 rounded-lg p-3 text-center text-2xl font-mono tracking-wider mb-4 select-all">{reset.tempPassword}</div>
              <div className="flex flex-col gap-2">
                {reset.email && (
                  <a href={`mailto:${reset.email}?subject=${encodeURIComponent(reset.subject)}&body=${encodeURIComponent(reset.body)}`} className="text-center bg-[var(--primary-color)] text-white py-2 rounded-lg">Email it</a>
                )}
                {reset.phone && (
                  <a href={`https://wa.me/${String(reset.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(reset.body)}`} target="_blank" rel="noreferrer" className="text-center bg-green-600 text-white py-2 rounded-lg">WhatsApp it</a>
                )}
                <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(reset.tempPassword); }} className="bg-gray-200 py-2 rounded-lg">Copy password</button>
                <button onClick={() => setReset(null)} className="bg-gray-200 py-2 rounded-lg">Done</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Reg Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request.objectId} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{request.name}</td>
                    <td className="px-6 py-4 text-sm">{request.regNumber}</td>
                    <td className="px-6 py-4 text-sm">{request.email}</td>
                    <td className="px-6 py-4 text-sm">{request.phone}</td>
                    <td className="px-6 py-4">
                      {request.approved ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">Approved</span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {canManagePasswordRequests(JSON.parse(localStorage.getItem('currentUser'))) && (
                        <div className="flex gap-2">
                          {!request.approved && (
                            <button onClick={() => handleApprove(request)} className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg text-sm">
                              APPROVE
                            </button>
                          )}
                          <button onClick={() => handleDelete(request.objectId)} className="text-red-600 hover:text-red-800">
                            <div className="icon-trash-2 text-lg"></div>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('PasswordRequestsView error:', error);
    return null;
  }
}