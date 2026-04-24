import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const links = [
  { to: '/',              label: 'Dashboard',    icon: '📊' },
  { to: '/orders',        label: 'Orders',       icon: '🧾' },
  { to: '/menu',          label: 'Menu items',   icon: '🍽️' },
  { to: '/categories',    label: 'Categories',   icon: '🏷️' },
  { to: '/tables',        label: 'Tables',       icon: '🪑' },
  { to: '/coupons',       label: 'Coupons',      icon: '🎟️' },
  { to: '/reservations',  label: 'Reservations', icon: '📅' },
  { to: '/analytics',     label: 'Analytics',    icon: '📈' },
  { to: '/users',         label: 'Users',        icon: '👥', adminOnly: true },
  { to: '/settings',      label: 'Settings',     icon: '⚙️' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const visible = links.filter((l) => !l.adminOnly || user?.role === 'admin');

  return (
    <div className="flex h-full">
      <aside className="w-60 shrink-0 bg-brand-800 text-brand-100 flex flex-col">
        <div className="px-5 py-5 border-b border-brand-700">
          <div className="text-lg font-bold text-white">Kinu's Cafe</div>
          <div className="text-xs text-brand-200">Admin Console</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {visible.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition ' +
                (isActive
                  ? 'bg-brand-700 text-white'
                  : 'text-brand-100 hover:bg-brand-700/60 hover:text-white')
              }
            >
              <span className="text-base w-5 text-center">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-brand-700 text-xs">
          <div className="text-white font-medium truncate">{user?.name || user?.email}</div>
          <div className="text-brand-200 uppercase tracking-wide">{user?.role}</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-end px-6 gap-3">
          <span className="text-sm text-slate-600 hidden sm:block">
            Signed in as <b>{user?.email}</b>
          </span>
          <button className="btn-secondary" onClick={doLogout}>Log out</button>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
