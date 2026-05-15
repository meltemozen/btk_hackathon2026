import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  PlusCircle, BrainCircuit, TrendingUp, Wallet,
  Download, PieChart as PieIcon, Zap, AlertTriangle, ShieldCheck, Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Navbar from "./Navbar";

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("Gıda");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // What-if state
  const [simCategory, setSimCategory] = useState("Gıda");
  const [simPercent, setSimPercent] = useState(25);

  const dashboardRef = useRef();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/login");
    fetchTransactions();
  }, [token]);

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

  const addTransaction = async (e) => {
    e.preventDefault();
    try {
      let finalAmount = parseFloat(amount);
      if (category !== "Gelir" && finalAmount > 0) finalAmount = -finalAmount;

      await axios.post("http://127.0.0.1:8000/transactions", {
        amount: finalAmount,
        description: desc,
        category: category,
        date: date
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAmount("");
      setDesc("");
      fetchTransactions();
    } catch (err) {
      alert("İşlem eklenemedi.");
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

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/analyze", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalysis(res.data);
    } catch (err) {
      alert("AI Analizi şu an yapılamıyor.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const element = dashboardRef.current;
    if (!element) return;

    element.classList.add("pdf-mode");

    // Stillerin uygulanması için kısa bekleme
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f172a",
        logging: false
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      // İlk Sayfa
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);

      // Çoklu Sayfa Desteği (Arkadaşınızın mantığı)
      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight + margin;
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);
      }

      pdf.save(`FinTwin-Analiz-${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF Hatası:", err);
    } finally {
      element.classList.remove("pdf-mode");
    }
  };

  const minMax = (val, min, max) => Math.min(Math.max(val, min), max);

  const getSimResult = () => {
    if (!analysis) return null;
    const catValue = analysis.categories.find(c => c.name === simCategory)?.value || 0;
    const savings = (catValue * simPercent) / 100;
    const newExpense = analysis.total_expense - savings;
    const newRisk = minMax(Math.round((newExpense / analysis.total_income) * 100), 0, 100);
    return { savings, newRisk, total3mo: savings * 3 };
  };

  const simResult = getSimResult();

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="app-container" ref={dashboardRef}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ margin: 0 }}>Genel Bakış</h2>
          {analysis && (
            <button onClick={downloadPDF} className="secondary" style={{ width: "auto", marginTop: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Download size={18} /> Rapor İndir
            </button>
          )}
        </div>

        {/* Ana Kartlar */}
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: "2rem" }}>
          <div className="stats-card">
            <p className="text-muted">Toplam Gelir</p>
            <h2 style={{ color: "#4ade80" }}>{analysis?.total_income || 0} TL</h2>
          </div>
          <div className="stats-card">
            <p className="text-muted">Toplam Gider</p>
            <h2 style={{ color: "#f87171" }}>{analysis?.total_expense || 0} TL</h2>
          </div>
          <div className="stats-card">
            <p className="text-muted">Risk Skoru</p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ color: analysis?.risk_score > 50 ? "#f87171" : "#818cf8" }}>{analysis?.risk_score || 0}/100</h2>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${analysis?.risk_score || 0}%`, background: analysis?.risk_score > 50 ? "#f87171" : "#6366f1" }}></div>
            </div>
          </div>
          <div className="stats-card">
            <p className="text-muted">FinTwin Güven Skoru</p>
            <h2 style={{ color: "#4ade80" }}>{analysis?.confidence_score || 0}/100</h2>
            <p style={{ fontSize: "0.7rem", opacity: 0.7 }}>{analysis?.confidence_comment}</p>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* İşlem Ekleme (PDF'de Gizli) */}
          <div className="glass-card no-pdf">
            <h3><PlusCircle size={20} /> Yeni İşlem</h3>
            <form onSubmit={addTransaction}>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Açıklama" required />
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Miktar" required />
              </div>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
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
              <button type="submit">Ekle</button>
            </form>
          </div>

          {/* AI Analiz Bölümü */}
          <div className="glass-card">
            <h3><BrainCircuit size={20} /> AI Analiz Merkezi</h3>
            {!analysis ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <button onClick={runAnalysis} disabled={loading}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                      Analiz Ediliyor...
                    </span>
                  ) : "İkizimi Analiz Et"}
                </button>
              </div>
            ) : analysis.error ? (
              <div className="ai-section alert" style={{ textAlign: "center" }}>
                <p>Analiz oluşturulamadı: {analysis.error}</p>
                <button onClick={runAnalysis} style={{ marginTop: "1rem" }}>Tekrar Dene</button>
              </div>
            ) : (
              <div className="ai-content">
                <h2 style={{ fontSize: "1.2rem" }}>{analysis.persona || "Finansal İkiz"}</h2>
                <p className="badge-mood">{analysis.twin_mood || "Analiz Tamamlandı"}</p>

                <div className="ai-section">
                  <strong><Zap size={14} /> İçgörüler:</strong>
                  {(analysis.insights || []).map((item, i) => <p key={i} className="small-text">• {item}</p>)}
                </div>

                <div className="ai-section">
                  <strong><ShieldCheck size={14} /> Aksiyon Planı:</strong>
                  {(analysis.action_plan || []).map((item, i) => <p key={i} className="small-text">• {item}</p>)}
                </div>

                <div className="ai-section alert">
                  <strong><AlertTriangle size={14} /> 3 Ay Sonra Tahmini:</strong>
                  <p style={{ color: (analysis.future_balance || 0) < 0 ? "#f87171" : "#4ade80", fontWeight: "bold" }}>
                    {analysis.future_balance || 0} TL
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
          {/* Grafik Bölümü */}
          <div className="glass-card">
            <h3><PieIcon size={20} /> Kategori Dağılımı</h3>
            <div style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysis?.categories || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(analysis?.categories || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* What-if Simülatörü */}
          <div className="glass-card">
            <h3><TrendingUp size={20} /> What-If Simülatörü</h3>
            <div className="input-group">
              <label>Kategori</label>
              <select value={simCategory} onChange={(e) => setSimCategory(e.target.value)}>
                {analysis?.categories.map(c => <option key={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Azaltma Oranı: %{simPercent}</label>
              <input type="range" min="0" max="100" value={simPercent} onChange={(e) => setSimPercent(e.target.value)} />
            </div>

            {simResult && (
              <div className="sim-box">
                <p>Aylık Tasarruf: <span>{simResult.savings} TL</span></p>
                <p>3 Aylık Kazanç: <span>{simResult.total3mo} TL</span></p>
                <p>Yeni Risk Skoru: <span style={{ color: "#4ade80" }}>%{simResult.newRisk}</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Son İşlemler */}
        <div className="glass-card">
          <h3><Wallet size={20} /> Son İşlemler</h3>
          <div className="transaction-list">
            {transactions.slice().reverse().slice(0, 10).map((t) => (
              <div key={t.id} className="transaction-item">
                <div>
                  <p style={{ fontWeight: 600 }}>{t.description}</p>
                  <p style={{ fontSize: "0.7rem", opacity: 0.6 }}>{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 700, color: t.amount > 0 ? "#4ade80" : "#f87171" }}>
                      {t.amount > 0 ? "+" : ""}{t.amount} TL
                    </p>
                    <span className={`badge ${t.amount > 0 ? "badge-income" : "badge-expense"}`}>{t.category}</span>
                  </div>
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

        <style>{`
        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          margin-top: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          transition: width 0.5s ease-out;
        }
        .ai-section {
          background: rgba(255,255,255,0.03);
          padding: 1rem;
          border-radius: 0.75rem;
          margin-top: 1rem;
        }
        .ai-section.alert {
          border-left: 3px solid #f87171;
        }
        .ai-section strong {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #818cf8;
          margin-bottom: 0.5rem;
        }
        .small-text {
          font-size: 0.8rem;
          color: #cbd5e1;
          margin-bottom: 0.2rem;
        }
        .badge-mood {
          display: inline-block;
          padding: 2px 10px;
          background: rgba(168, 85, 247, 0.2);
          color: #c084fc;
          border-radius: 10px;
          font-size: 0.75rem;
          margin-top: 0.5rem;
        }
        .sim-box {
          background: rgba(34, 197, 94, 0.1);
          padding: 1rem;
          border-radius: 0.75rem;
          margin-top: 1rem;
          border: 1px dashed rgba(34, 197, 94, 0.3);
        }
        .sim-box p {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }
        .sim-box span {
          font-weight: 700;
        }

        /* PDF Modu - Karanlık Tema Garantili */
        .pdf-mode {
          background: #0f172a !important; 
          color: #ffffff !important;
          padding: 30px !important;
        }
        .pdf-mode .glass-card, 
        .pdf-mode .stats-card,
        .pdf-mode .ai-section {
          background: #1e293b !important;
          color: #ffffff !important;
          border: 1px solid #334155 !important;
          box-shadow: none !important;
          border-radius: 12px !important;
        }
        .pdf-mode h1, .pdf-mode h2, .pdf-mode h3, 
        .pdf-mode strong, .pdf-mode span {
          color: #ffffff !important;
        }
        .pdf-mode p {
          color: #cbd5e1 !important;
        }
        .pdf-mode .text-muted {
          color: #94a3b8 !important;
        }
        .pdf-mode button, .pdf-mode form, .pdf-mode .no-pdf {
          display: none !important;
        }
      `}</style>
      </div>
    </div>
  );
}


