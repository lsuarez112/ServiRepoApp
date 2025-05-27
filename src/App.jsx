import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Supervisor from "./pages/Supervisor";
import Repositor from "./pages/Repositor";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/index" element={<Index />} />
        <Route path="/supervisor/:id" element={<Supervisor />} />
        <Route path="/repositor/:id" element={<Repositor />} />
      </Routes>
    </Router>
  );
}

export default App;
