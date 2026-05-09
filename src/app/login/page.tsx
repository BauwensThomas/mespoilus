import { signIn } from './actions';
import type { Metadata } from 'next';
import { PawPrint, Lock, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Connexion - Mes Poilus Admin',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: { error?: string; redirect?: string };
}

export default function LoginPage({ searchParams }: Props) {
  const hasError = searchParams.error === '1';

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <PawPrint size={28} className="text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-gray-900 font-bold text-2xl tracking-tight">Mes Poilus</h1>
              <p className="text-gray-600 text-xs uppercase tracking-widest">Administration</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-8">
          <h2 className="text-gray-900 font-bold text-xl mb-2">Se connecter</h2>
          <p className="text-gray-600 text-sm mb-8">Accédez à votre espace administrateur</p>

          {hasError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 flex gap-3">
              <AlertCircle size={20} strokeWidth={1.5} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">Email ou mot de passe incorrect.</p>
            </div>
          )}

          <form action={signIn} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@mespoilus.com"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900
                           placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2
                           focus:ring-orange-200 transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900
                           placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2
                           focus:ring-orange-200 transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold
                         text-base py-3 rounded-xl transition-colors duration-200 mt-4 flex items-center justify-center gap-2
                         focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
            >
              <Lock size={18} strokeWidth={1.5} />
              Se connecter
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-8 font-medium">
          Accès réservé à l'équipe Mes Poilus
        </p>
      </div>
    </div>
  );
}
