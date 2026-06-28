import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';

const GENRE_COLORS = [
  '#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#8b5cf6', '#14b8a6', '#f97316',
  '#6366f1', '#84cc16',
];

const TIER_COLOR_MAP = {
  S: '#FFD700',
  A: '#10B981',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#EF4444',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-navy-800/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      {label && <p className="text-xs text-gray-400 mb-1 font-medium">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color || entry.fill }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export function GenrePieChart({ data = [], height = 300 }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500 text-sm">No genre data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={GENRE_COLORS[index % GENRE_COLORS.length]}
              className="transition-all duration-300 hover:opacity-80"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span className="text-xs text-gray-300">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TierBarChart({ data = [], height = 300 }) {
  const tierData = data.length
    ? data
    : ['S', 'A', 'B', 'C', 'D'].map((t) => ({ tier: t, count: 0 }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={tierData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="tier"
          tick={{ fill: '#9ca3af', fontSize: 14, fontWeight: 700 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Movies" radius={[8, 8, 0, 0]} maxBarSize={50}>
          {tierData.map((entry) => (
            <Cell
              key={entry.tier}
              fill={TIER_COLOR_MAP[entry.tier] || '#7c3aed'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RatingLineChart({ data = [], height = 300 }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500 text-sm">No rating history available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="ratingGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 10]}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="rating"
          name="Rating"
          stroke="url(#ratingGradient)"
          strokeWidth={3}
          dot={{ fill: '#7c3aed', r: 4, strokeWidth: 0 }}
          activeDot={{ fill: '#a78bfa', r: 6, strokeWidth: 2, stroke: '#7c3aed' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
