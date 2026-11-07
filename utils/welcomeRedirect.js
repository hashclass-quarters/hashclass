const currentPage = window.location.pathname;
const isWelcomePage = currentPage.includes('welcome.html') || currentPage === '/welcome.html';
const isIndexPage = currentPage.includes('index.html') || currentPage === '/' || currentPage === '/index.html';
const fromSignup = document.referrer.includes('signup.html');
const fromLogout = sessionStorage.getItem('just_logged_out') === 'true';

if (!isWelcomePage && isIndexPage && !fromSignup && !fromLogout) {
  const hasVisitedDevice = localStorage.getItem('hashclass_device_visited');
  if (!hasVisitedDevice) {
    localStorage.setItem('hashclass_device_visited', 'true');
    window.location.href = 'welcome.html';
  }
}

if (fromLogout) {
  sessionStorage.removeItem('just_logged_out');
}
