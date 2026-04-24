import { useEffect, useState } from 'react';
import { couponsApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import Empty from '../components/Empty';
import { formatCurrency, formatDateShort, statusBadge, toDateInput } from '../utils/format';

const emptyForm = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  maxDiscount: '',
  minOrderAmount: 0,
  usageLimit: '',
  usagePerUser: 1,
  validFrom: '',
  validTo: '',
  isActive: true,
};

export default function CouponsPage() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { coupons } = await couponsApi.list();
      setList(coupons);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing('new'); setForm(emptyForm); };
  const openEdit = (c) => {
    setEditing(c._id);
    setForm({
      code: c.code || '',
      description: c.description || '',
      discountType: c.discountType || 'percentage',
      discountValue: c.discountValue || 0,
      maxDiscount: c.maxDiscount ?? '',
      minOrderAmount: c.minOrderAmount || 0,
      usageLimit: c.usageLimit ?? '',
      usagePerUser: c.usagePerUser ?? 1,
      validFrom: toDateInput(c.validFrom),
      validTo: toDateInput(c.validTo),
      isActive: c.isActive !== false,
    });
  };

  const save = async () => {
    if (!form.code.trim() || !form.validTo) {
      toast.error('Code and valid-to date are required');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        code: form.code.trim().toUpperCase(),
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount || 0),
        usagePerUser: Number(form.usagePerUser || 1),
      };
      if (form.maxDiscount !== '') body.maxDiscount = Number(form.maxDiscount);
      if (form.usageLimit !== '') body.usageLimit = Number(form.usageLimit);
      if (form.validFrom) body.validFrom = new Date(form.validFrom).toISOString();
      body.validTo = new Date(form.validTo).toISOString();

      if (editing === 'new') {
        await couponsApi.create(body);
        toast.success('Coupon created');
      } else {
        await couponsApi.update(editing, body);
        toast.success('Coupon updated');
      }
      setEditing(null);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await couponsApi.remove(toDelete._id);
      toast.success('Deleted');
      setToDelete(null);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle="Promo codes for customers"
        actions={<button className="btn-primary" onClick={openNew}>+ New coupon</button>}
      />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : list.length === 0 ? (
        <Empty title="No coupons yet" action={<button className="btn-primary" onClick={openNew}>+ Create coupon</button>} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th><th>Discount</th><th>Min order</th><th>Usage</th><th>Valid till</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div className="font-mono font-semibold">{c.code}</div>
                    {c.description && <div className="text-xs text-slate-500">{c.description}</div>}
                  </td>
                  <td>
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                    {c.maxDiscount ? <span className="text-xs text-slate-500"> (cap {formatCurrency(c.maxDiscount)})</span> : null}
                  </td>
                  <td>{c.minOrderAmount ? formatCurrency(c.minOrderAmount) : '—'}</td>
                  <td className="text-xs">
                    {c.usedCount || 0}{c.usageLimit ? `/${c.usageLimit}` : ''}
                    <div className="text-slate-500">per user: {c.usagePerUser || 1}</div>
                  </td>
                  <td className="text-xs">{formatDateShort(c.validTo)}</td>
                  <td><span className={statusBadge(c.isActive ? 'active' : 'inactive')}>{c.isActive ? 'active' : 'inactive'}</span></td>
                  <td className="text-right space-x-2">
                    <button className="btn-secondary" onClick={() => openEdit(c)}>Edit</button>
                    <button className="btn-danger" onClick={() => setToDelete(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing === 'new' ? 'New coupon' : 'Edit coupon'}
          size="lg"
          footer={
            <>
              <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? <Spinner size="sm" /> : 'Save'}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Code</label>
              <input className="input uppercase" value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="WELCOME10" />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                <option value="percentage">Percentage</option>
                <option value="flat">Flat amount</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <input className="input" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Value ({form.discountType === 'percentage' ? '%' : '₹'})</label>
              <input type="number" className="input" value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
            </div>
            <div>
              <label className="label">Max discount (₹, for %-type)</label>
              <input type="number" className="input" value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
            </div>
            <div>
              <label className="label">Min order amount (₹)</label>
              <input type="number" className="input" value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
            </div>
            <div>
              <label className="label">Total usage limit</label>
              <input type="number" className="input" value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="blank = unlimited" />
            </div>
            <div>
              <label className="label">Per-user limit</label>
              <input type="number" className="input" value={form.usagePerUser}
                onChange={(e) => setForm({ ...form, usagePerUser: e.target.value })} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
            </div>
            <div>
              <label className="label">Valid from</label>
              <input type="date" className="input" value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
            </div>
            <div>
              <label className="label">Valid to</label>
              <input type="date" className="input" value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete coupon?"
        message={`Remove coupon "${toDelete?.code}"?`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
