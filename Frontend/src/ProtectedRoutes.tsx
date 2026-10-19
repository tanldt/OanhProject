import { Navigate } from "react-router-dom";
import { useAuth } from "./Auth";
import type { Role } from "./Auth";
import type { ReactNode } from "react";

export default function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  const hasRole = user.roles.some((r) => allowedRoles.includes(r));
  if (!hasRole) return <Navigate to="/access-denied" replace />;

  return children;
}