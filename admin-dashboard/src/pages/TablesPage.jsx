import { useEffect, useState } from 'react';
import { tablesApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import Empty from '../components/Empty';
import { statusBadge } from '../utils/format';

const emptyForm = { number: '', label: '', capacity: 4, status: 'available', isActive: true };

export default function TablesPage() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [qrShown, setQrShown] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { tables } = await tablesApi.list();
      setList(tables);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing('new'); setForm(emptyForm); };
  const openEdit = (t) => {
    setEditing(t._id);
    setForm({
      number: t.number || '',
      label: t.label || '',
      capacity: t.capacity || 4,
      status: t.status || 'available',
      isActive: t.isActive !== false,
    });
  };

  const save = async () => {
    if (!String(form.number).trim()) { toast.error('Table number is required'); return; }
    setSaving(true);
    try {
      const body = { ...form, number: String(form.number), capacity: Number(form.capacity) };
      if (editing === 'new') {
        await tablesApi.create(body);
        toast.success('Table created (QR generated)');
      } else {
        await tablesApi.update(editing, body);
        toast.success('Table updated');
      }
      setEditing(null);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const regenerate = async (t) => {
    if (!confirm(`Regenerate QR for table ${t.number}? Old QR stops working.`)) return;
    try {
      const { table } = await tablesApi.regenerateQr(t._id);
      toast.success('New QR generated');
      setList((list) => list.map((x) => (x._id === table._id ? table : x)));
      setQrShown(table);
    } catch (e) { toast.error(errMsg(e)); }
  };

  const confirmDelete = async () => {
    try {
      await tablesApi.remove(toDelete._id);
      toast.success('Deleted');
      setToDelete(null);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader
        title="Tables"
        subtitle="Dine-in tables with QR ordering"
        actions={<button className="btn-primary" onClick={openNew}>+ New table</button>}
      />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : list.length === 0 ? (
        <Empty title="No tables yet" action={<button className="btn-primary" onClick={openNew}>+ Add first table</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((t) => (
            <div key={t._id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-lg font-semibold">Table {t.number}</div>
                  {t.label && <div className="text-xs text-slate-500">{t.label}</div>}
                </div>
                <span className={statusBadge(t.status)}>{t.status}</span>
              </div>
              <div className="text-sm text-slate-600 mb-3">Capacity: {t.capacity || '—'}</div>
              <div className="text-xs text-slate-500 font-mono break-all mb-3">
                {t.qrUrl || `token: ${t.qrToken}`}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button className="btn-secondary" onClick={() => setQrShown(t)}>View QR</button>
                <button className="btn-secondary" onClick={() => openEdit(t)}>Edit</button>
                <button className="btn-secondary" onClick={() => regenerate(t)}>Regen QR</button>
                <button className="btn-danger" onClick={() => setToDelete(t)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing === 'new' ? 'New table' : 'Edit table'}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? <Spinner size="sm" /> : 'Save'}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Number</label>
              <input className="input" value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })} />
            </div>
            <div>
              <label className="label">Capacity</label>
              <input type="number" className="input" value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Label</label>
              <input className="input" value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Window side" />
            </div>
            {editing !== 'new' && (
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {['available', 'occupied', 'reserved'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
            </div>
          </div>
        </Modal>
      )}

      {qrShown && (
        <Modal
          open
          onClose={() => setQrShown(null)}
          title={`QR for Table ${qrShown.number}`}
          footer={<button className="btn-secondary" onClick={() => setQrShown(null)}>Close</button>}
        >
          <div className="text-center">
            {qrShown.qrUrl && (
              <img
                className="mx-auto mb-3 border border-slate-200 rounded-lg"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrShown.qrUrl)}`}
                alt="QR code"
              />
            )}
            <div className="text-xs font-mono break-all text-slate-600 bg-slate-50 p-2 rounded">
              {qrShown.qrUrl || qrShown.qrToken}
            </div>
            <p className="text-xs text-slate-500 mt-3">Place this QR on the table so customers can scan and order.</p>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete table?"
        message={`Remove table ${toDelete?.number}? Its QR will stop working.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
