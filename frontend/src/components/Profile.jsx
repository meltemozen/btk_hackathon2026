import { useState, useEffect } from "react";
import api from "../api";
import Navbar from "./Navbar";
import { User, Key, Save } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total_tx: 0, balance: 0 });
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setNewUsername(res.data.username);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const balance = res.data.reduce((acc, t) => acc + t.amount, 0);
      setStats({ total_tx: res.data.length, balance });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const updateData = {};
      if (newUsername && newUsername !== user?.username) {
        updateData.username = newUsername;
      }
      if (newPassword) {
        if (!currentPassword) {
          setMessage({ type: "error", text: "Şifre değiştirmek için mevcut şifrenizi girmelisiniz." });
          setLoading(false);
          return;
        }
        updateData.new_password = newPassword;
        updateData.current_password = currentPassword;
      }

      if (Object.keys(updateData).length === 0) {
        setMessage({ type: "info", text: "Herhangi bir değişiklik yapılmadı." });
        setLoading(false);
        return;
      }

      const res = await api.put("/me", updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
      }

      setUser((prev) => ({ ...prev, username: res.data.username }));
      setCurrentPassword("");
      setNewPassword("");
      setMessage({ type: "success", text: res.data.message });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Güncelleme başarısız oldu."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="app-container">
        <div className="glass-card" style={{ maxWidth: "600px", margin: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              margin: "0 auto 1.5rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "2.5rem",
              fontWeight: "bold",
              color: "white",
              boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)"
            }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <h2>{user?.username}</h2>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="stats-card">
              <p className="text-muted">Toplam İşlem</p>
              <h3>{stats.total_tx}</h3>
            </div>
            <div className="stats-card">
              <p className="text-muted">Net Bakiye</p>
              <h3 style={{ color: stats.balance >= 0 ? "#16a34a" : "#dc2626" }}>{stats.balance} TL</h3>
            </div>
          </div>

          <div className="glass-card" style={{ marginTop: "2rem", padding: "1.5rem", background: "rgba(255, 255, 255, 0.9)", border: "1px solid rgba(0, 0, 0, 0.08)" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem", fontSize: "1.25rem", color: "#1e293b" }}>
              <Key size={20} style={{ color: "#6366f1" }} /> Hesap Ayarları
            </h3>

            {message.text && (
              <div style={{
                padding: "1rem",
                borderRadius: "0.5rem",
                marginBottom: "1.5rem",
                background: message.type === "error" ? "rgba(239, 68, 68, 0.1)" : message.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(59, 130, 246, 0.1)",
                border: `1px solid ${message.type === "error" ? "rgba(239, 68, 68, 0.3)" : message.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
                color: message.type === "error" ? "#dc2626" : message.type === "success" ? "#16a34a" : "#2563eb",
                fontSize: "0.875rem",
                fontWeight: "500"
              }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ marginBottom: "0.5rem", color: "#475569" }}>Kullanıcı Adı</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Yeni kullanıcı adı"
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ marginBottom: "0.5rem", color: "#475569", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Mevcut Şifre</span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>(Şifre değişimi için gerekli)</span>
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ marginBottom: "0.5rem", color: "#475569" }}>Yeni Şifre</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "0.75rem", padding: "0.75rem" }}>
                <Save size={18} /> {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
