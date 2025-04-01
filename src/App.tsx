import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ResetPassword from './components/auth/ResetPassword';
import AdminLogin from './components/auth/AdminLogin';
import AdminRegister from './components/auth/AdminRegister';
import InterventionsList from './components/admin/InterventionsList';
import EditIntervention from './components/EditIntervention';
import MachinesList from './components/admin/MachinesList';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/admin/AdminRoute';
import Navbar from './components/Navbar';
import { useAuth } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import UserInterventionsList from './components/UserInterventionsList';
import InterventionsListe from './components/InterventionListe';
import CreateIntervention from './components/CreateIntervention';

function App() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        {!window.location.pathname.includes('/auth')}
        <div className="py-6">
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={user ? (isAdmin ? <Navigate to="/admin/interventions" /> : <Navigate to="/" />) : <Login />} />
            <Route path="/register" element={user ? (isAdmin ? <Navigate to="/admin/interventions" /> : <Navigate to="/" />) : <Register />} />
            <Route path="/reset-password" element={user ? (isAdmin ? <Navigate to="/admin/interventions" /> : <Navigate to="/" />) : <ResetPassword />} />
            
            {/* Admin Routes */}
            <Route path="/interventions" element={<><Navbar/> <InterventionsListe /></>} />
            <Route path="/admin/login" element={user ? (isAdmin ? <Navigate to="/admin/interventions" /> : <Navigate to="/" />) : <AdminLogin />} />
            <Route path="/admin/register" element={user ? (isAdmin ? <Navigate to="/admin/interventions" /> : <Navigate to="/" />) : <AdminRegister />} />
            <Route
              path="/admin/interventions"
              element={
                <AdminRoute>
                   <Navbar/>
                  <InterventionsList />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/machines"
              element={
                <AdminRoute>
                   <Navbar/>
                  <MachinesList />
                </AdminRoute>
              }
            />
            
            {/* User Routes */}
            <Route
              path="/interventions/:id"
              element={
                <ProtectedRoute>
                   <Navbar/>
                  <EditIntervention />
                </ProtectedRoute>
              }
            />
            
            {/* Root Route - Show intervention form */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navbar/>
                  <InterventionsListe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/intervention/new/"
              element={
                <ProtectedRoute>
                   <Navbar/>
                  <CreateIntervention />
                </ProtectedRoute>
              }
            />
          </Routes>
          
        </div>
      </div>
    </Router>
  );
}

export default App;