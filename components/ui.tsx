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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target ${className}`}
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow touch-target ${className}`}
    >
      {loading && <Spinner className="text-white" />}
      <span>{children}</span>
    </button>
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      {...props} 
      className={`w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder-gray-400 transition-all duration-200 ease-in-out
        hover:border-gray-400 
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
        disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60
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
      className={`w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder-gray-400 resize-y transition-all duration-200 ease-in-out
        hover:border-gray-400 
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
        disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60
        ${className}`} 
    />
  );
}

export function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select 
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-4 py-3 text-sm appearance-none bg-white transition-all duration-200 ease-in-out
        hover:border-gray-400 
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
        disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60
        ${className}`} 
    >
      {children}
    </select>
  );
}

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`bg-white rounded-lg shadow-sm border border-gray-200 animate-fadeIn ${className}`}>
      {children}
    </div>
  );
}

export function Section({ title, actions, children }: { title: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </Card>
  );
}

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700'
  };
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}




