"use client";

import { useState } from 'react';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';
import { updateOrderStatus, OrderStatus, Order } from '@/lib/firebase/api';
import { Clock, ChefHat, CheckCircle2, Utensils, AlertCircle } from 'lucide-react';

export default function KitchenDashboard() {
  const { orders, loading, error } = useKitchenOrders();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setUpdating(orderId);
      await updateOrderStatus(orderId, nextStatus);
    } catch(err) {
      alert("อัปเดตสถานะล้มเหลว");
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-500 animate-pulse">กำลังโหลดระบบหลังครัว...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle />
          <span>เกิดข้อผิดพลาดในการโหลดออเดอร์</span>
        </div>
      </div>
    );
  }

  const pending = orders.filter(o => o.status === 'pending');
  const cooking = orders.filter(o => o.status === 'cooking');
  const ready = orders.filter(o => o.status === 'ready');

  const OrderCard = ({ order, nextStatus, nextLabel, icon: Icon, bgColor }: { order: any, nextStatus: OrderStatus, nextLabel: string, icon: any, bgColor: string }) => (
    <div className={`mb-4 rounded-xl border p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${bgColor}`}>
      <div className="mb-3 flex items-start justify-between">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="rounded-lg bg-gray-900/5 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-gray-900 shadow-sm border border-black/5">
               {order.tableOrQueue}
             </span>
             <span className="font-bold text-gray-800">{order.customerName || 'ไม่ระบุชื่อ'}</span>
           </div>
           <div className="mt-1 text-xs font-semibold text-gray-500">
             {order.createdAt.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} น.
           </div>
        </div>
        <div className="text-right text-xl font-black text-gray-900">
          {order.totalPrice} บาท
        </div>
      </div>

      <div className="mb-5 space-y-2 border-t border-black/10 pt-4">
        {order.items.map((item: any, idx: number) => (
           <div key={idx} className="flex justify-between text-sm">
              <div className="font-semibold text-gray-800">
                 {item.quantity}x {item.name}
                 {item.toppings?.length > 0 && (
                   <div className="text-xs text-black/50 pl-5 mt-1 font-medium">
                     + {item.toppings.map((t:any) => t.name).join(', ')}
                   </div>
                 )}
              </div>
           </div>
        ))}
      </div>

      <button 
        disabled={updating === order.id}
        onClick={() => handleUpdateStatus(order.id, nextStatus)}
        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-gray-800 disabled:opacity-50"
      >
        <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
            <div className="relative h-full w-8 bg-white/10" />
        </div>
        <Icon className="h-4 w-4" />
        {updating === order.id ? 'กำลังอัปเดต...' : nextLabel}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 font-sans selection:bg-red-200">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-red-700 tracking-tight">ระบบจัดการหลังครัว (Waffle Tee Ob)</h1>
          <p className="text-gray-500 mt-2 font-medium">คิวออเดอร์วาฟเฟิลแบบเรียลไทม์</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700 shadow-sm border border-green-200">
           <span className="relative flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
           </span>
           ระบบเชื่อมต่อปกติ
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3 lg:gap-8 items-start h-[calc(100vh-140px)]">
        {/* Pending Column */}
        <div className="flex flex-col h-full rounded-3xl bg-red-50/70 p-5 shadow-inner border border-red-100">
          <div className="mb-6 flex items-center justify-between pb-2 text-red-900 border-b-2 border-red-200/60">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                    <Clock className="h-6 w-6 text-red-700" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black">ออเดอร์ใหม่</h2>
            </div>
            <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white shadow-md shadow-red-600/30">{pending.length}</span>
          </div>
          <div className="flex-1 overflow-auto pr-2 pb-6" style={{scrollbarWidth: 'none'}}>
            {pending.map(o => (
               <OrderCard 
                 key={o.id} 
                 order={o} 
                 nextStatus="cooking" 
                 nextLabel="เริ่มทำ" 
                 icon={ChefHat} 
                 bgColor="bg-white border-red-200 shadow-red-100/30" 
               />
            ))}
            {pending.length === 0 && <p className="text-center text-red-400 font-medium italic mt-10">ไม่มีออเดอร์ใหม่</p>}
          </div>
        </div>

        {/* Cooking Column */}
        <div className="flex flex-col h-full rounded-3xl bg-orange-50 p-5 shadow-inner border border-orange-100">
          <div className="mb-6 flex items-center justify-between pb-2 text-orange-900 border-b-2 border-orange-200/60">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                    <ChefHat className="h-6 w-6 text-orange-700" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black">กำลังทำ</h2>
            </div>
            <span className="rounded-full bg-orange-500 px-3 py-1 text-sm font-bold text-white shadow-md shadow-orange-500/30">{cooking.length}</span>
          </div>
          <div className="flex-1 overflow-auto pr-2 pb-6" style={{scrollbarWidth: 'none'}}>
            {cooking.map(o => (
               <OrderCard 
                 key={o.id} 
                 order={o} 
                 nextStatus="ready" 
                 nextLabel="ทำเสร็จแล้ว" 
                 icon={CheckCircle2} 
                 bgColor="bg-white border-orange-200 shadow-orange-100/30" 
               />
            ))}
            {cooking.length === 0 && <p className="text-center text-orange-400 font-medium italic mt-10">ไม่มีออเดอร์ทีกำลังทำ</p>}
          </div>
        </div>

        {/* Ready Column */}
        <div className="flex flex-col h-full rounded-3xl bg-green-50 p-5 shadow-inner border border-green-100">
          <div className="mb-6 flex items-center justify-between pb-2 text-green-900 border-b-2 border-green-200/60">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                    <Utensils className="h-6 w-6 text-green-700" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black">พร้อมเสิร์ฟ</h2>
            </div>
            <span className="rounded-full bg-green-600 px-3 py-1 text-sm font-bold text-white shadow-md shadow-green-600/30">{ready.length}</span>
          </div>
          <div className="flex-1 overflow-auto pr-2 pb-6" style={{scrollbarWidth: 'none'}}>
            {ready.map(o => (
               <OrderCard 
                 key={o.id} 
                 order={o} 
                 nextStatus="served" 
                 nextLabel="เสิร์ฟเรียบร้อย" 
                 icon={CheckCircle2} 
                 bgColor="bg-white border-green-200 shadow-green-100/30" 
               />
            ))}
            {ready.length === 0 && <p className="text-center text-green-500 font-medium italic mt-10">ไม่มีออเดอร์รอเสิร์ฟ</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
