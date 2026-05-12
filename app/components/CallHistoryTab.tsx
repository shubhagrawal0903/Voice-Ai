'use client'

import { useState, useMemo } from 'react'
import {
  BarChart3, RefreshCw, Mic, Play, Clock,
  ChevronDown, ChevronUp, FileText,
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

export default function CallHistoryTab({
  calls, syncingId, onSync, onRefresh, onExportCSV,
}: CallHistoryTabProps) {
  const [expandedCall, setExpandedCall] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]   = useState('')

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
    if (dateFrom)
      list = list.filter(c => new Date(c.createdAt) >= new Date(dateFrom))
    if (dateTo)
      list = list.filter(c => new Date(c.createdAt) <= new Date(dateTo + 'T23:59:59'))
    return list
  }, [calls, filterStatus, dateFrom, dateTo])

  return (
    <div className="space-y-4 animate-slide-up">

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

        {/* Row 2: Date range — stacks on mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="input-glow flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300 transition-all [color-scheme:dark] min-h-[44px]"
            title="From date"
          />
          <span className="text-slate-600 text-xs text-center hidden sm:inline">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="input-glow flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300 transition-all [color-scheme:dark] min-h-[44px]"
            title="To date"
          />
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

          return (
            <div
              key={call.id}
              className="glass rounded-2xl overflow-hidden transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* ── Call row ─────────────────────────────── */}
              <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">

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

                  {call.duration && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                      <Clock size={10} />{formatDuration(call.duration)}
                    </span>
                  )}

                  {/* Sync — only for non-terminal statuses */}
                  {call.status !== 'completed' && call.status !== 'ended' && call.status !== 'failed' && (
                    <button
                      id={`sync-btn-${call.id}`}
                      onClick={() => onSync(call.id)}
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
                      onClick={() => setExpandedCall(isExpanded ? null : call.id)}
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
                      <div className="bg-black/30 rounded-xl p-4 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto border border-white/5">
                        {call.transcript}
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
