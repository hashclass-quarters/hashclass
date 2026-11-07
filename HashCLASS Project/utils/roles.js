const ROLES = {
  CEO: 'FOUNDER & CEO',
  GENERAL_SECRETARY: 'General Secretary',
  CFO: 'Chief Financial Officer',
  ACCOUNTANT: 'Accountant',
  LECTURER: 'Lecturer'
};

function canViewAdminPassword(currentUser, targetAdmin) {
  if (!currentUser || !targetAdmin) return false;
  if (currentUser.authority === ROLES.CEO) return true;
  if (currentUser.regNumber === targetAdmin.regNumber) return true;
  return false;
}

function canPostNews(currentUser) {
  if (!currentUser) return false;
  return currentUser.authority === ROLES.CEO || currentUser.authority === ROLES.GENERAL_SECRETARY;
}

function canManageRegisteredUsers(currentUser) {
  if (!currentUser) return false;
  return currentUser.authority === ROLES.CEO || currentUser.authority === ROLES.CFO;
}

function canManageValidUsers(currentUser) {
  if (!currentUser) return false;
  return currentUser.authority === ROLES.CEO || currentUser.authority === ROLES.ACCOUNTANT;
}

function canManageAdmins(currentUser) {
  if (!currentUser) return false;
  return currentUser.authority === ROLES.CEO;
}

function canManagePackages(currentUser) {
  if (!currentUser) return false;
  return currentUser.authority === ROLES.CEO;
}

function canManagePasswordRequests(currentUser) {
  if (!currentUser) return false;
  return currentUser.authority === ROLES.CEO;
}

function showUnauthorizedAlert() {
  let popupRoot = document.getElementById('unauthorized-popup-root');
  if (!popupRoot) {
    popupRoot = document.createElement('div');
    popupRoot.id = 'unauthorized-popup-root';
    document.body.appendChild(popupRoot);
  }
  
  const UnauthorizedPopup = () => {
    const [show, setShow] = React.useState(true);
    
    if (!show) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-sm mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="icon-shield-alert text-3xl text-red-600"></div>
          </div>
          <h3 className="text-xl font-bold mb-2">Unauthorized Access</h3>
          <p className="text-sm text-gray-600 mb-6">You are not authorized to perform this action. Please contact the FOUNDER & CEO if you need access.</p>
          <button 
            onClick={() => {
              setShow(false);
              setTimeout(() => {
                const container = document.getElementById('unauthorized-popup-root');
                if (container) {
                  ReactDOM.unmountComponentAtNode(container);
                }
              }, 100);
            }}
            className="w-full bg-[var(--primary-color)] text-white py-2 rounded-lg"
          >
            OK
          </button>
        </div>
      </div>
    );
  };
  
  const container = document.getElementById('unauthorized-popup-root');
  const rootElement = ReactDOM.createRoot(container);
  rootElement.render(<UnauthorizedPopup />);
}
