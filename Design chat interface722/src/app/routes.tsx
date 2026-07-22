import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import UploadPage from "./pages/UploadPage";
import KnowledgePage from "./pages/KnowledgePage";
import SelectPage from "./pages/SelectPage";

function Root() {
  return <Outlet />;
}

function Guard({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, element: <Guard><ChatPage /></Guard> },
      { path: "auth", Component: AuthPage },
      { path: "select", element: <Guard><SelectPage /></Guard> },
      { path: "upload", element: <Guard><UploadPage /></Guard> },
      { path: "knowledge", element: <Guard><KnowledgePage /></Guard> },
      { path: "*", element: <Navigate to="/auth" replace /> },
    ],
  },
]);
