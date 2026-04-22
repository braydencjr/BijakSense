import asyncio
from routers.signals import process_signal_task

async def generate_mock_live_recs():
    # Signals representing regional and local disruptions
    signals = [
        {
            "title": "Typhoon Approaching Vietnam Coast",
            "summary": "Severe weather alerts issued for Vietnam coast, likely disrupting sea supply chains.",
            "signal_type": "weather",
            "urgency": "red",
            "raw_data": {},
            "origin_latitude": 14.0583,
            "origin_longitude": 109.2773
        },
        {
            "title": "Milk Shortage in Kuala Lumpur",
            "summary": "Local dairy suppliers reporting low stock across Klang Valley.",
            "signal_type": "supply",
            "urgency": "amber",
            "raw_data": {},
            "origin_latitude": 3.1390,
            "origin_longitude": 101.6869
        },
        {
            "title": "New Shopping Mall Opened in Subang",
            "summary": "Massive influx of youth traffic at Subang Jaya due to new mall opening.",
            "signal_type": "trend",
            "urgency": "opportunity",
            "raw_data": {},
            "origin_latitude": 3.0738,
            "origin_longitude": 101.5859
        },
        {
            "title": "Coffee Bean Price Surge Indonesia",
            "summary": "Indonesian crop yields fell short, driving Arabica beans up 20%.",
            "signal_type": "commodity",
            "urgency": "red",
            "raw_data": {},
            "origin_latitude": -0.7893,
            "origin_longitude": 113.9213
        },
        {
            "title": "Trending Viral Boba Local Competitor",
            "summary": "A nearby stall went viral on TikTok, heavy queues reported.",
            "signal_type": "trend",
            "urgency": "amber",
            "raw_data": {},
            "origin_latitude": 3.1200,          # Very close to Siti's shop
            "origin_longitude": 101.6200
        }
    ]
    
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

    print("Synthesizing 5 dynamic Market Analyst signals. Please wait ~15 seconds...")
    # Dispatch all tasks concurrently for speed
    tasks = []
    for sig in signals:
        tasks.append(process_signal_task(sig, merchant_id))
    
    await asyncio.gather(*tasks)
    print("Successfully populated system with dynamic signals!")

if __name__ == "__main__":
    asyncio.run(generate_mock_live_recs())
