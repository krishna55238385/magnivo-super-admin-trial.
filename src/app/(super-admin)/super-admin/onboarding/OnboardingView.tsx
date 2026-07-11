'use client'

import { useState } from 'react'
import {
  CheckCircle2, Plus, Eye, FileText, FileSignature,
  ClipboardList, Receipt, ShieldCheck, Download,
  AlertCircle, ChevronDown, ChevronUp, Mail, Sparkles, ArrowRight
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type LegalStatus = 'not_sent' | 'sent' | 'signed'
type FormStatus = 'not_sent' | 'sent' | 'completed'
type InvoiceStatus = 'not_issued' | 'issued' | 'paid'

interface OnboardingStatus {
  nda_status: LegalStatus | null
  msa_status: LegalStatus | null
  onboarding_form_status: FormStatus | null
  data_auth_status: LegalStatus | null
  invoice_status: InvoiceStatus | null
  activated_at: string | null
  notes: string | null
}

export interface OnboardingClient {
  id: string
  name: string
  plan_name: string | null
  created_at: string
  user_count: number
  onboarding_complete: boolean
  onboarding: OnboardingStatus
}

// ─── Static reference checklist (not client-specific) ────

const checklistTemplate = [
  { id: 'nda_send', label: 'Send NDA template to client', responsible: 'Success Team', category: 'Legal' },
  { id: 'nda_signed', label: 'NDA signed by client', responsible: 'Client', category: 'Legal' },
  { id: 'msa_send', label: 'Send Service Agreement / MSA', responsible: 'Success Team', category: 'Legal' },
  { id: 'msa_signed', label: 'MSA reviewed and signed by client', responsible: 'Client', category: 'Legal' },
  { id: 'form_send', label: 'Send onboarding access form link', responsible: 'Success Team', category: 'Forms' },
  { id: 'form_fill', label: 'Client fills form: company info, ICP, domain, email access', responsible: 'Client', category: 'Forms' },
  { id: 'data_auth', label: 'Data authorization consent confirmed (checkbox + timestamp)', responsible: 'Client', category: 'Forms' },
  { id: 'invoice_issue', label: 'Issue invoice (plan amount, net-7 terms)', responsible: 'Success Team', category: 'Billing' },
  { id: 'invoice_paid', label: 'Payment received / proof recorded', responsible: 'Client', category: 'Billing' },
  { id: 'signup', label: 'Create org account & send admin invite', responsible: 'System (auto)', category: 'Account' },
  { id: 'welcome', label: 'Send welcome email with setup guide', responsible: 'System (auto)', category: 'Account' },
  { id: 'call', label: 'Schedule onboarding kickoff call', responsible: 'Success Team', category: 'Relationship' },
  { id: 'profile', label: 'Verify company profile completed in CRM', responsible: 'Client', category: 'Client Action' },
  { id: 'email_connect', label: 'Gmail / Outlook connected', responsible: 'Client', category: 'Client Action' },
  { id: 'ga4', label: 'GA4 property connected (optional)', responsible: 'Client', category: 'Client Action' },
  { id: 'icp', label: 'ICP profile created together on kickoff call', responsible: 'Success Team', category: 'Relationship' },
  { id: 'first_gtm', label: 'First GTM pipeline run completed', responsible: 'Success Team', category: 'Activation' },
  { id: 'review', label: '7-day usage review call', responsible: 'Success Team', category: 'Relationship' },
  { id: 'payment_card', label: 'Credit card on file for subscription renewal', responsible: 'Client', category: 'Billing' },
  { id: 'convert', label: 'Trial converted to paid subscription', responsible: 'System (auto)', category: 'Billing' },
  { id: 'nps', label: 'Day-30 NPS survey sent', responsible: 'System (auto)', category: 'Feedback' },
]

// ─── Helpers ─────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const NOT_STARTED = new Set(['not_sent', 'not_issued', null, undefined])
const DONE_VALUES = new Set(['signed', 'completed', 'paid'])

function statusBadge(status: string | null) {
  if (NOT_STARTED.has(status)) return { label: 'Not sent', color: 'bg-white/[0.05] text-white/30 border-white/[0.06]' }
  if (DONE_VALUES.has(status ?? '')) {
    const label = status === 'paid' ? 'Paid' : status === 'completed' ? 'Completed' : 'Signed'
    return { label, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
  }
  const label = status === 'issued' ? 'Issued — awaiting payment' : 'Sent — awaiting'
  return { label, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
}

function docsCount(o: OnboardingStatus) {
  return [o.nda_status, o.msa_status, o.data_auth_status].filter(s => s === 'signed').length
    + (o.onboarding_form_status === 'completed' ? 1 : 0)
    + (o.invoice_status === 'paid' ? 1 : 0)
}

function docsFullyComplete(o: OnboardingStatus) {
  return docsCount(o) === 5
}

const stepIsLegal = (key: string) =>
  ['nda_status', 'msa_status', 'onboarding_form_status', 'data_auth_status', 'invoice_status'].includes(key)

// ─── Sub-components ──────────────────────────────────────

function DocRow({
  icon: Icon, title, status, actionLabel, onAction,
}: {
  icon: any; title: string; status: string | null; actionLabel?: string; onAction?: () => void
}) {
  const c = statusBadge(status)
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0">
      <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-white/40" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-white/80">{title}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${c.color}`}>{c.label}</span>
        {actionLabel && (
          <button
            onClick={onAction}
            className="text-[11px] text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-lg transition-colors"
          >
            {actionLabel}
          </button>
        )}
        {DONE_VALUES.has(status ?? '') && (
          <button className="p-1 rounded text-white/20 hover:text-white/50 transition-colors">
            <Download className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

function OnboardingFormModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111118] border border-white/[0.1] rounded-2xl w-[600px] max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-semibold text-white">Client Onboarding Form</h2>
            <p className="text-[12px] text-white/40 mt-0.5">Collect company details, ICP, and access before activating the account</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 text-[20px] leading-none">×</button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-3">Company details</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Company name', placeholder: 'Acme Corp' },
                { label: 'Website / domain', placeholder: 'acme.com' },
                { label: 'Admin name', placeholder: 'John Smith' },
                { label: 'Admin email', placeholder: 'john@acme.com' },
                { label: 'Industry', placeholder: 'SaaS / FinTech / D2C' },
                { label: 'Team size', placeholder: '10–50' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-[11px] text-white/40 mb-1">{f.label}</label>
                  <input
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 placeholder:text-white/20 outline-none focus:border-violet-500/40"
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
            <p className="text-[12px] font-semibold text-amber-400 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Data authorization consent
            </p>
            <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
              By checking this box, the client authorizes Magnivo AI to use their company domain, email address, and provided information to run outreach campaigns, GTM pipelines, and AI-generated communications on their behalf, in accordance with the signed Service Agreement.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-violet-500" />
              <span className="text-[12px] text-white/70">
                I confirm that I am authorized to grant this consent on behalf of my organization, and I agree to the above data usage terms.
              </span>
            </label>
            <p className="text-[10px] text-white/25 mt-2">Timestamp will be recorded automatically on submission.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[12px] text-white/50 hover:bg-white/[0.08] transition-colors">
              Cancel
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[12px] font-medium text-white transition-colors"
            >
              Submit & record timestamp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main view ───────────────────────────────────────────

export default function OnboardingView({ clients }: { clients: OnboardingClient[] }) {
  const [tab, setTab] = useState<'active' | 'completed' | 'checklist'>('active')
  const activeQueue = clients.filter(c => !c.onboarding.activated_at)
  const completed = clients.filter(c => c.onboarding.activated_at)
  const [selectedId, setSelectedId] = useState<string | null>(activeQueue[0]?.id ?? null)
  const [showForm, setShowForm] = useState(false)
  const [docsExpanded, setDocsExpanded] = useState(true)

  const selected = activeQueue.find(c => c.id === selectedId) ?? activeQueue[0] ?? null

  const inOnboarding = clients.filter(c => !c.onboarding.activated_at).length
  const docsPending = clients.filter(c => !c.onboarding_complete).length
  const activated = clients.filter(c => c.onboarding.activated_at).length

  return (
    <div className="space-y-5 max-w-[1300px]">
      {showForm && <OnboardingFormModal onClose={() => setShowForm(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Client Onboarding</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Manage documents, signatures, and activation for all new clients</p>
        </div>
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Start Onboarding
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'In Onboarding', value: inOnboarding, color: 'text-violet-400' },
          { label: 'Docs Pending', value: docsPending, color: 'text-amber-400' },
          { label: 'Activated', value: activated, color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111118] border border-white/[0.07] rounded-xl p-4 text-center">
            <p className={`text-[22px] font-bold ${color}`}>{value}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d0d14] border border-white/[0.06] rounded-xl p-1 w-fit">
        {(['active', 'completed', 'checklist'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium capitalize transition-all ${
              tab === t ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30' : 'text-white/40 hover:text-white/70'
            }`}>
            {t === 'checklist' ? 'Onboarding Template' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Next Best Action Assistant ── */}
      {tab === 'active' && activeQueue.length > 0 && (
        <div className="bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <p className="text-[13px] font-semibold text-violet-300">Next Best Action</p>
            <span className="text-[10px] text-white/25 ml-1">Rules-based assistant</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {activeQueue.map(c => {
              const o = c.onboarding
              let action = ''
              let urgency: 'high' | 'medium' | 'low' = 'low'
              if (o.nda_status === 'not_sent' || !o.nda_status) { action = 'Send NDA'; urgency = 'high' }
              else if (o.nda_status === 'sent') { action = 'Follow up on NDA'; urgency = 'high' }
              else if (o.msa_status === 'not_sent' || !o.msa_status) { action = 'Send Service Agreement (MSA)'; urgency = 'high' }
              else if (o.msa_status === 'sent') { action = 'Follow up on MSA signature'; urgency = 'high' }
              else if (o.onboarding_form_status === 'not_sent' || !o.onboarding_form_status) { action = 'Send Onboarding Form'; urgency = 'medium' }
              else if (o.onboarding_form_status === 'sent') { action = 'Chase form submission'; urgency = 'medium' }
              else if (o.data_auth_status === 'not_sent' || !o.data_auth_status) { action = 'Confirm data authorization'; urgency = 'medium' }
              else if (o.invoice_status === 'not_issued' || !o.invoice_status) { action = 'Issue Invoice'; urgency = 'high' }
              else if (o.invoice_status === 'issued') { action = 'Request payment confirmation'; urgency = 'high' }
              else { action = 'Ready to activate'; urgency = 'low' }
              const color = urgency === 'high' ? 'border-amber-500/25 bg-amber-500/5' : urgency === 'medium' ? 'border-blue-500/20 bg-blue-500/5' : 'border-white/[0.07] bg-white/[0.02]'
              const textColor = urgency === 'high' ? 'text-amber-400' : urgency === 'medium' ? 'text-blue-400' : 'text-white/50'
              return (
                <div key={c.id} className={`rounded-lg border p-3 flex items-center gap-3 ${color}`}>
                  <div className="flex-1">
                    <p className="text-[11px] text-white/40">{c.name}</p>
                    <p className={`text-[12px] font-medium mt-0.5 ${textColor}`}>{action}</p>
                  </div>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                      urgency === 'high' ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25' :
                      urgency === 'medium' ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25' :
                      'bg-white/[0.05] text-white/40 hover:bg-white/[0.09]'
                    }`}>
                    Do it <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Active tab ── */}
      {tab === 'active' && (
        activeQueue.length === 0 ? (
          <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto mb-3" />
            <p className="text-[14px] text-white/50 font-medium">No clients in onboarding</p>
            <p className="text-[12px] text-white/25 mt-1">All clients have been activated.</p>
          </div>
        ) : (
          <div className="flex gap-4">
            {/* Queue */}
            <div className="w-72 space-y-3 flex-shrink-0">
              {activeQueue.map(c => {
                const dc = docsCount(c.onboarding)
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selected?.id === c.id
                        ? 'bg-violet-600/10 border-violet-500/30'
                        : 'bg-[#111118] border-white/[0.07] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[11px] font-bold text-white/60">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-white">{c.name}</p>
                        <p className="text-[10px] text-white/30">{c.plan_name ?? 'trial'} · {formatDate(c.created_at)}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 text-[10px] mb-2 font-medium ${dc === 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <ShieldCheck className="w-3 h-3" />
                      {dc}/5 docs complete
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${(dc / 5) * 100}%` }} />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Detail */}
            {selected && (
              <div className="flex-1 min-w-0 space-y-4">
                <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[15px] font-semibold text-white">{selected.name}</h3>
                      <p className="text-[12px] text-white/40 mt-0.5">{selected.plan_name ?? 'trial'} · {selected.user_count} users</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-[12px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg hover:bg-violet-500/15 flex items-center gap-1.5 transition-colors">
                        <Mail className="w-3.5 h-3.5" /> Send Reminder
                      </button>
                      <button className="text-[12px] text-white/40 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-lg hover:bg-white/[0.08] flex items-center gap-1.5 transition-colors">
                        <Eye className="w-3.5 h-3.5" /> View Account
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Documents & Signatures ── */}
                <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setDocsExpanded(p => !p)}
                    className="w-full flex items-center justify-between px-5 py-4 border-b border-white/[0.06] hover:bg-white/[0.01] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileSignature className="w-4 h-4 text-violet-400" />
                      <div className="text-left">
                        <p className="text-[13px] font-semibold text-white">Documents & Signatures</p>
                        <p className="text-[11px] text-white/30 mt-0.5">Must be completed before account is activated</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                        docsFullyComplete(selected.onboarding)
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {docsCount(selected.onboarding)}/5 complete
                      </span>
                      {docsExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                    </div>
                  </button>

                  {docsExpanded && (
                    <div className="px-5 py-2">
                      <DocRow
                        icon={FileText}
                        title="NDA — Mutual Confidentiality Agreement"
                        status={selected.onboarding.nda_status}
                        actionLabel={NOT_STARTED.has(selected.onboarding.nda_status) ? 'Send NDA' : selected.onboarding.nda_status === 'sent' ? 'Resend' : undefined}
                      />
                      <DocRow
                        icon={FileSignature}
                        title="Service Agreement / MSA — Scope, pricing, IP, payment terms"
                        status={selected.onboarding.msa_status}
                        actionLabel={NOT_STARTED.has(selected.onboarding.msa_status) ? 'Send MSA' : selected.onboarding.msa_status === 'sent' ? 'Resend' : undefined}
                      />
                      <DocRow
                        icon={ClipboardList}
                        title="Onboarding Form — Company info, ICP, sender domain, email access"
                        status={selected.onboarding.onboarding_form_status}
                        actionLabel={
                          NOT_STARTED.has(selected.onboarding.onboarding_form_status) ? 'Send Form' :
                          selected.onboarding.onboarding_form_status === 'sent' ? 'Resend Link' :
                          selected.onboarding.onboarding_form_status === 'completed' ? 'View Responses' : undefined
                        }
                        onAction={NOT_STARTED.has(selected.onboarding.onboarding_form_status) ? () => setShowForm(true) : undefined}
                      />
                      <DocRow
                        icon={ShieldCheck}
                        title="Data Authorization Consent"
                        status={selected.onboarding.data_auth_status}
                        actionLabel={NOT_STARTED.has(selected.onboarding.data_auth_status) ? 'Send Consent Request' : selected.onboarding.data_auth_status === 'sent' ? 'Resend' : undefined}
                      />
                      <DocRow
                        icon={Receipt}
                        title="Invoice / Payment Record"
                        status={selected.onboarding.invoice_status}
                        actionLabel={
                          NOT_STARTED.has(selected.onboarding.invoice_status) ? 'Issue Invoice' :
                          selected.onboarding.invoice_status === 'issued' ? 'Mark Paid' : undefined
                        }
                      />

                      {!docsFullyComplete(selected.onboarding) && (
                        <div className="flex items-center gap-2 mt-1 mb-2 px-3 py-2 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <p className="text-[11px] text-amber-400/80">
                            Do not activate the client account until all 5 documents are complete.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-[11px] text-white/30 mb-1">Internal notes</p>
                  <textarea
                    defaultValue={selected.onboarding.notes ?? ''}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[12px] text-white/60 placeholder:text-white/20 outline-none resize-none"
                    placeholder="No notes yet…" rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ── Completed tab ── */}
      {tab === 'completed' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
          {completed.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[13px] text-white/30">No clients have been activated yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Client', 'Plan', 'Users', 'Activated On'].map(h => (
                    <th key={h} className="text-left text-[11px] font-medium text-white/30 px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completed.map(c => (
                  <tr key={c.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-[13px] font-medium text-white/80">{c.name}</td>
                    <td className="px-5 py-3 text-[12px] text-white/50">{c.plan_name ?? 'trial'}</td>
                    <td className="px-5 py-3 text-[12px] text-white/50">{c.user_count}</td>
                    <td className="px-5 py-3">
                      <div className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> {formatDate(c.onboarding.activated_at)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Checklist template tab ── */}
      {tab === 'checklist' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[13px] font-semibold text-white">Standard Onboarding Checklist</p>
            <p className="text-[11px] text-white/30 mt-0.5">
              Applied to every new client. Legal and billing steps must complete before account activation.
            </p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {checklistTemplate.map((step, i) => (
              <div key={step.id} className={`flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] ${
                step.category === 'Legal' || step.category === 'Forms' ? 'bg-violet-500/[0.02]' : ''
              }`}>
                <span className="w-5 text-[11px] text-white/25 font-medium text-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-white/80">{step.label}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{step.responsible}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium flex-shrink-0 ${
                  step.category === 'Legal' ? 'bg-violet-500/10 text-violet-400' :
                  step.category === 'Forms' ? 'bg-blue-500/10 text-blue-400' :
                  step.category === 'Billing' ? 'bg-emerald-500/10 text-emerald-400' :
                  step.category === 'Activation' ? 'bg-amber-500/10 text-amber-400' :
                  step.category === 'Relationship' ? 'bg-pink-500/10 text-pink-400' :
                  step.category === 'Account' ? 'bg-cyan-500/10 text-cyan-400' :
                  step.category === 'Feedback' ? 'bg-orange-500/10 text-orange-400' :
                  'bg-white/[0.05] text-white/40'
                }`}>{step.category}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-white/[0.06] flex gap-4 text-[11px] text-white/25">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-violet-500/60 inline-block"></span> Legal (2)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-blue-500/60 inline-block"></span> Forms (3)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500/60 inline-block"></span> Billing (3)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-cyan-500/60 inline-block"></span> Account (2)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-pink-500/60 inline-block"></span> Relationship (3)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-500/60 inline-block"></span> Activation (1)</span>
          </div>
        </div>
      )}
    </div>
  )
}
