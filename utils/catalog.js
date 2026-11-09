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

// Packages a student of this year may choose (exactly one can be selected).
function getPackagesForYear(year) {
  if (year === 'FIRST YEAR') return FIRST_YEAR_PACKAGES.map(p => ({ ...p }));
  if (year === 'SECOND YEAR' || year === 'THIRD YEAR') {
    const carryOver = isCarryOverYear(year);
    return UPPER_YEAR_PACKAGES.map(p => ({ ...p, carryOver }));
  }
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
