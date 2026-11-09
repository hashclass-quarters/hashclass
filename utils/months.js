// Month 1 / 2 / 3 billing periods, set by admins in the "Months" tab.
// Everything that needs "which month is it now?" uses the functions below.
window.__monthPeriods = window.__monthPeriods || {};
const MONTH_NUMBERS = [1, 2, 3];

function parseDateKey(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatMonthDate(s) {
  const d = parseDateKey(s);
  return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

function getMonthPeriod(n) {
  const p = window.__monthPeriods[n];
  if (!p || !parseDateKey(p.startDate) || !parseDateKey(p.endDate)) return null;
  return p;
}

async function loadMonthPeriods() {
  const items = await trickleListAll('month_period');
  const map = {};
  items.forEach(it => {
    const n = Number(it.objectData.month);
    if (MONTH_NUMBERS.includes(n)) {
      map[n] = { objectId: it.objectId, startDate: it.objectData.startDate, endDate: it.objectData.endDate };
    }
  });
  window.__monthPeriods = map;
  return map;
}

// returns an error message, or '' when the dates are fine
function validateMonthPeriod(n, startDate, endDate) {
  const s = parseDateKey(startDate), e = parseDateKey(endDate);
  if (!s || !e) return 'Choose both a start date and an end date';
  if (e < s) return 'End date cannot be before the start date';
  const prev = getMonthPeriod(n - 1), next = getMonthPeriod(n + 1);
  if (prev && s <= parseDateKey(prev.endDate)) return `Month ${n} must start after Month ${n - 1} ends (${formatMonthDate(prev.endDate)})`;
  if (next && e >= parseDateKey(next.startDate)) return `Month ${n} must end before Month ${n + 1} starts (${formatMonthDate(next.startDate)})`;
  return '';
}

async function saveMonthPeriod(n, startDate, endDate) {
  const err = validateMonthPeriod(n, startDate, endDate);
  if (err) throw new Error(err);
  const existing = window.__monthPeriods[n];
  if (existing && existing.objectId) {
    await trickleUpdateObject('month_period', existing.objectId, { month: n, startDate, endDate });
  } else {
    await trickleCreateObject('month_period', { month: n, startDate, endDate });
  }
  await loadMonthPeriods();
}

// 'unset' | 'upcoming' | 'current' | 'past'
function getMonthState(n, today = new Date()) {
  const p = getMonthPeriod(n);
  if (!p) return 'unset';
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (t < parseDateKey(p.startDate)) return 'upcoming';
  if (t > parseDateKey(p.endDate)) return 'past';
  return 'current';
}

// 0 = not started (or dates not set), 1-3 = current month, 4 = all months finished
function getCurrentMonth(today = new Date()) {
  const states = MONTH_NUMBERS.map(n => getMonthState(n, today));
  if (states.every(s => s === 'unset')) return 0;
  let latestStarted = 0;
  for (const n of MONTH_NUMBERS) {
    const st = states[n - 1];
    if (st === 'current') return n;
    if (st === 'past') latestStarted = n;
  }
  const last = MONTH_NUMBERS.filter(n => states[n - 1] !== 'unset').pop();
  if (latestStarted && latestStarted === last) return 4;
  return latestStarted ? latestStarted : 0; // in a gap between months: stay on the latest finished month
}

function getMonthDateRange(n) {
  const p = getMonthPeriod(n);
  return p ? `${formatMonthDate(p.startDate)} - ${formatMonthDate(p.endDate)}` : 'Dates not set yet';
}

// What the student/admin sees as the status of a month.
// A month that has not started yet (or has no dates) cannot be PAID/UNPAID.
function effectiveMonthStatus(n, storedStatus) {
  const st = getMonthState(n);
  if (storedStatus === 'PAID') return 'PAID';
  if (st === 'unset') return 'NOT SET';
  if (st === 'upcoming') return storedStatus === 'PARTIAL' ? 'PARTIAL' : 'UPCOMING';
  return storedStatus || 'UNPAID';
}

function monthStatusBadgeClass(status) {
  return status === 'PAID' ? 'bg-green-100 text-green-800'
    : status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800'
    : status === 'UPCOMING' || status === 'NOT SET' || status === 'NOT STARTED' ? 'bg-gray-100 text-gray-600'
    : status === 'COMPLETED' ? 'bg-blue-100 text-blue-800'
    : 'bg-red-100 text-red-800';
}
