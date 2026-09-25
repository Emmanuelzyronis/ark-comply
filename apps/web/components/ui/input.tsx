import { cn } from '@/lib/utils';
import { type InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id: idProp, ...props }, ref) => {
    const generatedId = useId();
    const id = idProp ?? (label ? generatedId : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-brand-text-muted mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            'w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-text-base placeholder:text-brand-muted',
            'focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30',
            'transition-colors duration-150',
            error && 'border-red-500 focus:border-red-500',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="mt-1 text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id: idProp, ...props }, ref) => {
    const generatedId = useId();
    const id = idProp ?? (label ? generatedId : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-brand-text-muted mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            'w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-text-base placeholder:text-brand-muted resize-none',
            'focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30',
            'transition-colors duration-150',
            error && 'border-red-500',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="mt-1 text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
