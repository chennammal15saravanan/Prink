import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import type { Order } from '../types';
import mainLogo from '../assets/logos/main-logo.png';
import UploadScreen from './UploadScreen';

// Comprehensive product image map keyed by SKU
// These are reference product photos shown on the card grid – NOT customer uploads
const SKU_PRODUCT_IMAGES: Record<string, string> = {
  // ── Mugs ──
  'MUG-WHT-11OZ':    'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop',
  'MUG-BLK-11OZ':    'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?q=80&w=800&auto=format&fit=crop',
  'MUG-MAGIC-15OZ':  'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=800&auto=format&fit=crop',
  'PRK-MUG-CLASSIC': 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop',
  'PRK-MUG-MAGIC':   'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=800&auto=format&fit=crop',
  // ── T-Shirts ──
  'TSH-WHT-L':        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
  'TSH-BLK-L':        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=800&auto=format&fit=crop',
  'PRK-TSHIRT-WHITE': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
  'PRK-TSHIRT-BLACK': 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=800&auto=format&fit=crop',
  // ── Tote Bags ──
  'BAG-CAN-001':      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop',
  'PRK-BAG-CANVAS':   'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop',
  // ── Phone Cases ──
  'CAS-IP14-PRO':     'https://images.unsplash.com/photo-1580870013141-3b13c510006b?q=80&w=800&auto=format&fit=crop',
  'CAS-IP15-PRO':     'https://images.unsplash.com/photo-1580870013141-3b13c510006b?q=80&w=800&auto=format&fit=crop',
  'PRK-CASE-IP15P':   'https://images.unsplash.com/photo-1580870013141-3b13c510006b?q=80&w=800&auto=format&fit=crop',
  // ── Photo Frames ──
  'FRM-WDN-8X10':     'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop',
  'FRM-BLK-11X14':    'https://images.unsplash.com/photo-1618220048851-db15a46e62b4?q=80&w=800&auto=format&fit=crop',
  'PRK-FRM-810':      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop',
  // ── Canvas Prints ──
  'CANVAS-12X16':     'https://images.unsplash.com/photo-1578926078693-4d2d93e74e78?q=80&w=800&auto=format&fit=crop',
  'CANVAS-16X20':     'https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=800&auto=format&fit=crop',
  'PRK-CANVAS-1216':  'https://images.unsplash.com/photo-1578926078693-4d2d93e74e78?q=80&w=800&auto=format&fit=crop',
  // ── Desk Calendars ──
  'CAL-DESK-2026':    'https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=800&auto=format&fit=crop',
  'PRK-CAL-2026':     'https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=800&auto=format&fit=crop',
  // ── Photo Books ──
  'BOOK-HC-20P':      'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop',
  'PRK-BOOK-20P':     'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop',
  // ── Pillows ──
  'PIL-SOFT-18X18':   'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop',
  'PRK-PIL-SOFT':     'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop',
  // ── Keychains ──
  'KEY-ACR-001':      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=800&auto=format&fit=crop',
};

/** Returns the product reference image to display on cards.
 *  Priority: order.productImage → SKU map.
 *  Customer-uploaded photos (images[]) are intentionally NOT used here
 *  so the card always shows the product, not what the customer uploaded.
 */
const getCardImage = (order: { productImage?: string; sku?: string }): string | null => {
  if (order.productImage && order.productImage.startsWith('http')) return order.productImage;
  if (order.sku && SKU_PRODUCT_IMAGES[order.sku]) return SKU_PRODUCT_IMAGES[order.sku];
  return null;
};

