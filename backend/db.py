from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Update with your actual DB URL or use an environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

