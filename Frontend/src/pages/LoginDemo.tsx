import { useMemo, useState } from "react";
import CipsAuthShell from "../components/CipsAuthShell";

export default function LoginDemo() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmedEmail = email.trim();

  const emailError = useMemo(() => {
    if (!touched && trimmedEmail.length === 0) return "";

    if (trimmedEmail.length === 0) {
      return "Please enter your email address.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return "Please enter a valid email address.";
    }

    return "";
  }, [trimmedEmail, touched]);

  const canSubmit = trimmedEmail.length > 0 && !emailError;

  const signIn = () => {
    setTouched(true);

    if (!trimmedEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) return;

    const token = `DEV|${trimmedEmail}`;

    window.location.href = `/auth/membee/callback?Token=${encodeURIComponent(
      token
    )}`;
  };

  return (
    <CipsAuthShell
      title="Certification Portal Login"
      subtitle="Demo mode for capstone marking. In production, members sign in using Membee SSO."
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-cipsText">Email</label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            className={[
              "mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200",
              emailError
                ? "border-red-300 bg-red-50 text-slate-900 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-cipsNavy/20",
            ].join(" ")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="you@cips.ca"
            aria-invalid={emailError ? "true" : "false"}
            aria-describedby={emailError ? "email-error" : "email-help"}
            onKeyDown={(e) => {
              if (e.key === "Enter") signIn();
            }}
          />

          {emailError ? (
            <p id="email-error" className="mt-2 text-xs font-medium text-red-600">
              {emailError}
            </p>
          ) : (
            <p id="email-help" className="mt-2 text-xs text-slate-500">
              Enter the email address associated with your CIPS account.
            </p>
          )}

          <p className="mt-2 text-xs text-slate-500">
            Note: In demo mode, only predefined emails are accepted to simulate
            member access.
          </p>
        </div>

        <button
          onClick={signIn}
          disabled={!canSubmit}
          className="w-full rounded-xl bg-blue-400 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 active:scale-95 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        >
          Sign in
        </button>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-cipsText">
            Not a CIPS member?
          </p>
          <p className="mt-1 text-sm text-cipsText/80">
            You must be a CIPS member to apply. If you’re not a member, join
            first.
          </p>

          <a
            href={
              (import.meta.env.VITE_CIPS_JOIN_URL as string) ||
              "https://cips.ca/membership/"
            }
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-cipsNavy hover:bg-slate-100 active:scale-95 transition-all duration-200"
          >
            Become a CIPS Member
          </a>
        </div>
      </div>
    </CipsAuthShell>
  );
}