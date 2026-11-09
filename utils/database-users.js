// ----- shaping helpers -------------------------------------------------

// Single-course packages used to cost 6,500; they are now 7,000. Older records are shown at the new
// price (months that are already fully paid keep what was actually charged).
const OLD_SINGLE_PRICE = 6500, NEW_SINGLE_PRICE = 7000;
function fixOldPackagePrice(pkg) {
  return pkg && pkg.price === OLD_SINGLE_PRICE ? Object.assign({}, pkg, { price: NEW_SINGLE_PRICE }) : pkg;
}
function fixOldMonthlyPayments(mp) {
  if (!mp || typeof mp !== 'object') return mp;
  const out = {};
  Object.keys(mp).forEach(k => {
    const m = mp[k];
    if (m && m.price === OLD_SINGLE_PRICE && m.status !== 'PAID') {
      out[k] = Object.assign({}, m, { price: NEW_SINGLE_PRICE, balance: NEW_SINGLE_PRICE - (m.amountPaid || 0) });
    } else out[k] = m;
  });
  return out;
}

function shapeRegisteredUser(item) {
  const d = item.objectData || {};
  let lessonPackages = null;
  let lessonPackage = null;

  const multi = parseJsonField(d.lessonPackages, null);
  if (Array.isArray(multi)) lessonPackages = multi;

  if (!lessonPackages && d.lessonPackage) {
    const single = parseJsonField(d.lessonPackage, null);
    lessonPackage = single;
    lessonPackages = Array.isArray(single) ? single : (single ? [single] : null);
  }
  if (lessonPackages) lessonPackages = lessonPackages.map(fixOldPackagePrice);
  if (lessonPackage && !Array.isArray(lessonPackage)) lessonPackage = fixOldPackagePrice(lessonPackage);

  return {
    objectId: item.objectId,
    createdAt: item.createdAt,
    regNumber: d.regNumber,
    name: d.name,
    course: d.course,
    year: d.year,
    email: d.email,
    phone: d.phone,
    profilePic: d.profilePic,
    lessonPackages: lessonPackages,
    lessonPackage: lessonPackage,
    paid: d.paid || false,
    amountPaid: d.amountPaid || 0,
    paymentStatus: d.paymentStatus || (d.paid ? 'PAID' : 'UNPAID'),
    monthlyPayments: fixOldMonthlyPayments(parseJsonField(d.monthlyPayments, null))
  };
}

function shapeAdmin(item) {
  const d = item.objectData || {};
  return {
    objectId: item.objectId,
    regNumber: d.regNumber,
    name: d.name,
    course: d.course,
    year: d.year,
    email: d.email || '',
    phone: d.phone,
    profilePic: d.profilePic,
    authority: d.authority || ''
  };
}

// ----- students --------------------------------------------------------

// Admin side: create a registered student (password is hashed on the server).
// Resolves to the created item; item.generatedPassword is set if none was supplied.
async function addRegisteredUser(userData) {
  if (!userData || !userData.regNumber || !userData.name) {
    throw new Error('Registration number and name are required');
  }
  let packageString = null;
  const pk = userData.lessonPackages || userData.lessonPackage;
  if (pk) packageString = typeof pk === 'string' ? pk : JSON.stringify(pk);
  if (!packageString) throw new Error('At least one lesson package must be selected');

  return await trickleCreateObject('registered_user', {
    regNumber: userData.regNumber,
    name: userData.name,
    course: userData.course || 'N/A',
    year: userData.year || 'N/A',
    email: userData.email || '',
    phone: userData.phone || '',
    profilePic: userData.profilePic || '',
    password: userData.password || '',
    lessonPackage: packageString,
    paid: userData.paid || false
  });
}

// Public sign-up (no login yet)
async function registerStudent(userData) {
  if (!userData || !userData.regNumber || !userData.name) {
    throw new Error('Registration number and name are required');
  }
  const pk = userData.lessonPackages || userData.lessonPackage;
  if (!pk) throw new Error('At least one lesson package must be selected');
  return await appRegister({
    regNumber: userData.regNumber,
    name: userData.name,
    course: userData.course || 'N/A',
    year: userData.year || 'N/A',
    email: userData.email || '',
    phone: userData.phone || '',
    profilePic: userData.profilePic || '',
    password: userData.password,
    lessonPackage: typeof pk === 'string' ? pk : JSON.stringify(pk)
  });
}

// One direct lookup (the server finds it by registration number)
async function getRegisteredUser(regNumber) {
  if (!regNumber) return null;
  const result = await trickleListObjects('registered_user', 1, true, undefined, {
    filter: { regNumber: normalizeRegNumber(regNumber) }
  });
  return result.items.length ? shapeRegisteredUser(result.items[0]) : null;
}

async function getAllRegisteredUsers() {
  try {
    const items = await trickleListAll('registered_user');
    return items.map(shapeRegisteredUser);
  } catch (error) {
    console.error('Error fetching all registered users:', error);
    return [];
  }
}

async function getAllValidUsers() {
  try {
    const items = await trickleListAll('valid_user');
    return items.map(item => ({
      objectId: item.objectId,
      regNumber: item.objectData.regNumber,
      name: item.objectData.name,
      course: item.objectData.course,
      year: item.objectData.year
    }));
  } catch (error) {
    console.error('Error fetching all valid users:', error);
    return [];
  }
}

// ----- admins ----------------------------------------------------------

async function getAllAdmins() {
  try {
    const items = await trickleListAll('admin_user');
    return items.map(shapeAdmin);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
}

// Resolves to the created item; item.generatedPassword is set if none was supplied.
async function addAdmin(adminData) {
  return await trickleCreateObject('admin_user', {
    regNumber: adminData.regNumber,
    name: adminData.name,
    course: adminData.course || 'N/A',
    year: adminData.year || 'N/A',
    email: adminData.email || '',
    phone: adminData.phone || '',
    profilePic: adminData.profilePic || '',
    password: adminData.password || '',
    authority: adminData.authority
  });
}

async function deleteAdmin(regNumber) {
  const result = await trickleListObjects('admin_user', 1, true, undefined, {
    filter: { regNumber: normalizeRegNumber(regNumber) }
  });
  if (result.items.length) await trickleDeleteObject('admin_user', result.items[0].objectId);
}

// Update an admin's own profile (name / email / phone / profilePic)
async function updateAdminProfile(objectId, fields) {
  const allowed = ['name', 'email', 'phone', 'profilePic', 'course', 'year'];
  const patch = {};
  allowed.forEach(k => { if (fields[k] !== undefined) patch[k] = fields[k]; });
  return await trickleUpdateObject('admin_user', objectId, patch);
}

// A random temporary password for accounts created by an admin
function generateTempPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = new Uint32Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}
