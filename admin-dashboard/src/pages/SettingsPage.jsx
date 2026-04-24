import { useEffect, useState } from 'react';
import { settingsApi, authApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { useToast } from '../components/Toast';
import { useAuth } from '../auth/AuthContext';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';

export default function SettingsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [changingPwd, setChangingPwd] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { settings } = await settingsApi.get();
      setSettings(settings);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const setField = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  const setLoyalty = (key, value) =>
    setSettings((s) => ({ ...s, loyalty: { ...(s.loyalty || {}), [key]: value } }));

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        cafeName: settings.cafeName,
        address: settings.address,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        openingHours: settings.openingHours,
        taxRate: Number(settings.taxRate),
        birthdayDiscountPercent: Number(settings.birthdayDiscountPercent),
        allowCouponStackingWithBirthday: !!settings.allowCouponStackingWithBirthday,
        loyalty: {
          earnRatePerRupee: Number(settings.loyalty?.earnRatePerRupee || 0),
          redeemRate: Number(settings.loyalty?.redeemRate || 0),
          maxRedeemPercent: Number(settings.loyalty?.maxRedeemPercent || 0),
        },
      };
      const { settings: updated } = await settingsApi.update(body);
      setSettings(updated);
      toast.success('Settings saved');
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!pwd.current || !pwd.next) { toast.error('Fill both fields'); return; }
    if (pwd.next !== pwd.confirm) { toast.error('Passwords do not match'); return; }
    if (pwd.next.length < 6) { toast.error('New password must be ≥ 6 chars'); return; }
    setChangingPwd(true);
    try {
      await authApi.changePassword(pwd.current, pwd.next);
      toast.success('Password updated');
      setPwd({ current: '', next: '', confirm: '' });
    } catch (e) { toast.error(errMsg(e)); }
    finally { setChangingPwd(false); }
  };

  if (loading || !settings) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Cafe profile, tax, loyalty and your account" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold text-sm mb-4">Cafe profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="label">Cafe name</label>
                <input className="input" value={settings.cafeName || ''}
                  onChange={(e) => setField('cafeName', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address</label>
                <input className="input" value={settings.address || ''}
                  onChange={(e) => setField('address', e.target.value)} />
              </div>
              <div>
                <label className="label">Contact email</label>
                <input type="email" className="input" value={settings.contactEmail || ''}
                  onChange={(e) => setField('contactEmail', e.target.value)} />
              </div>
              <div>
                <label className="label">Contact phone</label>
                <input className="input" value={settings.contactPhone || ''}
                  onChange={(e) => setField('contactPhone', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Opening hours</label>
                <input className="input" value={settings.openingHours || ''}
                  onChange={(e) => setField('openingHours', e.target.value)} placeholder="e.g. 10am – 11pm" />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold text-sm mb-4">Billing &amp; discounts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Tax rate (decimal)</label>
                <input type="number" step="0.001" className="input" value={settings.taxRate ?? 0}
                  onChange={(e) => setField('taxRate', e.target.value)} />
                <p className="text-xs text-slate-500 mt-1">e.g. 0.05 for 5%</p>
              </div>
              <div>
                <label className="label">Birthday discount %</label>
                <input type="number" className="input" value={settings.birthdayDiscountPercent ?? 0}
                  onChange={(e) => setField('birthdayDiscountPercent', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!settings.allowCouponStackingWithBirthday}
                    onChange={(e) => setField('allowCouponStackingWithBirthday', e.target.checked)} />
                  Allow stacking coupon with birthday discount
                </label>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold text-sm mb-4">Loyalty program</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Earn rate (pts per ₹)</label>
                <input type="number" step="0.01" className="input"
                  value={settings.loyalty?.earnRatePerRupee ?? 0}
                  onChange={(e) => setLoyalty('earnRatePerRupee', e.target.value)} />
              </div>
              <div>
                <label className="label">Redeem rate (₹ per pt)</label>
                <input type="number" step="0.01" className="input"
                  value={settings.loyalty?.redeemRate ?? 0}
                  onChange={(e) => setLoyalty('redeemRate', e.target.value)} />
              </div>
              <div>
                <label className="label">Max redeem % of subtotal</label>
                <input type="number" className="input"
                  value={settings.loyalty?.maxRedeemPercent ?? 0}
                  onChange={(e) => setLoyalty('maxRedeemPercent', e.target.value)} />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Save settings'}
            </button>
          </div>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold text-sm mb-3">Your account</h2>
            <div className="text-sm space-y-1 mb-4">
              <div className="text-slate-500">Name</div>
              <div>{user?.name || '—'}</div>
              <div className="text-slate-500 mt-2">Email</div>
              <div>{user?.email}</div>
              <div className="text-slate-500 mt-2">Role</div>
              <div className="uppercase text-xs font-semibold">{user?.role}</div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold text-sm mb-3">Change password</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Current password</label>
                <input type="password" className="input" value={pwd.current}
                  onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
              </div>
              <div>
                <label className="label">New password</label>
                <input type="password" className="input" value={pwd.next}
                  onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input type="password" className="input" value={pwd.confirm}
                  onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
              </div>
              <button className="btn-primary w-full" onClick={changePassword} disabled={changingPwd}>
                {changingPwd ? <Spinner size="sm" /> : 'Update password'}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
