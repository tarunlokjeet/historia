from sqlalchemy.orm import Session
from model import Message
from datetime import datetime

def create_message(db: Session, role: str, content: str):
    db_message = Message(role=role, content=content, timestamp=datetime.utcnow())
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_all_messages(db: Session):
    return db.query(Message).order_by(Message.timestamp.asc()).all()

def get_sessions(db: Session):
    return db.query(Message.session_id).distinct().all()

def get_messages_by_session(db: Session, session_id: str):
    return db.query(Message).filter(Message.session_id == session_id).all()

def get_all_conversations(db: Session):
    return db.query(models.Conversation).all()
