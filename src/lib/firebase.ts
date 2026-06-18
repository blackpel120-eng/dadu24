import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import firebaseConfig from '@/firebase-applet-config.json';
import { FoodItem, ElectricianService, Order, RegisteredUser } from '../types';

const app = initializeApp(firebaseConfig);

// Resilient Firestore initialization
function initializeFirestoreDb() {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || (firebaseConfig as any).databaseId;
    if (dbId) {
      console.log("Firebase: Initializing Firestore with custom database ID:", dbId);
      return getFirestore(app, dbId);
    }
  } catch (err) {
    console.warn("Firebase: Failed to initialize custom Firestore database ID, falling back to default (default):", err);
  }
  console.log("Firebase: Initializing default Firestore database");
  return getFirestore(app);
}

export const db = initializeFirestoreDb();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google Auth Helpers
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error("Google login failed: ", err);
    throw err;
  }
}

export async function signOutFromFirebase() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Logout failed: ", err);
    throw err;
  }
}


// Collection References
export const FOOD_COLLECTION = 'food_items';
export const SERVICE_COLLECTION = 'electrician_services';
export const ORDER_COLLECTION = 'orders';

// Initial Preset Food Items to Seed if Empty
export const PRESET_FOODS: Omit<FoodItem, 'id'>[] = [
  {
    name: "Special Dadu Chicken Biryani",
    price: 320,
    description: "Savoury Sindh-style basmati rice layered with juicy cooked pieces of chicken, aromatic spices, and traditional aaloo (potato). Served with raita.",
    category: "Biryani",
    imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=600&auto=format&fit=crop",
    isAvailable: true
  },
  {
    name: "Sindhi Mutton Karahi",
    price: 1100,
    description: "Prepared with fresh tomatoes, ginger, green chilies, and our secret hand-ground spices in a traditional iron wok (karahi). Serving: Half KG.",
    category: "Desi Salan",
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=600&auto=format&fit=crop",
    isAvailable: true
  },
  {
    name: "Crispy Zinger Burger & Fries",
    price: 350,
    description: "Golden fried crispy chicken thigh fillet with premium spicy seasoning, crunchy lettuce, and our special signature mayo sauce in freshly toasted sesame buns.",
    category: "Fast Food",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop",
    isAvailable: true
  },
  {
    name: "Secial Seekh Kebab Roll Paratha",
    price: 180,
    description: "Two flame-grilled beef seekh kebabs loaded with garlic mayo sauce, mint chutney, and raw red unions rolled tightly inside a crisp golden lacha paratha.",
    category: "Desi Fast Food",
    imageUrl: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=600&auto=format&fit=crop",
    isAvailable: true
  },
  {
    name: "Traditional Sohan Halwa (Dadu Special)",
    price: 260,
    description: "Dadu's historic rich, sweet, and nutty dessert made of pure ghee, wheat germ (samnak), milk, and a loaded topping of almonds and walnuts (250g).",
    category: "Sweets",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=600&auto=format&fit=crop",
    isAvailable: true
  },
  {
    name: "Pakola Shake or Cold Soft Drink",
    price: 90,
    description: "Refreshing ice-cold standard Pakistani favourite green Pakola milk shake or choose from standard cold soft drink cans (Coke/Pepsi/Sprite).",
    category: "Beverages",
    imageUrl: "https://images.unsplash.com/photo-1497534446932-c925b458314e?q=80&w=600&auto=format&fit=crop",
    isAvailable: true
  }
];

