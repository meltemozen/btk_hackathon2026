from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    
    transactions: List["Transaction"] = Relationship(back_populates="user")
    goals: List["Goal"] = Relationship(back_populates="user")

class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    amount: float
    category: str
    date: datetime = Field(default_factory=datetime.utcnow)
    
    user_id: int = Field(foreign_key="user.id")
    user: User = Relationship(back_populates="transactions")

class Goal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    target_amount: float
    current_amount: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    user_id: int = Field(foreign_key="user.id")
    user: User = Relationship(back_populates="goals")

class UserCreate(SQLModel):
    username: str
    password: str

class UserUpdate(SQLModel):
    username: Optional[str] = None
    new_password: Optional[str] = None
    current_password: Optional[str] = None

class TransactionCreate(SQLModel):
    description: str
    amount: float
    category: str
    date: Optional[datetime] = None

class GoalCreate(SQLModel):
    name: str
    target_amount: float

class GoalAddMoney(SQLModel):
    amount: float

class Badge(SQLModel):
    id: str
    name: str
    description: str
    icon: str
    earned: bool
    color: str

class Token(SQLModel):
    access_token: str
    token_type: str
