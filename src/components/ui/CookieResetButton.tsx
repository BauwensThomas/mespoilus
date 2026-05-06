'use client';

export default function CookieResetButton() {
  function reset() {
    localStorage.removeItem('mespoilus_cookie_consent');
    window.location.reload();
  }

  return (
    <button
      onClick={reset}
      className="mt-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-lg text-sm transition-colors"
    >
      Réinitialiser mes préférences cookies
    </button>
  );
}
