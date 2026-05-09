import Link from 'next/link';
import { PawPrint, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-orange-50 px-8 text-center">
      <div className="mb-6">
        <div className="p-4 bg-orange-100 rounded-full inline-block">
          <PawPrint size={48} className="text-orange-600" strokeWidth={1.5} />
        </div>
      </div>
      <h1 className="text-6xl font-bold text-gray-900 mb-3">404</h1>
      <p className="text-gray-600 text-lg font-medium mb-2">Page introuvable</p>
      <p className="text-gray-600 text-base mb-10 max-w-md">
        Cette page n'existe pas ou a été déplacée. Retournons à la page d'accueil.
      </p>
      <Link href="/" className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2">
        <Home size={20} strokeWidth={1.5} />
        Retour à l'accueil
      </Link>
    </div>
  );
}
