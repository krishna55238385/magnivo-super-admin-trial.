'use client'

import { useState } from 'react'
import {
  CheckCircle2, Clock, Plus, Eye, FileText, FileSignature,
  ClipboardList, Receipt, ShieldCheck, Send, Download,
  AlertCircle, ChevronDown, ChevronUp, Mail, Sparkles, ArrowRight
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type DocStatus = 'not_sent' | 'sent' | 'signed' | 'submitted' | 'confirmed'

interface ClientDoc {
  nda: DocStatus
  ndaSignedAt: string | null
  msa: DocStatus
  msaSignedAt: string | null
  onboardingForm: DocStatus
  onboardingFormAt: string | null
  invoiceNumber: string | null
  invoiceAmount: string | null
  invoiceStatus: 'not_issued' | 'pending' | 'paid'
  dataAuth: boolean
  dataAuthAt: string | null
}

interface OnboardingClient {
  id: string
  client: string
  email: string
  plan: string
  startedAt: string
  assignee: string
  docs: ClientDoc
  steps: { key: string; label: string; done: boolean; ts: string | null }[]
  notes: string
  healthPct: number
}

// ─── Mock data ───────────────────────────────────────────

const onboardingQueue: OnboardingClient[] = [
  {
    id: 'ob1', client: 'CloudScale', email: 'raj@cloudscale.ai', plan: 'Enterprise',
    startedAt: 'Jun 25, 2026', assignee: 'Priya Menon',
    docs: {
      nda: 'signed', ndaSignedAt: 'Jun 25, 09:41',
      msa: 'sent', msaSignedAt: null,
      onboardingForm: 'not_sent', onboardingFormAt: null,
      invoiceNumber: null, invoiceAmount: null, invoiceStatus: 'not_issued',
      dataAuth: false, dataAuthAt: null,
    },
    steps: [
      { key: 'nda', label: 'NDA Signed', done: true, ts: 'Jun 25, 09:41' },
      { key: 'msa', label: 'Service Agreement Signed', done: false, ts: null },
      { key: 'onboarding_form', label: 'Onboarding Form Submitted', done: false, ts: null },
      { key: 'data_auth', label: 'Data Authorization Confirmed', done: false, ts: null },
      { key: 'invoice', label: 'Invoice Issued & Paid', done: false, ts: null },
      { key: 'signup', label: 'Account Created', done: true, ts: 'Jun 25, 10:02' },
      { key: 'invite', label: 'Admin Invited', done: true, ts: 'Jun 25, 10:03' },
      { key: 'profile', label: 'Profile Completed', done: true, ts: 'Jun 25, 14:32' },
      { key: 'integrations', label: 'Email Connected', done: false, ts: null },
      { key: 'icp', label: 'ICP Profile Created', done: false, ts: null },
      { key: 'first_run', label: 'First GTM Run', done: false, ts: null },
      { key: 'payment', label: 'Payment Method Added', done: false, ts: null },
      { key: 'converted', label: 'Converted to Paid', done: false, ts: null },
    ],
    notes: 'MSA sent on Jun 25. Need to follow up. Schedule ICP setup call once form is in.',
    healthPct: 38,
  },
  {
    id: 'ob2', client: 'NexaFlow', email: 'ceo@nexaflow.io', plan: 'Growth',
    startedAt: 'Jun 28, 2026', assignee: 'Priya Menon',
    docs: {
      nda: 'signed', ndaSignedAt: 'Jun 28, 09:00',
      msa: 'signed', msaSignedAt: 'Jun 28, 09:45',
      onboardingForm: 'submitted', onboardingFormAt: 'Jun 28, 11:20',
      invoiceNumber: 'INV-2851', invoiceAmount: '$1,200', invoiceStatus: 'pending',
      dataAuth: true, dataAuthAt: 'Jun 28, 11:20',
    },
    steps: [
      { key: 'nda', label: 'NDA Signed', done: true, ts: 'Jun 28, 09:00' },
      { key: 'msa', label: 'Service Agreement Signed', done: true, ts: 'Jun 28, 09:45' },
      { key: 'onboarding_form', label: 'Onboarding Form Submitted', done: true, ts: 'Jun 28, 11:20' },
      { key: 'data_auth', label: 'Data Authorization Confirmed', done: true, ts: 'Jun 28, 11:20' },
      { key: 'invoice', label: 'Invoice Issued & Paid', done: false, ts: null },
      { key: 'signup', label: 'Account Created', done: true, ts: 'Jun 28, 12:00' },
      { key: 'invite', label: 'Admin Invited', done: true, ts: 'Jun 28, 12:01' },
      { key: 'profile', label: 'Profile Completed', done: false, ts: null },
      { key: 'integrations', label: 'Email Connected', done: false, ts: null },
      { key: 'icp', label: 'ICP Profile Created', done: false, ts: null },
      { key: 'first_run', label: 'First GTM Run', done: false, ts: null },
      { key: 'payment', label: 'Payment Method Added', done: false, ts: null },
      { key: 'converted', label: 'Converted to Paid', done: false, ts: null },
    ],
    notes: 'Invoice sent, awaiting payment before activating account.',
    healthPct: 54,
  },
]

const completedOnboarding = [
  {
    client: 'Acme Corp', plan: 'Enterprise', completedAt: 'Jan 14, 2026', daysToConvert: 2,
    ndaSigned: 'Jan 12', msaSigned: 'Jan 12', invoicePaid: 'Jan 13',
  },
  {
    client: 'TechVentures', plan: 'Pro', completedAt: 'Feb 5, 2026', daysToConvert: 3,
    ndaSigned: 'Feb 2', msaSigned: 'Feb 3', invoicePaid: 'Feb 4',
  },
  {
    client: 'DataSync Pro', plan: 'Growth', completedAt: 'Apr 10, 2026', daysToConvert: 4,
    ndaSigned: 'Apr 6', msaSigned: 'Apr 7', invoicePaid: 'Apr 9',
  },
  {
    client: 'SalesGenius', plan: 'Pro', completedAt: 'Mar 25, 2026', daysToConvert: 5,
    ndaSigned: 'Mar 20', msaSigned: 'Mar 21', invoicePaid: 'Mar 24',
  },
  {
    client: 'GrowthLab', plan: 'Starter', completedAt: 'May 16, 2026', daysToConvert: 1,
    ndaSigned: 'May 15', msaSigned: 'May 15', invoicePaid: 'May 15',
  },
]

const checklistTemplate = [
  // ── Legal & Agreements (must happen first)
  { id: 'nda_send', label: 'Send NDA template to client', responsible: 'Success Team', category: 'Legal' },
  { id: 'nda_signed', label: 'NDA signed by client', responsible: 'Client', category: 'Legal' },
  { id: 'msa_send', label: 'Send Service Agreement / MSA', responsible: 'Success Team', category: 'Legal' },
  { id: 'msa_signed', label: 'MSA reviewed and signed by client', responsible: 'Client', category: 'Legal' },
  // ── Onboarding form & consent
  { id: 'form_send', label: 'Send onboarding access form link', responsible: 'Success Team', category: 'Forms' },
  { id: 'form_fill', label: 'Client fills form: company info, ICP, domain, email access', responsible: 'Client', category: 'Forms' },
  { id: 'data_auth', label: 'Data authorization consent confirmed (checkbox + timestamp)', responsible: 'Client', category: 'Forms' },
  // ── Billing
  { id: 'invoice_issue', label: 'Issue invoice (plan amount, net-7 terms)', responsible: 'Success Team', category: 'Billing' },
  { id: 'invoice_paid', label: 'Payment received / proof recorded', responsible: 'Client', category: 'Billing' },
  // ── Account setup
  { id: 'signup', label: 'Create org account & send admin invite', responsible: 'System (auto)', category: 'Account' },
  { id: 'welcome', label: 'Send welcome email with setup guide', responsible: 'System (auto)', category: 'Account' },
  { id: 'call', label: 'Schedule onboarding kickoff call', responsible: 'Success Team', category: 'Relationship' },
  // ── Technical activation
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

const docStatusConfig: Record<DocStatus, { label: string; color: string }> = {
  not_sent: { label: 'Not sent', color: 'bg-white/[0.05] text-white/30 border-white/[0.06]' },
  sent: { label: 'Sent — awaiting', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  signed: { label: 'Signed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  submitted: { label: 'Submitted', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
}

const invStatusConfig = {
  not_issued: { label: 'Not issued', color: 'bg-white/[0.05] text-white/30 border-white/[0.06]' },
  pending: { label: 'Pending payment', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  paid: { label: 'Paid', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
}

const stepIsLegal = (key: string) =>
  ['nda', 'msa', 'onboarding_form', 'data_auth', 'invoice'].includes(key)

// ─── Sub-components ──────────────────────────────────────

function DocStatusBadge({ status }: { status: DocStatus }) {
  const c = docStatusConfig[status]
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${c.color}`}>
      {c.label}
    </span>
  )
}

function DocRow({
  icon: Icon, title, status, ts, actionLabel, onAction, extra
}: {
  icon: any; title: string; status: DocStatus; ts: string | null
  actionLabel?: string; onAction?: () => void; extra?: React.ReactNode
}) {
  const c = docStatusConfig[status]
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0">
      <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-white/40" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-white/80">{title}</p>
        {ts && <p className="text-[10px] text-white/25 mt-0.5">{ts}</p>}
        {extra}
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
        {(status === 'signed' || status === 'submitted' || status === 'confirmed') && (
          <button className="p-1 rounded text-white/20 hover:text-white/50 transition-colors">
            <Download className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Onboarding form modal ────────────────────────────────

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
          {/* Company details */}
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

          {/* Sender / email access */}
          <div>
            <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-3">Sender domain & email access</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Sender email address', placeholder: 'outreach@acme.com' },
                { label: 'Sending domain', placeholder: 'acme.com' },
                { label: 'Daily sending volume target', placeholder: '200 emails/day' },
                { label: 'Gmail / Outlook account to connect', placeholder: 'outreach@acme.com' },
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

          {/* ICP info */}
          <div>
            <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-3">ICP (Ideal Customer Profile)</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Target job titles', placeholder: 'Founder, VP Sales, CMO' },
                { label: 'Target industries', placeholder: 'SaaS, FinTech, eCommerce' },
                { label: 'Target company size', placeholder: '50–500 employees' },
                { label: 'Target geography', placeholder: 'US, UK, India' },
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
            <div className="mt-3">
              <label className="block text-[11px] text-white/40 mb-1">Value proposition / pitch (1–2 sentences)</label>
              <textarea
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 placeholder:text-white/20 outline-none focus:border-violet-500/40 resize-none"
                rows={2}
                placeholder="We help [target] do [outcome] by [method]…"
              />
            </div>
          </div>

          {/* API / integration access */}
          <div>
            <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-3">API & integration access</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'CRM system (if any)', placeholder: 'HubSpot / Salesforce / None' },
                { label: 'LinkedIn profile URL', placeholder: 'linkedin.com/company/acme' },
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

          {/* Data authorization */}
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

          {/* Actions */}
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

// ─── Main page ───────────────────────────────────────────

export default function OnboardingPage() {
  const [tab, setTab] = useState<'active' | 'completed' | 'checklist'>('active')
  const [selected, setSelected] = useState<OnboardingClient>(onboardingQueue[0])
  const [showForm, setShowForm] = useState(false)
  const [docsExpanded, setDocsExpanded] = useState(true)

  const docsComplete = (d: ClientDoc) =>
    d.nda === 'signed' && d.msa === 'signed' && d.onboardingForm === 'submitted' &&
    d.dataAuth && d.invoiceStatus === 'paid'

  const docsCount = (d: ClientDoc) => {
    let count = 0
    if (d.nda === 'signed') count++
    if (d.msa === 'signed') count++
    if (d.onboardingForm === 'submitted') count++
    if (d.dataAuth) count++
    if (d.invoiceStatus === 'paid') count++
    return count
  }

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
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'In Onboarding', value: onboardingQueue.length, color: 'text-violet-400' },
          { label: 'Docs Pending', value: onboardingQueue.filter(o => !docsComplete(o.docs)).length, color: 'text-amber-400' },
          { label: 'Avg Days to Convert', value: '3.0', color: 'text-white' },
          { label: 'Conversion Rate', value: '72%', color: 'text-emerald-400' },
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
      {tab === 'active' && (
        <div className="bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <p className="text-[13px] font-semibold text-violet-300">Next Best Action</p>
            <span className="text-[10px] text-white/25 ml-1">Rules-based assistant</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {onboardingQueue.map(ob => {
              let action = ''
              let urgency: 'high' | 'medium' | 'low' = 'low'
              if (ob.docs.nda === 'not_sent') { action = 'Send NDA'; urgency = 'high' }
              else if (ob.docs.nda === 'sent') { action = 'Follow up on NDA'; urgency = 'high' }
              else if (ob.docs.msa === 'not_sent') { action = 'Send Service Agreement (MSA)'; urgency = 'high' }
              else if (ob.docs.msa === 'sent') { action = 'Follow up on MSA signature'; urgency = 'high' }
              else if (ob.docs.onboardingForm === 'not_sent') { action = 'Send Onboarding Form'; urgency = 'medium' }
              else if (ob.docs.onboardingForm === 'sent') { action = 'Chase form submission'; urgency = 'medium' }
              else if (ob.docs.invoiceStatus === 'not_issued') { action = 'Issue Invoice'; urgency = 'high' }
              else if (ob.docs.invoiceStatus === 'pending') { action = 'Request payment confirmation'; urgency = 'high' }
              else if (!ob.steps.find(s => s.key === 'email_connect')?.done) { action = 'Help connect Gmail / Outlook'; urgency = 'low' }
              else { action = 'Schedule ICP setup call'; urgency = 'low' }
              const color = urgency === 'high' ? 'border-amber-500/25 bg-amber-500/5' : urgency === 'medium' ? 'border-blue-500/20 bg-blue-500/5' : 'border-white/[0.07] bg-white/[0.02]'
              const textColor = urgency === 'high' ? 'text-amber-400' : urgency === 'medium' ? 'text-blue-400' : 'text-white/50'
              return (
                <div key={ob.id} className={`rounded-lg border p-3 flex items-center gap-3 ${color}`}>
                  <div className="flex-1">
                    <p className="text-[11px] text-white/40">{ob.client}</p>
                    <p className={`text-[12px] font-medium mt-0.5 ${textColor}`}>{action}</p>
                  </div>
                  <button className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
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
        <div className="flex gap-4">
          {/* Queue */}
          <div className="w-72 space-y-3 flex-shrink-0">
            {onboardingQueue.map(ob => {
              const dc = docsCount(ob.docs)
              return (
                <button
                  key={ob.id}
                  onClick={() => setSelected(ob)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selected.id === ob.id
                      ? 'bg-violet-600/10 border-violet-500/30'
                      : 'bg-[#111118] border-white/[0.07] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[11px] font-bold text-white/60">
                      {ob.client.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-white">{ob.client}</p>
                      <p className="text-[10px] text-white/30">{ob.plan} · {ob.startedAt}</p>
                    </div>
                  </div>
                  {/* Docs pill */}
                  <div className={`flex items-center gap-1.5 text-[10px] mb-2 font-medium ${dc === 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <ShieldCheck className="w-3 h-3" />
                    {dc}/5 docs complete
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Overall progress</span>
                      <span className="text-white/50">{ob.steps.filter(s => s.done).length}/{ob.steps.length} steps</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${ob.healthPct}%` }} />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Detail */}
          {selected && (
            <div className="flex-1 min-w-0 space-y-4">

              {/* Client header */}
              <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-white">{selected.client}</h3>
                    <p className="text-[12px] text-white/40 mt-0.5">{selected.email} · {selected.plan} · Assigned to {selected.assignee}</p>
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

              {/* ── Documents & Signatures section ── */}
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
                      docsComplete(selected.docs)
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {docsCount(selected.docs)}/5 complete
                    </span>
                    {docsExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                  </div>
                </button>

                {docsExpanded && (
                  <div className="px-5 py-2">
                    {/* NDA */}
                    <DocRow
                      icon={FileText}
                      title="NDA — Mutual Confidentiality Agreement"
                      status={selected.docs.nda}
                      ts={selected.docs.ndaSignedAt ? `Signed ${selected.docs.ndaSignedAt}` : null}
                      actionLabel={selected.docs.nda === 'not_sent' ? 'Send NDA' : selected.docs.nda === 'sent' ? 'Resend' : undefined}
                    />

                    {/* MSA */}
                    <DocRow
                      icon={FileSignature}
                      title="Service Agreement / MSA — Scope, pricing, IP, payment terms"
                      status={selected.docs.msa}
                      ts={selected.docs.msaSignedAt ? `Signed ${selected.docs.msaSignedAt}` : null}
                      actionLabel={
                        selected.docs.msa === 'not_sent' ? 'Send MSA' :
                        selected.docs.msa === 'sent' ? 'Resend' : undefined
                      }
                    />

                    {/* Onboarding form */}
                    <DocRow
                      icon={ClipboardList}
                      title="Onboarding Form — Company info, ICP, sender domain, email access"
                      status={selected.docs.onboardingForm}
                      ts={selected.docs.onboardingFormAt ? `Submitted ${selected.docs.onboardingFormAt}` : null}
                      actionLabel={
                        selected.docs.onboardingForm === 'not_sent' ? 'Send Form' :
                        selected.docs.onboardingForm === 'sent' ? 'Resend Link' :
                        selected.docs.onboardingForm === 'submitted' ? 'View Responses' : undefined
                      }
                      onAction={selected.docs.onboardingForm === 'not_sent' ? () => setShowForm(true) : undefined}
                    />

                    {/* Data authorization */}
                    <div className="flex items-center gap-3 py-3 border-b border-white/[0.05]">
                      <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-white/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white/80">Data Authorization Consent</p>
                        <p className="text-[10px] text-white/25 mt-0.5">
                          {selected.docs.dataAuth
                            ? `Confirmed via onboarding form · ${selected.docs.dataAuthAt}`
                            : 'Client consent for domain/data use in outreach campaigns — included in onboarding form'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          selected.docs.dataAuth
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-white/[0.05] text-white/30 border-white/[0.06]'
                        }`}>
                          {selected.docs.dataAuth ? 'Confirmed' : 'Pending form'}
                        </span>
                      </div>
                    </div>

                    {/* Invoice */}
                    <div className="flex items-center gap-3 py-3">
                      <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-3.5 h-3.5 text-white/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white/80">
                          Invoice / Payment Record
                          {selected.docs.invoiceNumber && (
                            <span className="ml-2 text-[10px] text-white/30 font-normal">{selected.docs.invoiceNumber}</span>
                          )}
                        </p>
                        <p className="text-[10px] text-white/25 mt-0.5">
                          {selected.docs.invoiceAmount
                            ? `${selected.docs.invoiceAmount} · ${invStatusConfig[selected.docs.invoiceStatus].label}`
                            : 'Issue invoice before activating account'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${invStatusConfig[selected.docs.invoiceStatus].color}`}>
                          {invStatusConfig[selected.docs.invoiceStatus].label}
                        </span>
                        {selected.docs.invoiceStatus === 'not_issued' && (
                          <button className="text-[11px] text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-lg transition-colors">
                            Issue Invoice
                          </button>
                        )}
                        {selected.docs.invoiceStatus === 'pending' && (
                          <button className="text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg transition-colors">
                            Mark Paid
                          </button>
                        )}
                        {selected.docs.invoiceStatus === 'paid' && (
                          <button className="p-1 rounded text-white/20 hover:text-white/50 transition-colors">
                            <Download className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Warning if not all docs done */}
                    {!docsComplete(selected.docs) && (
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

              {/* ── Onboarding steps ── */}
              <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
                <p className="text-[13px] font-semibold text-white mb-4">Activation steps</p>
                <div className="space-y-3">
                  {selected.steps.map((step, i) => (
                    <div key={step.key} className="flex items-center gap-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.done ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/[0.04] border border-white/[0.08]'
                      }`}>
                        {step.done
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          : <span className="text-[10px] text-white/30 font-medium">{i + 1}</span>
                        }
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className={`text-[12px] font-medium ${step.done ? 'text-white/80' : 'text-white/40'}`}>
                              {step.label}
                            </p>
                            {stepIsLegal(step.key) && (
                              <span className="text-[9px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded font-medium">
                                Legal
                              </span>
                            )}
                          </div>
                          {step.ts
                            ? <span className="text-[10px] text-white/25">{step.ts}</span>
                            : <span className="text-[10px] text-white/20">Pending</span>
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <p className="text-[11px] text-white/30 mb-1">Internal notes</p>
                  <p className="text-[12px] text-white/50 mb-2">{selected.notes}</p>
                  <textarea
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[12px] text-white/60 placeholder:text-white/20 outline-none resize-none"
                    placeholder="Add a note…" rows={2}
                  />
                  <button className="mt-1 text-[11px] text-violet-400 hover:text-violet-300">Save note</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Completed tab ── */}
      {tab === 'completed' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Client', 'Plan', 'NDA Signed', 'MSA Signed', 'Invoice Paid', 'Converted', 'Days'].map(h => (
                  <th key={h} className="text-left text-[11px] font-medium text-white/30 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completedOnboarding.map(c => (
                <tr key={c.client} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-[13px] font-medium text-white/80">{c.client}</td>
                  <td className="px-5 py-3 text-[12px] text-white/50">{c.plan}</td>
                  <td className="px-5 py-3 text-[12px] text-white/50">{c.ndaSigned}</td>
                  <td className="px-5 py-3 text-[12px] text-white/50">{c.msaSigned}</td>
                  <td className="px-5 py-3 text-[12px] text-white/50">{c.invoicePaid}</td>
                  <td className="px-5 py-3 text-[12px] text-white/50">{c.completedAt}</td>
                  <td className="px-5 py-3">
                    <div className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> {c.daysToConvert}d
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
