interface AttendancePieChartProps {
  attended: number;
  noShow: number;
  notMarked: number;
  size?: number;
}

export default function AttendancePieChart({ attended, noShow, notMarked, size = 160 }: AttendancePieChartProps) {
  const total = attended + noShow + notMarked;
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-slate-500 text-sm">
          No data
        </div>
      </div>
    );
  }

  const attendedPct = (attended / total) * 100;
  const noShowPct = (noShow / total) * 100;
  const notMarkedPct = (notMarked / total) * 100;

  const conicGradient = [
    attended > 0 ? `#10b981 ${0}% ${attendedPct}%` : '',
    noShow > 0 ? `#f59e0b ${attendedPct}% ${attendedPct + noShowPct}%` : '',
    notMarked > 0 ? `#9ca3af ${attendedPct + noShowPct}% 100%` : '',
  ].filter(Boolean).join(', ');

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-full border-4 border-slate-700 shadow-lg"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${conicGradient})`,
        }}
      />
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        {attended > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-300">Attended: {attended}</span>
          </div>
        )}
        {noShow > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
            <span className="text-slate-300">No-show: {noShow}</span>
          </div>
        )}
        {notMarked > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500 shrink-0" />
            <span className="text-slate-300">Not marked: {notMarked}</span>
          </div>
        )}
      </div>
    </div>
  );
}
