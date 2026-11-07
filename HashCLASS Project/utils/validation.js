function validateRegNumber(regNumber) {
  const pattern = /^T\d{2}-\d{2}-\d{5}$/;
  return pattern.test(regNumber);
}

function validateEmail(email) {
  return email.endsWith('@gmail.com') && email.length > 10;
}

function validatePhone(phone) {
  return phone.startsWith('+255') && phone.length === 13 && phone[4] !== '0';
}

function validatePassword(password) {
  return password.length >= 6;
}