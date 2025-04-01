import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { setUserRole } from '../../services/users';

const ADMIN_REGISTRATION_CODE = 'ADMIN123'; // Replace with a secure code in production

const AdminRegister = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
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
    if (!registrationCode.trim()) {
      toast.error('Le code d\'inscription administrateur est requis');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (registrationCode !== ADMIN_REGISTRATION_CODE) {
      toast.error('Code d\'inscription administrateur invalide');
      return;
    }

    setLoading(true);

    try {
      // 1. Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Mettre à jour le profil avec le nom d'utilisateur
      await updateProfile(userCredential.user, {
        displayName: username,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
      });
      
      // 3. Définir le rôle administrateur et le nom d'utilisateur dans Firestore
      await setUserRole(userCredential.user.uid, 'admin', username);
      
      toast.success('Compte administrateur créé avec succès');
      navigate('/admin/interventions');
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
        <div className="flex justify-center">
          <Shield className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Inscription Administrateur
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Créer un nouveau compte administrateur
        </p>
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
                Email administrateur <span className="text-red-500">*</span>
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
              <label htmlFor="registrationCode" className="block text-sm font-medium text-gray-700">
                Code d'inscription administrateur <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="registrationCode"
                  name="registrationCode"
                  type="password"
                  required
                  value={registrationCode}
                  onChange={(e) => setRegistrationCode(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Code requis pour créer un compte administrateur
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
                {loading ? 'Création en cours...' : 'Créer le compte administrateur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;