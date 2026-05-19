import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AdminPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/admin/users', { replace: true });
  }, [navigate]);

  return null;
}
