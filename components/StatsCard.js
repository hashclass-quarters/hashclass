function StatsCard({ title, value, icon, color }) {
  try {
    return (
      <div className="bg-white rounded-xl shadow-md p-6" data-name="stats-card" data-file="components/StatsCard.js">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-[var(--text-dark)]">{value}</p>
          </div>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-${color}-100`}>
            <div className={`icon-${icon} text-2xl text-${color}-600`}></div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('StatsCard error:', error);
    return null;
  }
}