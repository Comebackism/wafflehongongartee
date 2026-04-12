import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from './config';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'waffle' | 'topping' | 'savory' | 'sweet' | 'drink';
};

export type OrderItem = {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  toppings: MenuItem[];
};

export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled';

export type Order = {
  id?: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  tableOrQueue: string;
  customerName: string;
  createdAt?: any;
};

const IS_FIREBASE_CONFIGURED = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Static default menus — ใช้เป็นค่าเริ่มต้น แสดงทันทีโดยไม่ต้องรอ fetch
export const DEFAULT_MENUS: MenuItem[] = [
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
];

// Module-level cache — เมนูจะถูกดึงครั้งเดียวต่อ session
let menuCache: MenuItem[] | null = null;

// 1. Fetch available menus
export const fetchMenus = async (): Promise<MenuItem[]> => {
  if (menuCache) return menuCache;
  try {
    const menusCol = collection(db, 'menus');
    const menuSnapshot = await getDocs(menusCol);

    if (menuSnapshot.empty) {
      // Realistic mock data as requested
      menuCache = [
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
      ];
      return menuCache;
    }

    menuCache = menuSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MenuItem));
    return menuCache;
  } catch (error) {
    console.error("Error fetching menus: ", error);
    if (!IS_FIREBASE_CONFIGURED || process.env.NODE_ENV === "development") {
      menuCache = [
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
      ];
      return menuCache;
    }
    throw error;
  }
};

// 2. Submit new document to orders collection
export const submitOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
  if (!IS_FIREBASE_CONFIGURED) {
    const mockId = "order-" + Math.floor(Math.random() * 10000);
    const newOrder = {
      ...orderData,
      id: mockId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    // Local storage sync
    const currentOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
    currentOrders.push(newOrder);
    localStorage.setItem('localOrders', JSON.stringify(currentOrders));
    // Trigger an artificial storage event for the same tab
    window.dispatchEvent(new Event('storage'));
    console.warn("Used LocalStorage fallback for submission");
    return mockId;
  }

  try {
    const ordersCol = collection(db, 'orders');
    const docRef = await addDoc(ordersCol, {
      ...orderData,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error submitting order: ", error);
    throw error;
  }
};


// 3. Update order status
export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  if (!IS_FIREBASE_CONFIGURED) {
    const currentOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
    const updated = currentOrders.map((o: any) => o.id === orderId ? { ...o, status } : o);
    localStorage.setItem('localOrders', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    return;
  }

  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status });
  } catch (error) {
    console.error("Error updating order status: ", error);
    throw error;
  }
};

