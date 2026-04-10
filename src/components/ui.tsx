import { PropsWithChildren } from 'react';

export function Card({ children, title, actions, className = '' }: PropsWithChildren<{ title?: string; actions?: React.ReactNode; className?: string }>) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="cardHeader">
          <div>{title && <h3>{title}</h3>}</div>
          <div>{actions}</div>
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`btn ${props.className ?? ''}`.trim()} />;
}

export function SegmentedTabs({ tabs, value, onChange }: { tabs: { label: string; value: string }[]; value: string; onChange: (value: string) => void; }) {
  return (
    <div className="tabsRow">
      {tabs.map((tab) => (
        <button key={tab.value} type="button" className={`tabButton ${value === tab.value ? 'active' : ''}`} onClick={() => onChange(tab.value)}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
