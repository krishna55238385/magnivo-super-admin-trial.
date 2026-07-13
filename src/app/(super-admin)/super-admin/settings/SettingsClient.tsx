'use client'

import { useState, useTransition } from 'react'
import {
  Save, Key, Bell, Globe, Zap,
  Plus, Trash2, Eye, EyeOff, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { updatePlatformSetting } from '@/app/actions/super-admin'

type Settings = Record<string, string>

const TEXT_FIELDS: { key: string; label: string; section: 'config' | 'limits' }[] = [
  { key: 'platform_name', label: 'Platform Name', section: 'config' },
  { key: 'support_email', label: 'Support Email', section: 'config' },
  { key: 'default_token_limit', label: 'Default Monthly Token Limit', section: 'config' },
  { key: 'trial_duration_days', label: 'Trial Duration (days)', section: 'config' },
  { key: 'alert_threshold_percent', label: 'Alert at % usage', section: 'limits' },
]

const TOGGLE_FIELDS: { key: string; label: string; section: 'config' | 'limits' | 'notifications' }[] = [
  { key: 'maintenance_mode', label: 'Maintenance Mode', section: 'config' },
  { key: 'allow_new_signups', label: 'Allow New Signups', section: 'config' },
  { key: 'enforce_hard_token_cap', label: 'Enforce Hard Token Cap', section: 'limits' },
  { key: 'notify_churn', label: 'Alert on client churn', section: 'notifications' },
  { key: 'notify_payment_failure', label: 'Alert on payment failure', section: 'notifications' },
  { key: 'notify_token_limit', label: 'Alert on token limit', section: 'notifications' },
  { key: 'notify_new_signup', label: 'Alert on new client signup', section: 'notifications' },
  { key: 'notify_urgent_tickets', label: 'Alert on urgent tickets', section: 'notifications' },
]

const apiKeys = [
  { name: 'Stripe (Payments)', key: 'sk_live_****************************aX9k', status: 'active' },
  { name: 'OpenAI', key: 'sk-proj-****************************bZ2m', status: 'active' },
  { name: 'Resend (Transactional Email)', key: 're_****************************cW3n', status: 'active' },
  { name: 'SerpAPI', key: '****************************dY4p', status: 'active' },
  { name: 'Supabase Service Key', key: 'eyJ****************************eR5q', status: 'active' },
]

export default function SettingsClient({ settings }: { settings: Settings }) {
  const [textValues, setTextValues] = useState<Settings>(settings)
  const [toggleValues, setToggleValues] = useState<Settings>(settings)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [dangerModal, setDangerModal] = useState<{ label: string; word: string } | null>(null)
  const [dangerInput, setDangerInput] = useState('')
  const [isSaving, startSaving] = useTransition()
  const [isToggling, startToggling] = useTransition()

  const toggleKey = (k: string) => setShowKeys(p => ({ ...p, [k]: !p[k] }))

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }

  function handleTextChange(key: string, value: string) {
    setTextValues(p => ({ ...p, [key]: value }))
  }

  function handleSaveText() {
    const changed = TEXT_FIELDS.filter(f => textValues[f.key] !== settings[f.key])
    if (changed.length === 0) {
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
      return
    }
    startSaving(async () => {
      await Promise.all(changed.map(f => updatePlatformSetting(f.key, textValues[f.key])))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function handleToggle(key: string) {
    const next = toggleValues[key] === 'true' ? 'false' : 'true'
    setToggleValues(p => ({ ...p, [key]: next }))
    startToggling(async () => {
      const result = await updatePlatformSetting(key, next)
      if (result?.error) {
        setToggleValues(p => ({ ...p, [key]: toggleValues[key] }))
        showToast(`Failed to update ${key}`)
      }
    })
  }

  const confirmWords: Record<string, string> = {
    'Enable Maintenance Mode': 'MAINTENANCE',
    'Flush All Caches': 'FLUSH',
    'Disable New Signups': 'DISABLE',
    'Reset Rate Limits': 'RESET',
  }

  function renderTextField(f: { key: string; label: string }) {
    return (
      <div key={f.key}>
        <label className="text-[11px] font-medium text-white/50 block mb-1.5">{f.label}</label>
        <input
          value={textValues[f.key] ?? ''}
          onChange={e => handleTextChange(f.key, e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50 transition-colors"
        />
      </div>
    )
  }

  function renderToggleField(f: { key: string; label: string }) {
    const enabled = toggleValues[f.key] === 'true'
    return (
      <div key={f.key}>
        <label className="text-[11px] font-medium text-white/50 block mb-1.5">{f.label}</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleToggle(f.key)}
            disabled={isToggling}
            className={`w-10 h-5 rounded-full relative transition-colors disabled:opacity-50 ${enabled ? 'bg-violet-600' : 'bg-white/[0.08]'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${enabled ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className="text-[12px] text-white/50">{enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Super Admin Settings</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Platform-wide configuration and API key management</p>
        </div>
        <button
          onClick={handleSaveText}
          disabled={isSaving}
          className={`flex items-center gap-2 text-[13px] font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60 ${
            saved ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400' : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Platform Configuration */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-4 h-4 text-violet-400" />
          <p className="text-[13px] font-semibold text-white">Platform Configuration</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {TEXT_FIELDS.filter(f => f.section === 'config').map(renderTextField)}
          {TOGGLE_FIELDS.filter(f => f.section === 'config').map(renderToggleField)}
        </div>
      </div>

      {/* Token & Cost Limits */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-4 h-4 text-violet-400" />
          <p className="text-[13px] font-semibold text-white">Token & Cost Limits</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {TEXT_FIELDS.filter(f => f.section === 'limits').map(renderTextField)}
          {TOGGLE_FIELDS.filter(f => f.section === 'limits').map(renderToggleField)}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-4 h-4 text-violet-400" />
          <p className="text-[13px] font-semibold text-white">Notification Settings</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {TOGGLE_FIELDS.filter(f => f.section === 'notifications').map(renderToggleField)}
        </div>
      </div>

      {/* API Keys — not wired to a server action yet */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-violet-400" />
            <p className="text-[13px] font-semibold text-white">API Keys & Secrets</p>
          </div>
          <button className="flex items-center gap-1.5 text-[11px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg hover:bg-violet-500/15 transition-colors">
            <Plus className="w-3 h-3" /> Add Key
          </button>
        </div>
        <div className="space-y-3">
          {apiKeys.map(k => (
            <div key={k.name} className="flex items-center gap-4 py-3 border-b border-white/[0.04] last:border-0">
              <div className="flex-1">
                <p className="text-[12px] font-medium text-white/80">{k.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-[11px] text-white/40 font-mono">
                    {showKeys[k.name] ? k.key : k.key.replace(/[^*]/g, '•').slice(0, 24) + '••••'}
                  </code>
                  <button onClick={() => toggleKey(k.name)} className="text-white/25 hover:text-white/50 transition-colors">
                    {showKeys[k.name] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-2.5 h-2.5" /> Active
              </div>
              <button className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/20 transition-colors group">
                <Trash2 className="w-3 h-3 text-white/25 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-[13px] font-semibold text-red-400">Danger Zone</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Enable Maintenance Mode', desc: 'Puts the entire platform in maintenance mode. All clients will see a maintenance page.' },
            { label: 'Flush All Caches', desc: 'Clears server-side caches across all services. May cause temporary slowness.' },
            { label: 'Disable New Signups', desc: 'Prevents new organizations from signing up. Existing clients unaffected.' },
            { label: 'Reset Rate Limits', desc: 'Resets all API rate limit counters. Use during an incident.' },
          ].map(a => (
            <div key={a.label} className="flex items-start gap-3 p-3 bg-red-500/[0.05] border border-red-500/10 rounded-lg">
              <div className="flex-1">
                <p className="text-[12px] font-medium text-red-400">{a.label}</p>
                <p className="text-[10px] text-white/30 mt-1 leading-relaxed">{a.desc}</p>
                <p className="text-[9px] text-white/20 mt-1">Requires typing <span className="font-mono text-red-400/60">{confirmWords[a.label]}</span> to confirm</p>
              </div>
              <button
                onClick={() => { setDangerModal({ label: a.label, word: confirmWords[a.label] }); setDangerInput('') }}
                className="text-[11px] text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0 mt-0.5"
              >
                Execute
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger confirm modal */}
      {dangerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDangerModal(null)}>
          <div className="bg-[#111118] border border-red-500/25 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h2 className="text-[15px] font-semibold text-red-400">{dangerModal.label}</h2>
            </div>
            <p className="text-[12px] text-white/40 mb-4">
              Type <span className="font-mono font-bold text-red-400">{dangerModal.word}</span> exactly to confirm this action. This cannot be undone.
            </p>
            <input
              value={dangerInput}
              onChange={e => setDangerInput(e.target.value)}
              className="w-full bg-white/[0.04] border border-red-500/30 focus:border-red-500/60 rounded-lg px-3 py-2 text-[13px] text-white outline-none mb-4 font-mono"
              placeholder={dangerModal.word}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setDangerModal(null)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
              <button
                disabled={dangerInput !== dangerModal.word}
                onClick={() => {
                  showToast(`${dangerModal.label} is not wired up yet — no action was taken.`)
                  setDangerModal(null)
                }}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-[13px] text-white font-medium transition-colors"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1a2e] border border-white/[0.1] rounded-lg px-4 py-3 text-[12px] text-white/80 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
