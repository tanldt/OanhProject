/**
 * MembeeCallback Component
 * ------------------------
 * This component handles the redirect after Membee login.
 * It:
 * 1. Reads token from URL
 * 2. Sends token to backend
 * 3. Gets user + role
 * 4. Stores user in Auth context
 * 5. Redirects user based on role
 */

import { useEffect, useState } from "react"; // React hooks
import { useNavigate } from "react-router-dom"; // used to redirect user
import { useAuth } from "../Auth"; // custom auth hook
import type { Role, User } from "../Auth"; // TypeScript types
import CipsAuthShell from "../components/CipsAuthShell"; // UI wrapper

/**
 * CallbackState
 * --------------
 * Represents different UI states during login process
 */
type CallbackState =
  | "loading"      // when processing login
  | "error"        // when something fails
  | "non-member"   // user not allowed
  | "done";        // success

export default function MembeeCallback() {

  // used for navigation (redirecting pages)
  const navigate = useNavigate();

  // function to store user globally
  const { setUserFromBackend } = useAuth();

  /**
   * STATE VARIABLES
   */
  const [status, setStatus] = useState<CallbackState>("loading"); // current state
  const [message, setMessage] = useState("Finishing sign in..."); // message shown to user

  /**
   * URL for membership signup (fallback if env not present)
   */
  const joinUrl =
    (import.meta.env.VITE_CIPS_JOIN_URL as string) ||
    "https://cips.ca/membership/";

  /**
   * useEffect runs once when component loads
   * This is the main logic of login flow
   */
  useEffect(() => {

    /**
     * run()
     * ------
     * async function to:
     * - read token
     * - call backend
     * - process response
     */
    const run = async () => {

      // get query params from URL
      const params = new URLSearchParams(window.location.search);

      // extract token from URL (?token=xxx or ?Token=xxx)
      const token = params.get("Token") || params.get("token");

      /**
       *  CASE: token not found
       */
      if (!token) {
        setStatus("error");
        setMessage("No token found. Please try again.");
        return;
      }

      // backend API base URL
      const apiBase = (import.meta.env.VITE_API_BASE ||
        "http://localhost:4000") as string;

      try {
        /**
         *  CALL BACKEND API
         * Exchange Membee token for user session
         */
        const res = await fetch(
          `${apiBase}/api/auth/membee/exchange?token=${encodeURIComponent(token)}`,
          { credentials: "include" } // send cookies
        );

        // parse JSON response safely
        const data = await res.json().catch(() => null);

        /**
         *  CASE: API ERROR
         */
        if (!res.ok) {

          // user not authorized (not a member)
          if (res.status === 401 || res.status === 403) {
            setStatus("non-member");
            setMessage(
              data?.message ||
                "This account is not authorized to access the certification portal."
            );
            return;
          }

          // general error
          setStatus("error");
          setMessage(data?.message || "Sign-in failed. Please try again.");
          return;
        }

        /**
         *  SUCCESS CASE
         */

        // extract user from response
        const user = data.user as User;

        // store user in global auth context
        setUserFromBackend(user);

        // get first role of user
        const role = (user.roles?.[0] || "") as Role;

        // mark as done
        setStatus("done");

        /**
         *  ROLE-BASED REDIRECTION
         */
        if (role === "Applicant") navigate("/applicant");
        else if (role === "Office") navigate("/office");
        else if (role === "EducationReviewer") navigate("/reviewer/education");
        else if (role === "ExperienceReviewer") navigate("/reviewer/experience");
        else navigate("/access-denied"); // fallback
      } catch {
        /**
         *  NETWORK ERROR
         */
        setStatus("error");
        setMessage("Backend not reachable. Is the server running?");
      }
    };

    // call the async function
    run();

  }, [navigate, setUserFromBackend]); // dependencies

  /**
   * UI RENDERING
   * -------------
   * Based on current status
   */
  return (
    <CipsAuthShell
      title={
        status === "loading"
          ? "Signing you in..."
          : status === "non-member"
          ? "Membership Required"
          : status === "error"
          ? "Sign-in Failed"
          : "Redirecting..."
      }
      subtitle={
        status === "loading"
          ? "Please wait while we verify your account."
          : status === "non-member"
          ? "You must be an active CIPS member before using the certification portal."
          : message
      }
    >

      /**
       * ⏳ LOADING STATE UI
       */
      {status === "loading" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Verifying your account...
        </div>
      )}

      /**
       *  NON-MEMBER UI
       */
      {status === "non-member" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-base font-semibold text-amber-900">
              This account is not a CIPS member
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-800">
              The Certification Portal is available only to active CIPS members.
              Please sign up for membership first, then return and sign in again.
            </p>

            <div className="mt-4 rounded-xl border border-amber-100 bg-white px-4 py-3 text-sm text-slate-700">
              {message}
            </div>
          </div>
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

          <div className="flex flex-col gap-3 sm:flex-row">

            {/* Button to go to membership website */}
            <a
              href={joinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-cipsNavy px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
            >
              Become a CIPS Member
            </a>

            {/* Back button */}
            <button
              onClick={() => navigate("/")}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}

      /**
       * ERROR UI
       */
      {status === "error" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {message}
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full rounded-xl bg-cipsNavy px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
          >
            Back to Login
          </button>
        </div>
      )}
    </CipsAuthShell>
  );
}