import { useEffect, useState } from "react";

const BASE_URL = "https://cloud01.browix.com";
const TOKEN = "5632674a4257a67218c812191c3efd81";

export default function Index() {
  const [supervisores, setSupervisores] = useState([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) {
      window.location.href = "/";
      return;
    }

    fetch(`${BASE_URL}/v1/externalpermissions/getUsers/uuid:${TOKEN}/limit:200/page:1`)
      .then(res => res.json())
      .then(data => {
        const registros = data?.response?.data?.records || [];
        const soloSupervisores = registros.filter(u => u.User.role === "1");
        setSupervisores(soloSupervisores);
      })
      .catch(err => console.error("Error al obtener supervisores:", err));
  }, []);

  const supervisoresFiltrados = supervisores.filter(s =>
    s.User.name.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Supervisores</h1>

      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="mb-4 px-4 py-2 border rounded w-full max-w-md"
      />

      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Nombre</th>
            <th className="border p-2 text-left">Email</th>
            <th className="border p-2 text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          {supervisoresFiltrados.map(({ User }) => (
            <tr key={User.id} className="hover:bg-gray-50">
              <td className="border p-2">{User.name}</td>
              <td className="border p-2">{User.email}</td>
              <td className="border p-2 text-center">
                <button
                  className="text-blue-700 font-medium hover:underline"
                  onClick={() => alert(`Ver supervisor ID: ${User.id}`)}
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
