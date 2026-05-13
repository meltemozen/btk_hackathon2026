import { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const analyzeFile = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setResult(data);
  };

  return (
    <div className="container">
      <h1>FinTwin AI</h1>
      <p>Finansal davranışlarını analiz eden dijital ikizin.</p>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={analyzeFile} disabled={!file}>
        Finansal İkizimi Oluştur
      </button>

      {result && (
  <div className="card">
    <h2>{result.persona}</h2>

    <p>Gelir: {result.income} TL</p>
    <p>Gider: {result.expense} TL</p>

    <p>
      <strong>Risk Skoru:</strong> {result.risk_score}/100
    </p>

    <p>
      <strong>3 Ay Sonra Tahmini Durum:</strong>{" "}
      {result.future_balance} TL
    </p>

    <h3>Kategori Analizi</h3>

    {Object.entries(result.categories).map(([key, value]) => (
      <p key={key}>
        • {key}: {Math.abs(value)} TL
      </p>
    ))}

    <h3>İçgörüler</h3>

    {result.insights.map((item, index) => (
      <p key={index}>• {item}</p>
    ))}
  </div>
)}
    </div>
  );
}

export default App;