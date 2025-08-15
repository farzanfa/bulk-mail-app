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
      className={`inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm transition border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 ${className}`}
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
      className={`inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm transition bg-black text-white hover:opacity-90 disabled:opacity-50 ${className}`}
    >
      {loading && <Spinner className="text-white" />}
      <span>{children}</span>
    </button>
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`border rounded px-3 py-2 text-sm ${className}`} />;
}

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`bg-white rounded-lg shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function Section({ title, actions, children }: { title: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <h2 className="font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </Card>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs">{children}</span>;
}




