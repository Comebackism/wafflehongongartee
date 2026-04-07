"use client";

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchMenus, submitOrder, MenuItem, OrderItem } from '@/lib/firebase/api';
import { 
  Coffee, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Check, 
  Loader2 
} from 'lucide-react';

function OrderApp() {
  const searchParams = useSearchParams();
  const tableOrQueue = searchParams.get('table') || searchParams.get('queue') || 'หน้าร้าน (Walk-in)';

  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<{id: string, name: string} | null>(null);
  const [customerName, setCustomerName] = useState('');

  // For modal / bottom sheet to select toppings
  const [selectedWaffle, setSelectedWaffle] = useState<MenuItem | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetchMenus().then((data) => {
      setMenus(data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
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
      setOrderComplete({ id: orderId, name: finalName });
      setCart([]);
      setCustomerName('');
    } catch(err) {
      alert("ไม่สามารถส่งออเดอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
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
        <button 
          onClick={() => setOrderComplete(null)} 
          className="mt-8 text-red-600 font-semibold hover:text-red-700 transition"
        >
          สั่งอะไรเพิ่มอีกไหม?
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40 font-sans selection:bg-red-200 selection:text-red-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-6 py-5 shadow-sm border-b border-red-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-red-700 tracking-tight uppercase">Artee Waffle Hongkong</h1>
            <div className="mt-1 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{tableOrQueue}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-red-50 p-3 text-red-600 shadow-inner">
            <Coffee className="h-6 w-6" />
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
