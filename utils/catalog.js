// Single source of truth for years of study and lesson packages (prices in TZS per month).
// Every screen (sign-up, student panel, admin panel) reads from here.

const STUDY_YEARS = ['FIRST YEAR', 'SECOND YEAR', 'THIRD YEAR'];

const FIRST_YEAR_PACKAGES = [
  { id: 'AF111+MT1114', name: 'AF111 & MT1114', price: 10000 },
  { id: 'AF111', name: 'AF111', price: 6000 },
  { id: 'MT1114', name: 'MT1114', price: 6000 }
];

// Second year and third year share the same course list
// (third year students take them as Carry Over Courses).
const UPPER_YEAR_PACKAGES = [
  { id: 'AF211+AF212+MS211', name: 'AF211, AF212 & MS211', price: 15000 },
  { id: 'AF211+AF212', name: 'AF211 & AF212', price: 12000 },
  { id: 'AF211+MS211', name: 'AF211 & MS211', price: 12000 },
  { id: 'AF212+MS211', name: 'AF212 & MS211', price: 12000 },
  { id: 'AF211', name: 'AF211 Only', price: 7000 },
  { id: 'AF212', name: 'AF212 Only', price: 7000 },
  { id: 'MS211', name: 'MS211 Only', price: 7000 }
];

function isCarryOverYear(year) {
  return year === 'THIRD YEAR';
}

// Packages shown as the main list for this year (carry over packages for years 2 and 3)
function getPackagesForYear(year) {
  if (year === 'FIRST YEAR') return FIRST_YEAR_PACKAGES.map(p => ({ ...p }));
  return getCarryOverPackages(year);
}

// Carry over packages: second year students may take ONE first year package,
// third year students may take ONE second year package.
function getCarryOverPackages(year) {
  if (year === 'SECOND YEAR') return FIRST_YEAR_PACKAGES.map(p => ({ ...p, carryOver: true }));
  if (year === 'THIRD YEAR') return UPPER_YEAR_PACKAGES.map(p => ({ ...p, carryOver: true }));
  return [];
}

// Text shown wherever a package is listed
function packageLabel(pkg) {
  if (!pkg) return '';
  return pkg.carryOver ? pkg.name + ' (Carry Over)' : pkg.name;
}

// Section title used on the sign-up page
function packageSectionTitle(year) {
  return isCarryOverYear(year) ? 'Carry Over Courses' : 'Lesson Package';
}


// Third year students also take their own course, AF318 (optional), next to ONE carry over package.
const THIRD_YEAR_OWN_PACKAGE = { id: 'AF318', name: 'AF318', price: 15000 };

// the student's own (non carry over) course packages for this year
function getOwnCoursePackages(year) {
  if (year === 'FIRST YEAR') return FIRST_YEAR_PACKAGES.map(p => ({ ...p }));
  if (year === 'SECOND YEAR') return UPPER_YEAR_PACKAGES.map(p => ({ ...p }));
  if (year === 'THIRD YEAR') return [Object.assign({}, THIRD_YEAR_OWN_PACKAGE)];
  return [];
}

// third year can tick AF318 (checkbox); first and second year pick one own package (radio)
function ownCoursesAreCheckbox(year) {
  return year === 'THIRD YEAR';
}

// second and third year can also pick ONE carry over package from the dropdown
function isMultiPackageYear(year) {
  return year === 'SECOND YEAR' || year === 'THIRD YEAR';
}

// turns a list of chosen package ids into the objects that are saved on the student
function buildSavedPackages(year, ids) {
  const out = [];
  const own = getOwnCoursePackages(year).filter(o => ids.includes(o.id));
  (ownCoursesAreCheckbox(year) ? own : own.slice(-1)).forEach(o => out.push({ id: o.id, name: o.name, price: o.price }));
  const carry = getCarryOverPackages(year).find(p => ids.includes(p.id));
  if (carry) out.push({ id: carry.id, name: carry.name, price: carry.price, carryOver: true });
  return out;
}
