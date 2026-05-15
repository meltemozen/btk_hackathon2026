import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { User, Mail, Calendar, TrendingUp, ShieldCheck } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total_tx: 0, balance: 0 });
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const balance = res.data.reduce((acc, t) => acc + t.amount, 0);
      setStats({ total_tx: res.data.length, balance });
    } catch (err) {
      console.error(err);
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
              color: "white"
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
              <h3 style={{ color: stats.balance >= 0 ? "#4ade80" : "#f87171" }}>{stats.balance} TL</h3>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
