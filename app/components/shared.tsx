'use client'

import { Activity, AlertCircle, CheckCircle, Clock, PhoneCall, XCircle } from 'lucide-react'

/* ─── Status config ──────────────────────────── */
export const STATUS_CONFIG: Record<string, {
  pill: string; dot: string; icon: React.ReactNode; label: string
}> = {
  initiated:    { pill: 'bg-amber-400/10 text-amber-300 border-amber-400/20',    dot: 'bg-amber-400',    icon: <AlertCircle size={11} />, label: 'Initiated'    },
  queued:       { pill: 'bg-blue-400/10  text-blue-300  border-blue-400/20',     dot: 'bg-blue-400',     icon: <Clock size={11} />,       label: 'Queued'       },
  ringing:      { pill: 'bg-cyan-400/10  text-cyan-300  border-cyan-400/20',     dot: 'bg-cyan-400',     icon: <PhoneCall size={11} />,   label: 'Ringing'      },
  'in-progress':{ pill: 'bg-violet-400/10 text-violet-300 border-violet-400/20', dot: 'bg-violet-400',   icon: <Activity size={11} />,    label: 'In Progress'  },
  completed:    { pill: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20', dot: 'bg-emerald-400', icon: <CheckCircle size={11} />, label: 'Completed'   },
  ended:        { pill: 'bg-slate-400/10  text-slate-300  border-slate-400/20',  dot: 'bg-slate-400',    icon: <CheckCircle size={11} />, label: 'Ended'        },
  failed:       { pill: 'bg-red-400/10   text-red-300   border-red-400/20',      dot: 'bg-red-400',      icon: <XCircle size={11} />,     label: 'Failed'       },
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['initiated']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export function StatCard({
  label, value, sub, icon, gradient, delay = 0,
}: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; gradient: string; delay?: number
}) {
  return (
    <div
      className="glass rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${gradient}`} aria-hidden />
      <div className="flex items-center justify-between relative z-10">
        <span className="text-slate-400 text-xs font-medium tracking-wide uppercase">{label}</span>
        <span className="text-slate-500 bg-white/5 p-2 rounded-xl">{icon}</span>
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export function formatDuration(sec: number | null) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatTime(dt: string) {
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
