'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts'
import { Call } from './types'
import { 
  TrendingUp, Phone, CheckCircle, Clock, 
  Percent, Calendar, Activity, Users, Clock3
} from 'lucide-react'
import { detectResolution } from './CallHistoryTab'

interface AnalyticsTabProps {
  calls: Call[]
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
  const { dailyVolume, bestDay, pickedUp, notPicked, pickUpRate, avgDurationStr, durationData, peakHoursData, topContactsData, resolutionCounts, dailyTrend } = useMemo(() => {
    // 1. Daily Volume & Best Day
    const days: { date: string; Calls: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })
      const dateStr = d.toISOString().slice(0, 10)
      const count = calls.filter(c => c.createdAt?.startsWith(dateStr)).length
      days.push({ date: label, Calls: count })
    }
    const bestDayObj = days.reduce((max, d) => d.Calls > max.Calls ? d : max, days[0])

    // 2. Pick up stats & Avg Duration
    const total = calls.length
    const pickedUpCalls = calls.filter(c => c.status === 'completed' || c.status === 'ended')
    const pickedUp = pickedUpCalls.length
    const notPicked = calls.filter(c => c.status === 'failed' || c.status === 'initiated' || c.status === 'ringing').length
    const pickUpRate = total > 0 ? Math.round((pickedUp / total) * 100) : 0

    const avgDurSec = pickedUp > 0 ? Math.round(pickedUpCalls.reduce((s, c) => s + (c.duration || 0), 0) / pickedUp) : 0
    const avgDurationStr = avgDurSec ? `${Math.floor(avgDurSec/60)}m ${avgDurSec%60}s` : '—'

    // 3. Duration Distribution
    const durationBuckets = [
      { name: '0-30s', Calls: 0 },
      { name: '30-60s', Calls: 0 },
      { name: '1-2m', Calls: 0 },
      { name: '2-5m', Calls: 0 },
      { name: '5m+', Calls: 0 },
    ]
    pickedUpCalls.forEach(c => {
      const d = c.duration || 0
      if (d <= 30) durationBuckets[0].Calls++
      else if (d <= 60) durationBuckets[1].Calls++
      else if (d <= 120) durationBuckets[2].Calls++
      else if (d <= 300) durationBuckets[3].Calls++
      else durationBuckets[4].Calls++
    })

    // 4. Peak Hours (9am to 9pm)
    const hoursMap: Record<number, number> = {}
    calls.forEach(c => {
      const h = new Date(c.createdAt).getHours()
      if (h >= 9 && h <= 21) {
        hoursMap[h] = (hoursMap[h] || 0) + 1
      }
    })
    const peakHoursData = Array.from({length: 13}, (_, i) => {
      const h = i + 9
      const ampm = h >= 12 ? 'pm' : 'am'
      const displayH = h > 12 ? h - 12 : h
      return { hourStr: `${displayH}${ampm}`, Calls: hoursMap[h] || 0 }
    })

    // 5. Calls per Contact (Top 8)
    const contactMap: Record<string, {name: string, count: number}> = {}
    calls.forEach(c => {
      if (!c.contact) return
      if (!contactMap[c.contactId]) {
        contactMap[c.contactId] = { name: c.contact.name, count: 0 }
      }
      contactMap[c.contactId].count++
    })
    const topContactsData = Object.values(contactMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(c => ({ name: c.name, Calls: c.count }))

    // 6. Resolution Status Counts
    const resolutionCounts = { resolved: 0, unresolved: 0, partially: 0, noAnswer: 0 }
    calls.forEach(c => {
      const res = detectResolution(c).resolution
      if (res === 'Resolved') resolutionCounts.resolved++
      else if (res === 'Unresolved') resolutionCounts.unresolved++
      else if (res === 'Partially Resolved') resolutionCounts.partially++
      else if (res === 'No Answer') resolutionCounts.noAnswer++
    })

    // 7. Daily Resolution & Pick Up Trend
    const dailyTrend: { date: string; PickedUp: number; Resolved: number; Unresolved: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })
      const dateStr = d.toISOString().slice(0, 10)
      
      const dayCalls = calls.filter(c => c.createdAt?.startsWith(dateStr))
      let PickedUp = 0
      let Resolved = 0
      let Unresolved = 0
      
      dayCalls.forEach(c => {
        if (c.status === 'completed' || c.status === 'ended') PickedUp++
        const res = detectResolution(c).resolution
        if (res === 'Resolved') Resolved++
        else if (res === 'Unresolved' || res === 'Partially Resolved' || res === 'No Answer') Unresolved++
      })
      
