import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Order } from '@/lib/firebase/api';

export const useKitchenOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!isFirebaseConfigured) {
        // Fallback to local storage sync
        const parseLocalOrders = () => {
            const raw = localStorage.getItem('localOrders');
            if (raw) {
                const parsed = JSON.parse(raw);
                // Convert string iso dates back to objects
                const formatted = parsed.map((o: any) => ({
                    ...o,
                    createdAt: new Date(o.createdAt)
                }));
                // filter active orders
                setOrders(formatted.filter((o: any) => ['pending', 'cooking', 'ready'].includes(o.status)));
            }
            setLoading(false);
        };

        parseLocalOrders();
        window.addEventListener('storage', parseLocalOrders);
        return () => window.removeEventListener('storage', parseLocalOrders);
    }

    try {
        const q = query(
        collection(db, 'orders'),
        where('status', 'in', ['pending', 'cooking', 'ready']),
        orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            const fetchOrders: Order[] = [];
            snapshot.forEach((doc) => {
            fetchOrders.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            } as Order);
            });
            setOrders(fetchOrders);
            setLoading(false);
        },
        (err) => {
            console.error("Error fetching realtime orders: ", err);
            setError(err);
            setLoading(false);
        }
        );
        return () => unsubscribe();
    } catch(err) {
        console.error("Firebase not initialized: ", err);
        setLoading(false);
        return () => {};
    }
  }, []);

  return { orders, loading, error };
};
