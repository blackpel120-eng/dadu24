export interface FoodItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
}

export interface ElectricianService {
  id: string;
  name: string;
  basePrice: number;
  description: string;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'food' | 'electrician';
}

export type OrderStatus = 'Pending' | 'Accepted' | 'Preparing' | 'Out for Delivery' | 'Completed' | 'Cancelled';

export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  deliveryAddress: string;
  nearestLandmark: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  orderNotes?: string;
  paymentMethod: 'Cash on Delivery';
}
