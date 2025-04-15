import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, Auth } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { getUserRole } from '../../services/users';
import { Eye, EyeOff, LogIn, Loader, Mail, Lock, Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    form: ''
  });

  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Vérifier le rôle de l'utilisateur
          const role = await getUserRole(user.uid);
          
          if (role === 'admin') {
            // Si c'est un admin, rediriger vers le dashboard admin
            navigate('/admin/dashboard');
          } else {
            // Si ce n'est pas un admin, afficher un message et déconnecter
            toast.error('Vous n\'avez pas les droits d\'administration nécessaires');
            auth.signOut();
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur tape
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation de base
    let hasError = false;
    const newErrors = {
      email: '',
      password: '',
      form: ''
    };
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
      hasError = true;
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
      hasError = true;
    }
    
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({ email: '', password: '', form: '' });

    try {
      // Tentative de connexion
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const user = userCredential.user;
      
      // Vérifier si l'utilisateur est un administrateur
      const role = await getUserRole(user.uid);
      
      if (role !== 'admin') {
        // Si ce n'est pas un admin, afficher une erreur et déconnecter
        await auth.signOut();
        setErrors(prev => ({ 
          ...prev, 
          form: 'Vous n\'avez pas les droits d\'administration nécessaires' 
        }));
        setLoading(false);
        return;
      }
      
      toast.success('Connexion administrateur réussie!');
      navigate('/admin/dashboard');
      
    } catch (error: any) {
      setLoading(false);
      console.error('Admin login error:', error);
      
      // Gérer les erreurs spécifiques de Firebase
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrors(prev => ({ ...prev, form: 'Email ou mot de passe incorrect' }));
      } else if (error.code === 'auth/too-many-requests') {
        setErrors(prev => ({ ...prev, form: 'Trop de tentatives échouées. Veuillez réessayer plus tard' }));
      } else if (error.code === 'auth/user-disabled') {
        setErrors(prev => ({ ...prev, form: 'Ce compte a été désactivé' }));
      } else {
        setErrors(prev => ({ ...prev, form: error.message || 'Une erreur est survenue lors de la connexion' }));
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Connexion administrateur
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link to="/admin/register" className="font-medium text-blue-600 hover:text-blue-500">
              créez un compte administrateur
            </Link>
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
          <p className="text-sm">
            Cette page est réservée aux administrateurs. Si vous êtes un utilisateur standard, veuillez vous connecter via l'espace utilisateur.
          </p>
        </div>
        
        {errors.form && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.form}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="admin@exemple.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="••••••••"
                />
                <div 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Se souvenir de moi
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Mot de passe oublié?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Shield className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Connexion en cours...' : 'Se connecter en tant qu\'administrateur'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Navigation</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Link
              to="/login"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Espace utilisateur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;