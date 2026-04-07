"use client";

import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Order } from '@/lib/firebase/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { Loader2, TrendingUp, DollarSign, Calendar, RefreshCcw, ShoppingBag } from 'lucide-react';
import { format, subDays, startOfDay, isSameDay, startOfMonth, isSameMonth, parseISO, startOfYear, isSameYear, subMonths, subYears } from 'date-fns';
import { th } from 'date-fns/locale';

export default function SalesDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  const loadData = async () => {
    setLoading(true);
    const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!isFirebaseConfigured) {
      // Mock / Offline Data Load
      const raw = localStorage.getItem('localOrders');
      if (raw) {
        const parsed = JSON.parse(raw).map((o: any) => ({
          ...o,
           createdAt: new Date(o.createdAt)
        }));
        setOrders(parsed);
      }
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'orders'));
      const snapshot = await getDocs(q);
      const data: Order[] = [];
      snapshot.forEach(doc => {
        data.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        } as Order);
      });
      setOrders(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Only count orders that aren't cancelled
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const today = new Date();

  // --- Aggregation Logic ---
  
  // 1. Daily (Last 7 Days)
  const getDailyData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const targetDate = subDays(today, i);
        const dayOrders = validOrders.filter(o => isSameDay(o.createdAt, targetDate));
        const total = dayOrders.reduce((sum, o) => sum + o.totalPrice, 0);
        data.push({
            name: format(targetDate, 'EEE d', { locale: th }),
            total,
            orders: dayOrders.length
        });
    }
    return data;
  };

  // 2. Monthly (Last 6 Months)
  const getMonthlyData = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
        const targetDate = subMonths(today, i);
        const monthOrders = validOrders.filter(o => isSameMonth(o.createdAt, targetDate));
        const total = monthOrders.reduce((sum, o) => sum + o.totalPrice, 0);
        data.push({
            name: format(targetDate, 'MMM yyyy', { locale: th }),
            total,
            orders: monthOrders.length
        });
    }
    return data;
  };

  // 3. Yearly (Last 3 Years)
  const getYearlyData = () => {
    const data = [];
    for (let i = 2; i >= 0; i--) {
        const targetDate = subYears(today, i);
        const yearOrders = validOrders.filter(o => isSameYear(o.createdAt, targetDate));
        const total = yearOrders.reduce((sum, o) => sum + o.totalPrice, 0);
        data.push({
            name: format(targetDate, 'yyyy'),
            total,
            orders: yearOrders.length
        });
    }
    return data;
  };

  const chartData = view === 'daily' ? getDailyData() : view === 'monthly' ? getMonthlyData() : getYearlyData();

  // Quick Stats Calculation
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalOrders = validOrders.length;
  const todayOrders = validOrders.filter(o => isSameDay(o.createdAt, today));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
         <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans selection:bg-red-200">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-red-700 tracking-tight">สรุปยอดขาย Artee Waffle</h1>
          <p className="text-gray-500 mt-1 font-medium">Dashboard Analytics</p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <RefreshCcw className="h-4 w-4" />
          รีเฟรชข้อมูล
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
           <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">ยอดขายวันนี้</p>
              <h2 className="text-3xl font-black text-gray-900">{todayRevenue.toLocaleString()} บาท</h2>
           </div>
           <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
             <DollarSign className="h-6 w-6" />
           </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
           <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">ออเดอร์วันนี้</p>
              <h2 className="text-3xl font-black text-gray-900">{todayOrders.length}</h2>
           </div>
           <div className="h-12 w-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
             <ShoppingBag className="h-6 w-6" />
           </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
           <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">ยอดขายทั้งหมด</p>
              <h2 className="text-3xl font-black text-gray-900">{totalRevenue.toLocaleString()} บาท</h2>
           </div>
           <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
             <TrendingUp className="h-6 w-6" />
           </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
           <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">ออเดอร์ทั้งหมด</p>
              <h2 className="text-3xl font-black text-gray-900">{totalOrders}</h2>
           </div>
           <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
             <Calendar className="h-6 w-6" />
           </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 mb-8">
         <div className="flex flex-col md:flex-row justify-between mb-8 gap-4 border-b border-gray-100 pb-4">
            <h3 className="text-xl font-extrabold text-gray-800">แนวโน้มยอดขาย</h3>
            <div className="flex bg-gray-100 p-1 rounded-xl">
               <button 
                 onClick={() => setView('daily')} 
                 className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${view === 'daily' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 รายวัน
               </button>
               <button 
                 onClick={() => setView('monthly')} 
                 className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${view === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 รายเดือน
               </button>
               <button 
                 onClick={() => setView('yearly')} 
                 className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${view === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 รายปี
               </button>
            </div>
         </div>

         <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                     <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 13, fontWeight: 600}} dy={10} />
                 <YAxis tickFormatter={(val) => `${val} บ.`} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 13, fontWeight: 600}} dx={-10} />
                 <Tooltip 
                   formatter={(value: any) => [`${Number(value).toLocaleString()} บาท`, 'ยอดขาย'] as any}
                   labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                 />
                 <Area type="monotone" dataKey="total" stroke="#dc2626" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
}
