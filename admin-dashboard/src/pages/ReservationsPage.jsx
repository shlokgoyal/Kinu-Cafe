import { useEffect, useState } from 'react';
import { reservationsApi, tablesApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Empty from '../components/Empty';
import { formatDateShort, statusBadge } from '../utils/format';

export default function ReservationsPage() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [tables, setTables] = useState([]);
  const [filter, setFilter] = useState({ status: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ status: '', table: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = filter.status ? { status: filter.status } : {};
      const [{ reservations }, { tables }] = await Promise.all([
        reservationsApi.list(params),
        tablesApi.list(),
      ]);
      setList(reservations);
      setTables(tables);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter.status]);

  const openEdit = (r) => {
    setEditing(r);
    setForm({ status: r.status, table: r.table?._id || '' });
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = { status: form.status };
      if (form.table) body.table = form.table;
      await reservationsApi.update(editing._id, body);
      toast.success('Updated');
      setEditing(null);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Reservations"
        subtitle="Manage bookings, assign tables, and confirm"
        actions={<button className="btn-secondary" onClick={load}>Refresh</button>}
      />

      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Status</label>
          <select className="input" value={filter.status}
            onChange={(e) => setFilter({ status: e.target.value })}>
            <option value="">All</option>
            {['pending', 'confirmed', 'cancelled', 'completed'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : list.length === 0 ? (
        <Empty title="No reservations" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Phone</th><th>Date</th><th>Time</th><th>Party</th><th>Table</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r._id}>
                  <td>{r.name || r.user?.name || '—'}</td>
                  <td className="text-xs">{r.phone || r.user?.phone || '—'}</td>
                  <td className="text-xs">{formatDateShort(r.date)}</td>
                  <td className="text-xs">{r.time || '—'}</td>
                  <td>{r.partySize || '—'}</td>
                  <td>{r.table?.number || '—'}</td>
                  <td><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td className="text-right">
                    <button className="btn-secondary" onClick={() => openEdit(r)}>Manage</button>
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
          title={`Reservation · ${editing.name || editing.user?.name || editing._id}`}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? <Spinner size="sm" /> : 'Save'}
              </button>
            </>
          }
        >
          <div className="space-y-3">
            {editing.specialRequest && (
              <div className="text-sm bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <b>Request:</b> {editing.specialRequest}
              </div>
            )}
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['pending', 'confirmed', 'cancelled', 'completed'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Assign table</label>
              <select className="input" value={form.table}
                onChange={(e) => setForm({ ...form, table: e.target.value })}>
                <option value="">— none —</option>
                {tables.map((t) => (
                  <option key={t._id} value={t._id}>
                    Table {t.number}{t.label ? ` · ${t.label}` : ''} (cap {t.capacity || '—'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
