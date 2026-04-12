"use client";

import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchMenus, submitOrder, fetchMyOrders, saveMyOrderId, getMyOrderIds, MenuItem, OrderItem, Order } from '@/lib/firebase/api';
import WaffleIcon from '@/components/WaffleIcon';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Check, 
  Loader2,
  ClipboardList,
  X,
  Clock,
  ChefHat,
  UtensilsCrossed,
  CheckCircle2,
  Package,
  RefreshCw
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: 'รอรับออเดอร์', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200', icon: Clock },
  cooking: { label: 'กำลังทำ', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200', icon: ChefHat },
  ready: { label: 'พร้อมเสิร์ฟ', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200', icon: UtensilsCrossed },
  served: { label: 'เสิร์ฟแล้ว', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: CheckCircle2 },
  cancelled: { label: 'ยกเลิก', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', icon: X },
};

function OrderApp() {
  const searchParams = useSearchParams();
  const tableOrQueue = searchParams.get('table') || searchParams.get('queue') || 'หน้าร้าน (Walk-in)';

  const [menus, setMenus] = useState<MenuItem[]>([
    { id: 'm1', name: 'แป้ง original', description: 'วาฟเฟิลฮ่องกง แป้งกรอบนอกนุ่มใน คลาสสิกสุดๆ', price: 30, category: 'waffle' },
    { id: 's1', name: 'ชีส', description: '', price: 5, category: 'savory' },
    { id: 's2', name: 'ปูอัด', description: '', price: 5, category: 'savory' },
    { id: 's3', name: 'ไส้กรอก', description: '', price: 5, category: 'savory' },
    { id: 's4', name: 'แฮม', description: '', price: 5, category: 'savory' },
    { id: 'sw1', name: 'โอริโอ้', description: '', price: 5, category: 'sweet' },
    { id: 'sw2', name: 'ฝอยทอง', description: '', price: 5, category: 'sweet' },
    { id: 'sw3', name: 'กล้วย', description: '', price: 5, category: 'sweet' },
    { id: 'sw4', name: 'ช็อกโกแลตชิพ', description: '', price: 5, category: 'sweet' },
    { id: 'sw5', name: 'ไวท์ช็อกโกแลต', description: '', price: 5, category: 'sweet' },
  ]); // แสดงทันที ไม่ต้องรอ loader
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<{id: string, name: string} | null>(null);
  const [customerName, setCustomerName] = useState('');

  // For modal / bottom sheet to select toppings
  const [selectedWaffle, setSelectedWaffle] = useState<MenuItem | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<MenuItem[]>([]);

  // My Orders state
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);
  const [myOrderCount, setMyOrderCount] = useState(0);

  useEffect(() => {
    // ถ้าต่อ Firebase จริง ให้ดึงและอัปเดทเมนูใน background
    const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (isFirebaseConfigured) {
      fetchMenus().then(setMenus).catch(console.error);
    }
    // Load order count from localStorage
    setMyOrderCount(getMyOrderIds().length);
  }, []);

  const waffles = useMemo(() => menus.filter(m => m.category === 'waffle'), [menus]);
  const savoryList = useMemo(() => menus.filter(m => m.category === 'savory'), [menus]);
  const sweetList = useMemo(() => menus.filter(m => m.category === 'sweet'), [menus]);
  
  const cartTotalAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price + item.toppings.reduce((a, t) => a + t.price, 0), 0);
  }, [cart]);

  const handleWaffleClick = (waffle: MenuItem) => {
    setSelectedWaffle(waffle);
    setSelectedToppings([]);
  };

  const toggleTopping = (topping: MenuItem) => {
    if (selectedToppings.find(t => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter(t => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const addToCart = () => {
    if (!selectedWaffle) return;
    const newItem: OrderItem = {
      menuId: selectedWaffle.id,
      name: selectedWaffle.name,
      price: selectedWaffle.price,
      quantity: 1,
      toppings: selectedToppings
    };
    setCart([...cart, newItem]);
    setSelectedWaffle(null);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const submit = async () => {
    if (cart.length === 0 || !customerName.trim()) return;
    setIsSubmitting(true);
    
    // Calculate total
    let total = cartTotalAmount;

    try {
      const finalName = customerName.trim() || 'ไม่ระบุชื่อ';
      const orderId = await submitOrder({
        items: cart,
        totalPrice: total,
        tableOrQueue: tableOrQueue,
        customerName: finalName
      });
      // Save order ID for "My Orders" tracking
      saveMyOrderId(orderId);
      setMyOrderCount(getMyOrderIds().length);
      setOrderComplete({ id: orderId, name: finalName });
      setCart([]);
      setCustomerName('');
    } catch(err) {
      alert("ไม่สามารถส่งออเดอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadMyOrders = useCallback(async () => {
    setMyOrdersLoading(true);
    try {
      const orders = await fetchMyOrders();
      setMyOrders(orders);
    } catch (err) {
      console.error('Error loading my orders:', err);
    } finally {
      setMyOrdersLoading(false);
    }
  }, []);

  const handleOpenMyOrders = () => {
    setShowMyOrders(true);
    loadMyOrders();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white p-6 text-center">
        <div className="mb-6 rounded-full bg-red-50 p-6 text-red-600 shadow-lg shadow-red-100">
          <Check className="h-12 w-12" />
        </div>
        <h1 className="mb-2 text-3xl font-extrabold text-gray-900 tracking-tight">ได้รับออเดอร์แล้ว!</h1>
        <p className="mb-8 text-gray-600 text-lg">ออเดอร์ของคุณถูกส่งไปยังห้องครัวแล้ว กรุณารอสักครู่นะครับ</p>
        <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white px-8 py-6 shadow-xl shadow-red-50">
           <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">ออเดอร์ของคุณ</p>
           <p className="mt-1 text-2xl font-black text-gray-900">{orderComplete.name}</p>
           <div className="mt-4 pt-4 border-t border-gray-100">
             <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">รหัสออเดอร์</p>
             <p className="mt-1 font-mono text-lg font-bold text-red-600">{orderComplete.id}</p>
           </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-3">
          <button 
            onClick={() => setOrderComplete(null)} 
            className="text-red-600 font-semibold hover:text-red-700 transition"
          >
            สั่งอะไรเพิ่มอีกไหม?
          </button>
          <button 
            onClick={() => { setOrderComplete(null); handleOpenMyOrders(); }} 
            className="flex items-center gap-2 text-gray-500 font-medium hover:text-gray-700 transition text-sm"
          >
            <ClipboardList className="h-4 w-4" />
            ดูออเดอร์ทั้งหมดของฉัน
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40 font-sans selection:bg-red-200 selection:text-red-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-6 py-5 shadow-sm border-b border-red-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-red-700 tracking-tight uppercase">Waffle Tee Ob</h1>
            <div className="mt-1 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{tableOrQueue}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* My Orders Button */}
            <button
              id="my-orders-btn"
              onClick={handleOpenMyOrders}
              className="relative flex items-center gap-1.5 rounded-xl bg-gray-50 px-3 py-2 text-sm font-bold text-gray-600 transition-all hover:bg-red-50 hover:text-red-600 active:scale-95 border border-gray-100 hover:border-red-200"
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">ออเดอร์ของฉัน</span>
              {myOrderCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-md shadow-red-200">
                  {myOrderCount}
                </span>
              )}
            </button>
            <WaffleIcon size={32} className="text-red-600" />
          </div>
        </div>
      </header>

      {/* Menu List */}
      <main className="p-6 mx-auto max-w-3xl">
        <h2 className="mb-6 text-xl font-bold text-gray-800 flex items-center gap-2">
            เมนูแนะนำสำหรับคุณ
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          {waffles.map(waffle => (
            <div 
              key={waffle.id} 
              onClick={() => handleWaffleClick(waffle)}
              className="group flex cursor-pointer items-center justify-between rounded-3xl border border-white bg-white p-5 shadow-lg shadow-gray-200/40 transition-all hover:-translate-y-1 hover:border-red-200 hover:shadow-red-100/60"
            >
              <div className="pr-4">
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-red-600 transition-colors">{waffle.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500 line-clamp-2">{waffle.description}</p>
                <div className="mt-3 inline-block rounded-lg bg-red-50 px-3 py-1 font-bold text-red-600">
                    {waffle.price} บาท
                </div>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-red-600 group-hover:text-white transition-all">
                  <Plus className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Summary Header/Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-20px_60px_-15px_rgba(255,0,0,0.08)] rounded-t-[2.5rem] border-t border-gray-100">
          <div className="max-w-3xl mx-auto p-6 md:p-8">
            <div className="mb-6 max-h-[30vh] overflow-y-auto pr-2">
              {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center mb-4">
                      <div className="flex flex-col">
                          <span className="font-bold text-gray-800">{item.name}</span>
                          {item.toppings.length > 0 && (
                              <span className="text-sm text-red-500 font-medium">+ {item.toppings.map(t => t.name).join(', ')}</span>
                          )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-gray-900">
                            {item.price + item.toppings.reduce((a, t) => a + t.price, 0)} บาท
                        </span>
                        <button onClick={() => removeFromCart(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                            <Minus className="h-4 w-4" />
                        </button>
                      </div>
                  </div>
              ))}
            </div>

            <div className="mb-5 flex items-center justify-between border-t border-gray-100 pt-5">
                <span className="font-bold text-gray-500 uppercase tracking-widest text-sm">ยอดชำระทั้งหมด</span>
                <span className="text-3xl font-black text-red-600">
                {cartTotalAmount} บาท
                </span>
            </div>
            
            <div className="mb-6">
               <input 
                 type="text" 
                 placeholder="พิมพ์ชื่อของคุณ (เช่น คุณเอมมี่)" 
                 value={customerName}
                 onChange={(e) => setCustomerName(e.target.value)}
                 className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 font-semibold text-gray-900 outline-none transition duration-200 focus:border-red-500 focus:bg-white"
               />
            </div>

            <button 
                onClick={submit}
                disabled={isSubmitting || !customerName.trim()}
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-red-600 py-4 font-bold text-white shadow-xl shadow-red-600/20 transition-all hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:pointer-events-none disabled:shadow-none active:scale-[0.98]"
            >
                {customerName.trim() && !isSubmitting && (
                  <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                      <div className="relative h-full w-8 bg-white/20" />
                  </div>
                )}
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> : (
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        <span className="text-lg">{!customerName.trim() ? "กรุณากรอกชื่อเพื่อสั่งซื้อ" : "ยืนยันการสั่งซื้อ"}</span>
                    </div>
                )}
            </button>
          </div>
        </div>
      )}

      {/* Waffle Customization Modal */}
      {selectedWaffle && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-gray-900/60 backdrop-blur-sm p-4 transition-all md:items-center md:justify-center">
            {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setSelectedWaffle(null)}></div>
          
          <div className="relative w-full max-w-md animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-300 rounded-[2rem] bg-white p-6 shadow-2xl md:p-8">
            <div className="absolute right-6 top-6">
                <button onClick={() => setSelectedWaffle(null)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors">
                    <Minus className="h-4 w-4" />
                </button>
            </div>
            <h2 className="pr-12 text-2xl font-extrabold text-gray-900">{selectedWaffle.name}</h2>
            <p className="mt-2 text-xl font-bold text-red-600">{selectedWaffle.price} บาท</p>
            
            <div className="my-8 max-h-[40vh] overflow-y-auto pr-2">
              {savoryList.length > 0 && (
                 <div className="mb-6">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-red-500 bg-red-50 py-1 px-3 rounded-md inline-block">ไส้คาว</h3>
                    <div className="space-y-3">
                      {savoryList.map(topping => {
                        const isSelected = selectedToppings.find(t => t.id === topping.id);
                        return (
                          <label 
                            key={topping.id} 
                            onClick={(e) => {
                              e.preventDefault();
                              toggleTopping(topping);
                            }}
                            className={`group flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 transition-all ${isSelected ? 'border-red-500 bg-red-50/50' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                          >
                            <div className="flex items-center gap-4">
                               <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200 ${isSelected ? 'border-red-500 bg-red-500 shadow-md shadow-red-500/30' : 'border-gray-300 bg-white group-hover:border-red-300'}`}>
                                 <Check className={`h-4 w-4 text-white transition-transform ${isSelected ? 'scale-100' : 'scale-0'}`} strokeWidth={3} />
                               </div>
                               <div className="flex flex-col">
                                  <span className={`font-semibold transition-colors ${isSelected ? 'text-red-900' : 'text-gray-700'}`}>{topping.name}</span>
                               </div>
                            </div>
                            <span className={`font-bold transition-colors ${isSelected ? 'text-red-600' : 'text-gray-500'}`}>+ {topping.price} บาท</span>
                          </label>
                        )
                      })}
                    </div>
                 </div>
              )}

              {sweetList.length > 0 && (
                 <div className="mb-6">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-orange-500 bg-orange-50 py-1 px-3 rounded-md inline-block">ไส้หวาน</h3>
                    <div className="space-y-3">
                      {sweetList.map(topping => {
                        const isSelected = selectedToppings.find(t => t.id === topping.id);
                        return (
                          <label 
                            key={topping.id} 
                            onClick={(e) => {
                              e.preventDefault();
                              toggleTopping(topping);
                            }}
                            className={`group flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 transition-all ${isSelected ? 'border-orange-500 bg-orange-50/50' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                          >
                            <div className="flex items-center gap-4">
                               <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200 ${isSelected ? 'border-orange-500 bg-orange-500 shadow-md shadow-orange-500/30' : 'border-gray-300 bg-white group-hover:border-orange-300'}`}>
                                 <Check className={`h-4 w-4 text-white transition-transform ${isSelected ? 'scale-100' : 'scale-0'}`} strokeWidth={3} />
                               </div>
                               <div className="flex flex-col">
                                  <span className={`font-semibold transition-colors ${isSelected ? 'text-orange-900' : 'text-gray-700'}`}>{topping.name}</span>
                               </div>
                            </div>
                            <span className={`font-bold transition-colors ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>+ {topping.price} บาท</span>
                          </label>
                        )
                      })}
                    </div>
                 </div>
              )}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={addToCart}
                className="flex-1 rounded-2xl bg-gray-900 py-4 font-bold text-white shadow-xl shadow-gray-900/20 transition-all hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98]"
              >
                เพิ่มเมนู — {selectedWaffle.price + selectedToppings.reduce((a, t) => a + t.price, 0)} บาท
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== My Orders Panel ===== */}
      {showMyOrders && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-gray-900/60 backdrop-blur-sm transition-all md:items-center md:justify-center">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setShowMyOrders(false)}></div>

          <div className="relative w-full max-w-lg animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-300 rounded-t-[2rem] md:rounded-[2rem] bg-white shadow-2xl flex flex-col max-h-[85vh]">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 md:px-8 shrink-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">ออเดอร์ของฉัน</h2>
                  <p className="text-xs font-medium text-gray-400 mt-0.5">{myOrders.length} รายการ</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadMyOrders}
                  disabled={myOrdersLoading}
                  className="rounded-full bg-gray-50 p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
                  title="รีเฟรช"
                >
                  <RefreshCw className={`h-4 w-4 ${myOrdersLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowMyOrders(false)}
                  className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 md:px-8" style={{ scrollbarWidth: 'none' }}>
              {myOrdersLoading && myOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-red-400 mb-4" />
                  <p className="text-gray-400 font-medium">กำลังโหลดออเดอร์...</p>
                </div>
              ) : myOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="rounded-full bg-gray-100 p-6 mb-4">
                    <ClipboardList className="h-10 w-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-bold text-lg">ยังไม่มีออเดอร์</p>
                  <p className="text-gray-400 text-sm mt-1">เริ่มสั่งวาฟเฟิลกันเลย!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map((order) => {
                    const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                      >
                        {/* Order Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-800">{order.customerName}</span>
                              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border border-gray-200">
                                {order.tableOrQueue}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 font-medium">
                              {order.createdAt instanceof Date
                                ? order.createdAt.toLocaleString('th-TH', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </p>
                          </div>
                          {/* Status Badge */}
                          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${statusInfo.bgColor}`}>
                            <StatusIcon className={`h-3.5 w-3.5 ${statusInfo.color}`} />
                            <span className={`text-xs font-bold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="border-t border-gray-50 pt-3 space-y-2">
                          {order.items.map((item: OrderItem, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <div>
                                <span className="font-semibold text-gray-700">
                                  {item.quantity}x {item.name}
                                </span>
                                {item.toppings?.length > 0 && (
                                  <p className="text-xs text-gray-400 font-medium pl-4 mt-0.5">
                                    + {item.toppings.map((t) => t.name).join(', ')}
                                  </p>
                                )}
                              </div>
                              <span className="font-bold text-gray-600 shrink-0">
                                {item.price + (item.toppings?.reduce((a, t) => a + t.price, 0) || 0)} ฿
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Total */}
                        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ยอดรวม</span>
                          <span className="text-lg font-black text-red-600">{order.totalPrice} บาท</span>
                        </div>

                        {/* Order ID */}
                        <div className="mt-2 flex justify-end">
                          <span className="font-mono text-[10px] text-gray-300">#{order.id}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>}>
      <OrderApp />
    </Suspense>
  );
}
