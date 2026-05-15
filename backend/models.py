from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    
    transactions: List["Transaction"] = Relationship(back_populates="user")

class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    amount: float
    category: str
    date: datetime = Field(default_factory=datetime.utcnow)
    
    user_id: int = Field(foreign_key="user.id")
    user: User = Relationship(back_populates="transactions")

class UserCreate(SQLModel):
    username: str
    password: str

class TransactionCreate(SQLModel):
    description: str
    amount: float
    category: str
    date: Optional[datetime] = None

class Token(SQLModel):
    access_token: str
    token_type: str
