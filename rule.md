# Project Context
You are an expert AI developer building a Real-time QR Code Waffle Ordering Web Application.
The system has two main interfaces:
1. Customer App: A mobile-first web app accessed via scanning a QR code. Customers use it to browse the waffle menu, select toppings, and place orders.
2. Kitchen Display System (KDS): A real-time dashboard for kitchen staff to manage the queue and update order statuses (e.g., Pending, Cooking, Ready, Served).

# Tech Stack
- Frontend: Next.js (App Router), React, Tailwind CSS, Lucide Icons.
- Backend/Database: Firebase (Cloud Firestore).
- Hosting: Vercel or Firebase Hosting.

# Development Rules & Architecture
- **Mobile-First Approach:** All customer-facing UI components MUST be optimized for mobile devices. The KDS dashboard should be optimized for tablet/desktop screens.
- **Real-Time Data Sync:** Use Firestore `onSnapshot` listeners for the Kitchen KDS to ensure new orders appear instantly without requiring page refreshes.
- **State Management:** Keep React components highly modular. Separate UI rendering from data fetching logic (create custom hooks for Firebase interactions).
- **QR Code Parameters:** The application must capture URL search parameters to identify the source of the scan (e.g., `?table=4` or `?queue=front`).
- **Data Integrity:** Orders must include timestamps, total price calculation, selected options, and current queue status.
- **Realistic Mock Data:** When scaffolding UI components before the database is connected, use realistic waffle shop data (e.g., "Strawberry Cream Waffle", "Extra Maple Syrup") instead of placeholder text.

Please implement the database functions for the Waffle Ordering App based on this Firestore Schema.

Create a function to fetch available menus.

Create a function to submit a new document to the orders collection.

Create a React custom hook using Firebase onSnapshot to listen to the orders collection in real-time where status is NOT 'served' or 'cancelled', ordered by created_at