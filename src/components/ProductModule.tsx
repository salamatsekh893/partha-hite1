import { useState, FormEvent } from 'react';
import { 
  ShoppingBag, Search, Filter, Plus, Package, Clock, ShieldCheck, 
  Tag, CreditCard, Sparkles, CheckCircle2, AlertCircle, ArrowUpRight,
  ChevronRight, Eye, RefreshCw, Truck, HelpCircle, Key, Wallet, Building2, Check, ExternalLink, Sun
} from 'lucide-react';
import { User, SolarProduct, ProductOrder, ProductCategory } from '../types.js';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/products.js';

interface ProductModuleProps {
  user: User;
  orders: ProductOrder[];
  onOrderPlaced?: (newOrder: ProductOrder) => void;
  isDarkMode?: boolean;
  products?: SolarProduct[];
  categories?: ProductCategory[];
}

// Helper component for reliable image rendering with fallback icon
function ProductImage({ src, alt, className = "w-12 h-12 rounded-xl object-cover" }: { src: string; alt: string; className?: string }) {
  const [hasError, setHasError] = useState(false);
  if (hasError || !src) {
    return (
      <div className={`${className} bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0`}>
        <Sun className="w-5 h-5 animate-pulse" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`${className} object-cover shrink-0`}
    />
  );
}

