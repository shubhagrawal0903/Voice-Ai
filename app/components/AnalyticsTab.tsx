'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { Call } from './types'
import { TrendingUp, Phone, CheckCircle, Clock } from 'lucide-react'

interface AnalyticsTabProps {
  calls: Call[]
}

const RESOLUTION_COLORS: Record<string, string> = {
  Resolved:           '#10B981',
  Unresolved:         '#EF4444',
  'Partially Resolved': '#F59E0B',
  'Not Applicable':   '#64748B',
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number; name: string}[]; label?: string }) {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0D1120] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-2xl">
        <div className="text-slate-400 mb-1">{label}</div>
        {payload.map((p, i) => (
          <div key={i} className="font-semibold text-slate-200">{p.name}: {p.value}</div>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsTab({ calls }: AnalyticsTabProps) {
  // ── Daily call volume (last 7 days) ──────────────────────────────
  const dailyVolume = useMemo(() => {
    const days: { date: string; Calls: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })
      const dateStr = d.toISOString().slice(0, 10)
      const count = calls.filter(c => c.createdAt?.startsWith(dateStr)).length
      days.push({ date: label, Calls: count })
    }
    return days
  }, [calls])

  // ── Resolution status breakdown ───────────────────────────────────
  const resolutionData = useMemo(() => {
    const VALID = new Set(['Resolved', 'Unresolved', 'Partially Resolved', 'Not Applicable'])
    const map: Record<string, number> = {}
    calls.forEach(c => {
      if (!c.analysis) return
      try {
        const a = typeof c.analysis === 'string' ? JSON.parse(c.analysis) : c.analysis
        const status: string = a.resolution_status
        // Only count calls with an explicit, recognised resolution status
        // so that partial/errored analysis objects don't inflate 'Not Applicable'
        if (status && VALID.has(status)) {
          map[status] = (map[status] || 0) + 1
        }
      } catch {}
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [calls])

  // ── Summary stats ─────────────────────────────────────────────────
  const completedCalls = calls.filter(c => c.status === 'completed' || c.status === 'ended')
  const avgDuration = completedCalls.length
    ? Math.round(completedCalls.reduce((s, c) => s + (c.duration || 0), 0) / completedCalls.length)
    : 0

  const statCards = [
    { label: 'Total Calls',  value: calls.length,           icon: <Phone size={16} />,       gradient: 'bg-violet-500', color: 'text-violet-400' },
    { label: 'Completed',    value: completedCalls.length,  icon: <CheckCircle size={16} />, gradient: 'bg-emerald-500', color: 'text-emerald-400' },
    { label: 'Avg Duration', value: avgDuration ? `${Math.floor(avgDuration/60)}m ${avgDuration%60}s` : '—', icon: <Clock size={16} />, gradient: 'bg-cyan-500', color: 'text-cyan-400' },
  ]

  const chartConfig = { style: { background: 'transparent' } }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <div
            key={s.label}
            className="glass rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-15 ${s.gradient}`} aria-hidden />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-slate-400 text-xs font-medium tracking-wide uppercase">{s.label}</span>
              <span className={`${s.color} bg-white/5 p-2 rounded-xl`}>{s.icon}</span>
            </div>
            <div className="text-3xl font-bold tracking-tight relative z-10">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Bar chart — daily volume */}
        <div className="sm:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={14} className="text-violet-400" />
            <h3 className="text-sm font-semibold text-slate-300">Daily Call Volume</h3>
            <span className="text-xs text-slate-600 ml-auto">Last 7 days</span>
          </div>
          {calls.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyVolume} {...chartConfig}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Calls" radius={[6, 6, 0, 0]}
                  fill="url(#barGradient)" />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart — resolution */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle size={14} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-300">Resolution</h3>
          </div>
          {resolutionData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={resolutionData}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {resolutionData.map((entry, index) => (
                      <Cell key={index} fill={RESOLUTION_COLORS[entry.name] || '#64748B'} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {resolutionData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: RESOLUTION_COLORS[d.name] || '#64748B' }} />
                      <span className="text-slate-400 truncate">{d.name}</span>
                    </div>
                    <span className="text-slate-300 font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>


    </div>
  )
}
