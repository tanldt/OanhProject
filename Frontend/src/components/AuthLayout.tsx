import type { ReactNode } from "react";

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6">
        {/* Left branding panel */}
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cipsRed" />
            <div>
              <p className="text-xs tracking-wide text-slate-500">
                Canada’s Association of IT Professionals
              </p>
              <p className="font-semibold text-slate-900">CIPS</p>
            </div>
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-slate-600 leading-relaxed">{subtitle}</p>

          <div className="mt-8 rounded-xl bg-slate-50 border p-4">
            <p className="text-sm font-semibold text-slate-900">
              What this portal does
            </p>
            <ul className="mt-2 text-sm text-slate-600 list-disc pl-5 space-y-1">
              <li>Applicants submit certification applications</li>
              <li>Office staff manage applications</li>
              <li>Reviewers evaluate education & experience</li>
              <li>SSO via Membee (production) / Demo (capstone)</li>
            </ul>
          </div>
        </div>

        {/* Right form panel */}
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          {children}
          <p className="mt-6 text-xs text-slate-500">
            Capstone build: React + TypeScript + Node/Express. Styling via Tailwind.
          </p>
        </div>
      </div>
    </div>
  );
}