// Small helpers shared by every page. The real work happens in supabase-client.js.

async function waitForDatabaseAPI() {
  return typeof trickleListObjects === 'function';
}

function normalizeRegNumber(reg) {
  return (reg || '').toUpperCase().replace(/\s+/g, '');
}

// Used during sign-up: is this registration number on the "valid students" list?
async function getValidUser(regNumber) {
  if (!regNumber) return null;
  return await appCheckValid(regNumber);
}

// Safe JSON parsers for fields that were stored as text
function parseJsonField(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch (e) { return fallback; }
}
