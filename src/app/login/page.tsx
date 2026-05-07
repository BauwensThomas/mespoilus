import { signIn } from './actions';
import type { Metadata } from 'next';

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
    <div className="min-h-screen bg-[#111827] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-xl">
              🐾
            </div>
            <span className="text-white font-bold text-xl tracking-wide">Mes Poilus</span>
          </div>
          <p className="text-gray-300 text-sm">Espace administration</p>
        </div>

        {/* Card */}
        <div className="bg-[#262626] border border-[#484848] rounded-2xl p-8">
          <h1 className="text-white font-semibold text-lg mb-6">Se connecter</h1>

          {hasError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
              <p className="text-red-400 text-sm">Email ou mot de passe incorrect.</p>
            </div>
          )}

          <form action={signIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs text-gray-200 mb-1.5 font-medium">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@mespoilus.com"
                className="w-full bg-[#1e1e1e] border border-[#484848] rounded-lg px-3 py-2.5 text-sm text-white
                           placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1
                           focus:ring-amber-500/30 transition-colors duration-150"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs text-gray-200 mb-1.5 font-medium">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-[#1e1e1e] border border-[#484848] rounded-lg px-3 py-2.5 text-sm text-white
                           placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1
                           focus:ring-amber-500/30 transition-colors duration-150"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-semibold
                         text-sm py-2.5 rounded-lg transition-colors duration-150 mt-2"
            >
              Se connecter
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-300 mt-6">
          Accès réservé à l'équipe Mes Poilus
        </p>
      </div>
    </div>
  );
}
