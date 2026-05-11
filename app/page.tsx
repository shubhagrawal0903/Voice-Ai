'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Phone, PhoneCall, Plus, Trash2, RefreshCw, Mic,
  Clock, CheckCircle, XCircle, AlertCircle, ChevronDown,
  ChevronUp, Play, User, Activity, Zap, BarChart3,
} from 'lucide-react'

/* ─── Types ─────────────────────────────────── */
type Contact = {
  id: string
  name: string
  phone: string
  createdAt: string
  calls: Call[]
}

type Call = {
  id: string
  contactId: string
  vapiCallId: string | null
  status: string
  transcript: string | null
  recordingUrl: string | null
  duration: number | null
  startedAt: string
  endedAt: string | null
  createdAt: string
  contact?: Contact
}

/* ─── Status config ──────────────────────────── */
const STATUS_CONFIG: Record<string, { pill: string; dot: string; icon: React.ReactNode; label: string }> = {
  initiated:   { pill: 'bg-amber-400/10 text-amber-300 border-amber-400/20',   dot: 'bg-amber-400',   icon: <AlertCircle  size={11} />, label: 'Initiated'   },
  queued:      { pill: 'bg-blue-400/10  text-blue-300  border-blue-400/20',    dot: 'bg-blue-400',    icon: <Clock        size={11} />, label: 'Queued'      },
  ringing:     { pill: 'bg-cyan-400/10  text-cyan-300  border-cyan-400/20',    dot: 'bg-cyan-400',    icon: <PhoneCall    size={11} />, label: 'Ringing'     },
  'in-progress':{ pill: 'bg-violet-400/10 text-violet-300 border-violet-400/20', dot: 'bg-violet-400', icon: <Activity    size={11} />, label: 'In Progress' },
  completed:   { pill: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20', dot: 'bg-emerald-400', icon: <CheckCircle size={11} />, label: 'Completed' },
  ended:       { pill: 'bg-slate-400/10  text-slate-300  border-slate-400/20',  dot: 'bg-slate-400',   icon: <CheckCircle  size={11} />, label: 'Ended'      },
  failed:      { pill: 'bg-red-400/10   text-red-300   border-red-400/20',     dot: 'bg-red-400',     icon: <XCircle      size={11} />, label: 'Failed'      },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['initiated']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function formatDuration(sec: number | null) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatTime(dt: string) {
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

/* ─── Stat card ──────────────────────────────── */
function StatCard({
  label, value, icon, gradient, delay = 0,
}: {
  label: string; value: number; icon: React.ReactNode; gradient: string; delay?: number
}) {
  return (
    <div
      className="glass rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* bg glow blob */}
      <div
        className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${gradient}`}
        aria-hidden
      />
      <div className="flex items-center justify-between relative z-10">
        <span className="text-slate-400 text-xs font-medium tracking-wide uppercase">{label}</span>
        <span className="text-slate-500 bg-white/5 p-2 rounded-xl">{icon}</span>
      </div>
      <div className="text-4xl font-bold tracking-tight relative z-10">{value}</div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────── */
export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [calls, setCalls]       = useState<Call[]>([])
  const [tab, setTab]           = useState<'contacts' | 'dashboard'>('contacts')
  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [callingId, setCallingId]   = useState<string | null>(null)
  const [syncingId, setSyncingId]   = useState<string | null>(null)
  const [expandedCall, setExpandedCall] = useState<string | null>(null)
  const [toast, setToast]       = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  /* ── toast helper ── */
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  /* ── fetchers ── */
  const fetchContacts = useCallback(async () => {
    const res  = await fetch('/api/contacts')
    const data = await res.json()
    setContacts(Array.isArray(data) ? data : [])
  }, [])

  const fetchCalls = useCallback(async () => {
    const res  = await fetch('/api/calls')
    const data = await res.json()
    setCalls(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { fetchContacts(); fetchCalls() }, [fetchContacts, fetchCalls])

  /* ── actions ── */
  const addContact = async () => {
    if (!name.trim() || !phone.trim()) return showToast('Name and phone required', 'error')
    setLoading(true)
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
    })
    if (res.ok) {
      setName(''); setPhone('')
      await fetchContacts()
      showToast('Contact added!')
    } else {
      showToast('Failed to add contact', 'error')
    }
    setLoading(false)
  }

  const deleteContact = async (id: string) => {
    setDeletingId(id)
    const res = await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' })
    if (res.ok) { await fetchContacts(); await fetchCalls(); showToast('Contact deleted') }
    else showToast('Failed to delete', 'error')
    setDeletingId(null)
  }

  const triggerCall = async (contactId: string) => {
    setCallingId(contactId)
    const res = await fetch('/api/calls/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId }),
    })
    const data = await res.json()
    if (res.ok) {
      await fetchContacts(); await fetchCalls()
      showToast('Call initiated! 🚀')
    } else {
      showToast(data.error || 'Call failed', 'error')
    }
    setCallingId(null)
  }

  const syncCall = async (callId: string) => {
    setSyncingId(callId)
    const res = await fetch('/api/calls/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId }),
    })
    if (res.ok) { await fetchCalls(); showToast('Call synced') }
    else showToast('Sync failed', 'error')
    setSyncingId(null)
  }

  const completedCalls = calls.filter(c => c.status === 'completed' || c.status === 'ended')

  /* ── render ── */
  return (
    <div
      className="min-h-screen bg-[#080B12] text-slate-100"
      style={{ fontFamily: "'DM Sans','Inter','Segoe UI',ui-sans-serif,system-ui,sans-serif" }}
    >

      {/* ── Ambient background orbs ─────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-cyan-600/8 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-500/6 blur-3xl" />
      </div>

      {/* ── Toast ──────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border animate-fade-in
            ${toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300 backdrop-blur'
              : 'bg-red-950/90 border-red-500/30 text-red-300 backdrop-blur'}`}
        >
          {toast.type === 'success'
            ? <CheckCircle size={15} className="shrink-0" />
            : <XCircle     size={15} className="shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Header ─────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#080B12]/70 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse-ring"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)' }}
            >
              <PhoneCall size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">VoiceCall Dashboard</h1>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Powered by Vapi AI</p>
            </div>
          </div>

          {/* Quick stats pills */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full text-slate-400">
              <User size={11} className="text-violet-400" />
              {contacts.length} contacts
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full text-slate-400">
              <Mic size={11} className="text-cyan-400" />
              {calls.length} calls
            </span>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 py-10 relative z-10">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <StatCard
            label="Total Contacts"
            value={contacts.length}
            icon={<User size={16} />}
            gradient="bg-violet-500"
            delay={0}
          />
          <StatCard
            label="Total Calls"
            value={calls.length}
            icon={<Phone size={16} />}
            gradient="bg-cyan-500"
            delay={60}
          />
          <StatCard
            label="Completed"
            value={completedCalls.length}
            icon={<CheckCircle size={16} />}
            gradient="bg-emerald-500"
            delay={120}
          />
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-white/[0.04] border border-white/8 p-1 rounded-xl mb-7 w-fit">
          {(['contacts', 'dashboard'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              id={`tab-${t}`}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${tab === t
                  ? 'text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-300'}`}
              style={tab === t
                ? { background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.2))', borderColor: 'rgba(124,58,237,0.3)' }
                : {}}
            >
              {t === 'contacts'
                ? <><User size={14} />Contacts</>
                : <><BarChart3 size={14} />Call History</>}
            </button>
          ))}
        </div>

        {/* ── Contacts tab ─────────────────── */}
        {tab === 'contacts' && (
          <div className="space-y-5 animate-slide-up">

            {/* Add contact form */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Plus size={13} className="text-violet-400" />
                </span>
                Add New Contact
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="contact-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full Name"
                  className="input-glow flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-all"
                />
                <input
                  id="contact-phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91XXXXXXXXXX"
                  className="input-glow flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-all"
                  onKeyDown={e => e.key === 'Enter' && addContact()}
                />
                <button
                  id="add-contact-btn"
                  onClick={addContact}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)' }}
                >
                  {loading
                    ? <><RefreshCw size={14} className="animate-spin" />Adding…</>
                    : <><Plus size={14} />Add Contact</>}
                </button>
              </div>
            </div>

            {/* Contact list */}
            {contacts.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <User size={28} className="text-violet-400/60" />
                </div>
                <p className="text-slate-500 text-sm">No contacts yet.</p>
                <p className="text-slate-600 text-xs mt-1">Add your first contact above to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact, i) => {
                  const lastCall = contact.calls[0]
                  const initial  = contact.name[0]?.toUpperCase() || '?'
                  return (
                    <div
                      key={contact.id}
                      className="glass rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 animate-slide-up"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      {/* Avatar */}
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
                        style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.4),rgba(6,182,212,0.4))' }}
                      >
                        {initial}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{contact.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{contact.phone}</div>
                      </div>

                      {/* Last call badge */}
                      {lastCall && (
                        <div className="hidden sm:block">
                          <StatusBadge status={lastCall.status} />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          id={`call-btn-${contact.id}`}
                          onClick={() => triggerCall(contact.id)}
                          disabled={callingId === contact.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition disabled:opacity-50"
                        >
                          {callingId === contact.id
                            ? <><RefreshCw size={12} className="animate-spin" />Calling…</>
                            : <><Zap size={12} />Call</>}
                        </button>
                        <button
                          id={`delete-btn-${contact.id}`}
                          onClick={() => deleteContact(contact.id)}
                          disabled={deletingId === contact.id}
                          className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition disabled:opacity-50"
                          aria-label={`Delete ${contact.name}`}
                        >
                          {deletingId === contact.id
                            ? <RefreshCw size={14} className="animate-spin" />
                            : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Call Dashboard tab ─────────────── */}
        {tab === 'dashboard' && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <BarChart3 size={15} className="text-cyan-400" />
                Call History
                <span className="ml-1 px-2 py-0.5 rounded-full bg-white/5 text-slate-500 text-xs font-normal">
                  {calls.length}
                </span>
              </h2>
              <button
                id="refresh-calls-btn"
                onClick={() => { fetchCalls(); fetchContacts() }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 bg-white/5 hover:bg-white/10 border border-white/8 px-3 py-1.5 rounded-lg transition"
              >
                <RefreshCw size={11} />
                Refresh
              </button>
            </div>

            {calls.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                  <Phone size={28} className="text-cyan-400/60" />
                </div>
                <p className="text-slate-500 text-sm">No calls yet.</p>
                <p className="text-slate-600 text-xs mt-1">Trigger a call from the Contacts tab.</p>
              </div>
            ) : (
              calls.map((call, i) => (
                <div
                  key={call.id}
                  className="glass rounded-2xl overflow-hidden transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Call row */}
                  <div className="p-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.3))' }}
                    >
                      {call.contact?.name?.[0]?.toUpperCase() || '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {call.contact?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {call.contact?.phone} · {formatTime(call.createdAt)}
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={call.status} />

                      {call.duration && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                          <Clock size={10} />
                          {formatDuration(call.duration)}
                        </span>
                      )}

                      {/* Sync button — only for non-terminal states */}
                      {call.status !== 'completed' && call.status !== 'ended' && call.status !== 'failed' && (
                        <button
                          id={`sync-btn-${call.id}`}
                          onClick={() => syncCall(call.id)}
                          disabled={syncingId === call.id}
                          title="Sync call status"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 transition disabled:opacity-50"
                        >
                          <RefreshCw size={13} className={syncingId === call.id ? 'animate-spin' : ''} />
                        </button>
                      )}

                      {/* Expand button — only if has transcript or recording */}
                      {(call.transcript || call.recordingUrl) && (
                        <button
                          id={`expand-btn-${call.id}`}
                          onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition"
                          aria-label="Toggle details"
                        >
                          {expandedCall === call.id
                            ? <ChevronUp   size={14} />
                            : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  {expandedCall === call.id && (
                    <div className="border-t border-white/5 p-5 space-y-5 bg-black/20 animate-fade-in">

                      {/* Recording player */}
                      {call.recordingUrl && (
                        <div>
                          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                            <Play size={11} className="text-violet-400" />
                            Recording
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
                            <Mic size={11} className="text-cyan-400" />
                            Transcript
                          </div>
                          <div className="bg-black/30 rounded-xl p-4 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto border border-white/5">
                            {call.transcript}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────── */}
      <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-white/5 mt-8 flex items-center justify-between text-xs text-slate-600 relative z-10">
        <span>VoiceCall Dashboard</span>
        <span className="flex items-center gap-1.5">
          <Zap size={10} className="text-violet-500" />
          Powered by Vapi AI
        </span>
      </footer>
    </div>
  )
}
