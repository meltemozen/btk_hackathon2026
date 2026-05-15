import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { Search, Filter, ArrowUpDown, Trash2 } from "lucide-react";

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Tümü");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm("Bu işlemi silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTransactions();
    } catch (err) {
      alert("İşlem silinemedi.");
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "Tümü" || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  }).reverse();

  return (
    <div>
      <Navbar />
      <div className="app-container">
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <h2>Geçmiş İşlemler</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "10px", top: "12px", color: "#94a3b8" }} />
                <input 
                  placeholder="İşlem ara..." 
                  style={{ paddingLeft: "35px", width: "200px" }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ width: "150px" }}
              >
                <option>Tümü</option>
                <option>Gelir</option>
                <option>Gıda</option>
                <option>Yemek</option>
                <option>Alışveriş</option>
                <option>Abonelik</option>
                <option>Konut</option>
                <option>Kafe</option>
                <option>Ulaşım</option>
                <option>Diğer</option>
              </select>
            </div>
          </div>

          <div className="transaction-list">
            <div className="transaction-item" style={{ background: "rgba(255,255,255,0.05)", fontWeight: 700 }}>
              <span style={{ flex: 2 }}>Açıklama / Tarih</span>
              <span style={{ flex: 1, textAlign: "center" }}>Kategori</span>
              <span style={{ flex: 1, textAlign: "right" }}>Miktar</span>
            </div>
            {filteredTransactions.map((t) => (
              <div key={t.id} className="transaction-item">
                <div style={{ flex: 2 }}>
                  <p style={{ fontWeight: 600 }}>{t.description}</p>
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <span className={`badge ${t.amount > 0 ? "badge-income" : "badge-expense"}`}>{t.category}</span>
                </div>
                <div style={{ flex: 1, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                  <p style={{ fontWeight: 700, color: t.amount > 0 ? "#4ade80" : "#f87171" }}>
                    {t.amount > 0 ? "+" : ""}{t.amount} TL
                  </p>
                  <button 
                    onClick={() => deleteTransaction(t.id)} 
                    style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: "5px", marginTop: 0 }}
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