// Initial Preset Electrician Services to Seed if Empty
export const PRESET_SERVICES: Omit<ElectricianService, 'id'>[] = [
  {
    name: "AC Gas Leakage Repair & Refilling",
    basePrice: 1500,
    description: "Complete pressure testing of cooling coils, copper piping joint welding repair, and precision refilling of standard R22 or environment-friendly R410 refrigerant.",
    category: "AC & Cooling",
    imageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=600&auto=format&fit=crop",
    isAvailable: true
  },
  {
    name: "Ceiling Fan Complete Repairing / Replacement",
    basePrice: 400,
    description: "Fixing annoying noise issues, capacitor replacement, heavy-duty rewinding check, speed regulator replacement or clean installation of brand-new fans.",
    category: "Fans & Lighting",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop",
    isAvailable: true
  },
  {
    name: "UPS System Diagnostic & Battery Testing",
    basePrice: 600,
    description: "Essential diagnostic check-up of direct power backup systems, charger circuit card calibration, battery terminal acid cleaning, and acid gravity restoration.",
    category: "UPS & Backup",
    imageUrl: "https://images.unsplash.com/photo-1558489823-3b767c600262?q=80&w=600&auto=format&fit=crop",
    isAvailable: true
  },
  {
    name: "Short Circuit Fault Finding & Home Wiring",
    basePrice: 800,
    description: "Emergency dispatching to track down electrical short circuits, burnt cable replacement, main distribution board (DB) circuit breaker installation.",
    category: "House Wiring",
    imageUrl: "https://images.unsplash.com/photo-1498084393753-b411b2d26b34?q=80&w=600&auto=format&fit=crop",
    isAvailable: true
  }
];

// Helper to check and Seed database tables
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function seedDatabaseIfEmpty() {
  try {
    // 1. Seed Food
    let foodSnap;
    try {
      foodSnap = await getDocs(collection(db, FOOD_COLLECTION));
    } catch (err) {
      console.warn("Firebase Seeding: Could not check food items, might be offline or empty. Initing seed.", err);
      // Construct a fake empty snapshot to trigger seeding
      foodSnap = { empty: true };
    }

    if (foodSnap.empty) {
      console.log('Seeding initial food items in Firestore Resiliently...');
      const batch = writeBatch(db);
      PRESET_FOODS.forEach((food) => {
        const docRef = doc(collection(db, FOOD_COLLECTION));
        batch.set(docRef, food);
      });
      try {
        await batch.commit();
        console.log('Seeding of food items completed successfully!');
      } catch (err) {
        console.error("Firebase Seeding Error committing food batch: ", err);
      }
    }

    // 2. Seed Services
    let serviceSnap;
    try {
      serviceSnap = await getDocs(collection(db, SERVICE_COLLECTION));
    } catch (err) {
      console.warn("Firebase Seeding: Could not check electrician services, might be offline or empty. Initing seed.", err);
      serviceSnap = { empty: true };
    }

    if (serviceSnap.empty) {
      console.log('Seeding initial electrician services in Firestore Resiliently...');
      const batch = writeBatch(db);
      PRESET_SERVICES.forEach((service) => {
        const docRef = doc(collection(db, SERVICE_COLLECTION));
        batch.set(docRef, service);
      });
      try {
        await batch.commit();
        console.log('Seeding of electrician services completed successfully!');
      } catch (err) {
        console.error("Firebase Seeding Error committing services batch: ", err);
      }
    }
  } catch (err) {
    console.error('Error during Firestore database seeding (will proceed anyway): ', err);
  }
}

// FOOD DATABASE CRUD HELPERS
export async function getFoodItems(): Promise<FoodItem[]> {
  try {
    const querySnapshot = await getDocs(collection(db, FOOD_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FoodItem));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, FOOD_COLLECTION);
  }
}

export async function addFoodItem(food: Omit<FoodItem, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, FOOD_COLLECTION), food);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, FOOD_COLLECTION);
  }
}

export async function updateFoodItem(id: string, food: Partial<FoodItem>): Promise<void> {
  try {
    const docRef = doc(db, FOOD_COLLECTION, id);
    await updateDoc(docRef, food);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${FOOD_COLLECTION}/${id}`);
  }
}

export async function deleteFoodItem(id: string): Promise<void> {
  try {
    const docRef = doc(db, FOOD_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${FOOD_COLLECTION}/${id}`);
  }
}

// ELECTRICIAN DATABASE CRUD HELPERS
export async function getElectricianServices(): Promise<ElectricianService[]> {
  try {
    const querySnapshot = await getDocs(collection(db, SERVICE_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ElectricianService));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, SERVICE_COLLECTION);
  }
}

export async function addElectricianService(service: Omit<ElectricianService, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, SERVICE_COLLECTION), service);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, SERVICE_COLLECTION);
  }
}

