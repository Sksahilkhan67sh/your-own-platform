import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCompactPrice, formatDate } from '../../lib/format.js';

const GRID_COLOR = '#DDD5C5'; // border
const ACCENT = '#44574A';
const ACCENT_SOFT = '#8A6D3B';
const AXIS_COLOR = '#5C5448'; // ink-soft

const tooltipStyle = {
  borderRadius: 6,
  border: '1px solid #DDD5C5',
  background: '#F7F4EE',
  fontSize: 13,
};

/** Groups the recent nearby-sold list into a per-month sale count. Built
 * from real sale records (nearbySoldProperties), not synthetic data — the
 * tradeoff is it only reflects the most recent sales the API returns
 * (capped at 12), so it's a recent-activity view, not a full history. */
function buildMonthlySales(nearbySoldProperties) {
  const byMonth = new Map();
  for (const sale of nearbySoldProperties) {
    if (!sale.soldDate) continue;
    const d = new Date(sale.soldDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(key, (byMonth.get(key) || 0) + 1);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      const [year, month] = key.split('-');
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IN', {
        month: 'short',
        year: '2-digit',
      });
      return { month: label, count };
    });
}

export function MonthlySalesChart({ nearbySoldProperties }) {
  const data = buildMonthlySales(nearbySoldProperties);
  if (data.length === 0) return <ChartEmpty label="No recent sales to chart yet." />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="month" tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#EFE9DD' }} />
        <Bar dataKey="count" name="Sales" fill={ACCENT} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PriceTrendChart({ nearbySoldProperties }) {
  const data = [...nearbySoldProperties]
    .filter((s) => s.soldDate && typeof s.soldPrice === 'number')
    .sort((a, b) => new Date(a.soldDate) - new Date(b.soldDate))
    .map((s) => ({ date: formatDate(s.soldDate), price: s.soldPrice }));

  if (data.length === 0) return <ChartEmpty label="No recent sales to chart yet." />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="date" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
        <YAxis
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatCompactPrice(v)}
          width={64}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCompactPrice(v)} />
        <Line type="monotone" dataKey="price" name="Sale price" stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Compares the two rolling 6-month windows the backend already computes
 * the growth percentage from — this is what "price appreciation" actually
 * is here, not a fabricated monthly series. */
export function PriceAppreciationChart({ priceTrend, priceGrowth }) {
  if (!priceTrend || priceTrend.priorWindowAvg === null) {
    return <ChartEmpty label="Not enough sale history yet to show a trend." />;
  }

  const data = [
    { period: '6–12 months ago', price: priceTrend.priorWindowAvg },
    { period: 'Last 6 months', price: priceTrend.recentWindowAvg || 0 },
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
          <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactPrice(v)} />
          <YAxis type="category" dataKey="period" tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCompactPrice(v)} />
          <Bar dataKey="price" fill={ACCENT_SOFT} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {priceGrowth !== null && (
        <p className="mt-1 text-center text-sm text-ink-soft">
          {priceGrowth > 0 ? '+' : ''}
          {priceGrowth}% average price change
        </p>
      )}
    </div>
  );
}

export function SoldVsActivePieChart({ sold1Year, activeListings }) {
  const data = [
    { name: 'Sold (last year)', value: sold1Year },
    { name: 'Active listings', value: activeListings },
  ];

  if (sold1Year === 0 && activeListings === 0) {
    return <ChartEmpty label="No sales or listings nearby yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
          <Cell fill={ACCENT} />
          <Cell fill="#DCE5DD" />
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ChartEmpty({ label }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-center text-sm text-ink-soft">{label}</div>
  );
}
