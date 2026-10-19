// TODO : change styling to tailwindcss

import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth";

export default function AccessDenied() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const goBack = () => navigate("/");

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Access Denied</h1>
      <p>You don’t have permission to view this page.</p>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={goBack}>Back to Login</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}