      dailyTrend.push({ date: label, PickedUp, Resolved, Unresolved })
    }

    return { 
      dailyVolume: days, 
      bestDay: bestDayObj.date, 
      pickedUp, notPicked, pickUpRate, 
      avgDurationStr, durationData: durationBuckets, peakHoursData, topContactsData, resolutionCounts, dailyTrend
    }
  }, [calls])

  const statCards = [
    { label: 'Total Calls',  value: calls.length,     icon: <Phone size={16} />,     gradient: 'bg-violet-500',  color: 'text-violet-400' },
    { label: 'Pick Up Rate', value: `${pickUpRate}%`, icon: <Percent size={16} />,   gradient: 'bg-cyan-500',    color: 'text-cyan-400' },
    { label: 'Avg Duration', value: avgDurationStr,   icon: <Clock size={16} />,     gradient: 'bg-amber-500',   color: 'text-amber-400' },
    { label: 'Best Day',     value: bestDay,          icon: <Calendar size={16} />,  gradient: 'bg-emerald-500', color: 'text-emerald-400' },
  ]

  const resolutionChartData = [
    { name: 'Resolved', value: resolutionCounts.resolved },
    { name: 'Unresolved', value: resolutionCounts.unresolved },
    { name: 'Partially Resolved', value: resolutionCounts.partially },
    { name: 'No Answer', value: resolutionCounts.noAnswer }
  ].filter(d => d.value > 0)
  
  const RESOLUTION_COLORS: Record<string, string> = { 
    'Resolved': '#10B981', 
    'Unresolved': '#EF4444',
    'Partially Resolved': '#F59E0B',
    'No Answer': '#64748B'
  }

  const chartConfig = { style: { background: 'transparent' } }

  return (
    <div className="space-y-4 sm:space-y-6 animate-slide-up">
      {/* ── STAT CARDS ROW ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((s, i) => (
          <div
            key={s.label}
            className="glass rounded-2xl p-4 sm:p-5 flex flex-col gap-3 relative overflow-hidden animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`absolute -top-6 -right-6 w-20 h-20 sm:w-24 sm:h-24 rounded-full blur-2xl opacity-15 ${s.gradient}`} aria-hidden />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-slate-400 text-[10px] sm:text-xs font-medium tracking-wide uppercase">{s.label}</span>
              <span className={`${s.color} bg-white/5 p-1.5 sm:p-2 rounded-xl`}>{s.icon}</span>
            </div>
            <div className="text-xl sm:text-3xl font-bold tracking-tight relative z-10">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW 1 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Daily Call Volume */}
        <div className="sm:col-span-2 glass rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <TrendingUp size={14} className="text-violet-400" />
            <h3 className="text-sm font-semibold text-slate-300">Daily Call Volume</h3>
            <span className="text-xs text-slate-600 ml-auto">Last 7 days</span>
          </div>
          {calls.length === 0 ? (
            <div className="h-40 sm:h-48 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyVolume} {...chartConfig}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="Calls" radius={[6, 6, 0, 0]} fill="url(#barGradient)" />
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

        {/* Resolution Donut */}
        <div className="glass rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <Activity size={14} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-300">Resolution Status</h3>
          </div>
          {calls.length === 0 ? (
            <div className="h-40 sm:h-48 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={resolutionChartData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {resolutionChartData.map((entry, index) => (
                      <Cell key={index} fill={RESOLUTION_COLORS[entry.name] || '#64748B'} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {resolutionChartData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ background: RESOLUTION_COLORS[d.name] || '#64748B' }} />
                    <span className="text-slate-400">{d.name} <span className="text-slate-200 font-semibold ml-1">{d.value}</span></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── DAILY TREND ROW ─────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <Activity size={14} className="text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-300">Daily Resolution & Pick Up Trend</h3>
          <span className="text-xs text-slate-600 ml-auto">Last 7 days</span>
        </div>
        {calls.length === 0 ? (
          <div className="h-40 sm:h-48 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyTrend} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
              <Bar dataKey="PickedUp" name="Picked Up" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Resolved" name="Resolved" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Unresolved" name="Unresolved" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── CHARTS ROW 2 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Call Duration Distribution */}
        <div className="glass rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <Clock3 size={14} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-300">Duration Distribution</h3>
          </div>
          {calls.length === 0 ? (
            <div className="h-40 sm:h-48 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={durationData} {...chartConfig}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="Calls" radius={[6, 6, 0, 0]} fill="url(#barGradient)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Peak Call Hours */}
        <div className="glass rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <Activity size={14} className="text-pink-400" />
            <h3 className="text-sm font-semibold text-slate-300">Peak Call Hours</h3>
            <span className="text-xs text-slate-600 ml-auto">9am - 9pm</span>
          </div>
          {calls.length === 0 ? (
            <div className="h-40 sm:h-48 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={peakHoursData} {...chartConfig}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="hourStr" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="Calls" radius={[6, 6, 0, 0]} fill="url(#barGradient)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── CHARTS ROW 3 ─────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <Users size={14} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-300">Calls per Contact</h3>
          <span className="text-xs text-slate-600 ml-auto">Top 8</span>
        </div>
        {topContactsData.length === 0 ? (
          <div className="h-40 sm:h-48 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topContactsData} layout="vertical" margin={{ left: 40, right: 10, top: 0, bottom: 0 }} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="Calls" radius={[0, 6, 6, 0]} fill="url(#barGradientHoriz)" barSize={16} />
              <defs>
                <linearGradient id="barGradientHoriz" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.9} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}
