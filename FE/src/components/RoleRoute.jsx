import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetMe } from '../hooks/useGetMe';

export default function RoleRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth();
  const { loading, error } = useGetMe();

  // If not authenticated AND not loading user data, redirect to login
  if (!isAuthenticated && !loading) {
    return <Navigate to="/login" replace />;
  }

  // Show loading state while restoring user data
  if (loading) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-dark)',
        padding: 'var(--spacing-lg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto'
          }} />
          <p style={{
            marginTop: 'var(--spacing-lg)',
            color: 'var(--color-text-secondary)',
            fontSize: '14px'
          }}>
            Restoring your session...
          </p>
        </div>
      </div>
    );
  }

  // Show error if getMe failed
  if (error) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-dark)',
        padding: 'var(--spacing-lg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: 'var(--spacing-md)',
            color: 'var(--color-error)'
          }}>
            ⚠️
          </div>
          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: '14px',
            marginBottom: 'var(--spacing-lg)'
          }}>
            {error}
          </p>
          <a
            href="/login"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: 'var(--gradient-primary)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  if (!requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
