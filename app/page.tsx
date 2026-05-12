'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Phone, PhoneCall, User, Mic, Zap, BarChart3,
  CheckCircle, XCircle, Activity,
} from 'lucide-react'
import { Contact, Call } from './components/types'
import ContactsTab   from './components/ContactsTab'
import CallHistoryTab from './components/CallHistoryTab'
import AnalyticsTab  from './components/AnalyticsTab'

/* ─── Toast ─────────────────────────────────────────────────────── */
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border animate-fade-in
        ${type === 'success'
          ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300 backdrop-blur'
          : 'bg-red-950/90 border-red-500/30 text-red-300 backdrop-blur'}`}
    >
      {type === 'success'
        ? <CheckCircle size={15} className="shrink-0" />
        : <XCircle size={15} className="shrink-0" />}
      {msg}
    </div>
  )
}

type TabId = 'contacts' | 'history' | 'analytics'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'contacts',  label: 'Contacts',    icon: <User size={14} /> },
  { id: 'history',   label: 'Call History', icon: <BarChart3 size={14} /> },
  { id: 'analytics', label: 'Analytics',   icon: <Activity size={14} /> },
]

/* ─── CSV Export ─────────────────────────────────────────────────── */
function exportCallsCSV(calls: Call[]) {
  const header = ['ID', 'Contact', 'Phone', 'Status', 'Duration (s)', 'Started At', 'Created At']
  const rows = calls.map(c => [
    c.id,
    c.contact?.name || '',
    c.contact?.phone || '',
    c.status,
    c.duration ?? '',
    c.startedAt ? new Date(c.startedAt).toISOString() : '',
    new Date(c.createdAt).toISOString(),
  ])
  const csv = [header, ...rows].map(r => r.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `calls-${Date.now()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function Home() {
  const [contacts,   setContacts]   = useState<Contact[]>([])
  const [calls,      setCalls]      = useState<Call[]>([])
  const [tab,        setTab]        = useState<TabId>('contacts')
  const [name,       setName]       = useState('')
  const [phone,      setPhone]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [callingId,  setCallingId]  = useState<string | null>(null)
  const [syncingId,  setSyncingId]  = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

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

  /* ─── Actions ───────────────────────────────────────────────────── */
  const addContact = async () => {
    if (!name.trim() || !phone.trim()) return showToast('Name and phone required', 'error')
    setLoading(true)
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
    })
    if (res.ok) { setName(''); setPhone(''); await fetchContacts(); showToast('Contact added!') }
    else showToast('Failed to add contact', 'error')
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
    const res  = await fetch('/api/calls/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId }),
    })
    const data = await res.json()
    if (res.ok) { await fetchContacts(); await fetchCalls(); showToast('Call initiated! 🚀') }
    else showToast(data.error || 'Call failed', 'error')
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

  const callAll = async (ids: string[]) => {
    showToast(`Initiating ${ids.length} calls…`)
    for (const id of ids) await triggerCall(id)
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (contacts.every(c => selectedIds.has(c.id))) setSelectedIds(new Set())
    else setSelectedIds(new Set(contacts.map(c => c.id)))
  }

  const completedCalls = calls.filter(c => c.status === 'completed' || c.status === 'ended')

  return (
    <div
      className="min-h-screen bg-[#080B12] text-slate-100"
      style={{ fontFamily: "'DM Sans','Inter','Segoe UI',ui-sans-serif,system-ui,sans-serif" }}
    >
      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-cyan-600/6 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#080B12]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Top row: logo + title always visible */}
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse-ring shrink-0"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)' }}
              >
                <PhoneCall size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight gradient-text">VoiceCall Dashboard</h1>
                <p className="text-[10px] text-slate-500 leading-none mt-0.5">Powered by Vapi AI</p>
              </div>
            </div>

            {/* Stats pills: hidden on mobile (shown below), visible on sm+ */}
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full text-slate-400">
                <User size={11} className="text-violet-400" />{contacts.length} contacts
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full text-slate-400">
                <Mic size={11} className="text-cyan-400" />{calls.length} calls
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full text-slate-400">
                <Zap size={11} className="text-emerald-400" />{completedCalls.length} done
              </span>
            </div>
          </div>

          {/* Stats pills row on mobile only */}
          <div className="sm:hidden flex items-center gap-2 text-xs pb-2 overflow-x-auto">
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full text-slate-400 shrink-0">
              <User size={11} className="text-violet-400" />{contacts.length} contacts
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full text-slate-400 shrink-0">
              <Mic size={11} className="text-cyan-400" />{calls.length} calls
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full text-slate-400 shrink-0">
              <Zap size={11} className="text-emerald-400" />{completedCalls.length} done
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
        {/* Tab switcher — full width on mobile, auto-width on desktop */}
        <div className="flex gap-1 bg-white/[0.04] border border-white/8 p-1 rounded-xl mb-6 sm:mb-8 w-full sm:w-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-h-[44px] sm:min-h-0
                ${tab === t.id ? 'text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              style={tab === t.id
                ? { background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.2))' }
                : {}}
            >
              {t.icon}
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        {tab === 'contacts' && (
          <ContactsTab
            contacts={contacts}
            calls={calls}
            callingId={callingId}
            deletingId={deletingId}
            loading={loading}
            name={name}
            phone={phone}
            selectedIds={selectedIds}
            onNameChange={setName}
            onPhoneChange={setPhone}
            onAdd={addContact}
            onDelete={deleteContact}
            onCall={triggerCall}
            onCallAll={callAll}
            onSelectToggle={toggleSelect}
            onSelectAll={toggleSelectAll}
          />
        )}

        {tab === 'history' && (
          <CallHistoryTab
            calls={calls}
            syncingId={syncingId}
            onSync={syncCall}
            onRefresh={() => { fetchCalls(); fetchContacts() }}
            onExportCSV={() => exportCallsCSV(calls)}
          />
        )}

        {tab === 'analytics' && (
          <AnalyticsTab calls={calls} />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 border-t border-white/5 mt-6 sm:mt-8 flex items-center justify-between text-xs text-slate-600 relative z-10">
        <span>VoiceCall Dashboard</span>
        <span className="flex items-center gap-1.5">
          <Zap size={10} className="text-violet-500" />
          Powered by Vapi AI
        </span>
      </footer>
    </div>
  )
}
