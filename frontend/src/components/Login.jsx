import { useState } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await api.post("/token", formData);
      localStorage.setItem("token", response.data.access_token);
      if (onLogin) onLogin();
      navigate("/dashboard");
    } catch (err) {
      setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Hoş Geldiniz</h2>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>Dijital İkizinize erişmek için giriş yapın.</p>

      {error && <p style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

      <form onSubmit={handleLogin}>
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
        <button type="submit">Giriş Yap</button>
      </form>

      <Link to="/register" className="nav-link">Hesabınız yok mu? Kayıt olun</Link>
    </div>
  );
}
