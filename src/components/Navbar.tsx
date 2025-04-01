import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, Settings, ClipboardList, Shield, Cog } from 'lucide-react';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    } finally {
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              to={isAdmin ? "/admin/interventions" : "/"} 
              className="text-xl font-bold text-gray-800"
            >
              Maintenance App
            </Link>
          </div>

          {!user && (
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900"
              >
                Connexion
              </Link>
              <Link
                to="/admin/login"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            </div>
          )}

          {user && (
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-gray-700">{user.email}</span>
                    <span className={`text-sm ${isAdmin ? 'text-blue-600' : 'text-gray-500'}`}>
                      {isAdmin ? (
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Administrateur
                        </div>
                      ) : (
                        'Utilisateur'
                      )}
                    </span>
                  </div>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[1000]">
                    <div className="py-1">
                      {isAdmin && (
                        <>
                          <Link
                            to="/admin/interventions"
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <ClipboardList className="w-4 h-4 mr-2" />
                            Liste des interventions
                          </Link>
                          <Link
                            to="/admin/machines"
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Cog className="w-4 h-4 mr-2" />
                            Gestion des machines
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          // TODO: Implémenter la page de profil
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profil
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          // TODO: Implémenter la page des paramètres
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Paramètres
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;