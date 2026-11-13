import { useEffect, useId, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Tri } from "@/lib/domain/types";

export type Errors = Partial<Record<string, string>>;

interface FieldShellProps {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  optional?: boolean | undefined;
  children: (ids: { id: string; describedBy?: string | undefined; invalid: boolean }) => ReactNode;
  className?: string | undefined;
}

export function FieldShell({ label, hint, error, optional, children, className }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="font-bold text-foreground">
        {label}
        {optional && <span className="ml-1.5 text-sm font-normal text-muted-foreground">(opcional)</span>}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {children({ id, describedBy, invalid: !!error })}
      {error && <FieldError id={errId!}>{error}</FieldError>}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string | undefined; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-sm font-bold text-foreground">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-attention" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

type Common = { label: string; hint?: string | undefined; error?: string | undefined; optional?: boolean | undefined; className?: string | undefined };

export function TextField({
  value,
  onChange,
  type = "text",
  maxLength = 200,
  placeholder,
  autoComplete = "off",
  inputMode,
  ...c
}: Common & {
  value: string;
  onChange: (v: string) => void;
  type?: string | undefined;
  maxLength?: number | undefined;
  placeholder?: string | undefined;
  autoComplete?: string | undefined;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] | undefined;
}) {
  return (
    <FieldShell {...c}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          type={type}
          className="field-control"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </FieldShell>
  );
}

export function TextAreaField({
  value,
  onChange,
  maxLength = 1000,
  rows = 3,
  ...c
}: Common & { value: string; onChange: (v: string) => void; maxLength?: number | undefined; rows?: number | undefined }) {
  return (
    <FieldShell {...c}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          rows={rows}
          className="field-control"
          value={value}
          maxLength={maxLength}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </FieldShell>
  );
}

/** Number input that keeps the typed text and reports a parsed number (or null when empty). */
export function NumberField({
  value,
  onChange,
  step = "any",
  min = 0,
  suffix,
  ...c
}: Common & { value: number | null; onChange: (v: number | null) => void; step?: string | undefined; min?: number | undefined; suffix?: string | undefined }) {
  const [text, setText] = useState(value === null ? "" : String(value));
  useEffect(() => {
    const parsed = text.trim() === "" ? null : Number(text.replace(",", "."));
    if (parsed !== value) setText(value === null ? "" : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <FieldShell {...c}>
      {({ id, describedBy, invalid }) => (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            className="field-control"
            value={text}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            data-min={min}
            data-step={step}
            onChange={(e) => {
              const t = e.target.value;
              setText(t);
              const n = Number(t.replace(",", "."));
              onChange(t.trim() === "" ? null : Number.isFinite(n) ? n : NaN);
            }}
          />
          {suffix && <span className="shrink-0 text-muted-foreground">{suffix}</span>}
        </div>
      )}
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  ...c
}: Common & { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; placeholder?: string | undefined }) {
  return (
    <FieldShell {...c}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          className="field-control"
          value={value}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

export function TriField({
  label,
  value,
  onChange,
  hint,
  error,
  allowEmpty,
}: {
  label: string;
  value: Tri | "" | undefined;
  onChange: (v: Tri) => void;
  hint?: string | undefined;
  error?: string | undefined;
  allowEmpty?: boolean | undefined;
}) {
  const name = useId();
  const opts: { v: Tri; l: string }[] = [
    { v: "sim", l: "Sim" },
    { v: "nao", l: "Não" },
    { v: "nao_sei", l: "Não sei" },
  ];
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-bold text-foreground">{label}</legend>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {opts.map((o) => {
          const checked = value === o.v;
          return (
            <label
              key={o.v}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-2 px-4 py-2 font-bold transition-colors",
                checked ? "border-info bg-info-soft text-foreground" : "border-input bg-card hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name={name}
                className="size-4 accent-[var(--color-info)]"
                checked={checked}
                onChange={() => onChange(o.v)}
              />
              {o.l}
            </label>
          );
        })}
        {allowEmpty && !value && <span className="self-center text-sm text-muted-foreground">Sem resposta</span>}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </fieldset>
  );
}

export function CheckField({
  label,
  checked,
  onChange,
  hint,
  error,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string | undefined;
  error?: string | undefined;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg py-1">
        <input
          id={id}
          type="checkbox"
          className="mt-1 size-5 shrink-0 accent-[var(--color-primary)]"
          checked={checked}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          <span className="font-bold">{label}</span>
          {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
        </span>
      </label>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

export function FormErrorSummary({ errors }: { errors: Errors }) {
  const list = Object.values(errors).filter(Boolean) as string[];
  if (!list.length) return null;
  return (
    <div role="alert" className="rounded-lg border-2 border-attention bg-attention-soft p-4">
      <p className="font-bold text-foreground">Revise antes de salvar:</p>
      <ul className="mt-1 list-disc pl-5 text-sm">
        {list.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
