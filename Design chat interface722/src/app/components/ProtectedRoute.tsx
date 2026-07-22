import { Navigate } from "react-router";
import { isLoggedIn } from "../lib/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}
