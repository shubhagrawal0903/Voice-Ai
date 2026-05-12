'use client'

import { useState, useMemo } from 'react'
import {
  BarChart3, RefreshCw, Mic, Play, Clock,
  ChevronDown, ChevronUp, FileText,
  Phone, CheckCircle, XCircle, Percent,
} from 'lucide-react'
import { Call } from './types'
import { StatusBadge, formatDuration, formatTime } from './shared'

interface CallHistoryTabProps {
  calls: Call[]
  syncingId: string | null
  onSync: (id: string) => void
  onRefresh: () => void
  onExportCSV: () => void
}

type FilterStatus = 'all' | 'completed' | 'failed' | 'in-progress'

export function detectResolution(call: Call) {
  const text = (call.summary || call.transcript || '').toLowerCase()
  
  let resolution = 'Resolved'
  let resolutionColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  
  if (call.status === 'failed' || call.status === 'initiated' || (call.duration != null && call.duration < 10)) {
    resolution = 'No Answer'
    resolutionColor = 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  } else if (/(unable|cannot|follow up|callback|issue remains|problem persists)/.test(text)) {
    resolution = 'Unresolved'
    resolutionColor = 'text-red-400 bg-red-500/10 border-red-500/20'
  } else if (/(escalated|will check|checking|looking into|team will)/.test(text)) {
    resolution = 'Partially Resolved'
    resolutionColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
  } else if (/(resolved|updated|processed|scheduled|rescheduled|cancelled|confirmed|done|completed successfully)/.test(text)) {
    resolution = 'Resolved'
    resolutionColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  } else {
    resolution = 'Resolved'
    resolutionColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  }

  let intent = 'General'
  if (/(rebook|reschedule|change date)/.test(text)) intent = 'Rebooking'
  else if (/(cancel|cancellation)/.test(text)) intent = 'Cancellation'
  else if (/(complaint|issue|problem|not working)/.test(text)) intent = 'Complaint'
  else if (/(query|question|information|details)/.test(text)) intent = 'Query'

  return { resolution, resolutionColor, intent }
}

