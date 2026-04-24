import { useEffect, useState } from 'react';
import { categoriesApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import Empty from '../components/Empty';
import { statusBadge } from '../utils/format';

const emptyForm = { name: '', description: '', image: '', displayOrder: 0, isActive: true };

export default function CategoriesPage() {
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
      const { categories } = await categoriesApi.list();
      setList(categories);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing('new'); setForm(emptyForm); };
  const openEdit = (c) => {
    setEditing(c._id);
    setForm({
      name: c.name || '',
      description: c.description || '',
      image: c.image || '',
      displayOrder: c.displayOrder || 0,
      isActive: c.isActive !== false,
    });
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editing === 'new') {
        await categoriesApi.create(form);
        toast.success('Category created');
      } else {
        await categoriesApi.update(editing, form);
        toast.success('Category updated');
      }
      setEditing(null);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await categoriesApi.remove(toDelete._id);
      toast.success('Deleted');
      setToDelete(null);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organize menu items into visible groups"
        actions={<button className="btn-primary" onClick={openNew}>+ New category</button>}
      />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : list.length === 0 ? (
        <Empty title="No categories yet" action={<button className="btn-primary" onClick={openNew}>+ Add your first</button>} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Slug</th><th>Order</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c._id}>
                  <td className="font-medium">{c.name}</td>
                  <td className="font-mono text-xs text-slate-500">{c.slug}</td>
                  <td>{c.displayOrder || 0}</td>
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
          title={editing === 'new' ? 'New category' : 'Edit category'}
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
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Image URL</label>
              <input className="input" value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Display order</label>
                <input type="number" className="input" value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete category?"
        message={`This will remove "${toDelete?.name}". Menu items in this category may break.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
