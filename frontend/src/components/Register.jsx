import { useState } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post("/register", { username, password });
      navigate("/login");
    } catch (err) {
      setError("Kayıt başarısız. Bu kullanıcı adı alınmış olabilir.");
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Yeni Hesap Oluştur</h2>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>Finansal yolculuğunuza bugün başlayın.</p>
      
      {error && <p style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

      <form onSubmit={handleRegister}>
        <div className="input-group">
          <label>Kullanıcı Adı</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>
        <div className="input-group">
          <label>Şifre</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">Kayıt Ol</button>
      </form>

      <Link to="/login" className="nav-link">Zaten hesabınız var mı? Giriş yapın</Link>
    </div>
  );
}
