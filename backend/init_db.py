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
        
        # Give Siti Inventory Items
        session.add(Ingredient(merchant_id=merchant_id, name="Jasmine Tea Leaves", stock_days=10))
        session.add(Ingredient(merchant_id=merchant_id, name="Tapioca Pearls", stock_days=3))
        
        from models.merchant import InventoryItem, PriceHistory
        
        jasmine_id = uuid.uuid4()
        session.add(InventoryItem(
            id=jasmine_id,
            merchant_id=merchant_id,
            item_name="Jasmine Tea Leaves",
            quantity=5.0,
            unit="kg",
            reorder_threshold=10.0,
            current_price_myr=35.0,
            last_restocked="2023-10-01",
            supplier_name="TeaBros Wholesale",
            lead_time_days=7,
            supplier_reliability=0.75
        ))
        
        # Seed 30 days of price history for Jasmine Tea (Spiking)
        for d in range(30):
            p = 30.0 + (d * 0.1)
            if d > 25: p += (d-25) * 2.0
            ts = (datetime.datetime.now() - datetime.timedelta(days=30-d)).isoformat()
            session.add(PriceHistory(inventory_item_id=jasmine_id, price=p, timestamp=ts))

        tapioca_id = uuid.uuid4()
        session.add(InventoryItem(
            id=tapioca_id,
            merchant_id=merchant_id,
            item_name="Tapioca Pearls",
            quantity=20.0,
            unit="kg",
            reorder_threshold=15.0,
            current_price_myr=8.5,
            last_restocked="2023-10-05",
            supplier_name="BobaSupply HQ",
            lead_time_days=3,
            supplier_reliability=0.98
        ))
        
        # Seed 30 days of price history for Tapioca (Stable)
        for d in range(30):
            p = 8.0 + (d % 3 * 0.2)
            ts = (datetime.datetime.now() - datetime.timedelta(days=30-d)).isoformat()
            session.add(PriceHistory(inventory_item_id=tapioca_id, price=p, timestamp=ts))

        brown_sugar_id = uuid.uuid4()
        session.add(InventoryItem(
            id=brown_sugar_id,
            merchant_id=merchant_id,
            item_name="Brown Sugar",
            quantity=10.0,
            unit="kg",
            reorder_threshold=5.0,
            current_price_myr=4.2,
            last_restocked="2023-09-28",
            supplier_name="SweetLife Suppliers",
            lead_time_days=2,
            supplier_reliability=0.95
        ))
        
        # Seed 30 days of price history for Brown Sugar (Rising)
        for d in range(30):
            p = 3.5 + (d * 0.05)
            ts = (datetime.datetime.now() - datetime.timedelta(days=30-d)).isoformat()
            session.add(PriceHistory(inventory_item_id=brown_sugar_id, price=p, timestamp=ts))

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
