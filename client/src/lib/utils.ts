import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency as INR
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
export function formatDate(date: string | Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return new Date(date).toLocaleDateString('en-IN', options);
}

// Get order status label with appropriate styling
export function getOrderStatusLabel(status: string): { 
  label: string; 
  bgColor: string; 
  textColor: string;
} {
  switch (status) {
    case 'preparing':
      return { label: 'Preparing', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    case 'out-for-delivery':
      return { label: 'Out for Delivery', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
    case 'delivered':
      return { label: 'Delivered', bgColor: 'bg-green-100', textColor: 'text-green-800' };
    default:
      return { label: 'Pending', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  }
}

// Validate MLRIT email
export function isValidMLRITEmail(email: string): boolean {
  return email.endsWith('@mlrit.ac.in');
}

// Calculate total price from cart items
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export function calculateCartTotal(items: CartItem[]): {
  subtotal: number;
  deliveryFee: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = items.length > 0 ? 10 : 0; // ₹10 delivery fee if cart has items
  const total = subtotal + deliveryFee;
  
  return { subtotal, deliveryFee, total };
}

// Load Razorpay script
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
