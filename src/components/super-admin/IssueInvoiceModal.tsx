'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { issueInvoice } from '@/app/actions/super-admin'

export type InvoiceClientOption = { id: string; name: string; plan_name?: string | null }
export type InvoicePlanOption = { id: string; name: string; monthly_price_cents: number }

function defaultDueDate() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

export default function IssueInvoiceModal({
  onClose,
  onSuccess,
  clients,
  plans,
  fixedOrgId,
  fixedOrgName,
  defaultPlanName,
}: {
  onClose: () => void
  onSuccess: (message: string) => void
  clients?: InvoiceClientOption[]
  plans: InvoicePlanOption[]
  fixedOrgId?: string
  fixedOrgName?: string
  defaultPlanName?: string
}) {
  const initialPlanName = defaultPlanName || plans[0]?.name || ''
  const initialAmount = plans.find(p => p.name.toLowerCase() === initialPlanName.toLowerCase())?.monthly_price_cents

  const [search, setSearch] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [planName, setPlanName] = useState(initialPlanName)
  const [amountDollars, setAmountDollars] = useState(initialAmount ? String(initialAmount / 100) : '')
  const [dueDate, setDueDate] = useState(defaultDueDate())
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const orgId = fixedOrgId || selectedOrgId
  const filteredClients = (clients || []).filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  function applyPlan(name: string) {
    setPlanName(name)
    const plan = plans.find(p => p.name === name)
    if (plan) setAmountDollars(String(plan.monthly_price_cents / 100))
  }

  function selectClient(client: InvoiceClientOption) {
    setSelectedOrgId(client.id)
    setSearch(client.name)
    setErrors(e => ({ ...e, orgId: '' }))
    if (client.plan_name) {
      const plan = plans.find(p => p.name.toLowerCase() === client.plan_name!.toLowerCase())
      if (plan) applyPlan(plan.name)
    }
  }

  async function handleSubmit() {
    const errs: Record<string, string> = {}
    const amountNum = parseFloat(amountDollars)
    if (!orgId) errs.orgId = 'Client is required'
    if (!amountDollars || isNaN(amountNum) || amountNum <= 0) errs.amount = 'Amount must be greater than 0'
    if (!dueDate) errs.dueDate = 'Due date is required'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setPending(true)
    setServerError(null)
    const result = await issueInvoice({
      orgId,
      planName,
      amountCents: Math.round(amountNum * 100),
      dueDate,
      notes: notes.trim() || undefined,
    })
    setPending(false)
    if (result?.error) {
      setServerError(result.error)
      return
    }
    onSuccess(`Invoice ${result.invoiceNumber} issued.`)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !pending && onClose()}>
      <div className="bg-[#111118] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[16px] font-semibold text-white">Issue Invoice</h2>
          <button onClick={() => !pending && onClose()} className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[12px] text-white/40 mb-5">Create a manual invoice for a client.</p>

        <div className="space-y-3">
          {fixedOrgId ? (
            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1">Client</label>
              <div className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/60">
                {fixedOrgName}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1">Client</label>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedOrgId(''); }}
                disabled={pending}
                placeholder="Search clients…"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50"
              />
              {search && !selectedOrgId && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-white/[0.08] bg-[#15151f]">
                  {filteredClients.length === 0 && (
                    <p className="text-[12px] text-white/30 px-3 py-2">No matching clients</p>
                  )}
                  {filteredClients.slice(0, 8).map(c => (
                    <button
                      key={c.id}
                      onClick={() => selectClient(c)}
                      className="w-full text-left px-3 py-2 text-[12px] text-white/70 hover:bg-white/[0.06] transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              {errors.orgId && <p className="text-[11px] text-red-400 mt-1">{errors.orgId}</p>}
            </div>
          )}

          <div>
            <label className="text-[11px] font-medium text-white/50 block mb-1">Plan</label>
            <select
              value={planName}
              onChange={e => applyPlan(e.target.value)}
              disabled={pending}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none"
            >
              {plans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-white/50 block mb-1">Amount ($)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amountDollars}
              onChange={e => { setAmountDollars(e.target.value); setErrors(er => ({ ...er, amount: '' })) }}
              disabled={pending}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50"
            />
            {errors.amount && <p className="text-[11px] text-red-400 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="text-[11px] font-medium text-white/50 block mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => { setDueDate(e.target.value); setErrors(er => ({ ...er, dueDate: '' })) }}
              disabled={pending}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50"
            />
            {errors.dueDate && <p className="text-[11px] text-red-400 mt-1">{errors.dueDate}</p>}
          </div>

          <div>
            <label className="text-[11px] font-medium text-white/50 block mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={pending}
              rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none resize-none focus:border-violet-500/50"
              placeholder="Internal context for this invoice…"
            />
          </div>
        </div>

        {serverError && <p className="text-[12px] text-red-400 mt-4">{serverError}</p>}

        <div className="flex gap-2 mt-5">
          <button disabled={pending} onClick={() => !pending && onClose()} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors disabled:opacity-40">Cancel</button>
          <button disabled={pending} onClick={handleSubmit} className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[13px] text-white font-medium transition-colors disabled:opacity-50">
            {pending ? 'Issuing…' : 'Issue Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}
