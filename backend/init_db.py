import asyncio
import uuid
import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Import Base and models mapping
from database import Base, settings
from models.merchant import Merchant, Product, Ingredient
from models.recommendation import Recommendation

# Needs the engine
engine = create_async_engine(settings.database_url, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        # Create all tables (WARNING: this does not handle migrations)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Create a mock merchant
        merchant_id = uuid.uuid4()
        m = Merchant(
            id=merchant_id,
            owner_name="Siti",
            name="Siti's Boba",
            sector="F&B",
            sub_category="Bubble Tea",
            location_name="Petaling Jaya, Selangor",
            latitude=3.1073,
            longitude=101.6067
        )
        session.add(m)
        
        # Give Siti her Products
        session.add(Product(merchant_id=merchant_id, name="Matcha Latte", price=12.0))
        session.add(Product(merchant_id=merchant_id, name="Classic Milk Tea", price=8.5))
        
        # Give Siti a mock recommendation from the Market Analyst
        rec = Recommendation(
            merchant_id=merchant_id,
            agent="Market Analyst",
            urgency="opportunity", # maps to teal on frontend
            headline="Matcha trending strongly in your area.",
            body="Local search data + competitors confirm a 38% spike in Matcha based drinks.",
            status="pending",
            structured_data={
                "pin_lat": 3.12,
                "pin_lng": 101.62,
                "pin_place_name": "Section 14 Boba Area",
                "image_url": "https://via.placeholder.com/600x300.png?text=Boba+Trend+Epicenter"
            }
        )
        session.add(rec)
        await session.commit()
        print(f"Database seeded! Merchant ID is {merchant_id}")

if __name__ == "__main__":
    asyncio.run(init_db())
