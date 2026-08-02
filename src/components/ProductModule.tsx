import { useState, FormEvent } from 'react';
import { 
  ShoppingBag, Search, Filter, Plus, Package, Clock, ShieldCheck, 
  Tag, CreditCard, Sparkles, CheckCircle2, AlertCircle, ArrowUpRight,
  ChevronRight, Eye, RefreshCw, Truck
} from 'lucide-react';
import { User, SolarProduct, ProductOrder } from '../types.js';
import { INITIAL_PRODUCTS } from '../data/products.js';

interface ProductModuleProps {
  user: User;
  orders: ProductOrder[];
  onOrderPlaced?: (newOrder: ProductOrder) => void;
  isDarkMode?: boolean;
}

export default function ProductModule({ user, orders, onOrderPlaced, isDarkMode = false }: ProductModuleProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'upcoming' | 'orders' | 'transactions'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected product for Details View modal
  const [selectedProductDetails, setSelectedProductDetails] = useState<SolarProduct | null>(null);

  // Selected product for Order placement modal
  const [orderProduct, setOrderProduct] = useState<SolarProduct | null>(null);
  const [orderQty, setOrderQty] = useState<number>(1);
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string>('');

  const categories = ['all', 'Solar Panels', 'Inverters', 'Batteries', 'Solar Pumps', 'Street Lights', 'EV Chargers'];

  // Filter products
  const activeProducts = INITIAL_PRODUCTS.filter(p => !p.isUpcoming).filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const upcomingProducts = INITIAL_PRODUCTS.filter(p => p.isUpcoming);

  // Handle Order Submit
  const handlePlaceOrderSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!orderProduct || !shippingAddress.trim()) return;

    const totalAmt = orderProduct.distributorPrice * orderQty;
    const totalBV = orderProduct.businessValue * orderQty;
    const totalPV = orderProduct.pointValue * orderQty;

    const newOrderObj: ProductOrder = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      productId: orderProduct.id,
      productName: orderProduct.name,
      qty: orderQty,
      totalAmount: totalAmt,
      totalBV: totalBV,
      totalPV: totalPV,
      orderDate: new Date().toISOString().split('T')[0],
      status: 'Approved',
      shippingAddress: shippingAddress.trim()
    };

    if (onOrderPlaced) {
      onOrderPlaced(newOrderObj);
    }

    setOrderSuccessMsg(`Order #${newOrderObj.id} placed successfully! ${totalBV} BV and ${totalPV} PV will be credited to your account.`);
    setTimeout(() => {
      setOrderProduct(null);
      setOrderSuccessMsg('');
      setActiveTab('orders');
    }, 1800);
  };

  // Transaction History Mock Log
  const transactionHistory = [
    { txId: "TXN-98401", date: "2026-08-01", type: "CREDIT", category: "BV Credit", ref: "ORD-109282", bv: 10000, pv: 100, status: "Credited" },
    { txId: "TXN-98399", date: "2026-07-28", type: "DEBIT", category: "Wallet Payment", ref: "ORD-840192", bv: 0, pv: 0, amount: "₹29,500", status: "Completed" },
    { txId: "TXN-98210", date: "2026-07-20", type: "CREDIT", category: "Direct Referral BV", ref: "Sponsor Signup", bv: 25000, pv: 250, status: "Credited" },
    { txId: "TXN-98105", date: "2026-07-15", type: "CREDIT", category: "Bonus Payout", ref: "Executive Milestone", amount: "₹8,500", status: "Disbursed" },
  ];

  return (
    <div className={`space-y-6 animate-fade-in ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* 1. Header Banner */}
      <div className={`p-6 rounded-3xl border shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/20 text-white' 
          : 'bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-indigo-800'
      }`}>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-black">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Solar Products & Orders Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Solar Products & Order Management</h2>
          <p className="text-xs text-indigo-200/80 font-medium">
            Browse high-efficiency solar modules, check MRP, BV, PV, DP prices, place orders & track delivery status.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('orders')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md cursor-pointer hover:scale-105"
        >
          <Truck className="w-4 h-4" />
          <span>My Orders ({orders.length})</span>
        </button>
      </div>

      {/* 2. Sub-tabs Switcher */}
      <div className={`p-1.5 rounded-2xl border shadow-sm flex items-center gap-1 overflow-x-auto ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'catalog' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Product Catalog
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'upcoming' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Upcoming Products ({upcomingProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Product Orders History ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'transactions' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          BV & PV Transaction Log
        </button>
      </div>

      {/* 3. CATALOG VIEW */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name or category..."
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold capitalize transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProducts.map((p) => (
              <div key={p.id} className={`rounded-3xl border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  {/* Image & Badge */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-amber-400 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full border border-amber-400/30">
                      {p.category}
                    </div>
                    <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow-sm">
                      Stock: Available
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-extrabold text-sm line-clamp-2 leading-snug">{p.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>

                    {/* Required Metrics Grid: MRP, DP, BV, PV */}
                    <div className={`p-3 rounded-2xl grid grid-cols-2 gap-2 border text-xs font-mono ${
                      isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">MRP</span>
                        <span className="line-through text-slate-400 text-xs">₹{p.mrp.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-indigo-500 font-extrabold block uppercase">DP Price</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm">₹{p.distributorPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-500 font-extrabold block uppercase">Business Value</span>
                        <span className="text-amber-500 font-black text-xs">{p.businessValue.toLocaleString('en-IN')} BV</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-500 font-extrabold block uppercase">Point Value</span>
                        <span className="text-emerald-500 font-black text-xs">{p.pointValue} PV</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-5 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProductDetails(p)}
                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                    <span>View Specs</span>
                  </button>

                  <button
                    onClick={() => {
                      setOrderProduct(p);
                      setOrderQty(1);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 hover:scale-102"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Order Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 4. UPCOMING PRODUCTS */}
      {activeTab === 'upcoming' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingProducts.map((p) => (
            <div key={p.id} className={`rounded-3xl border overflow-hidden shadow-sm p-5 space-y-4 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-950">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-80" />
                <span className="absolute top-3 left-3 bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-md">
                  🚀 Launching Soon
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{p.description}</p>
              </div>
              <div className="flex justify-between items-center text-xs font-mono font-bold pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-indigo-500">Target BV: {p.businessValue.toLocaleString('en-IN')} BV</span>
                <span className="text-emerald-500">PV: {p.pointValue} PV</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. PRODUCT ORDERS HISTORY */}
      {activeTab === 'orders' && (
        <div className={`border rounded-3xl overflow-hidden shadow-sm ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[11px] ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Order Date</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">BV Earned</th>
                  <th className="p-4">PV Earned</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 font-medium">
                {orders.length > 0 ? (
                  orders.map((o) => (
                    <tr key={o.id} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                      <td className="p-4 font-mono font-bold text-amber-500">{o.id}</td>
                      <td className="p-4 text-slate-400">{o.orderDate}</td>
                      <td className="p-4 font-bold">{o.productName}</td>
                      <td className="p-4 font-black">{o.qty}</td>
                      <td className="p-4 font-mono font-black text-indigo-600 dark:text-indigo-400">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="p-4 font-mono font-bold text-amber-500">+{o.totalBV} BV</td>
                      <td className="p-4 font-mono font-bold text-emerald-500">+{o.totalPV} PV</td>
                      <td className="p-4 text-center"><span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-xl text-[10px] font-black">{o.status}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      No order records found. Place an order from the Product Catalog to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. ORDER PLACEMENT MODAL */}
      {orderProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`max-w-lg w-full rounded-3xl p-6 border shadow-2xl space-y-5 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-black text-base">Place Solar Product Order</h3>
                <p className="text-xs text-slate-500">Confirm order quantity & shipping address</p>
              </div>
              <button onClick={() => setOrderProduct(null)} className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm">✕</button>
            </div>

            {orderSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold text-center">
                {orderSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handlePlaceOrderSubmit} className="space-y-4 text-xs">
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-3">
                  <img src={orderProduct.image} alt={orderProduct.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-extrabold text-xs">{orderProduct.name}</h4>
                    <span className="text-indigo-500 font-mono font-bold">DP: ₹{orderProduct.distributorPrice.toLocaleString('en-IN')} / unit</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={orderQty}
                      onChange={(e) => setOrderQty(parseInt(e.target.value, 10) || 1)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-mono focus:outline-none ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Total Payable</label>
                    <div className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black font-mono text-sm border border-indigo-200 dark:border-indigo-800">
                      ₹{(orderProduct.distributorPrice * orderQty).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex justify-between font-mono font-bold">
                  <span>Earned BV: +{(orderProduct.businessValue * orderQty).toLocaleString('en-IN')} BV</span>
                  <span>Earned PV: +{orderProduct.pointValue * orderQty} PV</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Shipping & Installation Address</label>
                  <textarea
                    required
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter full site address with pincode and landmark..."
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOrderProduct(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-700 font-bold text-slate-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black cursor-pointer shadow-md"
                  >
                    Confirm Order
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 7. PRODUCT SPECS DETAILS MODAL */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`max-w-md w-full rounded-3xl p-6 border shadow-2xl space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-sm">{selectedProductDetails.name}</h3>
              <button onClick={() => setSelectedProductDetails(null)} className="text-slate-400 hover:text-white cursor-pointer font-bold">✕</button>
            </div>
            <img src={selectedProductDetails.image} alt={selectedProductDetails.name} className="w-full h-48 rounded-2xl object-cover" />
            <p className="text-xs text-slate-400 leading-relaxed">{selectedProductDetails.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
              <div>MRP: ₹{selectedProductDetails.mrp.toLocaleString('en-IN')}</div>
              <div className="text-indigo-500">DP: ₹{selectedProductDetails.distributorPrice.toLocaleString('en-IN')}</div>
              <div className="text-amber-500">BV: {selectedProductDetails.businessValue}</div>
              <div className="text-emerald-500">PV: {selectedProductDetails.pointValue}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
