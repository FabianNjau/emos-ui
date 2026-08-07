interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: 'default' | 'green' | 'red' | 'accent' | 'orange';
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

export default function StatCard({ label, value, subtitle, color = 'default', icon, style }: StatCardProps) {
  return (
    <div className={`stat-card${color !== 'default' ? ` ${color}` : ''}`} style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
            {label}
          </div>
          <div style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
            fontWeight: 700,
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            marginTop: 4,
          }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {subtitle}
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            width: 40, height: 40,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)',
            flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
