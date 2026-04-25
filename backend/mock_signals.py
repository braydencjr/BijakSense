"""
Mock signal data — regional SEA signals + 5km local signals for Petaling Jaya.

Regional: 5 signals across Malaysia, Singapore, Thailand, Indonesia
Local:    5 competitor signals + 3 opportunity signals within 5km of merchant
"""

# ── Regional SEA Signals ──────────────────────────────────────────

REGIONAL_SIGNALS = [
    {
        "id": "sig_thai_flood",
        "type": "Disruption",
        "category": "weather",
        "origin": "Nakhon Si Thammarat, Thailand",
        "coords": {"lat": 8.4333, "lng": 99.9667},
        "summary": "Severe flooding in southern Thailand — jasmine rice and sugarcane harvests disrupted. Supply chain delays expected 2-4 weeks.",
        "impact": "↓ supply",
        "urgency": "red",
        "agent": "Market Analyst",
    },
    {
        "id": "sig_sg_inflation",
        "type": "Price",
        "category": "price",
        "origin": "Singapore",
        "coords": {"lat": 1.3521, "lng": 103.8198},
        "summary": "Singapore F&B ingredient inflation +6.2% QoQ — dairy and palm oil derivatives hit hardest. Spillover pricing pressure on JB and KL suppliers.",
        "impact": "↑ cost",
        "urgency": "amber",
        "agent": "Market Analyst",
    },
    {
        "id": "sig_id_matcha",
        "type": "Opportunity",
        "category": "trend",
        "origin": "Jakarta, Indonesia",
        "coords": {"lat": -6.2088, "lng": 106.8456},
        "summary": "Matcha-based drinks trending +42% across Indonesian cafes — TikTok viral content driving demand. Trend spreading to Malaysia.",
        "impact": "↑ demand",
        "urgency": "teal",
        "agent": "Market Analyst",
    },
    {
        "id": "sig_my_palmoil",
        "type": "Commodity",
        "category": "price",
        "origin": "Kuala Lumpur, Malaysia",
        "coords": {"lat": 3.1390, "lng": 101.6869},
        "summary": "Palm oil futures up 11% — third consecutive week of gains. Affects milk tea creamer and syrup costs directly.",
        "impact": "↑ cost",
        "urgency": "amber",
        "agent": "Market Analyst",
    },
    {
        "id": "sig_thai_tourism",
        "type": "Opportunity",
        "category": "tourism",
        "origin": "Bangkok, Thailand",
        "coords": {"lat": 13.7563, "lng": 100.5018},
        "summary": "Songkran tourism surge +28% — Thai bubble tea chains expanding aggressively. Competitive playbook applicable to MY market.",
        "impact": "↑ competition",
        "urgency": "teal",
        "agent": "Market Analyst",
    },
]

# ── Local 5km Signals: Competitors ────────────────────────────────

LOCAL_COMPETITOR_SIGNALS = [
    {
        "id": "comp_teahouse",
        "name": "Tea House Petaling",
        "type": "competitor",
        "category": "Bubble Tea",
        "distance": 0.8,
        "coords": {"lat": 3.1090, "lng": 101.6100},
        "description": "Running 20% off all Brown Sugar Boba this week — loyalty members get extra topping free. Aggressive promo stealing foot traffic.",
        "urgency": "red",
    },
    {
        "id": "comp_matchadreams",
        "name": "Matcha Dreams",
        "type": "competitor",
        "category": "Specialty Tea",
        "distance": 1.5,
        "coords": {"lat": 3.1150, "lng": 101.6000},
        "description": "Viral on TikTok with 45K views on their matcha latte reel. Weekend queues 30min+. Matcha-focused menu capturing trend demand.",
        "urgency": "red",
    },
    {
        "id": "comp_pearlgarden",
        "name": "Pearl Garden",
        "type": "competitor",
        "category": "Bubble Tea",
        "distance": 1.2,
        "coords": {"lat": 3.1050, "lng": 101.6120},
        "description": "Just launched loyalty program: buy 5 get 1 free + birthday reward. Targeting repeat customers in the area.",
        "urgency": "amber",
    },
    {
        "id": "comp_brewstation",
        "name": "Brew Station",
        "type": "competitor",
        "category": "Coffee & Tea",
        "distance": 2.1,
        "coords": {"lat": 3.0950, "lng": 101.6150},
        "description": "Expanding menu to include boba — soft launch with free sampling event this Saturday. Cross-category threat emerging.",
        "urgency": "amber",
    },
    {
        "id": "comp_bubblebox",
        "name": "Bubble Box",
        "type": "competitor",
        "category": "Bubble Tea",
        "distance": 2.8,
        "coords": {"lat": 3.1200, "lng": 101.5950},
        "description": "GrabFood and Foodpanda exclusive deals — 15% off delivery orders. Capturing the delivery-first customer segment.",
        "urgency": "teal",
    },
]

# ── Local 5km Signals: Opportunities ──────────────────────────────

LOCAL_OPPORTUNITY_SIGNALS = [
    {
        "id": "opp_mrt",
        "name": "Taman Bahagia MRT Extension",
        "type": "opportunity",
        "category": "infrastructure",
        "distance": 0.6,
        "coords": {"lat": 3.1120, "lng": 101.6040},
        "description": "New MRT exit opening in 3 months — expected +2,000 daily foot traffic within 500m radius. Prime visibility for walk-in customers.",
        "urgency": "teal",
    },
    {
        "id": "opp_holiday",
        "name": "Hari Raya Weekend",
        "type": "opportunity",
        "category": "event",
        "distance": 0.0,
        "coords": {"lat": 3.1073, "lng": 101.6067},
        "description": "Hari Raya Aidilfitri falls on Saturday — 4-day long weekend. Historical foot traffic +180% for F&B in PJ area. Raya-themed drinks could capture demand.",
        "urgency": "amber",
    },
    {
        "id": "opp_mall",
        "name": "1 Utama Pop-Up Space",
        "type": "opportunity",
        "category": "retail",
        "distance": 3.2,
        "coords": {"lat": 3.1000, "lng": 101.6250},
        "description": "1 Utama accepting pop-up booth applications for June — F&B kiosk RM 800/weekend. Direct access to 60K+ weekend shoppers.",
        "urgency": "teal",
    },
]

ALL_LOCAL_SIGNALS = LOCAL_COMPETITOR_SIGNALS + LOCAL_OPPORTUNITY_SIGNALS
ALL_SIGNALS = REGIONAL_SIGNALS + ALL_LOCAL_SIGNALS
