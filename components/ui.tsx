import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, HTMLAttributes } from 'react';

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${className}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean };

export function Button({ className = '', loading = false, children, disabled, ...props }: BtnProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={`btn-base rounded-lg px-4 py-2.5 text-sm font-medium 
        border border-gray-200 bg-white text-gray-700 shadow-button
        hover:bg-gray-50 hover:border-gray-300 hover:shadow-button-hover hover:-translate-y-0.5
        focus:ring-2 focus:ring-primary/20 focus:ring-offset-2
        active:translate-y-0 active:shadow-sm
        disabled:hover:translate-y-0 disabled:hover:shadow-button
        touch-target ${className}`}
    >
      {loading && <Spinner />}
      <span>{children}</span>
    </button>
  );
}

export function PrimaryButton({ className = '', loading = false, children, disabled, ...props }: BtnProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={`btn-base rounded-lg px-5 py-2.5 text-sm font-semibold
        gradient-primary text-white shadow-lg
        hover:shadow-xl hover:-translate-y-0.5 hover:brightness-110
        focus:ring-2 focus:ring-primary/40 focus:ring-offset-2
        active:translate-y-0 active:shadow-md active:brightness-95
        disabled:hover:translate-y-0 disabled:hover:shadow-lg disabled:hover:brightness-100
        touch-target ${className}`}
    >
      {loading && <Spinner className="text-white" />}
      <span>{children}</span>
    </button>
  );
}

export function SecondaryButton({ className = '', loading = false, children, disabled, ...props }: BtnProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={`btn-base rounded-lg px-5 py-2.5 text-sm font-semibold
        border-2 border-primary/20 bg-primary/5 text-primary
        hover:bg-primary/10 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md
        focus:ring-2 focus:ring-primary/30 focus:ring-offset-2
        active:translate-y-0 active:shadow-sm
        disabled:hover:translate-y-0 disabled:hover:shadow-none
        touch-target ${className}`}
    >
      {loading && <Spinner className="text-primary" />}
      <span>{children}</span>
    </button>
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      {...props} 
      className={`input-base border border-gray-200 rounded-lg px-4 py-3 text-sm 
        placeholder-gray-400 bg-white shadow-sm
        hover:border-gray-300 hover:shadow-md
        focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md
        transition-all duration-fast
        ${props.type === 'search' ? 'pl-10' : ''}
        ${className}`} 
    />
  );
}

export function Textarea({ className = '', rows = 4, ...props }: InputHTMLAttributes<HTMLTextAreaElement> & { rows?: number }) {
  return (
    <textarea 
      {...props}
      rows={rows}
      className={`input-base border border-gray-200 rounded-lg px-4 py-3 text-sm 
        placeholder-gray-400 resize-y bg-white shadow-sm
        hover:border-gray-300 hover:shadow-md
        focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md
        transition-all duration-fast min-h-[100px]
        ${className}`} 
    />
  );
}

export function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select 
        {...props}
        className={`input-base border border-gray-200 rounded-lg px-4 py-3 text-sm 
          appearance-none bg-white shadow-sm pr-10
          hover:border-gray-300 hover:shadow-md
          focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md
          transition-all duration-fast
          ${className}`} 
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`bg-white rounded-xl shadow-card border border-gray-100 
      hover:shadow-card-hover transition-all duration-base animate-fadeInUp 
      ${className}`}>
      {children}
    </div>
  );
}

export function Section({ title, actions, children }: { title: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <div className="h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full mt-2"></div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </Card>
  );
}

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20',
    info: 'bg-info/10 text-info border-info/20'
  };
  
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium 
      border transition-all duration-fast hover:scale-105
      ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function IconButton({ className = '', loading = false, children, disabled, ...props }: BtnProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={`btn-base rounded-lg p-2.5 text-sm font-medium 
        border border-gray-200 bg-white text-gray-700 shadow-button
        hover:bg-gray-50 hover:border-gray-300 hover:shadow-button-hover hover:-translate-y-0.5
        focus:ring-2 focus:ring-primary/20 focus:ring-offset-2
        active:translate-y-0 active:shadow-sm
        disabled:hover:translate-y-0 disabled:hover:shadow-button
        touch-target ${className}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return (
    <div className={`h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent ${className}`} />
  );
}

export function LoadingCard() {
  return (
    <Card className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </Card>
  );
}




