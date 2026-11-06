export interface NotFoundPageProps {
  onBack: () => void;
}

export function NotFoundPage({ onBack }: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-surface-0 text-ink flex flex-col items-center justify-center p-6 selection:bg-accent-subtle selection:text-accent">
      <main className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-surface-2 border border-line text-accent font-display text-2xl font-bold tracking-tight shadow-sm">
          404
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Page Not Found
          </h1>
          <p className="text-sm text-ink-2 leading-relaxed">
            The page or view you requested doesn't exist or has been moved. Check the URL address or return to your financial dashboard.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center h-11 px-6 rounded-btn bg-accent text-white font-medium text-sm shadow hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

export default NotFoundPage;
