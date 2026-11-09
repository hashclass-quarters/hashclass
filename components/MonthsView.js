function DatePickButton({ label, value, onChange, disabled }) {
  // the real <input type="date"> sits invisibly over the button, so a click opens the native calendar everywhere
  return (
    <div className="relative">
      <div className={`rounded-xl border-2 px-4 py-3 text-center transition-colors ${
        value ? 'border-[var(--primary-color)] bg-[var(--secondary-color)]' : 'border-dashed border-gray-300 bg-gray-50'
      } ${disabled ? 'opacity-60' : 'hover:shadow-md cursor-pointer'}`}>
        <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-wider text-[var(--primary-color)]">
          <div className="icon-calendar text-base"></div>{label}
        </div>
        <div className={`mt-1 text-sm font-semibold ${value ? 'text-gray-800' : 'text-gray-400'}`}>
          {value ? formatMonthDate(value) : 'Tap to choose'}
        </div>
      </div>
      <input
        type="date"
        value={value || ''}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        aria-label={label}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        onClick={e => { try { e.target.showPicker && e.target.showPicker(); } catch (err) {} }}
      />
    </div>
  );
}

function MonthCard({ n, canEdit, onSaved }) {
  const saved = getMonthPeriod(n);
  const [start, setStart] = React.useState(saved ? saved.startDate : '');
  const [end, setEnd] = React.useState(saved ? saved.endDate : '');
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState(null);

  const dirty = start !== (saved ? saved.startDate : '') || end !== (saved ? saved.endDate : '');
  const error = start && end ? validateMonthPeriod(n, start, end) : '';
  const state = getMonthState(n);
  const days = start && end && !error ? Math.round((parseDateKey(end) - parseDateKey(start)) / 86400000) + 1 : null;

  const badge = {
    current: ['CURRENT', 'bg-green-100 text-green-800'],
    upcoming: ['UPCOMING', 'bg-blue-100 text-blue-800'],
    past: ['ENDED', 'bg-gray-200 text-gray-700'],
    unset: ['NOT SET', 'bg-yellow-100 text-yellow-800']
  }[state];

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      await saveMonthPeriod(n, start, end);
      setMsg({ ok: true, text: `Month ${n} saved` });
      onSaved();
    } catch (e) {
      setMsg({ ok: false, text: e.message || 'Could not save' });
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-4" data-name={`month-${n}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[var(--primary-color)]">Month {n}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge[1]}`}>{badge[0]}</span>
      </div>
      <DatePickButton label="START DATE" value={start} onChange={v => { setStart(v); setMsg(null); }} disabled={!canEdit} />
      <DatePickButton label="END DATE" value={end} onChange={v => { setEnd(v); setMsg(null); }} disabled={!canEdit} />
      <p className="text-xs text-gray-500 min-h-[1rem]">
        {days ? `${days} day${days === 1 ? '' : 's'} long` : ''}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}
      <button
        onClick={handleSave}
        disabled={!canEdit || saving || !dirty || !start || !end || !!error}
        className="w-full py-2.5 rounded-lg font-semibold text-white bg-[var(--primary-color)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'SAVE'}
      </button>
    </div>
  );
}

function MonthsView({ canEdit, onChanged }) {
  try {
    const [, force] = React.useReducer(x => x + 1, 0);
    const [loading, setLoading] = React.useState(true);
    const [loadError, setLoadError] = React.useState('');

    React.useEffect(() => {
      loadMonthPeriods().then(() => setLoading(false)).catch(e => { setLoadError(e.message || 'Could not load months'); setLoading(false); });
    }, []);

    const current = getCurrentMonth();
    const summary = current === 0 ? 'No month is running right now.'
      : current === 4 ? 'All three months have ended.'
      : `Month ${current} is running now (${getMonthDateRange(current)}).`;

    if (loading) return <div className="text-gray-500 py-10 text-center">Loading months...</div>;

    return (
      <div className="max-w-5xl mx-auto" data-name="months-view">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Months</h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose when each payment month starts and ends. Students see these dates, and PAID / UNPAID follows them:
            a month that has not started shows UPCOMING, and once it starts an unpaid month shows UNPAID.
          </p>
          <div className="mt-3 inline-block bg-[var(--secondary-color)] text-[var(--primary-color)] text-sm font-semibold px-4 py-2 rounded-lg">{summary}</div>
          {!canEdit && <p className="mt-3 text-sm text-yellow-700">Only the Founder &amp; CEO and the Chief Financial Officer can change these dates.</p>}
          {loadError && <p className="mt-3 text-sm text-red-600">{loadError}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MONTH_NUMBERS.map(n => (
            <MonthCard key={n} n={n} canEdit={canEdit} onSaved={() => { force(); onChanged && onChanged(); }} />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('MonthsView error:', error);
    return null;
  }
}
