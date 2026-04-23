import asyncio
import datetime
import uuid
import sys
from utils.search_client import search_tavily
from agents.market_analyst import MarketAnalystAgent
from models.merchant import Merchant

async def test():
    merchant_id = uuid.uuid4()
    merchant = Merchant(
        id=merchant_id,
        owner_name="Siti",
        name="Siti's Boba",
        sector="F&B",
        sub_category="Bubble Tea",
        location_name="Singapore",
        latitude=1.3521,
        longitude=103.8198
    )
    
    # Let's test the search FIRST
    print("Testing Tavily Search...")
    results = await search_tavily("Matcha trend in Singapore")
    print(f"Tavily Results: {results}")
    
    print("\nTesting Market Analyst Agent...")
    analyst = MarketAnalystAgent()
    signal = {"title": "Extreme Matcha Popularity", "summary": "Sales of Matcha based products in Singapore are exploding."}
    
    # We pass it as dict
    res = await analyst.analyze(signal=signal, merchant=merchant)
    print(f"Market Analyst Output: {res}")

if __name__ == "__main__":
    asyncio.run(test())
