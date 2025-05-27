import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <div className="flex items-center gap-6">
        <Link to="/index" className="text-blue-700 font-semibold text-lg hover:underline">
          ServirepoApp
        </Link>
        {usuario && (
          <span className="text-gray-600 text-sm">Sesión: {usuario.username}</span>
        )}
      </div>
      {usuario && (
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
        >
          Cerrar sesión
        </button>
      )}
    </nav>
  );
}
