import { useState, useEffect, useRef } from "react";
import api from "../api";
import {
  PlusCircle, BrainCircuit, TrendingUp, Wallet,
  Download, PieChart as PieIcon, Zap, AlertTriangle, ShieldCheck, Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
      const res = await api.get("/transactions", {
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

      await api.post("/transactions", {
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
      await api.delete(`/transactions/${id}`, {
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
      const res = await api.post("/analyze", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalysis(res.data);
    } catch (err) {
      alert("AI Analizi şu an yapılamıyor.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!analysis) return;

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.width; // 210
    const pageHeight = doc.internal.pageSize.height; // 297

    // Türkçe karakter düzeltici helper
    const tr = (str) => {
      if (!str) return "";
      return String(str)
        .replace(/Ğ/g, "G").replace(/ğ/g, "g")
        .replace(/Ü/g, "U").replace(/ü/g, "u")
        .replace(/Ş/g, "S").replace(/ş/g, "s")
        .replace(/İ/g, "I").replace(/ı/g, "i")
        .replace(/Ö/g, "O").replace(/ö/g, "o")
        .replace(/Ç/g, "C").replace(/ç/g, "c");
    };

    let y = 0;

    // Üst Banner (Header)
    doc.setFillColor(99, 102, 241); // Primary indigo
    doc.rect(0, 0, pageWidth, 32, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("FinTwin AI Analiz Raporu", 15, 21);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleDateString("tr-TR"), pageWidth - 15, 21, { align: "right" });

    y = 42;

    // Persona & Mood Bilgisi
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(tr(analysis.persona || "Finansal Ikiz"), 15, y);

    doc.setFontSize(12);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(147, 51, 234); // Mor duygu rengi
    doc.text(tr(analysis.twin_mood || "Analiz Tamamlandi"), 15, y + 7);

    y += 18;

    // KPI Özet Kartları
    const boxWidth = (pageWidth - 30 - 15) / 4;
    const boxHeight = 22;

    const kpis = [
      { title: "Toplam Gelir", val: `${analysis.total_income || 0} TL`, color: [22, 163, 74] },
      { title: "Toplam Gider", val: `${analysis.total_expense || 0} TL`, color: [220, 38, 38] },
      { title: "Risk Skoru", val: `${analysis.risk_score || 0}/100`, color: analysis.risk_score > 50 ? [220, 38, 38] : [99, 102, 241] },
      { title: "Guven Skoru", val: `${analysis.confidence_score || 0}/100`, color: [22, 163, 74] }
    ];

    kpis.forEach((kpi, idx) => {
      const boxX = 15 + idx * (boxWidth + 5);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(boxX, y, boxWidth, boxHeight, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(tr(kpi.title), boxX + boxWidth / 2, y + 7, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(...kpi.color);
      doc.text(tr(kpi.val), boxX + boxWidth / 2, y + 16, { align: "center" });
    });

    y += 32;

    // AI İçgörüleri
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("AI ICGORULERI", 15, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);

    (analysis.insights || []).forEach(insight => {
      const lines = doc.splitTextToSize(`• ${tr(insight)}`, pageWidth - 30);
      lines.forEach(line => {
        if (y > pageHeight - 20) { doc.addPage(); y = 20; }
        doc.text(line, 15, y);
        y += 6;
      });
      y += 2;
    });

    y += 8;
    if (y > pageHeight - 40) { doc.addPage(); y = 20; }

    // Aksiyon Planı
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("AKSIYON PLANI", 15, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);

    (analysis.action_plan || []).forEach(action => {
      const lines = doc.splitTextToSize(`• ${tr(action)}`, pageWidth - 30);
      lines.forEach(line => {
        if (y > pageHeight - 20) { doc.addPage(); y = 20; }
        doc.text(line, 15, y);
        y += 6;
      });
      y += 2;
    });

    y += 10;
    if (y > pageHeight - 40) { doc.addPage(); y = 20; }

    // Gelecek Tahmini Kutusu
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(15, y, pageWidth - 30, 24, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.text("3 AY SONRA TAHMINI BAKIYE:", 22, y + 9);

    doc.setFontSize(14);
    const fut = analysis.future_balance || 0;
    doc.setTextColor(fut < 0 ? 220 : 22, fut < 0 ? 38 : 163, fut < 0 ? 38 : 74);
    doc.text(`${fut} TL`, 22, y + 18);

    y += 34;
    if (y > pageHeight - 60) { doc.addPage(); y = 20; }

    // Kategori Dağılımı Tablosu
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Kategori Harcama Dagilimi", 15, y);
    y += 6;

    const catData = (analysis.categories || []).map(c => [tr(c.name), `${c.value} TL`]);

    autoTable(doc, {
      startY: y,
      head: [["Kategori", "Harcama Tutar (TL)"]],
      body: catData,
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], font: "helvetica", fontStyle: "bold" },
      bodyStyles: { font: "helvetica", textColor: [51, 65, 85] },
      margin: { left: 15, right: 15 }
    });

    y = doc.lastAutoTable.finalY + 16;
    if (y > pageHeight - 60) { doc.addPage(); y = 20; }

    // Son İşlemler Tablosu
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Son Islemler", 15, y);
    y += 6;

    const txData = transactions.slice().reverse().slice(0, 15).map(t => [
      new Date(t.date).toLocaleDateString("tr-TR"),
      tr(t.description),
      tr(t.category),
      `${t.amount > 0 ? "+" : ""}${t.amount} TL`
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Tarih", "Aciklama", "Kategori", "Tutar (TL)"]],
      body: txData,
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], font: "helvetica", fontStyle: "bold" },
      bodyStyles: { font: "helvetica", textColor: [51, 65, 85] },
      margin: { left: 15, right: 15 }
    });

    // Sayfa Alt Bilgisi (Footer)
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`FinTwin AI Raporu - Sayfa ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    }

    doc.save(`FinTwin-Analiz-Raporu-${new Date().getTime()}.pdf`);
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
            <h2 style={{ color: "#16a34a" }}>{analysis?.total_income || 0} TL</h2>
          </div>
          <div className="stats-card">
            <p className="text-muted">Toplam Gider</p>
            <h2 style={{ color: "#dc2626" }}>{analysis?.total_expense || 0} TL</h2>
          </div>
          <div className="stats-card">
            <p className="text-muted">Risk Skoru</p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ color: analysis?.risk_score > 50 ? "#dc2626" : "#6366f1" }}>{analysis?.risk_score || 0}/100</h2>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${analysis?.risk_score || 0}%`, background: analysis?.risk_score > 50 ? "#dc2626" : "#6366f1" }}></div>
            </div>
          </div>
          <div className="stats-card">
            <p className="text-muted">FinTwin Güven Skoru</p>
            <h2 style={{ color: "#16a34a" }}>{analysis?.confidence_score || 0}/100</h2>
            <p style={{ fontSize: "0.75rem", color: "#64748b" }}>{analysis?.confidence_comment}</p>
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
                  ) : "Analiz Et"}
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
                  <p style={{ color: (analysis.future_balance || 0) < 0 ? "#dc2626" : "#16a34a", fontWeight: "bold" }}>
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
                    isAnimationActive={false}
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
                <p>Yeni Risk Skoru: <span style={{ color: "#16a34a" }}>%{simResult.newRisk}</span></p>
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
                  <p style={{ fontWeight: 600, color: "#1e293b" }}>{t.description}</p>
                  <p style={{ fontSize: "0.75rem", color: "#64748b" }}>{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 700, color: t.amount > 0 ? "#16a34a" : "#dc2626" }}>
                      {t.amount > 0 ? "+" : ""}{t.amount} TL
                    </p>
                    <span className={`badge ${t.amount > 0 ? "badge-income" : "badge-expense"}`}>{t.category}</span>
                  </div>
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

        <style>{`
        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(0,0,0,0.08);
          border-radius: 3px;
          margin-top: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          transition: width 0.5s ease-out;
        }
        .ai-section {
          background: rgba(0,0,0,0.02);
          padding: 1rem;
          border-radius: 0.75rem;
          margin-top: 1rem;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .ai-section.alert {
          border-left: 3px solid #dc2626;
        }
        .ai-section strong {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #6366f1;
          margin-bottom: 0.5rem;
        }
        .small-text {
          font-size: 0.85rem;
          color: #334155;
          margin-bottom: 0.2rem;
        }
        .badge-mood {
          display: inline-block;
          padding: 2px 10px;
          background: rgba(168, 85, 247, 0.15);
          color: #9333ea;
          border-radius: 10px;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          font-weight: 600;
        }
        .sim-box {
          background: rgba(34, 197, 94, 0.1);
          padding: 1rem;
          border-radius: 0.75rem;
          margin-top: 1rem;
          border: 1px dashed rgba(34, 197, 94, 0.3);
          color: #1e293b;
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

      `}</style>
      </div>
    </div>
  );
}


