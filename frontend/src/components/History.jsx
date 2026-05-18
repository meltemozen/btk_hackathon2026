import { useState, useEffect } from "react";
import api from "../api";
import Navbar from "./Navbar";
import { Search, Filter, ArrowUpDown, Trash2 } from "lucide-react";

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Tümü");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/transactions", {
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
      await api.delete(`/transactions/${id}`, {
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

    const txDate = new Date(t.date).toISOString().split('T')[0];
    const matchesStartDate = !startDate || txDate >= startDate;
    const matchesEndDate = !endDate || txDate <= endDate;

    return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
  }).sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
  });

  return (
    <div>
      <Navbar />
      <div className="app-container">
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "15px" }}>
            <h2 style={{ margin: 0 }}>Geçmiş İşlemler</h2>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", right: "10px", top: "10px", color: "#94a3b8" }} />
                <input
                  placeholder="İşlem ara..."
                  style={{ paddingLeft: "35px", width: "180px", padding: "0.65rem 1rem", fontSize: "0.85rem" }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ width: "140px", padding: "0.65rem 1rem", fontSize: "0.85rem" }}
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

              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title="Başlangıç Tarihi"
                  style={{ width: "135px", padding: "0.65rem 0.5rem", fontSize: "0.85rem" }}
                />
                <span style={{ color: "#64748b", fontWeight: "bold" }}>-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title="Bitiş Tarihi"
                  style={{ width: "135px", padding: "0.65rem 0.5rem", fontSize: "0.85rem" }}
                />
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ width: "135px", padding: "0.65rem 1rem", fontSize: "0.85rem", background: "rgba(99,102,241,0.08)", color: "#6366f1", borderColor: "#6366f1", fontWeight: "600" }}
              >
                <option value="newest">En Yeniler</option>
                <option value="oldest">En Eskiler</option>
              </select>
            </div>
          </div>

          <div className="transaction-list">
            <div className="transaction-item" style={{ background: "rgba(0, 0, 0, 0.03)", fontWeight: 700, borderRadius: "0.5rem" }}>
              <span style={{ flex: 2 }}>Açıklama / Tarih</span>
              <span style={{ flex: 1, textAlign: "center" }}>Kategori</span>
              <span style={{ flex: 1, textAlign: "right" }}>Miktar</span>
            </div>
            {filteredTransactions.map((t) => (
              <div key={t.id} className="transaction-item">
                <div style={{ flex: 2 }}>
                  <p style={{ fontWeight: 600, color: "#1e293b" }}>{t.description}</p>
                  <p style={{ fontSize: "0.75rem", color: "#64748b" }}>{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <span className={`badge ${t.amount > 0 ? "badge-income" : "badge-expense"}`}>{t.category}</span>
                </div>
                <div style={{ flex: 1, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                  <p style={{ fontWeight: 700, color: t.amount > 0 ? "#16a34a" : "#dc2626" }}>
                    {t.amount > 0 ? "+" : ""}{t.amount} TL
                  </p>
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", padding: "5px", marginTop: 0, boxShadow: "none" }}
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
