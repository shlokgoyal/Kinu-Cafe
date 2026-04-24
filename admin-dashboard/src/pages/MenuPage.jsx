import { useEffect, useState } from 'react';
import { menuApi, categoriesApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import Empty from '../components/Empty';
import { formatCurrency, statusBadge } from '../utils/format';

const emptyForm = {
  name: '', description: '', price: 0, category: '',
  image: '', tags: '', isVeg: true, isAvailable: true, preparationTimeMins: 10,
};

export default function MenuPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', search: '' });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [mi, cats] = await Promise.all([
        menuApi.list({
          ...(filter.category ? { category: filter.category } : {}),
          ...(filter.search ? { search: filter.search } : {}),
        }),
        categoriesApi.list(),
      ]);
      setItems(mi.items);
      setCategories(cats.categories);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter.category]);

  const openNew = () => {
    setEditing('new');
    setForm({ ...emptyForm, category: categories[0]?._id || '' });
  };

  const openEdit = (it) => {
    setEditing(it._id);
    setForm({
      name: it.name || '',
      description: it.description || '',
      price: it.price || 0,
      category: it.category?._id || it.category || '',
      image: it.image || '',
      tags: (it.tags || []).join(', '),
      isVeg: it.isVeg !== false,
      isAvailable: it.isAvailable !== false,
      preparationTimeMins: it.preparationTimeMins || 10,
    });
  };

  const save = async () => {
    if (!form.name.trim() || !form.category) { toast.error('Name + category are required'); return; }
    setSaving(true);
    try {
      const body = {
        ...form,
        price: Number(form.price),
        preparationTimeMins: Number(form.preparationTimeMins),
        tags: form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };
      if (editing === 'new') {
        await menuApi.create(body);
        toast.success('Item created');
      } else {
        await menuApi.update(editing, body);
        toast.success('Item updated');
      }
      setEditing(null);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const toggleAvailability = async (it) => {
    try {
      await menuApi.toggleAvailability(it._id, !it.isAvailable);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  const confirmDelete = async () => {
    try {
      await menuApi.remove(toDelete._id);
      toast.success('Deleted');
      setToDelete(null);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader
        title="Menu items"
        subtitle="Your full menu — update prices, availability, and details"
        actions={<button className="btn-primary" onClick={openNew}>+ New item</button>}
      />

      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Category</label>
          <select className="input" value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
            <option value="">All</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="label">Search</label>
          <input className="input" value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
            placeholder="Name or description..." />
        </div>
        <button className="btn-secondary" onClick={load}>Apply</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <Empty title="No menu items" hint="Add your first item to get started." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Category</th><th>Price</th><th>Veg</th><th>Available</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it._id}>
                  <td>
                    <div className="font-medium">{it.name}</div>
                    {it.tags?.length > 0 && (
                      <div className="text-xs text-slate-500">{it.tags.join(', ')}</div>
                    )}
                  </td>
                  <td>{it.category?.name || '—'}</td>
                  <td>{formatCurrency(it.price)}</td>
                  <td>{it.isVeg ? '🟢' : '🔴'}</td>
                  <td>
                    <button onClick={() => toggleAvailability(it)}
                      className={statusBadge(it.isAvailable ? 'active' : 'inactive') + ' cursor-pointer'}>
                      {it.isAvailable ? 'available' : 'off'}
                    </button>
                  </td>
                  <td className="text-right space-x-2">
                    <button className="btn-secondary" onClick={() => openEdit(it)}>Edit</button>
                    <button className="btn-danger" onClick={() => setToDelete(it)}>Delete</button>
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
          title={editing === 'new' ? 'New menu item' : 'Edit menu item'}
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
            <div className="sm:col-span-2">
              <label className="label">Name</label>
              <input className="input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Price (₹)</label>
              <input type="number" step="0.01" className="input" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select...</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Image URL</label>
              <input className="input" value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Tags (comma-separated)</label>
              <input className="input" value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="spicy, bestseller" />
            </div>
            <div>
              <label className="label">Prep time (mins)</label>
              <input type="number" className="input" value={form.preparationTimeMins}
                onChange={(e) => setForm({ ...form, preparationTimeMins: e.target.value })} />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isVeg}
                  onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} />
                Veg
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isAvailable}
                  onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
                Available
              </label>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete menu item?"
        message={`Permanently remove "${toDelete?.name}"?`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
