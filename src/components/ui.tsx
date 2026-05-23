import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <header className="safe-top mb-6 flex items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-teal-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-teal-700/80">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function Fab({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full tropical-gradient text-3xl font-light text-white shadow-lg shadow-teal-600/30 transition hover:scale-105 active:scale-95 safe-bottom"
    >
      +
    </button>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50'
  const variants = {
    primary: 'tropical-gradient text-white shadow-md shadow-teal-600/20',
    secondary: 'bg-white text-teal-800 border border-teal-200 shadow-sm',
    danger: 'bg-red-500 text-white',
    ghost: 'text-teal-700 hover:bg-teal-50',
  }
  const { type = 'button', ...rest } = props
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-teal-900">{label}</span>
      {children}
      {hint && <span className="block text-xs text-teal-600/70">{hint}</span>}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 text-teal-900 placeholder:text-teal-400/60 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputClass} {...props} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClass} min-h-[88px] resize-y`} {...props} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={inputClass} {...props} />
}

export function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="glass-card animate-fade-up rounded-2xl p-8 text-center">
      <span className="text-4xl" role="img" aria-hidden>
        {icon}
      </span>
      <h3 className="mt-3 font-display text-lg font-semibold text-teal-900">{title}</h3>
      <p className="mt-1 text-sm text-teal-700/75">{description}</p>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl safe-bottom animate-fade-up">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-teal-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-teal-600 hover:bg-teal-50"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Badge({ children, tone = 'teal' }: { children: ReactNode; tone?: 'teal' | 'amber' | 'green' }) {
  const tones = {
    teal: 'bg-teal-100 text-teal-800',
    amber: 'bg-amber-100 text-amber-900',
    green: 'bg-green-100 text-green-800',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}
