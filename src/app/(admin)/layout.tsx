"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChefHat, PieChart, Store } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col shadow-sm z-10">
         <div className="p-6 border-b border-gray-100 flex items-center gap-3">
             <div className="p-2 bg-red-600 text-white rounded-xl shadow-md shadow-red-200">
                 <Store size={24} />
             </div>
             <h1 className="font-black text-gray-900 tracking-tight text-xl uppercase">Admin</h1>
         </div>
         <nav className="flex-1 p-4 space-y-2">
            <Link 
              href="/kitchen" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${pathname === '/kitchen' ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
               <ChefHat size={20} className={pathname === '/kitchen' ? 'text-red-500' : ''} />
               ระบบจัดการคิว
            </Link>
            <Link 
              href="/dashboard" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${pathname === '/dashboard' ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
               <PieChart size={20} className={pathname === '/dashboard' ? 'text-red-500' : ''} />
               สรุปยอดขาย
            </Link>
         </nav>
         <div className="p-6 border-t border-gray-100 bg-gray-50/50">
             <Link href="/" className="flex items-center gap-3 text-sm font-bold text-gray-500 hover:text-red-600 transition-colors">
                กลับสู่หน้าร้าน
             </Link>
         </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden flex flex-col relative w-full">
        {/* Mobile Nav Header */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex gap-4 overflow-x-auto shadow-sm z-10 sticky top-0">
           <Link 
             href="/kitchen" 
             className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${pathname === '/kitchen' ? 'bg-red-600 text-white shadow-md shadow-red-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
           >
              <ChefHat size={16} /> ห้องครัว
           </Link>
           <Link 
             href="/dashboard" 
             className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${pathname === '/dashboard' ? 'bg-red-600 text-white shadow-md shadow-red-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
           >
              <PieChart size={16} /> ยอดขาย
           </Link>
        </header>

        <main className="flex-1 overflow-y-auto relative bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
