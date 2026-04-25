import React, { useState, useEffect, useMemo } from 'react';
import { Package, AlertTriangle, TrendingUp, Calendar, ArrowRight, ArrowDown, ArrowUp, Loader2, Plus, X, Pencil, ChevronDown, Sparkles, ShoppingCart, Search, Filter, ChevronUp, ArrowUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const MERCHANT_ID = "8899d441-6234-4ed7-85ee-64ffdef25478";

/* ─── Global Dark Theme Tokens ────────────────────────────────── */
const T = {
  base: '#09090F',
  s1: '#13141A',
  s2: '#1C1D25',
  s3: '#24252F',
  border: 'rgba(255,255,255,0.06)',
  borderMd: 'rgba(255,255,255,0.11)',
  primary: '#ECEEF2',
  secondary: '#8B8FA8',
  muted: '#52556A',
  teal: '#2DD4BF',
  tealDim: 'rgba(45,212,191,0.14)',
  emerald: '#10B981',
  emeraldDim: 'rgba(16,185,129,0.12)',
  amber: '#F59E0B',
  amberDim: 'rgba(245,158,11,0.12)',
  ruby: '#F43F5E',
  rubyDim: 'rgba(244,63,94,0.1)',
};

type SortKey = 'item_name' | 'supplier_name' | 'quantity' | 'current_price_myr';
type SortDirection = 'asc' | 'desc' | null;

export default function InventoryPlanner() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(30); // Default to 30 days

  // Advanced Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'alert'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'item_name', direction: 'asc' });

  // Reference Data States
  const [categories, setCategories] = useState<string[]>([]);
  const [itemsInCategory, setItemsInCategory] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [newItem, setNewItem] = useState({
    item_name: '',
    item_code: null as number | null,
    quantity: 0,
    unit: 'kg',
    reorder_threshold: 10,
    current_price_myr: 0,
    supplier_name: '',
    lead_time_days: 3,
    manufacturing_cost: 0,
    shipping_cost: 0
  });

  const [restockItem, setRestockItem] = useState<any>(null);
  const [restockQty, setRestockQty] = useState<number>(0);
  const [isRestocking, setIsRestocking] = useState(false);

  const [symbols, setSymbols] = useState<Record<string, string>>({});
  const [recs, setRecs] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState<string>('Loading...');

  const fetchLatestDate = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/inventory/latest-date');
      if (res.ok) {
        const data = await res.json();
        const dateStr = data.latest_date;
        if (dateStr && dateStr !== 'N/A') {
          const date = new Date(dateStr);
          const formatted = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
          setLatestDate(formatted);
        } else {
          setLatestDate('N/A');
        }
      }
    } catch (e) {
      setLatestDate('Error');
    }
  };

  const fetchInventory = async (range: number = priceRange) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/inventory/${MERCHANT_ID}`);
      if (!res.ok) {
        setInventory([]);
        return;
      }
      const data = await res.json();

      const itemsWithHistory = await Promise.all(data.map(async (item: any) => {
        if (item.item_code) {
          try {
            const hRes = await fetch(`http://localhost:8000/api/inventory/history/${item.item_code}?days=${range}`);
            if (hRes.ok) {
              const hData = await hRes.json();
              return { ...item, price_history: hData };
            }
          } catch (e) {
            console.error("Failed to fetch history for item:", item.item_code);
          }
        }
        return item;
      }));

      setInventory(itemsWithHistory);
    } catch (err) {
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch('http://localhost:8000/api/inventory/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchItemsByCategory = async (category: string) => {
    setItemsInCategory([]);
    if (!category) return;
    try {
      setLoadingItems(true);
      const res = await fetch(`http://localhost:8000/api/inventory/items-by-category/${encodeURIComponent(category)}`);
      if (res.ok) {
        const data = await res.json();
        setItemsInCategory(data);
      }
    } catch (err) {
      console.error("Failed to fetch items:", err);
    } finally {
      setLoadingItems(false);
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
    fetchCategories();
    fetchLatestDate();
  }, []);

  useEffect(() => {
    if (inventory.length > 0) {
      fetchInventory(priceRange);
    }
  }, [priceRange]);

  const toggleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  // Derived Filtered & Sorted Inventory
  const filteredInventory = useMemo(() => {
    let result = inventory.filter(item => {
      const name = (item.item_name || item.itemName || '').toLowerCase();
      const supplier = (item.supplier_name || item.supplier || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = name.includes(query) || supplier.includes(query);

      const isCrit = (item.quantity || 0) <= (item.reorder_threshold || item.reorderThreshold || 0);
      const isAlert = item.alert || (item.supplier_reliability && item.supplier_reliability < 0.8);

      let matchesStatus = true;
      if (statusFilter === 'critical') matchesStatus = isCrit;
      if (statusFilter === 'alert') matchesStatus = isAlert;

      return matchesSearch && matchesStatus;
    });

    if (sortConfig.direction) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Handle inconsistent naming between API and UI state
        if (sortConfig.key === 'item_name') { valA = a.item_name || a.itemName; valB = b.item_name || b.itemName; }
        if (sortConfig.key === 'supplier_name') { valA = a.supplier_name || a.supplier; valB = b.supplier_name || b.supplier; }
        if (sortConfig.key === 'current_price_myr') { valA = a.current_price_myr || a.currentPriceMyr; valB = b.current_price_myr || b.currentPriceMyr; }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [inventory, searchQuery, statusFilter, sortConfig]);

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
        setSelectedCategory('');
        setItemsInCategory([]);
        fetchInventory();
        setNewItem({
          item_name: '',
          item_code: null,
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

  const handleQuickRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    try {
      setIsRestocking(true);
      const updatedQty = (restockItem.quantity || 0) + restockQty;

      const res = await fetch(`http://localhost:8000/api/inventory/${restockItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...restockItem,
          quantity: updatedQty,
          last_restocked: new Date().toISOString()
        })
      });

      if (res.ok) {
        setShowRestockModal(false);
        setRestockItem(null);
        setRestockQty(0);
        fetchInventory();
      }
    } catch (err) {
      console.error("Failed to restock item:", err);
    } finally {
      setIsRestocking(false);
    }
  };

  const handleEditItem = (item: any) => {
    setNewItem({
      item_name: item.item_name || item.itemName,
      item_code: item.item_code || null,
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

  const handleReferenceItemSelect = async (itemCode: number, itemName: string, unit: string) => {
    try {
      setLoadingItems(true);
      const res = await fetch(`http://localhost:8000/api/inventory/history/${itemCode}?days=1`);
      let latestPrice = 0;
      if (res.ok) {
        const history = await res.json();
        if (history.length > 0) {
          latestPrice = history[history.length - 1].price;
        }
      }
      setNewItem({
        ...newItem,
        item_name: itemName,
        item_code: itemCode,
        unit: unit,
        current_price_myr: latestPrice
      });
    } catch (err) {
      console.error("Failed to autofill price:", err);
      setNewItem({ ...newItem, item_name: itemName, item_code: itemCode, unit: unit });
    } finally {
      setLoadingItems(false);
    }
  };

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortConfig.key !== colKey) return <ArrowUpDown className="w-3 h-3 ml-1.5 opacity-20" />;
    if (sortConfig.direction === 'asc') return <ChevronUp className="w-3.5 h-3.5 ml-1.5 text-teal" />;
    if (sortConfig.direction === 'desc') return <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-teal" />;
    return <ArrowUpDown className="w-3 h-3 ml-1.5 opacity-20" />;
  };

  return (
    <div className="flex-1 overflow-y-auto h-full font-sans relative transition-colors duration-500" style={{ background: T.base, color: T.primary }}>
      <header className="px-8 py-6 sticky top-0 z-30 backdrop-blur-md" style={{ background: `${T.s1}cc`, borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <div className="flex items-center text-xs uppercase tracking-[0.2em] font-bold mb-1.5" style={{ color: T.teal }}>
              <Package className="w-4 h-4 mr-2" /> Inventory Planner
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Stock & Sourcing</h1>
          </div>
          <div className="flex items-center space-x-4">
            {loading && <Loader2 className="w-5 h-5 animate-spin" style={{ color: T.muted }} />}
            <button
              onClick={() => {
                setEditingId(null);
                setSelectedCategory('');
                setItemsInCategory([]);
                setNewItem({
                  item_name: '',
                  item_code: null,
                  quantity: 0,
                  unit: 'kg',
                  reorder_threshold: 10,
                  current_price_myr: 0,
                  supplier_name: '',
                  lead_time_days: 3,
                  manufacturing_cost: 0,
                  shipping_cost: 0
                });
                setShowAddModal(true);
              }}
              className="flex items-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-teal-500/20"
              style={{ background: `linear-gradient(135deg, ${T.teal}, #0EA5E9)`, color: '#fff' }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </button>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Advanced Filters & Search Bar */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6 relative group">
            <Search className="absolute left-4 top-3.5 w-4 h-4 transition-colors group-focus-within:text-teal" style={{ color: T.muted }} />
            <input
              type="text"
              placeholder="Search by item name or supplier..."
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/5 border border-white/5 outline-none focus:ring-2 focus:ring-teal/50 transition-all text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="md:col-span-6 flex items-center justify-end space-x-2">
            {[
              { id: 'all', label: 'All Items', icon: Filter },
              { id: 'critical', label: 'Low Stock', icon: AlertTriangle },
              { id: 'alert', label: 'Supplier Alert', icon: TrendingUp }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={cn(
                  "flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                  statusFilter === f.id ? "bg-teal/10 border-teal text-teal shadow-lg shadow-teal-500/10" : "bg-white/5 border-transparent text-muted hover:text-primary hover:bg-white/10"
                )}
              >
                <f.icon className="w-3.5 h-3.5 mr-2" />
                {f.label}
              </button>
            ))}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl shadow-xl overflow-hidden"
          style={{ background: T.s1, border: `1px solid ${T.border}` }}
        >
          <div className="px-6 py-5 border-b flex justify-between items-center" style={{ borderColor: T.border }}>
            <h2 className="font-semibold text-lg">Current Inventory Status</h2>
            <div className="flex items-center space-x-4">
              <span className="text-[10px] font-mono tracking-widest" style={{ color: T.muted }}>
                {filteredInventory.length} OF {inventory.length} SHOWN
              </span>
              {loading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: T.muted }} />}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.1em] font-bold" style={{ background: T.s2, color: T.secondary }}>
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors group" onClick={() => toggleSort('item_name')}>
                    <div className="flex items-center">Inventory Item <SortIcon colKey="item_name" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors group" onClick={() => toggleSort('supplier_name')}>
                    <div className="flex items-center">Supplier <SortIcon colKey="supplier_name" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors group" onClick={() => toggleSort('quantity')}>
                    <div className="flex items-center">Quantity <SortIcon colKey="quantity" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors group" onClick={() => toggleSort('current_price_myr')}>
                    <div className="flex items-center">Unit Price <SortIcon colKey="current_price_myr" /></div>
                  </th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: T.border }}>
                {filteredInventory.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center" style={{ color: T.muted }}>
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No items match your filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item, idx) => {
                    const isCrit = (item.quantity || 0) <= (item.reorder_threshold || item.reorderThreshold || 0);
                    const isAlert = item.alert || (item.supplier_reliability && item.supplier_reliability < 0.8);

                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium">
                          <div className="flex items-center">
                            {isAlert ? <AlertTriangle className="w-4 h-4 mr-2" style={{ color: T.ruby }} /> :
                              isCrit ? <AlertTriangle className="w-4 h-4 mr-2" style={{ color: T.amber }} /> :
                                <div className="w-1.5 h-1.5 rounded-full mr-3" style={{ background: T.teal }} />}
                            {item.item_name || item.itemName}
                          </div>
                          {item.supplier_name && <div className="text-[10px] mt-1 ml-4 uppercase tracking-widest" style={{ color: T.muted }}>Lead: {item.lead_time_days}d</div>}
                        </td>
                        <td className="px-6 py-4" style={{ color: T.secondary }}>{item.supplier_name || item.supplier || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className={cn("font-mono font-bold", isAlert ? "text-ruby" : isCrit ? "text-amber" : "text-primary")} style={{ color: isAlert ? T.ruby : isCrit ? T.amber : T.primary }}>
                              {(item.quantity || 0).toFixed(1)} {item.unit}
                            </span>
                            <span className="ml-1.5 text-[10px] font-bold opacity-40 uppercase">/ {item.reorder_threshold || item.reorderThreshold} target</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold" style={{ color: T.teal }}>RM {(item.current_price_myr || item.currentPriceMyr || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="p-2 transition-colors rounded-lg hover:bg-white/5"
                              style={{ color: T.muted }}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 transition-colors rounded-lg hover:bg-ruby/10 hover:text-ruby"
                              style={{ color: T.muted }}
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setRestockItem(item);
                                setRestockQty(Math.max(0, (item.reorder_threshold || item.reorderThreshold || 0) - (item.quantity || 0)));
                                setShowRestockModal(true);
                              }}
                              className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all ml-2",
                                isAlert ? "shadow-lg shadow-ruby-500/20" : isCrit ? "shadow-lg shadow-amber-500/20" : ""
                              )} style={{
                                background: isAlert ? T.ruby : isCrit ? T.amber : T.s2,
                                color: isAlert || isCrit ? '#fff' : T.primary,
                                border: isAlert || isCrit ? 'none' : `1px solid ${T.borderMd}`
                              }}>
                              {isCrit || isAlert ? 'REORDER' : 'DETAILS'}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl shadow-xl overflow-hidden flex flex-col"
            style={{ background: T.s1, border: `1px solid ${T.border}` }}
          >
            <div className="px-6 py-5 border-b" style={{ borderColor: T.border }}>
              <h2 className="font-semibold text-lg">AI Recommendations</h2>
            </div>
            <div className="p-6 flex-1 overflow-y-auto max-h-[500px] scrollbar-hide">
              <div className="relative border-l-2 ml-3 space-y-8" style={{ borderColor: T.borderMd }}>
                {inventory.length === 0 ? (
                  <div className="text-center py-12 px-6" style={{ color: T.muted }}>
                    <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Add items to receive AI-powered restocking and sourcing optimization strategies.</p>
                  </div>
                ) : recs.length === 0 && !loading ? (
                  <div className="text-center py-12 px-6" style={{ color: T.muted }}>
                    <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin opacity-20" />
                    <p className="text-sm">Analyzing market trends and supplier data...</p>
                  </div>
                ) : (
                  recs.map((rec, idx) => {
                    const isUrgent = rec.urgency === 'urgent';
                    return (
                      <div key={idx} className="relative pl-7">
                        <div className={cn(
                          "absolute w-3.5 h-3.5 rounded-full -left-[8px] top-1.5 shadow-lg",
                          isUrgent ? "bg-red-500 shadow-red-500/40" : "bg-teal-500 shadow-teal-500/40"
                        )} />
                        <div className={cn(
                          "text-[10px] font-black mb-2 uppercase tracking-[0.2em]",
                          isUrgent ? "text-ruby" : "text-teal"
                        )} style={{ color: isUrgent ? T.ruby : T.teal }}>
                          {isUrgent ? "IMMEDIATE ACTION" : `WINDOW: ${rec.order_within_days || 3} DAYS`}
                        </div>
                        <div className="rounded-xl p-5 shadow-inner transition-transform hover:scale-[1.01]" style={{ background: T.s2, border: `1px solid ${isUrgent ? 'rgba(244,63,94,0.2)' : T.borderMd}` }}>
                          <h3 className="font-bold mb-1.5 text-primary leading-tight">{rec.recommended_action || rec.headline}</h3>
                          <p className="text-xs mb-4" style={{ color: T.secondary }}>
                            Potential Cost Impact: <span className="font-mono font-bold" style={{ color: T.primary }}>RM {(rec.cost_now || 0).toFixed(2)}</span>
                          </p>
                          <div className="text-[11px] p-3 rounded-lg flex items-start leading-relaxed" style={{ background: isUrgent ? T.rubyDim : T.base, color: isUrgent ? T.primary : T.secondary }}>
                            <AlertTriangle className="w-3.5 h-3.5 mr-2 shrink-0 mt-0.5" style={{ color: isUrgent ? T.ruby : T.amber }} />
                            <div>
                              <span className="font-bold text-primary mr-1">RATIONALE:</span>
                              {rec.reasoning}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl shadow-xl overflow-hidden"
            style={{ background: T.s1, border: `1px solid ${T.border}` }}
          >
            <div className="px-6 py-5 border-b" style={{ borderColor: T.border }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Market Price Analytics</h2>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                  {[7, 30, 90].map(days => (
                    <button
                      key={days}
                      onClick={() => setPriceRange(days)}
                      className={cn(
                        "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                        priceRange === days ? "bg-teal text-white shadow-lg shadow-teal-500/20" : "text-muted hover:text-primary"
                      )}
                      style={{ background: priceRange === days ? T.teal : 'transparent' }}
                    >
                      {days}D
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Analytics Filter */}
              <div className="relative group">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 opacity-40 group-focus-within:opacity-100 group-focus-within:text-teal transition-all" />
                <input
                  type="text"
                  placeholder="Filter analytics..."
                  className="w-full h-9 pl-9 pr-4 rounded-xl bg-white/5 border border-white/5 outline-none focus:ring-1 focus:ring-teal/30 transition-all text-xs"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="p-6 space-y-8 max-h-[500px] overflow-y-auto scrollbar-hide">
              {filteredInventory.filter(i => (i.price_history?.length > 0 || i.priceHistory?.length > 0)).map((item, i) => {
                const history = (item.price_history || item.priceHistory || []).map((ph: any) => ({
                  date: ph.date,
                  value: ph.price
                }));

                const latestMarketPrice = history.length > 0 ? history[history.length - 1].value : 0;
                const userPrice = item.current_price_myr || 0;
                const diffPercent = latestMarketPrice > 0 ? ((userPrice - latestMarketPrice) / latestMarketPrice) * 100 : 0;

                const trendColor = diffPercent > 5 ? T.ruby : diffPercent > 0 ? T.amber : T.emerald;

                return (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="block text-sm font-bold text-primary mb-0.5">{item.item_name || item.itemName}</span>
                        <span className="text-[10px] font-mono tracking-widest opacity-40 uppercase">Benchmark Pricing</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono text-lg font-black" style={{ color: T.teal }}>
                          RM {userPrice.toFixed(2)}
                        </span>
                        <div className="flex items-center justify-end text-[10px] font-bold" style={{ color: trendColor }}>
                          {diffPercent > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                          {Math.abs(diffPercent).toFixed(1)}% VS MARKET
                        </div>
                      </div>
                    </div>
                    <div className="h-28 w-full rounded-xl overflow-hidden relative bg-black/20 p-2 border" style={{ borderColor: T.border }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                          <defs>
                            <linearGradient id={`colorPrice-${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Tooltip
                            contentStyle={{ background: T.s3, border: `1px solid ${T.borderMd}`, borderRadius: '12px', fontSize: '10px' }}
                            itemStyle={{ color: T.primary, fontWeight: 'bold' }}
                            labelStyle={{ color: T.secondary, marginBottom: '4px' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={trendColor}
                            fill={`url(#colorPrice-${i})`}
                            strokeWidth={2.5}
                            animationDuration={1500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
              {filteredInventory.length === 0 && (
                <div className="text-center py-20" style={{ color: T.muted }}>
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="text-sm">Ingest market data or adjust filters to view charts.</p>
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl overflow-hidden rounded-3xl shadow-2xl border"
              style={{ background: T.s1, borderColor: T.borderMd }}
            >
              <div className="px-8 py-6 border-b flex items-center justify-between" style={{ background: T.s2, borderColor: T.border }}>
                <div>
                  <h2 className="font-black text-xl tracking-tight leading-none uppercase">{editingId ? 'Modify Inventory' : 'Expand Inventory'}</h2>
                  <p className="text-xs mt-2" style={{ color: T.secondary }}>{editingId ? 'Updating current stock parameters' : 'Onboarding new item for supply chain tracking'}</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors" style={{ color: T.muted }}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide">
                {!editingId && (
                  <div className="p-6 rounded-2xl space-y-5 border" style={{ background: T.base, borderColor: T.borderMd }}>
                    <div className="flex items-center text-[10px] font-black tracking-[0.3em]" style={{ color: T.teal }}>
                      <TrendingUp className="w-3 h-3 mr-2" /> DOSM REFERENCE DATA ENGINE
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Category</label>
                        <div className="relative">
                          <select
                            className="w-full h-11 px-4 text-sm rounded-xl appearance-none outline-none focus:ring-2 border"
                            style={{ background: T.s1, borderColor: T.borderMd, color: T.primary }}
                            value={selectedCategory}
                            onChange={(e) => {
                              const cat = e.target.value;
                              setSelectedCategory(cat);
                              fetchItemsByCategory(cat);
                            }}
                          >
                            <option value="">Select Category...</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <ChevronDown className="w-4 h-4 absolute right-4 top-3.5 opacity-40 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Reference Item</label>
                        <div className="relative">
                          <select
                            className="w-full h-11 px-4 text-sm rounded-xl appearance-none outline-none focus:ring-2 border"
                            style={{ background: T.s1, borderColor: T.borderMd, color: T.primary }}
                            disabled={!selectedCategory || loadingItems}
                            onChange={(e) => {
                              const item = itemsInCategory.find(i => i.item === e.target.value);
                              if (item) {
                                handleReferenceItemSelect(item.item_code, item.item, item.unit);
                              }
                            }}
                          >
                            <option value="">{loadingItems ? 'Loading Reference...' : 'Select Item...'}</option>
                            {itemsInCategory.map(item => <option key={item.item_code} value={item.item}>{item.item} ({item.unit})</option>)}
                          </select>
                          <ChevronDown className="w-4 h-4 absolute right-4 top-3.5 opacity-40 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-full md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Inventory Item Name</label>
                    <input
                      type="text" required
                      className="w-full h-11 px-4 text-sm rounded-xl outline-none focus:ring-2 border"
                      style={{ background: T.base, borderColor: T.borderMd, color: T.primary }}
                      value={newItem.item_name}
                      onChange={e => setNewItem({ ...newItem, item_name: e.target.value })}
                      placeholder="e.g. Premium Arabica"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Supplier Name</label>
                    <input
                      type="text"
                      className="w-full h-11 px-4 text-sm rounded-xl outline-none focus:ring-2 border"
                      style={{ background: T.base, borderColor: T.borderMd, color: T.primary }}
                      value={newItem.supplier_name}
                      onChange={e => setNewItem({ ...newItem, supplier_name: e.target.value })}
                      placeholder="e.g. Origin Bulk Suppliers"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Initial Quantity</label>
                    <div className="relative">
                      <input
                        type="number" required step="0.1"
                        className="w-full h-11 px-4 text-sm rounded-xl outline-none focus:ring-2 border"
                        style={{ background: T.base, borderColor: T.borderMd, color: T.primary }}
                        value={newItem.quantity}
                        onChange={e => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                      />
                      <span className="absolute right-4 top-3 text-[10px] font-black opacity-40">{newItem.unit.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Base Unit</label>
                    <input
                      type="text" required
                      className="w-full h-11 px-4 text-sm rounded-xl outline-none focus:ring-2 border"
                      style={{ background: T.base, borderColor: T.borderMd, color: T.primary }}
                      value={newItem.unit}
                      onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                      placeholder="kg, box, unit"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Restock Threshold</label>
                    <input
                      type="number" required
                      className="w-full h-11 px-4 text-sm rounded-xl outline-none focus:ring-2 border"
                      style={{ background: T.base, borderColor: T.borderMd, color: T.primary }}
                      value={newItem.reorder_threshold}
                      onChange={e => setNewItem({ ...newItem, reorder_threshold: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Purchase Price (RM)</label>
                    <div className="relative">
                      <input
                        type="number" required step="0.01"
                        className="w-full h-11 px-4 text-sm rounded-xl outline-none focus:ring-2 border"
                        style={{ background: T.base, borderColor: T.borderMd, color: T.primary }}
                        value={newItem.current_price_myr}
                        onChange={e => setNewItem({ ...newItem, current_price_myr: parseFloat(e.target.value) })}
                      />
                      {loadingItems && <Loader2 className="absolute right-4 top-3 w-4 h-4 animate-spin text-teal" style={{ color: T.teal }} />}
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl space-y-5 border" style={{ background: T.s2, borderColor: T.borderMd }}>
                  <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60 border-b pb-2" style={{ borderColor: T.border }}>Logistics & Operations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold opacity-60">Lead Time (d)</label>
                      <input
                        type="number"
                        className="w-full h-10 px-3 text-xs rounded-lg outline-none focus:ring-2 border"
                        style={{ background: T.base, borderColor: T.borderMd, color: T.primary }}
                        value={newItem.lead_time_days}
                        onChange={e => setNewItem({ ...newItem, lead_time_days: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold opacity-60">Manuf. (RM)</label>
                      <input
                        type="number" step="0.01"
                        className="w-full h-10 px-3 text-xs rounded-lg outline-none focus:ring-2 border"
                        style={{ background: T.base, borderColor: T.borderMd, color: T.primary }}
                        value={newItem.manufacturing_cost}
                        onChange={e => setNewItem({ ...newItem, manufacturing_cost: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold opacity-60">Shipping (RM)</label>
                      <input
                        type="number" step="0.01"
                        className="w-full h-10 px-3 text-xs rounded-lg outline-none focus:ring-2 border"
                        style={{ background: T.base, borderColor: T.borderMd, color: T.primary }}
                        value={newItem.shipping_cost}
                        onChange={e => setNewItem({ ...newItem, shipping_cost: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 sticky bottom-0" style={{ background: T.s1 }}>
                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] shadow-2xl shadow-teal-500/20"
                    style={{ background: `linear-gradient(135deg, ${T.teal}, #0EA5E9)`, color: '#fff' }}
                  >
                    {editingId ? 'Commit Changes' : 'Initialize Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showRestockModal && restockItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRestockModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl border"
              style={{ background: T.s1, borderColor: T.borderMd }}
            >
              <div className="px-8 py-6 border-b flex items-center justify-between" style={{ background: T.s2, borderColor: T.border }}>
                <div>
                  <h2 className="font-black text-xl tracking-tight leading-none uppercase">Quick Restock</h2>
                  <p className="text-xs mt-2" style={{ color: T.secondary }}>Adding stock for {restockItem.item_name || restockItem.itemName}</p>
                </div>
                <button onClick={() => setShowRestockModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors" style={{ color: T.muted }}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleQuickRestock} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Quantity to Add</label>
                  <div className="relative">
                    <input
                      type="number" required step="0.1" autoFocus
                      className="w-full h-14 px-6 text-xl font-mono font-bold rounded-2xl outline-none focus:ring-2 border"
                      style={{ background: T.base, borderColor: T.borderMd, color: T.primary }}
                      value={restockQty}
                      onChange={e => setRestockQty(parseFloat(e.target.value))}
                    />
                    <span className="absolute right-6 top-4.5 text-xs font-black opacity-40">{restockItem.unit.toUpperCase()}</span>
                  </div>
                  <p className="text-[10px] font-bold px-2" style={{ color: T.muted }}>
                    Current Stock: {restockItem.quantity.toFixed(1)} {restockItem.unit}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isRestocking}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] shadow-2xl shadow-teal-500/20 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${T.emerald}, #059669)`, color: '#fff' }}
                >
                  {isRestocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShoppingCart className="w-4 h-4 mr-2" /> Confirm Restock</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="max-w-7xl mx-auto px-8 py-12 border-t mt-12" style={{ borderColor: T.border }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-xs max-w-2xl leading-relaxed" style={{ color: T.secondary }}>
              Benchmark market prices and historical trends are powered by the <a href="https://open.dosm.gov.my/" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:text-teal underline underline-offset-4 decoration-white/10 transition-colors">Department of Statistics Malaysia (DOSM)</a> Open Data initiative.
              Price data is sourced from the <a href="https://open.dosm.gov.my/data-catalogue/pricecatcher" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:text-teal underline underline-offset-4 decoration-white/10 transition-colors">PriceCatcher</a> dataset.
              Usage is governed by the <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:text-teal underline underline-offset-4 decoration-white/10 transition-colors">Creative Commons Attribution 4.0 International License</a>.
            </p>
          </div>
          <div className="flex items-center space-x-6 shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: T.muted }}>Last Updated</div>
              <div className="text-xs font-mono font-bold" style={{ color: T.teal }}>{latestDate}</div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
              <Sparkles className="w-5 h-5" style={{ color: T.teal }} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
