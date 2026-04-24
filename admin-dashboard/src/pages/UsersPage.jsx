import { useEffect, useState } from 'react';
import { usersApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import Empty from '../components/Empty';
import { formatDateShort, statusBadge } from '../utils/format';

const emptyForm = { name: '', email: '', password: '', role: 'staff', isActive: true };

export default function UsersPage() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.role) params.role = filters.role;
      if (filters.search) params.search = filters.search;
      const { users } = await usersApi.list(params);
      setList(users);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters.role]);

  const openNew = () => { setEditing('new'); setForm(emptyForm); };
  const openEdit = (u) => {
    setEditing(u._id);
    setForm({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'staff',
      isActive: u.isActive !== false,
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing === 'new') {
        if (!form.email || !form.password) { toast.error('Email and password required'); return; }
        await usersApi.create({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        toast.success('User created');
      } else {
        const body = { name: form.name, role: form.role, isActive: form.isActive };
        if (form.email) body.email = form.email;
        if (form.password) body.password = form.password;
        await usersApi.update(editing, body);
        toast.success('User updated');
      }
      setEditing(null);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await usersApi.remove(toDelete._id);
      toast.success('Deleted');
      setToDelete(null);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Admin, staff and customer accounts"
        actions={<button className="btn-primary" onClick={openNew}>+ New admin/staff</button>}
      />

      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Role</label>
          <select className="input" value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
            <option value="">All</option>
            <option value="admin">admin</option>
            <option value="staff">staff</option>
            <option value="customer">customer</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="label">Search</label>
          <input className="input" value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
            placeholder="name, email or phone" />
        </div>
        <button className="btn-secondary" onClick={load}>Apply</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : list.length === 0 ? (
        <Empty title="No users" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Points</th><th>Active</th><th>Joined</th><th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u._id}>
                  <td>{u.name || '—'}</td>
                  <td className="text-xs">{u.email || '—'}</td>
                  <td className="text-xs">{u.phone || '—'}</td>
                  <td><span className={statusBadge(u.role === 'admin' ? 'billed' : u.role === 'staff' ? 'reserved' : 'unbilled')}>{u.role}</span></td>
                  <td>{u.loyaltyPoints || 0}</td>
                  <td><span className={statusBadge(u.isActive !== false ? 'active' : 'inactive')}>{u.isActive !== false ? 'active' : 'off'}</span></td>
                  <td className="text-xs text-slate-500">{formatDateShort(u.createdAt)}</td>
                  <td className="text-right space-x-2">
                    <button className="btn-secondary" onClick={() => openEdit(u)}>Edit</button>
                    {u.role !== 'customer' && (
                      <button className="btn-danger" onClick={() => setToDelete(u)}>Delete</button>
                    )}
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
          title={editing === 'new' ? 'New admin/staff user' : 'Edit user'}
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
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">{editing === 'new' ? 'Password' : 'New password (blank = unchanged)'}</label>
              <input type="password" className="input" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="staff">staff</option>
                  <option value="admin">admin</option>
                  {editing !== 'new' && <option value="customer">customer</option>}
                </select>
              </div>
              {editing !== 'new' && (
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                    Active
                  </label>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete user?"
        message={`Permanently remove "${toDelete?.name || toDelete?.email}"?`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
