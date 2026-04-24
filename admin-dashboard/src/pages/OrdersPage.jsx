import { useEffect, useMemo, useState } from 'react';
import { ordersApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Empty from '../components/Empty';
import { formatCurrency, formatDate, statusBadge } from '../utils/format';

const STATUS_FLOW = ['placed', 'preparing', 'ready', 'served'];

export default function OrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', billingStatus: '' });
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.billingStatus) params.billingStatus = filters.billingStatus;
      const { orders } = await ordersApi.list(params);
      setOrders(orders);
    } catch (e) {
      toast.error(errMsg(e, 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.status, filters.billingStatus]);

  const onRowClick = async (o) => {
    try {
      const { order } = await ordersApi.get(o._id);
      setSelected(order);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Track the kitchen flow and settle bills at reception"
        actions={<button className="btn-secondary" onClick={load}>Refresh</button>}
      />

      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All</option>
            {['placed', 'preparing', 'ready', 'served', 'cancelled'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Billing</label>
          <select
            className="input"
            value={filters.billingStatus}
            onChange={(e) => setFilters((f) => ({ ...f, billingStatus: e.target.value }))}
          >
            <option value="">All</option>
            {['unbilled', 'billed', 'paid'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : orders.length === 0 ? (
        <Empty title="No orders found" hint="Try changing the filters." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Table</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Status</th>
                <th>Billing</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="cursor-pointer" onClick={() => onRowClick(o)}>
                  <td className="font-mono text-xs">{o.orderNumber}</td>
                  <td>{o.table?.number || '—'}</td>
                  <td>{o.user?.name || o.user?.phone || '—'}</td>
                  <td>{o.items.reduce((a, i) => a + i.quantity, 0)}</td>
                  <td>{formatCurrency(o.subtotal)}</td>
                  <td><span className={statusBadge(o.status)}>{o.status}</span></td>
                  <td><span className={statusBadge(o.billingStatus)}>{o.billingStatus}</span></td>
                  <td className="text-xs text-slate-500">{formatDate(o.placedAt || o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onChanged={(updated) => {
            setSelected(updated);
            setOrders((list) => list.map((o) => (o._id === updated._id ? updated : o)));
          }}
        />
      )}
    </div>
  );
}

function OrderDetailModal({ order, onClose, onChanged }) {
  const toast = useToast();
  const [billing, setBilling] = useState(false);
  const [couponCode, setCouponCode] = useState(order.discounts?.coupon?.code || '');
  const [redeemPoints, setRedeemPoints] = useState('');
  const [paying, setPaying] = useState(false);

  const nextStatus = useMemo(() => {
    const i = STATUS_FLOW.indexOf(order.status);
    return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
  }, [order.status]);

  const advance = async () => {
    if (!nextStatus) return;
    try {
      const { order: updated } = await ordersApi.updateStatus(order._id, nextStatus);
      toast.success(`Status → ${nextStatus}`);
      onChanged(updated);
    } catch (e) { toast.error(errMsg(e)); }
  };

  const cancel = async () => {
    if (!confirm('Cancel this order?')) return;
    try {
      const { order: updated } = await ordersApi.cancel(order._id);
      toast.success('Order cancelled');
      onChanged(updated);
    } catch (e) { toast.error(errMsg(e)); }
  };

  const generateBill = async () => {
    setBilling(true);
    try {
      const body = {};
      if (couponCode) body.couponCode = couponCode.trim();
      if (redeemPoints) body.redeemPoints = Number(redeemPoints);
      const { order: updated } = await ordersApi.bill(order._id, body);
      toast.success('Bill generated');
      onChanged(updated);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBilling(false); }
  };

  const pay = async (method) => {
    setPaying(true);
    try {
      const { order: updated } = await ordersApi.pay(order._id, method);
      toast.success(`Marked paid (${method})`);
      onChanged(updated);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setPaying(false); }
  };

  const { discounts = {} } = order;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Order ${order.orderNumber}`}
      size="lg"
      footer={
        <>
          {order.status !== 'cancelled' && order.billingStatus !== 'paid' && (
            <button className="btn-danger" onClick={cancel}>Cancel order</button>
          )}
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Info label="Table"  value={order.table?.number || '—'} />
        <Info label="Customer" value={order.user?.name || order.user?.phone || '—'} />
        <Info label="Placed" value={formatDate(order.placedAt || order.createdAt)} />
        <Info label="Status"  value={<span className={statusBadge(order.status)}>{order.status}</span>} />
        <Info label="Billing" value={<span className={statusBadge(order.billingStatus)}>{order.billingStatus}</span>} />
        <Info label="Payment" value={order.paymentMethod || '—'} />
      </div>

      <div className="card p-3 mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-600">Kitchen flow</div>
        <div className="flex gap-2">
          {nextStatus && order.status !== 'cancelled' && (
            <button className="btn-primary" onClick={advance}>
              Move to "{nextStatus}"
            </button>
          )}
        </div>
      </div>

      <div className="table-wrap mb-4">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th><th>Qty</th><th className="text-right">Price</th><th className="text-right">Line</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i, idx) => (
              <tr key={idx}>
                <td>{i.name}{i.notes && <div className="text-xs text-slate-500">{i.notes}</div>}</td>
                <td>{i.quantity}</td>
                <td className="text-right">{formatCurrency(i.price)}</td>
                <td className="text-right">{formatCurrency(i.price * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-sm mb-3">Billing</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Coupon code (optional)</label>
            <input className="input uppercase" value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)} placeholder="WELCOME10" />
          </div>
          <div>
            <label className="label">Redeem loyalty points (optional)</label>
            <input type="number" min="0" className="input" value={redeemPoints}
              onChange={(e) => setRedeemPoints(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="flex justify-end mb-3">
          <button className="btn-secondary" onClick={generateBill} disabled={billing || order.status === 'cancelled'}>
            {billing ? <Spinner size="sm" /> : 'Generate / recalc bill'}
          </button>
        </div>

        <div className="border-t border-slate-200 pt-3 text-sm space-y-1">
          <Line label="Subtotal" value={formatCurrency(order.subtotal)} />
          {discounts?.coupon?.amount > 0 && (
            <Line label={`Coupon (${discounts.coupon.code})`} value={`- ${formatCurrency(discounts.coupon.amount)}`} />
          )}
          {discounts?.birthday?.amount > 0 && (
            <Line label={`Birthday (${discounts.birthday.percent}%)`} value={`- ${formatCurrency(discounts.birthday.amount)}`} />
          )}
          {discounts?.loyalty?.amount > 0 && (
            <Line label={`Loyalty (${discounts.loyalty.pointsRedeemed} pts)`} value={`- ${formatCurrency(discounts.loyalty.amount)}`} />
          )}
          <Line label={`Tax (${(order.taxRate * 100).toFixed(1)}%)`} value={formatCurrency(order.taxAmount)} />
          <Line label="Total" value={formatCurrency(order.totalAmount)} bold />
          {order.pointsEarned > 0 && (
            <div className="text-xs text-slate-500 pt-1">+{order.pointsEarned} loyalty points will be credited on payment.</div>
          )}
        </div>

        {order.billingStatus === 'billed' && (
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => pay('cash')} disabled={paying}>Paid — Cash</button>
            <button className="btn-secondary" onClick={() => pay('card')} disabled={paying}>Paid — Card</button>
            <button className="btn-primary"   onClick={() => pay('upi')}  disabled={paying}>Paid — UPI</button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm mt-1">{value}</div>
    </div>
  );
}

function Line({ label, value, bold }) {
  return (
    <div className={'flex justify-between ' + (bold ? 'font-semibold text-base pt-2 border-t border-slate-200' : '')}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
