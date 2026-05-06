import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <div className="text-6xl mb-6">🐾</div>
      <h1 className="text-4xl font-bold text-white mb-3">404</h1>
      <p className="text-gray-400 text-lg mb-2">Page introuvable</p>
      <p className="text-gray-600 text-sm mb-8 max-w-md">
        Cette page n'existe pas ou a été déplacée. Retourne au tableau de bord.
      </p>
      <Link href="/" className="btn-primary">
        ← Retour au dashboard
      </Link>
    </div>
  );
}
