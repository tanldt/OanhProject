import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth";
import logo from '../assets/cips-logo.png'

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // If not logged in, show nothing
  if (!user) return null;

  const role = user.roles?.[0] || "Applicant";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <a href="https://cips.ca" rel="noopener noreferrer" target="_parent" className="flex items-center gap-3">

            <img
              src={logo}
              alt="CIPS"
              className="h-9 w-auto"
              draggable={false}
              
              
              />
            </a>
          <div className="leading-tight">
            <div className="text-sm text-slate-500">
              Canada’s Association of IT Professionals
            </div>
            <div className="text-lg font-semibold text-slate-900">
              Certification Portal
            </div>
          </div>
        </div>

        {/* Right: user + logout */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-slate-900">
              {user.name || user.email}
            </div>
            <div className="text-xs text-slate-500">{role}</div>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 active:scale-95 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}