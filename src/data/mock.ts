// Centralized mock data to ensure consistency across the application

export const MERCHANT_INFO = {
  name: "Siti",
  businessName: "Siti's Bubble Tea",
  sector: "F&B",
  subCategory: "Bubble Tea",
  location: "Petaling Jaya, Selangor",
  coordinates: { lat: 3.1073, lng: 101.6067 },
  monthlyRevenueEst: [18000, 22000],
  staffCount: 3,
  operatingSinceMonths: 14
};

export const INGREDIENTS = [
  { id: 'jasmine-tea', name: "Jasmine tea", reorderPoint: 5, stockDays: 12, price: 45.0, trend: 'flat', supplier: 'TeaBros Wholesale' },
  { id: 'tapioca-pearls', name: "Tapioca pearls", reorderPoint: 7, stockDays: 14, price: 65.0, trend: 'flat', supplier: 'BobaSupply HQ' },
  { id: 'fresh-milk', name: "Fresh milk", reorderPoint: 3, stockDays: 4, price: 8.5, trend: 'flat', supplier: 'PJ Dairy Farm' },
  { id: 'brown-sugar', name: "Brown sugar syrup", reorderPoint: 10, stockDays: 20, price: 55.0, trend: 'up', supplier: 'SweetLife Suppliers' },
  { id: 'matcha', name: "Matcha powder", reorderPoint: 14, stockDays: 18, price: 120.0, trend: 'flat', supplier: 'Uji Imports MY' },
  { id: 'cups-lids', name: "Disposable cups & lids", reorderPoint: 10, stockDays: 25, price: 0.15, trend: 'flat', supplier: 'EcoPak' },
  { id: 'straws', name: "Straws", reorderPoint: 15, stockDays: 30, price: 0.05, trend: 'flat', supplier: 'EcoPak' },
  { id: 'jasmine-rice', name: "Jasmine rice", reorderPoint: 7, stockDays: 5, price: 42.0, trend: 'spike', supplier: 'RiceKing MY', alert: true },
];

export const MENU_ITEMS = [
  { id: 'classic', name: "Classic Milk Tea", price: 7.00, areaAvg: 7.50, cost: 2.10 },
  { id: 'brown-sugar', name: "Brown Sugar Boba", price: 9.00, areaAvg: 10.50, cost: 3.20, highlightAction: true },
  { id: 'matcha', name: "Matcha Milk Tea", price: 10.00, areaAvg: 12.00, cost: 3.80 },
  { id: 'taro', name: "Taro Milk Tea", price: 8.50, areaAvg: 8.50, cost: 2.80 },
  { id: 'mango', name: "Mango Fruit Tea", price: 8.00, areaAvg: 8.50, cost: 3.00 },
];

export const WORLD_SIGNALS = [
  {
    id: "sig_typhoon",
    type: "Disruption",
    origin: "Nakhon Si Thammarat, Thailand",
    coords: { lat: 8.4333, lng: 99.9667 },
    summary: "Typhoon Haikui — agricultural disruption forecast, rice and sugarcane regions affected",
    impact: '↓ supply',
    urgency: "red",
    agentProcessing: "Inventory Planner"
  },
  {
    id: "sig_palmoil",
    type: "Commodity",
    origin: "Kuala Lumpur, Malaysia",
    coords: { lat: 3.1390, lng: 101.6869 },
    summary: "Palm oil futures up 11% — third consecutive week of gains",
    impact: '↑ cost',
    urgency: "amber",
    agentProcessing: "Market Analyst"
  },
  {
    id: "sig_matcha",
    type: "Trend",
    origin: "Petaling Jaya, Selangor",
    coords: { lat: 3.1073, lng: 101.6067 },
    summary: "Matcha search volume +38% regionally — early trend adoption phase",
    impact: '↑ demand',
    urgency: "teal",
    agentProcessing: "Market Analyst"
  },
  {
    id: "sig_logistics",
    type: "Supply Chain",
    origin: "Port Klang, Malaysia",
    coords: { lat: 3.0333, lng: 101.3667 },
    summary: "Container congestion — average delay 3.2 days, up from 1.8 days last week",
    impact: '↓ supply',
    urgency: "amber",
    agentProcessing: "Inventory Planner"
  },
  {
    id: "sig_development",
    type: "Real Estate",
    origin: "Johor Bahru, Malaysia",
    coords: { lat: 1.4927, lng: 103.7414 },
    summary: "New commercial development approved — 12,000 sqft F&B zone, opening Q3",
    impact: '↑ competition',
    urgency: "teal",
    agentProcessing: "Location Scout"
  }
];