export async function updateElectricianService(id: string, service: Partial<ElectricianService>): Promise<void> {
  try {
    const docRef = doc(db, SERVICE_COLLECTION, id);
    await updateDoc(docRef, service);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${SERVICE_COLLECTION}/${id}`);
  }
}

export async function deleteElectricianService(id: string): Promise<void> {
  try {
    const docRef = doc(db, SERVICE_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${SERVICE_COLLECTION}/${id}`);
  }
}

// ORDER CRUD HELPERS
export async function createOrder(order: Omit<Order, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, ORDER_COLLECTION), order);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, ORDER_COLLECTION);
  }
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<void> {
  try {
    const docRef = doc(db, ORDER_COLLECTION, id);
    await updateDoc(docRef, { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${ORDER_COLLECTION}/${id}`);
  }
}

export function subscribeToOrders(callback: (orders: Order[]) => void) {
  const q = query(collection(db, ORDER_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      } as Order);
    });
    callback(orders);
  }, (err) => {
    console.error("Firestore Subscribe Orders Error: ", err);
  });
}

export function subscribeToFoods(callback: (foods: FoodItem[]) => void) {
  return onSnapshot(collection(db, FOOD_COLLECTION), (snapshot) => {
    const foods: FoodItem[] = [];
    snapshot.forEach((doc) => {
      foods.push({
        id: doc.id,
        ...doc.data()
      } as FoodItem);
    });
    callback(foods);
  }, (err) => {
    console.error("Firestore Subscribe Foods Error: ", err);
  });
}

export function subscribeToServices(callback: (services: ElectricianService[]) => void) {
  return onSnapshot(collection(db, SERVICE_COLLECTION), (snapshot) => {
    const services: ElectricianService[] = [];
    snapshot.forEach((doc) => {
      services.push({
        id: doc.id,
        ...doc.data()
      } as ElectricianService);
    });
    callback(services);
  }, (err) => {
    console.error("Firestore Subscribe Services Error: ", err);
  });
}

// REGISTERED USER HELPERS
export const USERS_COLLECTION = 'registered_users';

export async function saveRegisteredUser(user: { customerName: string; phoneNumber: string; deliveryAddress: string; nearestLandmark?: string }) {
  try {
    const cleanPhone = user.phoneNumber.replace(/\D/g, ''); // Uniquely key by numeric digits of the phone number
    if (!cleanPhone) throw new Error("A valid phone number is required to register.");
    
    const docRef = doc(db, USERS_COLLECTION, cleanPhone);
    const docSnap = await getDoc(docRef);
    
    const userData = {
      customerName: user.customerName,
      phoneNumber: user.phoneNumber,
      deliveryAddress: user.deliveryAddress,
      nearestLandmark: user.nearestLandmark || '',
      createdAt: docSnap.exists() ? (docSnap.data().createdAt || new Date().toISOString()) : new Date().toISOString(),
    };
    
    await setDoc(docRef, userData, { merge: true });
    return cleanPhone;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, USERS_COLLECTION);
  }
}

export function subscribeToRegisteredUsers(callback: (users: RegisteredUser[]) => void) {
  return onSnapshot(collection(db, USERS_COLLECTION), (snapshot) => {
    const users: RegisteredUser[] = [];
    snapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      } as RegisteredUser);
    });
    // Sort chronologically (newest registered readers first)
    users.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(users);
  }, (err) => {
    console.error("Firestore Subscribe Users Error: ", err);
  });
}

// SETTINGS CRUD HELPERS
export const SETTINGS_COLLECTION = 'settings';

export async function updateDeliveryFee(amount: number): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'delivery');
    await setDoc(docRef, { amount });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${SETTINGS_COLLECTION}/delivery`);
  }
}

export function subscribeToDeliveryFee(callback: (amount: number) => void) {
  return onSnapshot(doc(db, SETTINGS_COLLECTION, 'delivery'), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data().amount ?? 60);
    } else {
      // Create with default 60
      setDoc(doc(db, SETTINGS_COLLECTION, 'delivery'), { amount: 60 }).catch(console.error);
      callback(60);
    }
  }, (err) => {
    console.error("Firestore Subscribe Delivery Fee Error: ", err);
    callback(60); // fallback
  });
}

