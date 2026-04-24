import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import { formatCurrency } from '../utils/format';

export default function DashboardPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.stats();
      setStats(data);
    } catch (e) {
      toast.error(errMsg(e, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }
  if (!stats) return null;

  const { today, tables, pendingReservations } = stats;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Today's activity at a glance"
        actions={<button className="btn-secondary" onClick={load}>Refresh</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Orders today"       value={today.orders}                icon="🧾" />
        <StatCard label="Paid orders"        value={today.paidOrders}            icon="✅" />
        <StatCard label="Revenue today"      value={formatCurrency(today.revenue)} icon="💰" />
        <StatCard label="Avg ticket"         value={formatCurrency(today.avgTicket)} icon="📈" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-sm mb-4">Top items today</h2>
          {today.topItems?.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {today.topItems.map((i) => (
                <li key={i._id} className="flex items-center justify-between py-2">
                  <span className="text-sm">{i.name}</span>
                  <span className="text-sm font-semibold">×{i.quantity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No paid orders yet today.</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-sm mb-4">Tables</h2>
          <div className="space-y-2 text-sm">
            <Row label="Total"     value={tables.total} />
            <Row label="Available" value={tables.available || 0} />
            <Row label="Occupied"  value={tables.occupied || 0} />
            <Row label="Reserved"  value={tables.reserved  || 0} />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-semibold mb-1">Reservations pending</h3>
            <div className="text-2xl font-semibold">{pendingReservations}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
