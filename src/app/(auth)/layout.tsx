export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-brand-navy px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-heading text-2xl font-extrabold text-white">
            Easy<span className="text-brand-cyan">Food</span>Hub
          </span>
          <p className="mt-1 text-sm text-white/60">Prospecção comercial</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white p-6 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
