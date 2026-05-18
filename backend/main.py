import os
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, create_engine, select
from jose import JWTError, jwt
import google.generativeai as genai
from dotenv import load_dotenv

from models import User, Transaction, Goal, UserCreate, TransactionCreate, GoalCreate, GoalAddMoney, Badge, Token, UserUpdate, OpenBankingSync
from auth import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key.strip())

model = genai.GenerativeModel('models/gemini-flash-latest')

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

    total_income = sum(t.amount for t in transactions if t.amount > 0)
    total_expense = abs(sum(t.amount for t in transactions if t.amount < 0))
    
    risk_score = min(int((total_expense / total_income * 100)) if total_income > 0 else 100, 100)
    confidence_score = 100 - risk_score
    future_balance_3_months = int(total_income - (total_expense * 3))

    category_map = {}
    for t in transactions:
        if t.amount < 0:
            cat = t.category
            category_map[cat] = category_map.get(cat, 0) + abs(t.amount)
    
    category_summary = [{"name": k, "value": v} for k, v in category_map.items()]

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

@app.get("/goals")
def get_goals(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(Goal).where(Goal.user_id == current_user.id)
    goals = session.exec(statement).all()
    
    tx_stmt = select(Transaction).where(Transaction.user_id == current_user.id)
    txs = session.exec(tx_stmt).all()
    
    total_income = sum(t.amount for t in txs if t.amount > 0)
    total_expense = sum(abs(t.amount) for t in txs if t.amount < 0)
    net_savings = total_income - total_expense
    
    result = []
    for g in goals:
        remaining = g.target_amount - g.current_amount
        ai_suggestion = ""
        if remaining > 0:
            if net_savings > 0:
                months = round(remaining / net_savings, 1)
                ai_suggestion = f"Mevcut harcama hızınızla bu hedefe yaklaşık {months} ayda ulaşabilirsiniz."
            else:
                ai_suggestion = f"Hedefe ulaşmak için aylık giderlerinizi (özellikle Alışveriş veya Gıda) düşürmelisiniz."
        else:
            ai_suggestion = "🎉 Tebrikler! Hedefinize ulaştınız."
            
        result.append({
            "id": g.id,
            "name": g.name,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "created_at": g.created_at,
            "ai_suggestion": ai_suggestion
        })
        
    return result

@app.post("/goals")
def create_goal(goal_in: GoalCreate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    new_goal = Goal(
        name=goal_in.name,
        target_amount=goal_in.target_amount,
        user_id=current_user.id
    )
    session.add(new_goal)
    session.commit()
    session.refresh(new_goal)
    return new_goal

@app.post("/goals/{goal_id}/add")
def add_money_to_goal(goal_id: int, money_in: GoalAddMoney, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    goal = session.exec(statement).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Hedef bulunamadı.")
        
    goal.current_amount += money_in.amount
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return goal

@app.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    goal = session.exec(statement).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Hedef bulunamadı.")
        
    session.delete(goal)
    session.commit()
    return {"message": "Hedef başarıyla silindi."}

@app.get("/badges", response_model=List[Badge])
def get_user_badges(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    tx_stmt = select(Transaction).where(Transaction.user_id == current_user.id)
    txs = session.exec(tx_stmt).all()
    
    goal_stmt = select(Goal).where(Goal.user_id == current_user.id)
    goals = session.exec(goal_stmt).all()
    
    total_inc = sum(t.amount for t in txs if t.amount > 0)
    total_exp = sum(abs(t.amount) for t in txs if t.amount < 0)
    net_bal = total_inc - total_exp
    
    shopping_exp = sum(abs(t.amount) for t in txs if t.amount < 0 and t.category.lower() in ["alışveriş", "alisveris", "shopping"])
    
    badges = [
        Badge(
            id="tasarruf_sovalyesi",
            name="🛡️ Tasarruf Şövalyesi",
            description="Toplam geliriniz toplam giderinizden yüksek. Bütçenizi kontrol altında tutuyorsunuz!",
            icon="ShieldCheck",
            earned=bool(len(txs) > 0 and total_inc > total_exp),
            color="#22c55e" if bool(len(txs) > 0 and total_inc > total_exp) else "#94a3b8"
        ),
        Badge(
            id="durtu_avcisi",
            name="⚡ Dürtü Avcısı",
            description="Alışveriş harcamalarınız toplam harcamalarınızın %25'inin altında. Harika otokontrol!",
            icon="Zap",
            earned=bool(len(txs) > 0 and total_exp > 0 and (shopping_exp / total_exp) < 0.25),
            color="#eab308" if bool(len(txs) > 0 and total_exp > 0 and (shopping_exp / total_exp) < 0.25) else "#94a3b8"
        ),
        Badge(
            id="sifir_borc",
            name="🌟 Sıfır Borç Kulübü",
            description="Net bakiyeniz sıfırın üzerinde. Geleceğe güvenle bakıyorsunuz!",
            icon="TrendingUp",
            earned=bool(net_bal > 0),
            color="#3b82f6" if bool(net_bal > 0) else "#94a3b8"
        ),
        Badge(
            id="hedef_uzmani",
            name="🎯 Hedef Uzmanı",
            description="En az 1 aktif birikim hedefi oluşturdunuz. Geleceğinizi planlıyorsunuz!",
            icon="Target",
            earned=bool(len(goals) > 0),
            color="#a855f7" if bool(len(goals) > 0) else "#94a3b8"
        ),
        Badge(
            id="fintwin_master",
            name="👑 FinTwin Master",
            description="5'ten fazla işlem kaydettiniz ve yapay zeka ikizinizi beslediniz!",
            icon="BrainCircuit",
            earned=bool(len(txs) >= 5),
            color="#ec4899" if bool(len(txs) >= 5) else "#94a3b8"
        )
    ]
    return badges

@app.post("/openbanking/sync")
def openbanking_sync(sync_in: OpenBankingSync, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    now = datetime.utcnow()
    mock_txs = [
        ("Maaş Ödemesi (BKM Senkronizasyon)", 45000.0, "Gelir", now - timedelta(days=5)),
        ("Migros Kurumsal", -1450.0, "Gıda", now - timedelta(days=4)),
        ("Starbucks Kafe", -220.0, "Kafe", now - timedelta(days=3)),
        ("Shell Akaryakıt", -1600.0, "Ulaşım", now - timedelta(days=2)),
        ("Netflix Üyelik", -279.0, "Abonelik", now - timedelta(days=2)),
        ("Zara / Inditex", -2450.0, "Alışveriş", now - timedelta(days=1)),
        ("Trendyol Pazaryeri", -850.0, "Alışveriş", now - timedelta(hours=12)),
        ("Elektrik Dağıtım A.Ş.", -740.0, "Konut", now - timedelta(hours=6)),
    ]
    
    for desc, amt, cat, dt in mock_txs:
        t = Transaction(
            description=f"[{sync_in.bank_name}] {desc}",
            amount=amt,
            category=cat,
            date=dt,
            user_id=current_user.id
        )
        session.add(t)
        
    session.commit()
    return {
        "message": f"{sync_in.bank_name} hesabınızdan 8 adet güncel işlem başarıyla senkronize edildi!",
        "count": len(mock_txs)
    }