export default function CallHistoryTab({
  calls, syncingId, onSync, onRefresh, onExportCSV,
}: CallHistoryTabProps) {
  const [expandedCall, setExpandedCall] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const filtered = useMemo(() => {
    let list = [...calls]
    if (filterStatus === 'completed')
      list = list.filter(c => c.status === 'completed' || c.status === 'ended')
    else if (filterStatus === 'failed')
      list = list.filter(c => c.status === 'failed')
    else if (filterStatus === 'in-progress')
      list = list.filter(c =>
        c.status === 'in-progress' || c.status === 'ringing' || c.status === 'initiated'
      )
    return list
  }, [calls, filterStatus])

  const stats = useMemo(() => {
    const total = calls.length
    const pickedUp = calls.filter(c => c.status === 'completed' || c.status === 'ended').length
    const notPickedUp = calls.filter(c => c.status === 'failed' || c.status === 'initiated').length
    const pickUpRate = total > 0 ? Math.round((pickedUp / total) * 100) : 0
    
    const completedCalls = calls.filter(c => c.status === 'completed' || c.status === 'ended')
    const avgDuration = completedCalls.length > 0 
      ? Math.round(completedCalls.reduce((acc, c) => acc + (c.duration || 0), 0) / completedCalls.length)
      : 0
      
    const minutes = Math.floor(avgDuration / 60)
    const seconds = avgDuration % 60
    const avgDurationStr = `${minutes}m ${seconds}s`
    
    const resolutionCounts = { resolved: 0, unresolved: 0, partially: 0 }
    
    calls.forEach(c => {
      const res = detectResolution(c).resolution
      if (res === 'Resolved') resolutionCounts.resolved++
      else if (res === 'Unresolved') resolutionCounts.unresolved++
      else if (res === 'Partially Resolved') resolutionCounts.partially++
    })

    return { total, pickedUp, notPickedUp, pickUpRate, avgDurationStr, resolutionCounts }
  }, [calls])

  return (
    <div className="space-y-4 animate-slide-up">
      
      {/* ── Stats Bar ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { label: 'Total Calls', value: stats.total, icon: <Phone size={14} />, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
          { label: 'Picked Up', value: stats.pickedUp, icon: <CheckCircle size={14} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Not Picked Up', value: stats.notPickedUp, icon: <XCircle size={14} />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
          { label: 'Pick Up Rate', value: `${stats.pickUpRate}%`, icon: <Percent size={14} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
          { label: 'Avg Duration', value: stats.avgDurationStr, icon: <Clock size={14} />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shrink-0 glass ${s.border}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{s.label}</div>
              <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Resolution Stats Bar ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { label: 'Resolved', value: stats.resolutionCounts.resolved, icon: <CheckCircle size={14} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Unresolved', value: stats.resolutionCounts.unresolved, icon: <XCircle size={14} />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
          { label: 'Partially Resolved', value: stats.resolutionCounts.partially, icon: <Clock size={14} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shrink-0 glass ${s.border}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{s.label}</div>
              <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* Row 1: Status filter pills + action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter pills */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/8 p-1 rounded-xl flex-1 sm:flex-none">
            {(['all', 'completed', 'failed', 'in-progress'] as FilterStatus[]).map(f => (
              <button
                key={f}
                id={`filter-${f}`}
                onClick={() => setFilterStatus(f)}
                className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all capitalize min-h-[36px] ${
                  filterStatus === f
                    ? 'text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                style={filterStatus === f
                  ? { background: 'linear-gradient(135deg,rgba(124,58,237,0.35),rgba(6,182,212,0.2))' }
                  : {}}
              >
                {f.replace('-', '\u00a0')}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              id="export-csv-btn"
              onClick={onExportCSV}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 bg-white/5 hover:bg-emerald-400/10 border border-white/8 hover:border-emerald-500/30 px-3 py-2 rounded-xl transition min-h-[36px]"
            >
              <BarChart3 size={12} />Export CSV
            </button>
            <button
              id="refresh-calls-btn"
              onClick={onRefresh}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 bg-white/5 hover:bg-white/10 border border-white/8 px-3 py-2 rounded-xl transition min-h-[36px]"
            >
              <RefreshCw size={11} />Refresh
            </button>
          </div>
        </div>

      </div>

      {/* Call count */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <BarChart3 size={12} className="text-cyan-400" />
        Showing {filtered.length} of {calls.length} calls
      </div>

      {/* ── Call list ──────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-8 sm:p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
            <BarChart3 size={28} className="text-cyan-400/60" />
          </div>
          <p className="text-slate-500 text-sm">No calls match the filter.</p>
        </div>
      ) : (
        filtered.map((call, i) => {
          const isExpanded = expandedCall === call.id
          const hasDetails = !!(call.transcript || call.recordingUrl || call.summary)
          const ai = detectResolution(call)

          return (
            <div
              key={call.id}
              className="glass rounded-2xl overflow-hidden transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* ── Call row ─────────────────────────────── */}
              <div 
                className={`p-3 sm:p-4 flex items-center gap-2 sm:gap-4 ${hasDetails ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
                onClick={() => {
                  if (hasDetails) setExpandedCall(isExpanded ? null : call.id)
                }}
              >

                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.3))' }}
                >
                  {call.contact?.name?.[0]?.toUpperCase() || '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{call.contact?.name || 'Unknown'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {call.contact?.phone} · {formatTime(call.createdAt)}
                  </div>
                </div>

                {/* Right-side controls */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <StatusBadge status={call.status} />

                  {/* AI Badges */}
                  <div className="hidden sm:flex items-center gap-1.5 ml-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${ai.resolutionColor}`}>
                      {ai.resolution}
                    </span>
                    {ai.resolution !== 'No Answer' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium border text-violet-400 bg-violet-500/10 border-violet-500/20">
                        {ai.intent}
                      </span>
                    )}
                  </div>

                  {call.duration && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                      <Clock size={10} />{formatDuration(call.duration)}
                    </span>
                  )}

                  {/* Sync — only for non-terminal statuses */}
                  {call.status !== 'completed' && call.status !== 'ended' && call.status !== 'failed' && (
                    <button
                      id={`sync-btn-${call.id}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSync(call.id)
                      }}
                      disabled={syncingId === call.id}
                      title="Sync call status"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 transition disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={syncingId === call.id ? 'animate-spin' : ''} />
                    </button>
                  )}

                  {/* Expand — only when there is something to show */}
                  {hasDetails && (
                    <button
                      id={`expand-btn-${call.id}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedCall(isExpanded ? null : call.id)
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {/* ── Expanded detail panel ─────────────────── */}
              {isExpanded && (
                <div className="border-t border-white/5 p-5 space-y-5 bg-black/20 animate-fade-in">

                  {/* Recording */}
                  {call.recordingUrl && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                        <Play size={11} className="text-violet-400" />Recording
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/8">
                        <audio controls src={call.recordingUrl} className="w-full" style={{ height: '36px' }} />
                      </div>
                    </div>
                  )}

                  {/* Transcript */}
                  {call.transcript && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                        <Mic size={11} className="text-cyan-400" />Transcript
                      </div>
                      <div className="bg-black/30 rounded-xl p-4 text-xs text-slate-300 leading-relaxed max-h-64 overflow-y-auto border border-white/5 space-y-3">
                        {call.transcript.split('\n').map((line, idx) => {
                          const lowerLine = line.toLowerCase()
                          if (lowerLine.startsWith('assistant:')) {
                            return (
                              <div key={idx}>
                                <span className="font-bold text-violet-400 mr-2">🤖 Maya (Agent):</span>
                                <span>{line.substring(10).trim()}</span>
                              </div>
                            )
                          }
                          if (lowerLine.startsWith('user:')) {
                            return (
                              <div key={idx}>
                                <span className="font-bold text-cyan-400 mr-2">👤 Guest:</span>
                                <span>{line.substring(5).trim()}</span>
                              </div>
                            )
                          }
                          return line.trim() ? <div key={idx} className="pl-6">{line}</div> : null
                        })}
                      </div>
                    </div>
                  )}

                  {/* Summary — from Bland AI sync */}
                  {call.summary && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                        <FileText size={11} className="text-emerald-400" />Summary
                      </div>
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
                        {call.summary}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
