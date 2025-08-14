import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, HTMLAttributes } from 'react';

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded px-3 py-2 text-sm transition border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 ${className}`}
    />
  );
}

export function PrimaryButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded px-3 py-2 text-sm transition bg-black text-white hover:opacity-90 disabled:opacity-50 ${className}`}
    />
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
      <div className="flex items-center justify-between mb-3">
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



