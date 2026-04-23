import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, Calendar, ArrowRight, ArrowDown, ArrowUp, Loader2, Plus, X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

const mockPriceHistory = (trend: 'flat' | 'up' | 'spike') => {
  return Array.from({ length: 30 }).map((_, i) => {
    let base = 100 + Math.random() * 5;
    if (trend === 'up') base += i * 1.5;
    if (trend === 'spike' && i > 25) base += (i - 25) * 8;
    return { value: base };
  });
};

const MERCHANT_ID = "8899d441-6234-4ed7-85ee-64ffdef25478";

export default function InventoryPlanner() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: '',
    quantity: 0,
    unit: 'kg',
    reorder_threshold: 10,
    current_price_myr: 0,
    supplier_name: '',
    lead_time_days: 3,
    manufacturing_cost: 0,
    shipping_cost: 0
  });
  const [recs, setRecs] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/inventory/${MERCHANT_ID}`);
      if (!res.ok) {
        setInventory([]);
        return;
      }
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSymbols = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/inventory/symbols`);
      if (res.ok) {
        const data = await res.json();
        setSymbols(data);
      }
    } catch (err) {
      console.error("Failed to fetch symbols:", err);
    }
  };

  const fetchRecs = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/recommendations?status=all');
      if (res.ok) {
        const data = await res.json();
        setRecs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch recs:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchRecs();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `http://localhost:8000/api/inventory/${editingId}`
        : `http://localhost:8000/api/inventory/${MERCHANT_ID}`;

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (res.ok) {
        setShowAddModal(false);
        setEditingId(null);
        fetchInventory();
        setNewItem({
          item_name: '',
          quantity: 0,
          unit: 'kg',
          reorder_threshold: 10,
          current_price_myr: 0,
          supplier_name: '',
          lead_time_days: 3,
          manufacturing_cost: 0,
          shipping_cost: 0
        });
      }
    } catch (err) {
      console.error("Failed to save item:", err);
    }
  };

  const handleEditItem = (item: any) => {
    setNewItem({
      item_name: item.item_name || item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      reorder_threshold: item.reorder_threshold || item.reorderThreshold,
      current_price_myr: item.current_price_myr || item.currentPriceMyr,
      supplier_name: item.supplier_name || item.supplier || '',
      lead_time_days: item.lead_time_days || 3,
      manufacturing_cost: item.manufacturing_cost || 0,
      shipping_cost: item.shipping_cost || 0
    });
    setEditingId(item.id);
    setShowAddModal(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/inventory/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchInventory();
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 h-full font-sans text-neutral-900 relative">
      <header className="px-8 py-6 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center text-sm uppercase tracking-widest font-bold text-neutral-400 mb-1">
              <Package className="w-4 h-4 mr-2" /> Agent: Inventory Planner
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Stock & Sourcing</h1>
          </div>
          <div className="flex items-center space-x-4">
            {loading && <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />}
            <button
              onClick={() => {
                setEditingId(null);
                setNewItem({
                  item_name: '',
                  quantity: 0,
                  unit: 'kg',
                  reorder_threshold: 10,
                  current_price_myr: 0,
                  supplier_name: '',
                  lead_time_days: 3,
                  commodity_symbol: ''
                });
                setShowAddModal(true);
              }}
              className="flex items-center px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-bold hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </button>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
            <h2 className="font-semibold">Current Inventory Status</h2>
            <span className="text-xs text-neutral-500 font-mono">
              {loading ? "REFRESHING..." : "UPDATED: JUST NOW"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">Inventory Item</th>
                  <th className="px-6 py-3 font-semibold">Supplier</th>
                  <th className="px-6 py-3 font-semibold">Quantity</th>
                  <th className="px-6 py-3 font-semibold">Unit Price</th>
                  <th className="px-6 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {inventory.map(item => {
                  const isCrit = (item.quantity || 0) <= (item.reorder_threshold || item.reorderThreshold || 0);
                  const isAlert = item.alert || (item.supplier_reliability && item.supplier_reliability < 0.8);

                  return (
                    <tr key={item.id} className={cn("hover:bg-neutral-50/50 transition-colors group", isAlert ? "bg-red-50/30" : isCrit ? "bg-amber-50/30" : "")}>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center">
                          {isAlert && <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />}
                          {!isAlert && isCrit && <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />}
                          {item.item_name || item.itemName}
                        </div>
                        {item.supplier_name && <div className="text-[10px] text-neutral-400 mt-0.5 ml-6 uppercase tracking-wider">Lead: {item.lead_time_days}d</div>}
                      </td>
                      <td className="px-6 py-4 text-neutral-600">{item.supplier_name || item.supplier}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={cn("font-mono font-medium", isAlert || isCrit ? (isAlert ? "text-red-700" : "text-amber-700") : "text-neutral-700")}>
                            {(item.quantity || 0).toFixed(1)} {item.unit}
                          </span>
                          <span className="text-neutral-400 ml-1 text-xs">/ {item.reorder_threshold || item.reorderThreshold} reorder</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-700">RM {(item.current_price_myr || item.currentPriceMyr || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button className={cn(
                            "px-4 py-1.5 rounded-md text-xs font-bold transition-colors ml-2",
                            isAlert ? "bg-red-600 hover:bg-red-700 text-white" : isCrit ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                          )}>
                            {isCrit || isAlert ? 'ORDER NOW' : 'REVIEW'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="font-semibold">Upcoming Recommended Actions</h2>
            </div>
            <div className="p-6 flex-1 overflow-y-auto max-h-[500px]">
              <div className="relative border-l-2 border-neutral-100 ml-3 space-y-8">
                {inventory.length === 0 ? (
                  <div className="text-center py-10 text-neutral-400 text-sm">Add items to your inventory to receive AI restocking recommendations.</div>
                ) : recs.length === 0 && !loading ? (
                  <div className="text-center py-10 text-neutral-400 text-sm">No recommendations generated yet.</div>
                ) : (
                  recs.map((rec, idx) => {
                    const isUrgent = rec.urgency === 'urgent';
                    return (
                      <div key={idx} className="relative pl-6">
                        <div className={cn(
                          "absolute w-3 h-3 rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_white]",
                          isUrgent ? "bg-red-500" : "bg-teal-500"
                        )} />
                        <div className={cn(
                          "text-xs font-bold mb-1 uppercase tracking-wider",
                          isUrgent ? "text-red-600" : "text-teal-600"
                        )}>
                          {isUrgent ? "IMMEDIATE" : `IN ${rec.order_within_days || 3} DAYS`}
                        </div>
                        <div className={cn(
                          "bg-white border rounded-lg p-4 shadow-sm",
                          isUrgent ? "border-red-200" : "border-neutral-200"
                        )}>
                          <h3 className="font-semibold mb-1">{rec.recommended_action || rec.headline}</h3>
                          <p className="text-sm text-neutral-600 mb-3">
                            Est. cost: RM {(rec.cost_now || 0).toFixed(2)}
                          </p>
                          <div className={cn(
                            "text-xs p-2 rounded flex items-start",
                            isUrgent ? "bg-red-50 text-red-800" : "bg-neutral-50 text-neutral-600 border border-neutral-100"
                          )}>
                            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="font-bold">Triggered by:</span> {rec.triggered_by || "Market fluctuation"} — {rec.reasoning}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="font-semibold">Dynamic Ingredient Price Trends (30d)</h2>
            </div>
            <div className="p-6 space-y-6">
              {inventory.filter(i => i.price_history?.length > 0 || i.priceHistory?.length > 0).slice(0, 3).map((item, i) => {
                const history = (item.price_history || item.priceHistory || []).map((ph: any) => ({ value: ph.price }));
                const trendColor = item.trend === 'spike' ? '#ef4444' : item.trend === 'up' ? '#f59e0b' : '#14b8a6';

                return (
                  <div key={i}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-medium text-sm text-neutral-700">{item.item_name || item.itemName}</span>
                      <span className="font-mono text-sm font-semibold text-neutral-500">
                        RM {(item.current_price_myr || item.currentPriceMyr || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-16 w-full rounded overflow-hidden relative group cursor-crosshair bg-neutral-50/50">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                          <YAxis domain={['auto', 'auto']} hide />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={trendColor}
                            fill={trendColor}
                            fillOpacity={0.1}
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
              {inventory.length === 0 && <div className="text-center py-10 text-neutral-400 text-sm">No inventory data available.</div>}
            </div>
          </section>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <h2 className="font-bold text-lg">{editingId ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Item Name</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                  value={newItem.item_name}
                  onChange={e => setNewItem({ ...newItem, item_name: e.target.value })}
                  placeholder="e.g. Arabica Beans"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Quantity</label>
                  <input
                    type="number" required step="0.1"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                    value={newItem.quantity}
                    onChange={e => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Unit</label>
                  <input
                    type="text" required
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                    value={newItem.unit}
                    onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="kg, units, etc."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Current Price (RM)</label>
                  <input
                    type="number" required step="0.01"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                    value={newItem.current_price_myr}
                    onChange={e => setNewItem({ ...newItem, current_price_myr: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Threshold</label>
                  <input
                    type="number" required
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                    value={newItem.reorder_threshold}
                    onChange={e => setNewItem({ ...newItem, reorder_threshold: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              {/* Supply Chain Details Section */}
              <div className="border-t border-neutral-100 pt-4 mt-2">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Supply Chain Details</label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Supplier Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                      value={newItem.supplier_name}
                      onChange={e => setNewItem({ ...newItem, supplier_name: e.target.value })}
                      placeholder="e.g. Global Grains Ltd"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Lead Time (Days)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                        value={newItem.lead_time_days}
                        onChange={e => setNewItem({ ...newItem, lead_time_days: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Manuf. Cost (RM)</label>
                      <input
                        type="number" step="0.01"
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                        value={newItem.manufacturing_cost}
                        onChange={e => setNewItem({ ...newItem, manufacturing_cost: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Shipping Cost (RM)</label>
                    <input
                      type="number" step="0.01"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                      value={newItem.shipping_cost}
                      onChange={e => setNewItem({ ...newItem, shipping_cost: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-[0.98] mt-4"
              >
                {editingId ? 'Save Changes' : 'Add to Inventory'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
