"""
Configuration de la base de données PostgreSQL
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dépendance pour obtenir une session DB"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Créer toutes les tables"""
    Base.metadata.create_all(bind=engine)

def migrate_add_data_v2():
    """Ajouter la colonne data_v2 à la table budgets si elle n'existe pas"""
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('budgets')]
    if 'data_v2' not in columns:
        with engine.connect() as conn:
            conn.execute(text('ALTER TABLE budgets ADD COLUMN data_v2 JSON'))
            conn.commit()
        print("Migration: colonne data_v2 ajoutée à la table budgets")
    else:
        print("Migration: colonne data_v2 déjà présente")

def drop_tables():
    """Supprimer toutes les tables (dev only)"""
    Base.metadata.drop_all(bind=engine)
