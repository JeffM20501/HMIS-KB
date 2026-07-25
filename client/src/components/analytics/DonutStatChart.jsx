import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DEFAULT_COLORS = ['#10B981', '#2563EB', '#EF4444', '#8B5CF6', '#F59E0B', '#6B7280'];

export default function DonutStatChart({ data, colors = DEFAULT_COLORS, valueKey = 'value', nameKey = 'name' }) {
  return (
    <div className="flex items-center gap-6">
      <div className="w-40 h-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius={45} outerRadius={70} paddingAngle={3}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d[nameKey]} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-text-primary">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              {d[nameKey]}
            </span>
            <span className="font-medium text-text-primary">{d[valueKey]}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
