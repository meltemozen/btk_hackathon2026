import os
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, create_engine, select
from jose import JWTError, jwt
import google.generativeai as genai
from dotenv import load_dotenv

from models import User, Transaction, UserCreate, TransactionCreate, Token, UserUpdate
from auth import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM

load_dotenv()

# Gemini Config
# Gemini Config
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key.strip())

model = genai.GenerativeModel('models/gemini-flash-latest')

# Database Config
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fintwin.db")
engine = create_engine(DATABASE_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

app = FastAPI(title="FinTwin AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username}

@app.put("/me")
def update_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    token_updated = False
    new_username = current_user.username

    if update_data.username and update_data.username != current_user.username:
        existing = session.exec(select(User).where(User.username == update_data.username)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Kullanıcı adı zaten kullanımda.")
        current_user.username = update_data.username
        new_username = update_data.username
        token_updated = True

    if update_data.new_password:
        if not update_data.current_password or not verify_password(update_data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Mevcut şifre yanlış.")
        current_user.hashed_password = get_password_hash(update_data.new_password)

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    access_token = create_access_token(data={"sub": new_username}) if token_updated else None

    return {
        "username": current_user.username,
        "message": "Profil başarıyla güncellendi.",
        "access_token": access_token
    }

@app.get("/")
def home():
    return {"message": "FinTwin AI Backend Çalışıyor 🚀"}

@app.post("/register", response_model=User)
def register(user_data: UserCreate, session: Session = Depends(get_session)):
    existing_user = session.exec(select(User).where(User.username == user_data.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pwd = get_password_hash(user_data.password)
    db_user = User(username=user_data.username, hashed_password=hashed_pwd)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/transactions", response_model=Transaction)
def create_transaction(
    transaction: TransactionCreate, 
    current_user: User = Depends(get_current_user), 
    session: Session = Depends(get_session)
):
    transaction_data = transaction.dict()
    if not transaction_data.get("date"):
        transaction_data["date"] = datetime.utcnow()
        
    db_transaction = Transaction(
        **transaction_data,
        user_id=current_user.id
    )
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    return db_transaction

@app.get("/transactions", response_model=List[Transaction])
def read_transactions(current_user: User = Depends(get_current_user)):
    return current_user.transactions

@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_transaction = session.get(Transaction, transaction_id)
    if not db_transaction or db_transaction.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    session.delete(db_transaction)
    session.commit()
    return {"message": "Transaction deleted"}

@app.post("/analyze")
async def analyze_twin(current_user: User = Depends(get_current_user)):
    transactions = current_user.transactions
    if not transactions:
        return {"error": "Henüz işlem verisi yok. Lütfen harcama girin."}

    # Temel Hesaplamalar
    total_income = sum(t.amount for t in transactions if t.amount > 0)
    total_expense = abs(sum(t.amount for t in transactions if t.amount < 0))
    
    risk_score = min(int((total_expense / total_income * 100)) if total_income > 0 else 100, 100)
    confidence_score = 100 - risk_score
    future_balance_3_months = int(total_income - (total_expense * 3))

    # Kategori Özeti
    category_map = {}
    for t in transactions:
        if t.amount < 0:
            cat = t.category
            category_map[cat] = category_map.get(cat, 0) + abs(t.amount)
    
    category_summary = [{"name": k, "value": v} for k, v in category_map.items()]

    # Gemini Prompt
    data_str = "\n".join([f"{t.date.date()} | {t.category} | {t.amount} TL | {t.description}" for t in transactions])
    
    prompt = f"""
    Sen bir finansal davranış analisti ve 'Dijital Finansal İkiz' oluşturucususun. 
    Aşağıdaki finansal verileri analiz et ve kullanıcıya bir 'İkiz' profili oluştur.
    
    Veriler:
    {data_str}
    
    Analitik Bilgiler:
    - Toplam Gelir: {total_income} TL
    - Toplam Gider: {total_expense} TL
    - Risk Skoru: {risk_score}/100
    
    Lütfen şu formatta JSON dön (sadece JSON):
    {{
        "persona": "İsim (örn: Maaş Günü Riskli Harcayıcı)",
        "summary": "Davranış özeti",
        "twin_mood": "İkizin ruh hali (örn: Endişeli ama Planlı)",
        "insights": ["İçgörü 1", "İçgörü 2", "İçgörü 3"],
        "action_plan": ["Aksiyon 1", "Aksiyon 2", "Aksiyon 3"],
        "confidence_comment": "Güven skoru açıklaması (örn: Finansal durum kontrol altında ancak dikkat gerektiriyor.)"
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        import json
        import re
        
        content = response.text
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            ai_data = json.loads(json_match.group())
        else:
            ai_data = {
                "persona": "Veri Analiz Edilemedi",
                "summary": "Analiz sırasında bir hata oluştu.",
                "insights": [],
                "action_plan": [],
                "confidence_comment": "Analiz yapılamadı."
            }
    except Exception as e:
        ai_data = {"error": str(e)}

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "risk_score": risk_score,
        "confidence_score": confidence_score,
        "future_balance": future_balance_3_months,
        "categories": category_summary,
        **ai_data
    }