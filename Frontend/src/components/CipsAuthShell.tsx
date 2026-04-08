import type { ReactNode } from "react";
import cipsLogo from "../assets/cips-logo.png";

export default function CipsAuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cipsBg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <a className="flex justify-center" href="https://cips.ca" target="_blank" rel="noopener noreferrer">
          <img
            src={cipsLogo}
            alt="CIPS"
            className="h-14 w-auto object-contain"
            
          />
        </a>

        {/* Card */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 pt-6 pb-4">
            <h1 className="text-2xl font-bold text-cipsNavy">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm text-cipsText/80 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <div className="px-6 pb-6">{children}</div>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Canada’s Association of Information Technology (IT) Professionals
        </p>
      </div>
    </div>
  );
}