import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Shield } from 'lucide-react';
import { setUserRole } from '../../services/users';
import toast from 'react-hot-toast';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!username.trim()) {
      toast.error('Le nom d\'utilisateur est requis');
      return false;
    }
    if (username.length < 3) {
      toast.error('Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Le nom d\'utilisateur ne peut contenir que des lettres, des chiffres et des underscores');
      return false;
    }
    if (!email.trim()) {
      toast.error('L\'email est requis');
      return false;
    }
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      // 1. Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Mettre à jour le profil avec le nom d'utilisateur
      await updateProfile(userCredential.user, {
        displayName: username,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
      });
      
      // 3. Définir le rôle utilisateur et le nom d'utilisateur dans Firestore
      await setUserRole(userCredential.user.uid, 'user', username);
      
      toast.success('Compte créé avec succès');
      navigate('/');
    } catch (err: any) {
      console.error('Erreur lors de l\'inscription:', err);
      
      // Gérer les erreurs spécifiques de Firebase
      switch (err.code) {
        case 'auth/email-already-in-use':
          toast.error('Cette adresse email est déjà utilisée');
          break;
        case 'auth/invalid-email':
          toast.error('L\'adresse email n\'est pas valide');
          break;
        case 'auth/operation-not-allowed':
          toast.error('L\'inscription par email/mot de passe n\'est pas activée');
          break;
        case 'auth/weak-password':
          toast.error('Le mot de passe est trop faible. Il doit contenir au moins 6 caractères');
          break;
        case 'auth/network-request-failed':
          toast.error('Erreur de connexion. Vérifiez votre connexion internet');
          break;
        case 'auth/too-many-requests':
          toast.error('Trop de tentatives. Veuillez réessayer plus tard');
          break;
        case 'username-already-exists':
          toast.error('Ce nom d\'utilisateur est déjà pris');
          break;
        default:
          toast.error('Une erreur est survenue lors de l\'inscription');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Créer un compte
        </h2>
        <div className="mt-2 text-center">
          <Link
            to="/admin/register"
            className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            <Shield className="w-4 h-4" />
            Accès administrateur
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Nom d'utilisateur <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  pattern="[a-zA-Z0-9_]+"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ex: john_doe"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Lettres, chiffres et underscores uniquement
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Minimum 6 caractères
                </p>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                <UserPlus className="w-4 h-4" />
                {loading ? 'Création en cours...' : 'S\'inscrire'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Déjà un compte ?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;