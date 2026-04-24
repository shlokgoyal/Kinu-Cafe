export default function Empty({ title = 'Nothing here yet', hint, action }) {
  return (
    <div className="card py-12 px-6 text-center">
      <div className="text-3xl mb-2">📭</div>
      <div className="font-semibold text-slate-700">{title}</div>
      {hint && <div className="text-sm text-slate-500 mt-1">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
