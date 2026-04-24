// Centralized mock data to ensure consistency across the application
// Signal and alert data is now served from the backend API

export const MERCHANT_INFO = {
  name: "Siti",
  businessName: "Mamak Bubble Tea",
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

export const INVENTORY_ITEMS = [
  { id: 'inv_1', itemName: 'Jasmine Tea Leaves', quantity: 5.0, unit: 'kg', reorderThreshold: 10.0, currentPriceMyr: 35.0, lastRestocked: '2023-10-01', trend: 'flat', supplier: 'TeaBros Wholesale' },
  { id: 'inv_2', itemName: 'Tapioca Pearls', quantity: 20.0, unit: 'kg', reorderThreshold: 15.0, currentPriceMyr: 8.5, lastRestocked: '2023-10-05', trend: 'flat', supplier: 'BobaSupply HQ' },
  { id: 'inv_3', itemName: 'Brown Sugar', quantity: 10.0, unit: 'kg', reorderThreshold: 5.0, currentPriceMyr: 4.2, lastRestocked: '2023-09-28', trend: 'up', supplier: 'SweetLife Suppliers' },
  { id: 'inv_4', itemName: 'Fresh Milk', quantity: 15.0, unit: 'L', reorderThreshold: 20.0, currentPriceMyr: 6.5, lastRestocked: '2023-10-10', trend: 'flat', supplier: 'PJ Dairy Farm' },
  { id: 'inv_5', itemName: 'Matcha Powder', quantity: 2.0, unit: 'kg', reorderThreshold: 3.0, currentPriceMyr: 120.0, lastRestocked: '2023-09-15', trend: 'flat', supplier: 'Uji Imports MY' },
  { id: 'inv_6', itemName: 'Jasmine Rice', quantity: 45.0, unit: 'kg', reorderThreshold: 50.0, currentPriceMyr: 42.0, lastRestocked: '2023-10-02', trend: 'spike', supplier: 'RiceKing MY', alert: true },
];


export const MENU_ITEMS = [
  { id: 'classic', name: "Classic Milk Tea", price: 7.00, areaAvg: 7.50, cost: 2.10 },
  { id: 'brown-sugar', name: "Brown Sugar Boba", price: 9.00, areaAvg: 10.50, cost: 3.20, highlightAction: true },
  { id: 'matcha', name: "Matcha Milk Tea", price: 10.00, areaAvg: 12.00, cost: 3.80 },
  { id: 'taro', name: "Taro Milk Tea", price: 8.50, areaAvg: 8.50, cost: 2.80 },
  { id: 'mango', name: "Mango Fruit Tea", price: 8.00, areaAvg: 8.50, cost: 3.00 },
];

export const AGENTS = [
  { id: 'inventory', name: 'Inventory Planner', status: 'processing', statusText: 'Analyzing Thai rice markets...' },
  { id: 'market', name: 'Market Analyst', status: 'idle', statusText: 'Monitoring local trends' },
  { id: 'ops', name: 'Ops Advisor', status: 'idle', statusText: 'Analyzing weekend foot traffic patterns' },
  { id: 'location', name: 'Location Scout', status: 'idle', statusText: 'Scanning commercial real estate data' },
];
