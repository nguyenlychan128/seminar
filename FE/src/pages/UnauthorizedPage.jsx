import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      backgroundColor: 'var(--color-bg-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-lg)'
    }}>
      <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div style={{
          fontSize: '72px',
          fontWeight: '700',
          color: 'var(--color-error)',
          marginBottom: 'var(--spacing-md)'
        }}>
          403
        </div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-md)'
        }}>
          Unauthorized
        </h2>
        <p style={{
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-lg)',
          lineHeight: '1.6'
        }}>
          You don't have permission to access this page.
        </p>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 24px',
            minHeight: '44px',
            fontSize: '14px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            background: 'var(--gradient-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'all var(--transition-fast)',
            boxShadow: 'var(--shadow-md)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = 'var(--shadow-lg)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
