import asyncio
from routers.signals import process_signal_task
import uuid

async def test():
    signal = {
        "title": "Matcha Craze in Southeast Asia",
        "summary": "Matcha flavor popularity surges across SEA. Establishments introducing Matcha lattes see significant volume increases.",
        "signal_type": "trend",
        "urgency": "watch",
        "raw_data": {}
    }
    
    # We need the real merchant_id from the DB
    from database import get_db
    from models.merchant import Merchant
    from sqlalchemy import select
    
    merchant_id = None
    async for db in get_db():
        result = await db.execute(select(Merchant))
        merchant = result.scalars().first()
        if merchant:
            merchant_id = str(merchant.id)
        break
        
    if not merchant_id:
        print("No merchant found!")
        return

    print(f"Using merchant: {merchant_id}")
    await process_signal_task(signal, merchant_id)
    print("Task completed!")

if __name__ == "__main__":
    asyncio.run(test())