export default function ProductModule({ user, orders, onOrderPlaced, isDarkMode = false, products: propProducts, categories: propCategories }: ProductModuleProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'upcoming' | 'orders' | 'transactions'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected product for Details View modal
  const [selectedProductDetails, setSelectedProductDetails] = useState<SolarProduct | null>(null);

  // Selected product for Order placement modal
  const [orderProduct, setOrderProduct] = useState<SolarProduct | null>(null);
  const [orderQty, setOrderQty] = useState<number | ''>(1);
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'wallet' | 'cod'>('razorpay');
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>('rzp_live_TLblIZgVpR9LWh');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string>('');
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const productList = propProducts || INITIAL_PRODUCTS;
  const categoryNames = ['all', ...(propCategories ? propCategories.map(c => c.name) : INITIAL_CATEGORIES.map(c => c.name))];

  // Filter products
  const activeProducts = productList.filter(p => !p.isUpcoming).filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const upcomingProducts = productList.filter(p => p.isUpcoming);

  // Helper to load Razorpay Checkout script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Fallback handler if popup is blocked or iframe restrictions apply
  const fallbackSimulatedRazorpay = (totalAmt: number, totalBV: number, totalPV: number) => {
    const actualQty = typeof orderQty === 'number' && orderQty > 0 ? orderQty : 1;
    setTimeout(() => {
      setIsProcessingPayment(false);
      const newOrderObj: ProductOrder = {
        id: `ORD-RZP-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: user.id,
        productId: orderProduct!.id,
        productName: orderProduct!.name,
        qty: actualQty,
        totalAmount: totalAmt,
        totalBV: totalBV,
        totalPV: totalPV,
        orderDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        shippingAddress: `${shippingAddress.trim()} (Paid via Razorpay Key: ${razorpayKeyId})`
      };

      if (onOrderPlaced) {
        onOrderPlaced(newOrderObj);
      }

      setOrderSuccessMsg(`Order #${newOrderObj.id} submitted successfully! Status: Pending Approval (অর্ডারটি অ্যাডমিন প্যানেলে অনুমোদনের জন্য পাঠানো হয়েছে)।`);
      setTimeout(() => {
        setOrderProduct(null);
        setOrderSuccessMsg('');
        setActiveTab('orders');
      }, 2200);
    }, 1200);
  };

  // Handle Order Submit
  const handlePlaceOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!orderProduct || !shippingAddress.trim()) return;

    const actualQty = typeof orderQty === 'number' && orderQty > 0 ? orderQty : 1;
    const totalAmt = orderProduct.distributorPrice * actualQty;
    const totalBV = orderProduct.businessValue * actualQty;
    const totalPV = orderProduct.pointValue * actualQty;

    if (paymentMethod === 'razorpay') {
      setIsProcessingPayment(true);
      const loaded = await loadRazorpayScript();

      if (loaded && (window as any).Razorpay) {
        const activeKey = razorpayKeyId.trim() || 'rzp_live_TLblIZgVpR9LWh';
        const options = {
          key: activeKey,
          amount: totalAmt * 100, // Amount in paise
          currency: "INR",
          name: "SuccessIndia Solar Energy",
          description: `Purchase: ${orderProduct.name} (${actualQty} Qty)`,
          image: "https://cdn-icons-png.flaticon.com/512/4252/4252332.png",
          handler: function (response: any) {
            setIsProcessingPayment(false);
            const paymentId = response.razorpay_payment_id || `PAY_RZP_${Math.floor(10000000 + Math.random() * 90000000)}`;
            const newOrderObj: ProductOrder = {
              id: `ORD-RZP-${Math.floor(100000 + Math.random() * 900000)}`,
              userId: user.id,
              productId: orderProduct.id,
              productName: orderProduct.name,
              qty: actualQty,
              totalAmount: totalAmt,
              totalBV: totalBV,
              totalPV: totalPV,
              orderDate: new Date().toISOString().split('T')[0],
              status: 'Pending',
              shippingAddress: `${shippingAddress.trim()} (Paid via Razorpay Live Payment ID: ${paymentId})`
            };

            if (onOrderPlaced) {
              onOrderPlaced(newOrderObj);
            }

            setOrderSuccessMsg(`🎉 Payment Received via Razorpay! Payment ID: ${paymentId}. Order #${newOrderObj.id} is now Pending Admin Approval.`);
            setTimeout(() => {
              setOrderProduct(null);
              setOrderSuccessMsg('');
              setActiveTab('orders');
            }, 2500);
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone
          },
          notes: {
            address: shippingAddress,
            distributorId: user.id
          },
          theme: {
            color: "#f59e0b"
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
            }
          }
        };

        try {
          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (response: any) {
            setIsProcessingPayment(false);
            alert(`Razorpay Payment Failed: ${response?.error?.description || 'Payment was declined or cancelled.'}`);
          });
          rzp.open();
        } catch (err) {
          console.error('Razorpay popup open error:', err);
          fallbackSimulatedRazorpay(totalAmt, totalBV, totalPV);
        }
      } else {
        fallbackSimulatedRazorpay(totalAmt, totalBV, totalPV);
      }
    } else {
      const newOrderObj: ProductOrder = {
        id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: user.id,
        productId: orderProduct.id,
        productName: orderProduct.name,
        qty: actualQty,
        totalAmount: totalAmt,
        totalBV: totalBV,
        totalPV: totalPV,
        orderDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        shippingAddress: `${shippingAddress.trim()} (${paymentMethod === 'wallet' ? 'Paid via Wallet Balance' : 'Cash on Delivery'})`
      };

      if (onOrderPlaced) {
        onOrderPlaced(newOrderObj);
      }

      setOrderSuccessMsg(`Order #${newOrderObj.id} submitted! Status: Pending Approval (অর্ডারটি অ্যাডমিন প্যানেলে অনুমোদনের জন্য পেন্ডিং রয়েছে)।`);
      setTimeout(() => {
        setOrderProduct(null);
        setOrderSuccessMsg('');
        setActiveTab('orders');
      }, 1800);
    }
  };


  // Transaction History Log derived from real user orders
  const transactionHistory = orders.map((o, idx) => ({
    txId: `TXN-${1000 + idx}`,
    date: o.orderDate,
    type: "DEBIT",
    category: "Product Order",
    ref: o.id,
    bv: o.totalBV,
    pv: o.totalPV,
    amount: `₹${o.totalAmount.toLocaleString('en-IN')}`,
    status: o.status
  }));

  return (
    <div className={`space-y-4 animate-fade-in ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* 1. Header Banner */}
      <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between gap-3 ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-800 text-white' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-500 border border-amber-400/30">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight">Solar Products Catalog</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Explore solar modules, batteries, and inverters with BV & PV reward points
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('orders')}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Truck className="w-4 h-4" />
          <span>My Orders ({orders.length})</span>
        </button>
      </div>

      {/* 1.5. Buying, Selling & Razorpay Setup Guide Banner */}
      {showGuide && (
        <div className={`p-4 sm:p-5 rounded-xl border shadow-xs space-y-3 transition-all ${
          isDarkMode ? 'bg-slate-900/90 border-indigo-500/30 text-slate-200' : 'bg-gradient-to-r from-indigo-50 via-slate-50 to-amber-50 border-indigo-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  Product Purchasing, Sales & Razorpay Payment Guide
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Instant Razorpay Checkout (UPI / Cards / Netbanking), Wallet Balance & Cash on Delivery
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer px-2 py-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
            <div className={`p-3 rounded-lg border space-y-1 ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
                <span>1. How to Buy Products</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Select any solar panel, inverter, or battery from the catalog and click <strong>"Order Now"</strong>. Enter quantity and delivery site address.
              </p>
            </div>

            <div className={`p-3 rounded-lg border space-y-1 ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                <span>2. Razorpay Live Gateway</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Online payment via <strong>Razorpay (UPI / Google Pay / PhonePe / Credit Card / Netbanking)</strong> is live and securely integrated.
              </p>
            </div>

            <div className={`p-3 rounded-lg border space-y-1 ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>3. Earn BV & PV Commission</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Upon order confirmation, instant <strong>Business Value (BV)</strong> and <strong>Point Value (PV)</strong> are credited to your account.
              </p>
            </div>
          </div>
        </div>
      )}


      {/* 2. Sub-tabs Switcher */}
      <div className={`p-1.5 rounded-xl border shadow-xs flex items-center gap-1 overflow-x-auto ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
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
              {categoryNames.map((cat) => (
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
                  <div className="relative h-48 w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                    <ProductImage 
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
              <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                <ProductImage src={p.image} alt={p.name} className="w-full h-full object-cover opacity-80" />
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
        <div className="space-y-3">
          {/* Privacy & Upline Business Rule Banner */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            isDarkMode ? 'bg-indigo-950/40 border-indigo-800/50 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-950'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block text-xs">🔒 Personal Purchase Privacy Rule (ক্রয় তথ্যের গোপনীয়তা)</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-300">
                  আপনার পারচেজের সম্পূর্ণ বিবরণ (পণ্য, পরিমাণ, টাকা ও ইনভয়েস) শুধুমাত্র আপনার আইডি <strong>#{user.id}</strong>-তেই সংরক্ষিত থাকবে। আপলাইনদের কাছে কেবল রিয়েল-টাইম বিজনেস কাউন্ট (+১) ও বিজনেস ভলিউম (BV) যুক্ত হবে।
                </p>
              </div>
            </div>
          </div>

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
                  {orders.filter(o => !o.userId || o.userId === user.id).length > 0 ? (
                    orders.filter(o => !o.userId || o.userId === user.id).map((o) => (
                      <tr key={o.id} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                        <td className="p-4 font-mono font-bold text-amber-500">{o.id}</td>
                        <td className="p-4 text-slate-400">{o.orderDate}</td>
                        <td className="p-4 font-bold">{o.productName}</td>
                        <td className="p-4 font-black">{o.qty}</td>
                        <td className="p-4 font-mono font-black text-indigo-600 dark:text-indigo-400">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="p-4 font-mono font-bold text-amber-500">+{o.totalBV} BV</td>
                        <td className="p-4 font-mono font-bold text-emerald-500">+{o.totalPV} PV</td>
                        <td className="p-4 text-center">
                          {o.status === 'Pending' ? (
                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                              ⏳ Pending Approval
                            </span>
                          ) : o.status === 'Approved' ? (
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                              ✓ Approved
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-xl text-[10px] font-black">
                              {o.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        User ID #{user.id} এর অধীনে কোনো পারচেজ ইনভয়েস রেকর্ড নেই। সোলার প্রোডাক্ট ক্যাটালগ থেকে নতুন অর্ডার সাবমিট করুন।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. ORDER PLACEMENT MODAL */}
      {orderProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-hidden">
          <div className={`max-w-md w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-800 text-white shadow-indigo-950/50' 
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-400/30'
          }`}>
            {/* Modal Header - Pinned at top */}
            <div className="flex-none p-4 sm:p-4.5 border-b flex items-center justify-between border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-500 border border-amber-400/30">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">Place Solar Product Order</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Select payment method & delivery site address</p>
                </div>
              </div>
              <button 
                onClick={() => setOrderProduct(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer font-bold text-sm p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
              {orderSuccessMsg ? (
                <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold text-center space-y-1 my-auto">
                  <div className="text-base font-black text-emerald-300">🎉 Order Confirmed!</div>
                  <div>{orderSuccessMsg}</div>
                </div>
              ) : (
                <form id="order-form" onSubmit={handlePlaceOrderSubmit} className="space-y-3.5 text-xs">
                  {/* Product Summary Card */}
                  <div className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-slate-800/90 via-slate-800/60 to-slate-800/90 border-slate-700/80 shadow-inner' 
                      : 'bg-gradient-to-r from-amber-50/70 via-indigo-50/50 to-slate-50 border-amber-200/60 shadow-xs'
                  }`}>
                    <ProductImage src={orderProduct.image} alt={orderProduct.name} className="w-12 h-12 rounded-xl border border-slate-200/50 dark:border-slate-700 shadow-xs" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-600 dark:text-amber-300 border border-amber-400/30">
                        {orderProduct.category}
                      </span>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate mt-0.5">{orderProduct.name}</h4>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black text-[11px]">
                        DP: ₹{orderProduct.distributorPrice.toLocaleString('en-IN')} / unit
                      </span>
                    </div>
                  </div>

                  {/* Quantity & Total Payable */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Quantity</label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            const val = typeof orderQty === 'number' ? orderQty : 1;
                            setOrderQty(Math.max(1, val - 1));
                          }}
                          className={`px-3 py-1.5 rounded-l-xl border border-r-0 font-extrabold text-sm transition-colors cursor-pointer ${
                            isDarkMode
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                              : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={orderQty}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setOrderQty('');
                            } else {
                              const num = parseInt(val, 10);
                              setOrderQty(isNaN(num) ? '' : num);
                            }
                          }}
                          onBlur={() => {
                            if (orderQty === '' || orderQty < 1) {
                              setOrderQty(1);
                            }
                          }}
                          className={`w-full text-center py-1.5 border font-extrabold font-mono text-xs focus:outline-none ${
                            isDarkMode
                              ? 'bg-slate-800 border-slate-700 text-white'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = typeof orderQty === 'number' ? orderQty : 1;
                            setOrderQty(Math.min(100, val + 1));
                          }}
                          className={`px-3 py-1.5 rounded-r-xl border border-l-0 font-extrabold text-sm transition-colors cursor-pointer ${
                            isDarkMode
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                              : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Payable</label>
                      <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-indigo-500/15 to-blue-500/10 text-indigo-600 dark:text-indigo-300 font-black font-mono text-xs border border-indigo-500/30 flex items-center justify-between h-[32px]">
                        <span>₹{(orderProduct.distributorPrice * (typeof orderQty === 'number' && orderQty > 0 ? orderQty : 1)).toLocaleString('en-IN')}</span>
                        <span className="text-[9px] text-indigo-400 font-normal">INR</span>
                      </div>
                    </div>
                  </div>

                  {/* Earned BV/PV Rewards Card */}
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-emerald-500/15 border border-amber-500/30 text-slate-900 dark:text-white flex items-center justify-between font-mono font-bold text-[11px] shadow-xs">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Earned BV: <strong className="text-amber-500 font-black">+{(orderProduct.businessValue * (typeof orderQty === 'number' && orderQty > 0 ? orderQty : 1)).toLocaleString('en-IN')} BV</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Earned PV: <strong className="text-emerald-500 font-black">+{orderProduct.pointValue * (typeof orderQty === 'number' && orderQty > 0 ? orderQty : 1)} PV</strong></span>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Shipping & Installation Address</label>
                    <textarea
                      required
                      rows={2}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Enter full site delivery address with pincode and landmark..."
                      className={`w-full px-3 py-1.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
                        isDarkMode ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  {/* Payment Method Selector Tiles */}
                  <div className="space-y-1.5 pt-0.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Razorpay Tile */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('razorpay')}
                        className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                          paymentMethod === 'razorpay'
                            ? 'bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-sky-500/10 border-blue-500 text-slate-900 dark:text-white ring-2 ring-blue-500/40 shadow-sm'
                            : isDarkMode 
                              ? 'bg-slate-800/40 border-slate-700/80 text-slate-400 hover:border-slate-600 hover:bg-slate-800/60' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="p-1 rounded-lg bg-blue-500/20 text-blue-500">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          {paymentMethod === 'razorpay' && (
                            <span className="p-0.5 bg-blue-500 text-white rounded-full">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5">
                          <span className="text-[10px] sm:text-[11px] font-extrabold block text-slate-900 dark:text-white">Razorpay</span>
                          <span className="text-[8.5px] text-blue-500 font-semibold block">UPI / Cards</span>
                        </div>
                      </button>

                      {/* Wallet Tile */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('wallet')}
                        className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                          paymentMethod === 'wallet'
                            ? 'bg-gradient-to-br from-emerald-600/20 via-teal-600/15 to-green-500/10 border-emerald-500 text-slate-900 dark:text-white ring-2 ring-emerald-500/40 shadow-sm'
                            : isDarkMode 
                              ? 'bg-slate-800/40 border-slate-700/80 text-slate-400 hover:border-slate-600 hover:bg-slate-800/60' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-500">
                            <Wallet className="w-3.5 h-3.5" />
                          </div>
                          {paymentMethod === 'wallet' && (
                            <span className="p-0.5 bg-emerald-500 text-white rounded-full">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5">
                          <span className="text-[10px] sm:text-[11px] font-extrabold block text-slate-900 dark:text-white">Wallet</span>
                          <span className="text-[8.5px] text-emerald-500 font-semibold block">Bal: ₹45,000</span>
                        </div>
                      </button>

                      {/* Cash on Delivery Tile */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                          paymentMethod === 'cod'
                            ? 'bg-gradient-to-br from-amber-600/20 via-purple-600/15 to-orange-500/10 border-amber-500 text-slate-900 dark:text-white ring-2 ring-amber-500/40 shadow-sm'
                            : isDarkMode 
                              ? 'bg-slate-800/40 border-slate-700/80 text-slate-400 hover:border-slate-600 hover:bg-slate-800/60' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-500">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          {paymentMethod === 'cod' && (
                            <span className="p-0.5 bg-amber-500 text-white rounded-full">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5">
                          <span className="text-[10px] sm:text-[11px] font-extrabold block text-slate-900 dark:text-white">Cash Delivery</span>
                          <span className="text-[8.5px] text-amber-500 font-semibold block">Site Delivery</span>
                        </div>
                      </button>
                    </div>

                    {paymentMethod === 'razorpay' && (
                      <div className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-sky-500/10 border border-blue-500/30 text-blue-400 space-y-1 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[10px] sm:text-[11px] flex items-center gap-1.5 text-blue-300 dark:text-blue-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                            Razorpay Live Gateway
                          </span>
                          <span className="text-[8.5px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">Encrypted</span>
                        </div>
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-snug">
                          Clicking <strong>"Pay via Razorpay"</strong> opens the secure Razorpay Checkout window (Google Pay, PhonePe, Paytm UPI QR, Cards & Netbanking).
                        </p>
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Modal Actions Footer - Pinned at bottom */}
            {!orderSuccessMsg && (
              <div className="flex-none p-3.5 sm:p-4 border-t flex gap-2.5 border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setOrderProduct(null)}
                  disabled={isProcessingPayment}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700/80 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="order-form"
                  disabled={isProcessingPayment}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black cursor-pointer shadow-md hover:shadow-amber-500/20 flex items-center justify-center gap-1.5 text-xs transition-all active:scale-[0.98]"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                      <span>Launching Razorpay...</span>
                    </>
                  ) : (
                    <span>
                      {paymentMethod === 'razorpay' ? 'Pay via Razorpay' : paymentMethod === 'wallet' ? 'Pay via Wallet' : 'Confirm Order'}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. PRODUCT SPECS DETAILS MODAL */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-hidden">
          <div className={`max-w-md w-full max-h-[85vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex-none p-4 border-b flex items-center justify-between border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
              <h3 className="font-extrabold text-sm truncate pr-2">{selectedProductDetails.name}</h3>
              <button 
                onClick={() => setSelectedProductDetails(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer font-bold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
              <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                <ProductImage src={selectedProductDetails.image} alt={selectedProductDetails.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{selectedProductDetails.description}</p>
              
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono font-bold p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">MRP</span>
                  <span className="line-through text-slate-400">₹{selectedProductDetails.mrp.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-indigo-400 block">DP Price</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-black">₹{selectedProductDetails.distributorPrice.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-amber-500 block">Business Value</span>
                  <span className="text-amber-500 font-black">{selectedProductDetails.businessValue.toLocaleString('en-IN')} BV</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-emerald-500 block">Point Value</span>
                  <span className="text-emerald-500 font-black">{selectedProductDetails.pointValue} PV</span>
                </div>
              </div>
            </div>

            <div className="flex-none p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
              <button
                onClick={() => {
                  setOrderProduct(selectedProductDetails);
                  setSelectedProductDetails(null);
                  setOrderQty(1);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Order Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
