import LoginDemo from "./LoginDemo";
import LoginMembee from "./LoginMembee";

export default function Login() {
  const mode = (import.meta.env.VITE_AUTH_MODE || "demo") as
    | "demo"
    | "membee";

  return mode === "membee" ? <LoginMembee /> : <LoginDemo />;
}