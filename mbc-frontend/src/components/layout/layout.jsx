// src/components/Layout/Layout.jsx
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export default function Layout() {
  const { user, logout } = useAuthStore();

  return (
    <>
      <header className="sticky top-0 bg-white shadow-md flex items-center px-4 sm:px-8 py-3 z-50">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 mr-4" />
        <span className="text-lg sm:text-xl font-bold text-blue-800 flex-1">
          MBC Department Portal
        </span>
        {user && (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline font-medium text-gray-700">
              {user.name} ({user.role})
            </span>
            <button
              onClick={logout}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </header>
      <main className="px-4 py-8 min-h-[calc(100vh-68px)] bg-gray-50">
        <Outlet />
      </main>
    </>
  );
}