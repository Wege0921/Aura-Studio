import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboardPage from './Admin/AdminDashboardPage';
import UserDashboard from './User/UserDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Render different dashboard based on user role
  if (user.role === 'ADMIN') {
    return <AdminDashboardPage />;
  }

  // Regular user dashboard
  return <UserDashboard />;
};

export default Dashboard;
