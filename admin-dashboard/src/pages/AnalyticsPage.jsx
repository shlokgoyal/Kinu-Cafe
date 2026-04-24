import { useEffect, useMemo, useState } from 'react';
import { analyticsApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import Empty from '../components/Empty';
import { formatCurrency, toDateInput } from '../utils/format';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateInput(d);
}

export default function AnalyticsPage() {
  const toast = useToast();
  const [range, setRange] = useState({ from: daysAgo(29), to: toDateInput(new Date()), groupBy: 'day' });
  const [sales, setSales] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [customers, setCustomers] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = {
        from: new Date(range.from).toISOString(),
        to: new Date(range.to + 'T23:59:59').toISOString(),
        groupBy: range.groupBy,
      };
      const [s, ti, c] = await Promise.all([
        analyticsApi.sales(params),
        analyticsApi.topItems({ from: params.from, to: params.to, limit: 10 }),
        analyticsApi.customers(),
      ]);
      setSales(s);
      setTopItems(ti.items || []);
      setCustomers(c);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    if (!sales?.rows) return { revenue: 0, orders: 0 };
    return sales.rows.reduce(
      (a, r) => ({ revenue: a.revenue + (r.revenue || 0), orders: a.orders + (r.orders || 0) }),
      { revenue: 0, orders: 0 }
    );
  }, [sales]);

  const maxRev = useMemo(
    () => (sales?.rows || []).reduce((m, r) => Math.max(m, r.revenue || 0), 0),
    [sales]
  );

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Revenue, top items, and customer mix" />

      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={range.from}
            onChange={(e) => setRange({ ...range, from: e.target.value })} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={range.to}
            onChange={(e) => setRange({ ...range, to: e.target.value })} />
        </div>
        <div>
          <label className="label">Group by</label>
          <select className="input" value={range.groupBy}
            onChange={(e) => setRange({ ...range, groupBy: e.target.value })}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <button className="btn-primary" onClick={load}>Apply</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Revenue" value={formatCurrency(totals.revenue)} icon="💰" />
            <StatCard label="Paid orders" value={totals.orders} icon="🧾" />
            <StatCard label="Customers (total)" value={customers?.totalCustomers ?? '—'} icon="👥" />
            <StatCard label="New this month" value={customers?.newThisMonth ?? '—'} icon="🆕"
              hint={`Returning: ${customers?.returning ?? 0}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="card p-5 lg:col-span-2">
              <h2 className="font-semibold text-sm mb-4">Revenue by {range.groupBy}</h2>
              {sales?.rows?.length ? (
                <div className="space-y-2">
                  {sales.rows.map((r) => (
                    <div key={r._id} className="flex items-center gap-3 text-sm">
                      <div className="w-24 text-xs text-slate-500 font-mono">{r._id}</div>
                      <div className="flex-1 bg-slate-100 rounded h-4 overflow-hidden">
                        <div
                          className="bg-brand-500 h-full"
                          style={{ width: `${maxRev ? (r.revenue / maxRev) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="w-24 text-right font-medium">{formatCurrency(r.revenue)}</div>
                      <div className="w-12 text-right text-xs text-slate-500">×{r.orders}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty title="No paid orders in range" />
              )}
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-sm mb-4">Top items</h2>
              {topItems.length ? (
                <ul className="divide-y divide-slate-100">
                  {topItems.map((i) => (
                    <li key={i._id} className="flex items-center justify-between py-2 text-sm">
                      <span className="truncate pr-2">{i.name}</span>
                      <span className="font-semibold">×{i.quantity}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No data.</p>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-sm mb-4">Birthday customers this month</h2>
            {customers?.birthdayThisMonth?.length ? (
              <ul className="divide-y divide-slate-100">
                {customers.birthdayThisMonth.map((u) => (
                  <li key={u._id} className="flex items-center justify-between py-2 text-sm">
                    <span>{u.name || u.phone || u.email}</span>
                    <span className="text-slate-500 text-xs">{u.phone || u.email}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No birthdays on file this month.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