export const ALERTS = [
  {
    id: "alt_1",
    agent: "Inventory Planner",
    urgency: "red",
    headline: "Restock jasmine rice within 5 days.",
    detail: "Typhoon forecast may raise prices 15-20%. Recommended order: 60kg.",
    time: "45 mins ago",
    status: "pending"
  },
  {
    id: "alt_2",
    agent: "Market Analyst",
    urgency: "red",
    headline: "Palm oil cost impact: estimated +RM 180/month to your operations.",
    detail: "Review pricing or find alternatives.",
    time: "2 hours ago",
    status: "pending"
  },
  {
    id: "alt_3",
    agent: "Market Analyst",
    urgency: "amber",
    headline: "Matcha drinks trending +38% regionally.",
    detail: "4 competitors near you have added matcha — 11 have not. Opportunity window open.",
    time: "4 hours ago",
    status: "pending"
  },
  {
    id: "alt_4",
    agent: "Ops Advisor",
    urgency: "amber",
    headline: "Public holiday Saturday + football match 3pm.",
    detail: "Foot traffic 2.1x average 2-6pm. Consider scheduling extra staff.",
    time: "Yesterday",
    status: "dismissed"
  },
  {
    id: "alt_5",
    agent: "Location Scout",
    urgency: "green",
    headline: "Block C, Section 14 opportunity.",
    detail: "MRT station 800m away, opening in 14 months. Rental currently 18% below district average.",
    time: "2 days ago",
    status: "acted_on"
  }
];

export const AGENTS = [
  { id: 'inventory', name: 'Inventory Planner', status: 'processing', statusText: 'Analyzing Thai rice markets...' },
  { id: 'market', name: 'Market Analyst', status: 'idle', statusText: 'Monitoring local trends' },
  { id: 'ops', name: 'Ops Advisor', status: 'idle', statusText: 'Analyzing weekend foot traffic patterns' },
  { id: 'location', name: 'Location Scout', status: 'idle', statusText: 'Scanning commercial real estate data' },
];

// Competitors within 5km radius of merchant location (PJ, Selangor)
export const LOCAL_COMPETITORS = [
  {
    id: 'comp_1',
    name: 'Tea House Petaling',
    type: 'Bubble Tea',
    distance: 0.8,
    coordinates: { lat: 3.1090, lng: 101.6100 },
    footTraffic: 'High',
    menuItems: ['Classic Milk Tea', 'Brown Sugar Boba', 'Matcha'],
    recentActivity: 'Added Brown Sugar Boba promo',
    threat: 'high'
  },
  {
    id: 'comp_2',
    name: 'Pearl Garden',
    type: 'Bubble Tea',
    distance: 1.2,
    coordinates: { lat: 3.1050, lng: 101.6120 },
    footTraffic: 'Medium',
    menuItems: ['Classic Milk Tea', 'Taro'],
    recentActivity: 'Happy hour 3-5pm extended',
    threat: 'medium'
  },
  {
    id: 'comp_3',
    name: 'Matcha Dreams',
    type: 'Specialty Tea',
    distance: 1.5,
    coordinates: { lat: 3.1150, lng: 101.6000 },
    footTraffic: 'High',
    menuItems: ['Matcha Latte', 'Matcha Milk Tea', 'Matcha Smoothie'],
    recentActivity: 'Trending +12% social media engagement',
    threat: 'critical'
  },
  {
    id: 'comp_4',
    name: 'Brew Station',
    type: 'Coffee & Tea',
    distance: 2.1,
    coordinates: { lat: 3.0950, lng: 101.6150 },
    footTraffic: 'Medium',
    menuItems: ['Coffee', 'Classic Tea'],
    recentActivity: 'Loyalty program launch',
    threat: 'low'
  },
  {
    id: 'comp_5',
    name: 'Bubble Box',
    type: 'Bubble Tea',
    distance: 2.8,
    coordinates: { lat: 3.1200, lng: 101.5950 },
    footTraffic: 'High',
    menuItems: ['Brown Sugar Boba', 'Classic Milk Tea', 'Matcha'],
    recentActivity: 'Mobile ordering available',
    threat: 'high'
  },
  {
    id: 'crowd_1',
    name: 'The Curve Mall',
    type: 'Shopping Center',
    distance: 1.3,
    coordinates: { lat: 3.1120, lng: 101.5990 },
    footTraffic: 'Very High',
    crowd: 'Peak at 12-2pm, 6-8pm',
    threat: 'opportunity'
  },
  {
    id: 'crowd_2',
    name: 'Paradigm Mall',
    type: 'Shopping Center',
    distance: 2.4,
    coordinates: { lat: 3.0880, lng: 101.6200 },
    footTraffic: 'Very High',
    crowd: 'Peak at 1-3pm, 7-9pm',
    threat: 'opportunity'
  }
];

// Live news/alerts feed
export const LIVE_NEWS = [
  { id: 'news_1', time: '2 mins ago', title: 'Matcha demand spike +38% region-wide', icon: '📈', urgency: 'green' },
  { id: 'news_2', time: '8 mins ago', title: 'Competitor "Matcha Dreams" trending +12%', icon: '🔥', urgency: 'red' },
  { id: 'news_3', time: '14 mins ago', title: 'Foot traffic peak detected at The Curve', icon: '👥', urgency: 'yellow' },
  { id: 'news_4', time: '22 mins ago', title: 'Palm oil prices up 2.3% today', icon: '📊', urgency: 'yellow' },
  { id: 'news_5', time: '31 mins ago', title: 'New promo detected: Tea House Petaling', icon: '🎯', urgency: 'orange' },
];
