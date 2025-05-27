import { useState } from "react";
import { useNavigate } from "react-router-dom";

const usuarios = [
  { username: "supervisor1", password: "123", id: "sup123" },
  { username: "admin", password: "admin", id: "admin001" },
];

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const encontrado = usuarios.find(u => u.username === user && u.password === pass);

    if (encontrado) {
      localStorage.setItem("usuario", JSON.stringify(encontrado));
      navigate("/index");
    } else {
      setError("Usuario o clave incorrectos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h2 className="text-2xl font-semibold mb-4">Iniciar Sesión</h2>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <input
          type="text"
          placeholder="Usuario"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="border px-3 py-2 mb-2 w-full rounded"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="border px-3 py-2 mb-4 w-full rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