// Product Card Image with graceful loading error state fallback
const ProductCardImage = ({ order, alt }: { order: any; alt: string }) => {
  const [hasError, setHasError] = useState(false);
  const imgSrc = getCardImage(order);

  if (imgSrc && !hasError) {
    return (
      <img
        src={imgSrc}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 space-y-3">
      <Package size={56} strokeWidth={1} />
      <span className="text-sm font-medium">No Image</span>
    </div>
  );
};

export default function CustomerPortal() {
  const { orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic progress metrics calculation
  const completedDesignsCount = orders.filter(
    o => o.uploadStatus === 'ready' || 
         o.customizationStatus === 'completed' || 
         o.customizationStatus === 'in-progress'
  ).length;
  
  const progressPercentage = orders.length > 0 
    ? Math.round((completedDesignsCount / orders.length) * 100) 
    : 0;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/orders/public/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : [data]);
      } else {
        setError("Order not found or link has expired.");
      }
    } catch (err) {
        console.error(err);
        setError("Failed to load order. Please try again.");
      } finally {
        setLoading(false);
      }
  };
  
  useEffect(() => {
    if (orderId) {
      fetchOrders();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F9FC]">
        <div className="flex flex-col items-center gap-4">
          <img src={mainLogo} alt="Prink" className="h-12 w-auto animate-pulse" />
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-gray-500 font-medium">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (error || orders.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F9FC] p-6">
        <div className="saas-card max-w-md w-full p-8 text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-8">{error || "We couldn't find any products associated with this link."}</p>
          <button className="saas-button-primary w-full">Contact Support</button>
        </div>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <UploadScreen 
        orderId={selectedOrder.id}
        orderInfo={selectedOrder} 
        onBack={() => {
          setSelectedOrder(null);
          fetchOrders();
        }} 
        onComplete={() => {
          setSelectedOrder(null);
          fetchOrders();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans selection:bg-primary selection:text-white relative overflow-hidden">
      {/* Decorative Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[50%] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
      
      {/* Premium Glassmorphism Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-gray-200/60 shadow-sm transition-all duration-300">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src={mainLogo} alt="Prink" className="h-7 w-auto" />
            <div className="hidden sm:block h-6 w-px bg-gray-300 rounded-full"></div>
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-full">
              <Package size={16} className="text-gray-400" />
              Order #{orderId}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="sm:hidden text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
              #{orderId}
            </div>
            <a href="#" className="hidden sm:inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors duration-200">
              Contact Support
            </a>
            <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center text-primary cursor-pointer hover:bg-primary/10 transition-colors">
              <span className="text-sm font-bold">{orderId?.slice(-2) || 'PR'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-16 sm:py-24 relative z-10">
        {/* Elegant Hero Section */}
        <div className="mb-12 text-center max-w-3xl mx-auto space-y-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block py-1.5 px-4 rounded-full bg-primary/10 text-primary font-bold text-sm tracking-widest uppercase mb-4 shadow-sm border border-primary/20">
              Order #{orderId}
            </span>
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Personalize Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Products</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto font-medium">
            Select an item from your order below to launch the design studio and create your custom artwork.
          </p>
        </div>

        {/* Order Progress Tracker */}
        <div className="max-w-3xl mx-auto mb-8 bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Design Progress</h3>
              <p className="text-sm text-gray-500 font-medium">Complete designs for all items to proceed to printing.</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-primary">{completedDesignsCount}</span>
              <span className="text-gray-400 font-semibold text-lg">/{orders.length}</span>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage || 5}%` }}
              className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
            ></motion.div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-12 relative">
          <input
            type="text"
            placeholder="Search items by product name, SKU, or status (e.g. pending)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-4 pl-12 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700"
          />
          <div className="absolute left-4 top-4.5 text-gray-400 flex items-center h-full">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
        </div>

        {/* Polished Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {orders.filter(order => 
              order.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (order.sku && order.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (order.customizationStatus && order.customizationStatus.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (order.uploadStatus && order.uploadStatus.toLowerCase().includes(searchQuery.toLowerCase()))
            ).map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="bg-white rounded-3xl overflow-hidden group cursor-pointer flex flex-col shadow-premium hover:shadow-premium-hover border border-gray-100/80 transition-all duration-300"
                onClick={() => setSelectedOrder(order)}
              >
                {/* Image Container with Inner Border & Badge */}
                <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden border-b border-gray-100">
                  <ProductCardImage order={order} alt={order.product} />

                  {/* Hover Details Overlay */}
                  <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-6 text-center z-20">
                    <div className="bg-white/10 p-4 rounded-2xl w-full max-w-[220px] shadow-2xl border border-white/20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                      <h4 className="text-white font-bold mb-3 border-b border-white/20 pb-2 text-sm uppercase tracking-wider">Product Info</h4>
                      <div className="space-y-2 text-sm text-white/90">
                        <div className="flex justify-between items-center text-left">
                          <span className="text-white/60 text-xs">Customer</span>
                          <span className="font-medium text-right line-clamp-1 truncate ml-2">{order.customer}</span>
                        </div>
                        <div className="flex justify-between items-center text-left">
                          <span className="text-white/60 text-xs">Ordered On</span>
                          <span className="font-medium text-right">{order.date}</span>
                        </div>
                        <div className="flex justify-between items-center text-left">
                          <span className="text-white/60 text-xs">Target DPI</span>
                          <span className="font-medium text-right">{order.dpi}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-5 left-5">
                    {order.customizationStatus === 'completed' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wide rounded-lg shadow-sm border border-green-100 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Ready to Print
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-gray-700 text-xs font-bold uppercase tracking-wide rounded-lg shadow-sm border border-gray-200/50 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Needs Design
                      </span>
                    )}
                  </div>
                  
                  {/* Quantity Badge */}
                  <div className="absolute top-5 right-5">
                    <span className="inline-flex items-center px-2.5 py-1.5 bg-gray-900/80 text-white text-xs font-bold tracking-wide rounded-lg shadow-sm backdrop-blur-md">
                      Qty: {order.quantity || 1}
                    </span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-7 flex-1 flex flex-col">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                      SKU: {order.sku}
                    </span>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{order.productType}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mt-2 mb-6 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {order.product}
                  </h3>
                  
                  {/* Action Button */}
                  <div className="mt-auto">
                    <button className="w-full py-3.5 px-5 bg-gray-50 border border-gray-100 hover:bg-primary hover:border-primary hover:text-white text-gray-700 font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-primary/20">
                      Upload Photos
                      <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
