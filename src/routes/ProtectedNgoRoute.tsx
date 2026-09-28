import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProtectedNgoRouteProps {
  children: React.ReactNode;
}

const ProtectedNgoRoute = ({ children }: ProtectedNgoRouteProps) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem('ngoToken');
    if (!token) {
      navigate('/ngo/login');
    }
  }, [navigate]);

  const token = localStorage.getItem('ngoToken');
  if (!token) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
};

export default ProtectedNgoRoute;
