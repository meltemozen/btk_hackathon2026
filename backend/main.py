
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "FinTwin AI Backend Çalışıyor 🚀"
    }

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    content = await file.read()

    df = pd.read_csv(io.BytesIO(content))

    total_income = df[df["amount"] > 0]["amount"].sum()
    total_expense = abs(df[df["amount"] < 0]["amount"].sum())

    expenses = df[df["amount"] < 0]

    category_summary = (
        expenses.groupby("category")["amount"]
        .sum()
        .abs()
        .sort_values(ascending=False)
    )

    top_category = category_summary.index[0]

    risk_score = min(int((total_expense / total_income) * 100), 100)

    future_balance = int(total_income - (total_expense * 3))

    insights = [
        f"En fazla harcama yapılan kategori: {top_category}",
        f"Aylık gider oranı %{risk_score}",
        "Bu davranış devam ederse finansal risk artabilir."
    ]

    return {
        "persona": "Maaş Günü Riskli Harcayıcı",
        "income": float(total_income),
        "expense": float(total_expense),
        "risk_score": risk_score,
        "future_balance": future_balance,
        "categories": category_summary.to_dict(),
        "insights": insights
    }