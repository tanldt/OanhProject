import CipsAuthShell from "../components/CipsAuthShell";

export default function LoginMembee() {
  const iframeSrc = import.meta.env.VITE_MEMBEE_LOGIN_IFRAME_SRC as string;

  return (
    <CipsAuthShell
      title="Member Sign-in"
      subtitle="Sign in with your CIPS member account (Membee SSO)."
    >
      {!iframeSrc ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Missing Membee iframe URL
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Set{" "}
            <code className="font-mono">VITE_MEMBEE_LOGIN_IFRAME_SRC</code> in{" "}
            <code className="font-mono">Frontend/.env</code>.
          </p>

          <a
            href={
              (import.meta.env.VITE_CIPS_JOIN_URL as string) ||
              "https://cips.ca/membership/"
            }
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-cipsNavy px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Become a CIPS Member
          </a>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-slate-200">
          <iframe title="Membee Login" src={iframeSrc} className="w-full h-[560px]" />
        </div>
      )}
    </CipsAuthShell>
  );
}