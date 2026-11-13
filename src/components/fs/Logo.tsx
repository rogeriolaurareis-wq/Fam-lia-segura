import { cn } from "@/lib/utils";

/** Brand logo: orange shield with two adults and two children hugging inside. */
export function Logo({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 48 56"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M24 2.5 44.5 9.5v17.5c0 14-9 22.8-20.5 26.5C12.5 49.8 3.5 41 3.5 27V9.5z"
        fill="var(--color-background)"
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* adults */}
      <circle cx="17" cy="17" r="4.3" fill="var(--color-safe-light)" />
      <circle cx="31" cy="17" r="4.3" fill="var(--color-safe-light)" />
      <path d="M9.5 37c0-7 3.3-11 7.5-11s7.5 4 7.5 11z" fill="var(--color-safe-light)" />
      <path d="M23.5 37c0-7 3.3-11 7.5-11s7.5 4 7.5 11z" fill="var(--color-safe-light)" />
      {/* children */}
      <g stroke="var(--color-background)" strokeWidth="1.4">
        <circle cx="19.5" cy="30" r="3.4" fill="var(--color-primary)" />
        <circle cx="28.5" cy="30" r="3.4" fill="var(--color-primary)" />
        <path d="M14 43.5c0-4.6 2.4-7.3 5.5-7.3s5.5 2.7 5.5 7.3z" fill="var(--color-primary)" />
        <path d="M23 43.5c0-4.6 2.4-7.3 5.5-7.3s5.5 2.7 5.5 7.3z" fill="var(--color-primary)" />
      </g>
      {/* embracing arms */}
      <path d="M10.5 33.5c1.5 9 25.5 9 27 0" fill="none" stroke="var(--color-safe-light)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
