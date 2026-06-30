'use client'

import { useState } from 'react'
import {
  Settings, Save, Key, Bell, Shield, Globe, Mail, Zap,
  Plus, Trash2, Eye, EyeOff, CheckCircle2, AlertCircle
} from 'lucide-react'

export default function SuperAdminSettingsPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)
  const [dangerModal, setDangerModal] = useState<{ label: string; word: string } | null>(null)
  const [dangerInput, setDangerInput] = useState('')

  const toggleKey = (k: string) => setShowKeys(p => ({ ...p, [k]: !p[k] }))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const confirmWords: Record<string, string> = {
    'Enable Maintenance Mode': 'MAINTENANCE',
    'Flush All Caches': 'FLUSH',
    'Disable New Signups': 'DISABLE',
    'Reset Rate Limits': 'RESET',
  }

  const sections = [
    {
      title: 'Platform Configuration',
      icon: Globe,
      fields: [
        { key: 'platform_name', label: 'Platform Name', value: 'Magnivo AI', type: 'text' },
        { key: 'support_email', label: 'Support Email', value: 'support@magnivo.ai', type: 'text' },
        { key: 'default_token_limit', label: 'Default Monthly Token Limit', value: '10000000', type: 'text' },
        { key: 'trial_days', label: 'Trial Duration (days)', value: '14', type: 'text' },
        { key: 'maintenance_mode', label: 'Maintenance Mode', value: false, type: 'toggle' },
        { key: 'new_signups', label: 'Allow New Signups', value: true, type: 'toggle' },
      ],
    },
    {
      title: 'Token & Cost Limits',
      icon: Zap,
      fields: [
        { key: 'starter_tokens', label: 'Starter Plan Token Limit', value: '10000000', type: 'text' },
        { key: 'growth_tokens', label: 'Growth Plan Token Limit', value: '30000000', type: 'text' },
        { key: 'pro_tokens', label: 'Pro Plan Token Limit', value: '60000000', type: 'text' },
        { key: 'enterprise_tokens', label: 'Enterprise Plan Token Limit', value: '100000000', type: 'text' },
        { key: 'hard_cap_enabled', label: 'Enforce Hard Token Cap', value: true, type: 'toggle' },
        { key: 'alert_threshold', label: 'Alert at % usage', value: '80', type: 'text' },
      ],
    },
    {
      title: 'Notification Settings',
      icon: Bell,
      fields: [
        { key: 'notify_churn', label: 'Alert on client churn', value: true, type: 'toggle' },
        { key: 'notify_payment_fail', label: 'Alert on payment failure', value: true, type: 'toggle' },
        { key: 'notify_token_limit', label: 'Alert on token limit', value: true, type: 'toggle' },
        { key: 'notify_new_client', label: 'Alert on new client signup', value: true, type: 'toggle' },
        { key: 'notify_support', label: 'Alert on urgent tickets', value: true, type: 'toggle' },
      ],
    },
  ]

  const apiKeys = [
    { name: 'Stripe (Payments)', key: 'sk_live_****************************aX9k', status: 'active' },
    { name: 'OpenAI', key: 'sk-proj-****************************bZ2m', status: 'active' },
    { name: 'Resend (Transactional Email)', key: 're_****************************cW3n', status: 'active' },
    { name: 'SerpAPI', key: '****************************dY4p', status: 'active' },
    { name: 'Supabase Service Key', key: 'eyJ****************************eR5q', status: 'active' },
  ]

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Super Admin Settings</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Platform-wide configuration and API key management</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 text-[13px] font-medium px-4 py-2 rounded-lg transition-colors ${
            saved ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400' : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Config sections */}
      {sections.map(section => {
        const Icon = section.icon
        return (
          <div key={section.title} className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Icon className="w-4 h-4 text-violet-400" />
              <p className="text-[13px] font-semibold text-white">{section.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {section.fields.map(f => (
                <div key={f.key}>
                  <label className="text-[11px] font-medium text-white/50 block mb-1.5">{f.label}</label>
                  {f.type === 'toggle' ? (
                    <div className="flex items-center gap-3">
                      <button
                        className={`w-10 h-5 rounded-full relative transition-colors ${f.value ? 'bg-violet-600' : 'bg-white/[0.08]'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${f.value ? 'left-5' : 'left-0.5'}`} />
                      </button>
                      <span className="text-[12px] text-white/50">{f.value ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  ) : (
                    <input
                      defaultValue={f.value as string}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50 transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* API Keys */}
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
                onClick={() => setDangerModal(null)}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-[13px] text-white font-medium transition-colors"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
