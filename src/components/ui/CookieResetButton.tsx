'use client';

export default function CookieResetButton() {
  function reset() {
    localStorage.removeItem('mespoilus_cookie_consent');
    window.location.reload();
  }

  return (
    <button
      onClick={reset}
      className="mt-2 px-4 py-2 bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100 rounded-lg text-sm transition-colors"
    >
      Réinitialiser mes préférences cookies
    </button>
  );
}
