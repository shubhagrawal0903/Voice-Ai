'use client'

import { useState, useMemo } from 'react'
import {
  Phone, Plus, Trash2, RefreshCw, Zap, User, Search,
  ChevronDown, ChevronUp, Clock, PhoneCall, Star,
} from 'lucide-react'
import { Contact, Call } from './types'
import { StatusBadge, formatDuration, formatTime } from './shared'

interface ContactsTabProps {
  contacts: Contact[]
  calls: Call[]
  callingId: string | null
  deletingId: string | null
  loading: boolean
  name: string
  phone: string
  selectedIds: Set<string>
  onNameChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onCall: (id: string) => void
  onCallAll: (ids: string[]) => void
  onSelectToggle: (id: string) => void
  onSelectAll: () => void
}

export default function ContactsTab({
  contacts, calls, callingId, deletingId, loading,
  name, phone, selectedIds,
  onNameChange, onPhoneChange,
  onAdd, onDelete, onCall, onCallAll,
  onSelectToggle, onSelectAll,
}: ContactsTabProps) {
  const [search, setSearch] = useState('')
  const [expandedContact, setExpandedContact] = useState<string | null>(null)

  const filtered = useMemo(() =>
    contacts.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    ), [contacts, search])

  const allSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id))

  const getContactStats = (contact: Contact) => {
    const contactCalls = calls.filter(c => c.contactId === contact.id)
    const completed = contactCalls.filter(c => c.status === 'completed' || c.status === 'ended')
    const totalDuration = completed.reduce((sum, c) => sum + (c.duration || 0), 0)
    const lastCall = contactCalls[0]
    return { total: contactCalls.length, completed: completed.length, totalDuration, lastCall, all: contactCalls }
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Add contact form */}
      <div className="glass rounded-2xl p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 sm:mb-5 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Plus size={13} className="text-violet-400" />
          </span>
          Add New Contact
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="contact-name"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            placeholder="Full Name"
            className="input-glow flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 sm:py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-all min-h-[44px]"
          />
          <input
            id="contact-phone"
            value={phone}
            onChange={e => onPhoneChange(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            className="input-glow flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 sm:py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-all min-h-[44px]"
            onKeyDown={e => e.key === 'Enter' && onAdd()}
          />
          <button
            id="add-contact-btn"
            onClick={onAdd}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-h-[44px]"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)' }}
          >
            {loading
              ? <><RefreshCw size={14} className="animate-spin" />Adding…</>
              : <><Plus size={14} />Add Contact</>}
          </button>
        </div>
      </div>

      {/* Search + bulk actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="contact-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="input-glow w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 sm:py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-all min-h-[44px]"
          />
        </div>
        {selectedIds.size > 0 && (
          <button
            id="call-all-selected-btn"
            onClick={() => onCallAll(Array.from(selectedIds))}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 w-full sm:w-auto min-h-[44px]"
            style={{ background: 'linear-gradient(135deg,#059669,#06B6D4)' }}
          >
            <PhoneCall size={14} />
            Call All Selected ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Contact list */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-8 sm:p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <User size={28} className="text-violet-400/60" />
          </div>
          <p className="text-slate-500 text-sm">{search ? 'No contacts match your search.' : 'No contacts yet.'}</p>
          <p className="text-slate-600 text-xs mt-1">Add your first contact above to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select all */}
          <div className="flex items-center gap-2 px-2">
            <input
              id="select-all-checkbox"
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="w-4 h-4 accent-violet-500 cursor-pointer"
            />
            <span className="text-xs text-slate-500">
              {allSelected ? 'Deselect all' : `Select all (${filtered.length})`}
            </span>
          </div>

          {filtered.map((contact, i) => {
            const stats = getContactStats(contact)
            const isExpanded = expandedContact === contact.id
            const initial = contact.name[0]?.toUpperCase() || '?'

            return (
              <div
                key={contact.id}
                className="glass rounded-2xl overflow-hidden transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
                  {/* Checkbox */}
                  <input
                    id={`select-${contact.id}`}
                    type="checkbox"
                    checked={selectedIds.has(contact.id)}
                    onChange={() => onSelectToggle(contact.id)}
                    className="w-4 h-4 accent-violet-500 cursor-pointer shrink-0"
                  />

                  {/* Avatar */}
                  <div
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white cursor-pointer hover:scale-105 transition-transform"
                    style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.5),rgba(6,182,212,0.5))' }}
                    onClick={() => setExpandedContact(isExpanded ? null : contact.id)}
                  >
                    {initial}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <button
                      className="font-semibold text-sm truncate text-left hover:text-violet-300 transition-colors w-full"
                      onClick={() => setExpandedContact(isExpanded ? null : contact.id)}
                    >
                      {contact.name}
                    </button>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="truncate">{contact.phone}</span>
                      {stats.total > 0 && (
                        <span className="flex items-center gap-1 text-slate-600 shrink-0">
                          <Phone size={9} />
                          {stats.total}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Last call badge */}
                  {stats.lastCall && (
                    <div className="hidden sm:block">
                      <StatusBadge status={stats.lastCall.status} />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <button
                      id={`call-btn-${contact.id}`}
                      onClick={() => onCall(contact.id)}
                      disabled={callingId === contact.id}
                      className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition disabled:opacity-50 min-h-[40px]"
                    >
                      {callingId === contact.id
                        ? <><RefreshCw size={12} className="animate-spin" /><span className="hidden sm:inline">Calling…</span></>
                        : <><Zap size={12} /><span className="hidden sm:inline">Call</span></>}
                    </button>
                    <button
                      id={`delete-btn-${contact.id}`}
                      onClick={() => onDelete(contact.id)}
                      disabled={deletingId === contact.id}
                      className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition disabled:opacity-50 min-h-[40px] min-w-[40px] flex items-center justify-center"
                      aria-label={`Delete ${contact.name}`}
                    >
                      {deletingId === contact.id
                        ? <RefreshCw size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                    <button
                      onClick={() => setExpandedContact(isExpanded ? null : contact.id)}
                      className="p-2 rounded-xl text-slate-600 hover:text-white hover:bg-white/10 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded contact profile */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-5 bg-black/20 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                      <Star size={13} className="text-violet-400" />
                      <span className="text-xs font-semibold text-slate-300">Contact Profile</span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'Total Calls', value: stats.total, icon: <Phone size={12} />, color: 'text-violet-400' },
                        { label: 'Completed', value: stats.completed, icon: <PhoneCall size={12} />, color: 'text-emerald-400' },
                        { label: 'Talk Time', value: formatDuration(stats.totalDuration || null), icon: <Clock size={12} />, color: 'text-cyan-400' },
                        {
                          label: 'Frequency',
                          value: stats.total === 0 ? '—' : stats.total === 1 ? '1 call' : `${stats.total} calls`,
                          icon: <User size={12} />, color: 'text-amber-400'
                        },
                      ].map(s => (
                        <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <div className={`flex items-center gap-1 ${s.color} mb-1`}>
                            {s.icon}
                            <span className="text-[10px] font-medium">{s.label}</span>
                          </div>
                          <div className="text-sm font-bold text-slate-100">{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Call history for this contact */}
                    {stats.all.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-slate-500 mb-2">Call History</div>
                        {stats.all.slice(0, 5).map(c => (
                          <div key={c.id} className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-2 border border-white/5">
                            <span className="text-xs text-slate-400">{formatTime(c.createdAt)}</span>
                            <div className="flex items-center gap-2">
                              {c.duration && (
                                <span className="text-xs text-slate-600 flex items-center gap-1">
                                  <Clock size={9} />{formatDuration(c.duration)}
                                </span>
                              )}
                              <StatusBadge status={c.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
