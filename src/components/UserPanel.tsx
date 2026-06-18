import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FoodItem, ElectricianService, OrderItem, Order } from '../types';
import { 
  Search, 
  ShoppingBag, 
  Trash2, 
  CheckCircle, 
  Phone, 
  MapPin, 
  ChevronRight, 
  Bike, 
  Wrench, 
  Utensils,
  Clock,
  ThumbsUp,
  CreditCard,
  Building,
  User
} from 'lucide-react';
import { createOrder, subscribeToFoods, subscribeToServices, PRESET_FOODS, PRESET_SERVICES, saveRegisteredUser, subscribeToOrders } from '../lib/firebase';

interface UserPanelProps {
  initialActiveTab: 'food' | 'electrician' | 'tracking';
  activeTab: 'food' | 'electrician' | 'admin' | 'tracking';
  setActiveTab: (tab: 'food' | 'electrician' | 'admin' | 'tracking') => void;
  cart: OrderItem[];
  setCart: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  deliveryFee: number;
}

export default function UserPanel({
  initialActiveTab,
  activeTab,
  setActiveTab,
  cart,
  setCart,
  isCartOpen,
  setIsCartOpen,
  deliveryFee
}: UserPanelProps) {
  // Live State from Firestore, pre-filled with presets for instantaneous loading!
  const [foods, setFoods] = useState<FoodItem[]>(() => 
    PRESET_FOODS.map((item, index) => ({ ...item, id: `preset-food-${index}` } as FoodItem))
  );
  const [services, setServices] = useState<ElectricianService[]>(() => 
    PRESET_SERVICES.map((item, index) => ({ ...item, id: `preset-service-${index}` } as ElectricianService))
  );
  const [loading, setLoading] = useState(false);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodCategory, setSelectedFoodCategory] = useState('All');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('All');

  // Checkout Form State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('dadu247_username') || '');
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem('dadu247_phone') || '');
  const [deliveryAddress, setDeliveryAddress] = useState(() => localStorage.getItem('dadu247_address') || '');
  const [nearestLandmark, setNearestLandmark] = useState(() => localStorage.getItem('dadu247_landmark') || '');
  const [orderNotes, setOrderNotes] = useState('');

  // Profile management states
  const [isEditingProfile, setIsEditingProfile] = useState(() => {
    return !localStorage.getItem('dadu247_username');
  });
  const [profileSavedMsg, setProfileSavedMsg] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Checkout Success State
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [orderSuccessModal, setOrderSuccessModal] = useState(false);

  // Users' Saved Orders Tracker (from localStorage & synced from Order collection inside Firestore)
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Track Real-time Foods and Services from Firestore
  useEffect(() => {
    const unsubFoods = subscribeToFoods((data) => {
      if (data && data.length > 0) {
        setFoods(data);
      }
    });

    const unsubServices = subscribeToServices((data) => {
      if (data && data.length > 0) {
        setServices(data);
      }
    });

    return () => {
      unsubFoods();
      unsubServices();
    };
  }, []);

  // Sync / Track User's Local Orders
  useEffect(() => {
    const savedOrderIds: string[] = JSON.parse(localStorage.getItem('dadu247_orders') || '[]');
    if (savedOrderIds.length > 0) {
      // We will pull the status from Firestore or display local trackers.
      // For real-time updates of local orders, we can subscribe.
    }
  }, []);

  const DELIVERY_FEE = deliveryFee; // Dynamic flat delivery fee inside Dadu City


  // Calculate Cart Metrics
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotal = cartSubtotal > 0 ? cartSubtotal + DELIVERY_FEE : 0;

  // Add Item to Cart
  const handleAddToCart = (id: string, name: string, price: number, type: 'food' | 'electrician') => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === id);
      if (existing) {
        return prevCart.map((item) => 
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { id, name, price, quantity: 1, type }];
    });
  };

  // Decrement or Remove Item
  const handleRemoveFromCart = (id: string) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === id);
      if (existing && existing.quantity > 1) {
        return prevCart.map((item) => 
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prevCart.filter((item) => item.id !== id);
    });
  };

  // Completely wipe specific item
  const handleWipeItem = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // Place Order Action (Saving to Firestore & localStorage)
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customerName || !phoneNumber || !deliveryAddress) {
      alert("Please fill in Name, Phone, and Delivery Address to save your profile!");
      return;
    }

    setIsSavingProfile(true);
    setProfileSavedMsg('');

    try {
      // Save locally
      localStorage.setItem('dadu247_username', customerName);
      localStorage.setItem('dadu247_phone', phoneNumber);
      localStorage.setItem('dadu247_address', deliveryAddress);
      localStorage.setItem('dadu247_landmark', nearestLandmark);

      // Sync to Firestore Users Collection
      await saveRegisteredUser({
        customerName,
        phoneNumber,
        deliveryAddress,
        nearestLandmark
      });

      setProfileSavedMsg("Mubarak! Your profile details have been synced successfully with Dadu 24#7!");
      setIsEditingProfile(false);
      setTimeout(() => setProfileSavedMsg(''), 4500);
    } catch (err) {
      console.error("Profile sync to Firestore failed: ", err);
      // Still show local success to keep UX smooth
      setProfileSavedMsg("Saved locally (Offline mode active). Your details are saved on this device!");
      setIsEditingProfile(false);
      setTimeout(() => setProfileSavedMsg(''), 4500);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName || !phoneNumber || !deliveryAddress) {
      alert("Please fill in Name, Phone, and Address!");
      return;
    }

    setIsSubmittingOrder(true);

    const orderData: Omit<Order, 'id'> = {
      customerName,
      phoneNumber,
      deliveryAddress,
      nearestLandmark,
      items: cart,
      totalAmount: cartTotal,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      orderNotes,
      paymentMethod: 'Cash on Delivery'
    };

    try {
      const orderId = await createOrder(orderData);
      
      const completeOrder: Order = {
        id: orderId,
        ...orderData
      };

      // Auto-register user at checkout as well!
      try {
        await saveRegisteredUser({
          customerName,
          phoneNumber,
          deliveryAddress,
          nearestLandmark
        });
      } catch (profErr) {
        console.error("Auto registration failed: ", profErr);
      }

      // Save Order Id to localStorage for tracking
      const localIds: string[] = JSON.parse(localStorage.getItem('dadu247_order_ids') || '[]');
      localIds.push(orderId);
      localStorage.setItem('dadu247_order_ids', JSON.stringify(localIds));

      // Clear Cart and Checkout Options
      setCart([]);
      setIsCheckoutOpen(false);
      setPlacedOrder(completeOrder);
      setOrderSuccessModal(true);

      // Save input defaults for future placing convenience
      localStorage.setItem('dadu247_username', customerName);
      localStorage.setItem('dadu247_phone', phoneNumber);
      localStorage.setItem('dadu247_address', deliveryAddress);
      localStorage.setItem('dadu247_landmark', nearestLandmark);

      // Reset form variables
      setOrderNotes('');

    } catch (err) {
      console.error("Order completion failed in Firebase: ", err);
      alert("Something went wrong while processing your order. Please try again!");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Populating cached info from localStorage on load
  useEffect(() => {
    const cachedName = localStorage.getItem('dadu247_username') || '';
    const cachedPhone = localStorage.getItem('dadu247_phone') || '';
    const cachedAddress = localStorage.getItem('dadu247_address') || '';
    const cachedLandmark = localStorage.getItem('dadu247_landmark') || '';

    if (cachedName) setCustomerName(cachedName);
    if (cachedPhone) setPhoneNumber(cachedPhone);
    if (cachedAddress) setDeliveryAddress(cachedAddress);
    if (cachedLandmark) setNearestLandmark(cachedLandmark);
  }, []);

  // Filter Food categories
  const foodCategories = ['All', ...Array.from(new Set(foods.map((f) => f.category)))];
  const filteredFoods = foods.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedFoodCategory === 'All' || f.category === selectedFoodCategory;
    return matchSearch && matchCat;
  });

  // Filter Service categories
  const serviceCategories = ['All', ...Array.from(new Set(services.map((s) => s.category)))];
  const filteredServices = services.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedServiceCategory === 'All' || s.category === selectedServiceCategory;
    return matchSearch && matchCat;
  });

  // Helpers for continuous cascading scroll (optimized for mobile)
  const renderFoodsSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            🍕 <span className="text-amber-500">Dadu Garam Garam</span> Food Menu
          </h2>
          <p className="text-xs text-gray-500 font-medium font-sans">Freshly prepared, safe, and hygienic food delivered instantly in Dadu City</p>
        </div>
        
        {/* Food Local Category Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 shrink-0 scrollbar-none max-w-full">
          {foodCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFoodCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-150 ${
                selectedFoodCategory === cat 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredFoods.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-150 p-8 text-center max-w-md mx-auto shadow-xs">
          <p className="text-2xl mb-1">🍽️</p>
          <h3 className="font-bold text-gray-800 text-sm">No Food Items Match</h3>
          <p className="text-xs text-gray-400 mt-1">Garam Khane aapki search ke mutabiq nahi mile. Naya search karein.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFoods.map((item) => (
            <div 
              key={item.id}
              className={`bg-white rounded-2xl border ${item.isAvailable ? 'border-gray-100/80 hover:shadow-lg' : 'border-gray-200 opacity-80'} transition-all duration-300 flex flex-col overflow-hidden relative group`}
            >
              <div className="h-44 sm:h-48 w-full bg-gray-100 relative overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop';
                  }}
                />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-white/95 backdrop-blur-xs text-[9px] font-extrabold rounded text-amber-800 shadow-sm uppercase tracking-wider">
                  {item.category}
                </span>
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                    <span className="px-3.5 py-1.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest leading-none">
                      Soon (Unavailable)
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-gray-900 group-hover:text-amber-600 transition-colors leading-tight text-sm sm:text-base">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 sm:mt-4 border-t border-gray-55">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">Price</p>
                    <span className="text-base font-black text-gray-950">
                      Rs. {item.price}
                    </span>
                  </div>

                  {item.isAvailable && (
                    <div className="flex items-center gap-1">
                      {cart.some(ci => ci.id === item.id) ? (
                        <div className="flex items-center gap-2 px-1 py-1 bg-amber-50 rounded-lg border border-amber-200">
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="w-6.5 h-6.5 bg-white rounded flex items-center justify-center font-black text-amber-600 shadow-xs border border-amber-100 hover:bg-amber-100"
                          >
                            -
                          </button>
                          <span className="text-xs font-black text-amber-900 px-0.5">
                            {cart.find(ci => ci.id === item.id)?.quantity}
                          </span>
                          <button
                            onClick={() => handleAddToCart(item.id, item.name, item.price, 'food')}
                            className="w-6.5 h-6.5 bg-amber-500 text-white rounded flex items-center justify-center font-bold shadow-xs hover:bg-amber-600"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item.id, item.name, item.price, 'food')}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition duration-200 cursor-pointer shadow-sm shadow-amber-500/10 active:scale-95"
                        >
                          Add +
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderElectricianSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            ⚡ <span className="text-blue-600">Dadu Electrician</span> Services
          </h2>
          <p className="text-xs text-gray-500 font-medium">Safe repairs, AC charging, board wiring, and UPS battery diagnosis in Dadu City</p>
        </div>
        
        {/* Electrician Local Category Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 shrink-0 scrollbar-none max-w-full">
          {serviceCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedServiceCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-150 ${
                selectedServiceCategory === cat 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-150 p-8 text-center max-w-md mx-auto shadow-xs">
          <p className="text-2xl mb-1">🛠️</p>
          <h3 className="font-bold text-gray-800 text-sm">No Electrician Services Match</h3>
          <p className="text-xs text-gray-400 mt-1">Aapki high electrical search criteria ke mutabiq koi diagnostic packet nahi mila.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredServices.map((service) => (
            <div 
              key={service.id}
              className={`bg-white rounded-2xl border ${service.isAvailable ? 'border-gray-100/80 hover:shadow-lg' : 'border-gray-150 opacity-80'} transition-all duration-300 overflow-hidden flex flex-col sm:flex-row relative group`}
            >
              <div className="h-40 sm:h-auto sm:w-40 bg-gray-50 relative shrink-0">
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=600&auto=format&fit=crop';
                  }}
                />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-extrabold uppercase tracking-wide">
                  {service.category}
                </span>
                {!service.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                    <span className="px-3.5 py-1.5 bg-red-650 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">
                      Bookings Full
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-gray-950 group-hover:text-blue-600 transition-colors leading-tight text-sm sm:text-base">
                    {service.name}
                  </h3>
                  <p className="text-xs text-gray-550 mt-1.5 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-gray-55">
                  <div>
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider leading-none">Base Price</p>
                    <span className="text-base font-black text-gray-950">
                      Rs. {service.basePrice}
                    </span>
                  </div>

                  {service.isAvailable && (
                    <div>
                      {cart.some(ci => ci.id === service.id) ? (
                        <div className="flex items-center gap-1.5 px-1 py-1 bg-blue-50 rounded-lg border border-blue-105">
                          <button
                            onClick={() => handleRemoveFromCart(service.id)}
                            className="w-6.5 h-6.5 bg-white rounded flex items-center justify-center font-black text-blue-600 shadow-xs hover:bg-blue-100"
                          >
                            -
                          </button>
                          <span className="text-xs font-black text-blue-900 px-1">
                            {cart.find(ci => ci.id === service.id)?.quantity}
                          </span>
                          <button
                            onClick={() => handleAddToCart(service.id, service.name, service.basePrice, 'electrician')}
                            className="w-6.5 h-6.5 bg-blue-500 text-white rounded flex items-center justify-center font-bold shadow-xs hover:bg-blue-600"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(service.id, service.name, service.basePrice, 'electrician')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition duration-200 cursor-pointer shadow-sm shadow-blue-500/10 active:scale-95"
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* 🚀 BANNER SECTON */}
      <div className="relative bg-linear-to-r from-amber-500 to-amber-600 text-white overflow-hidden py-10 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-orange-100 text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
                ⚡ Dadu Fast Home delivery Services
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Dadu 24#7 Quick Services!
                <span className="text-xl md:text-2xl mt-1 block font-normal text-yellow-300">Welcome! Reliable home service for all Dadu residents</span>
              </h1>
              <p className="text-sm md:text-base text-yellow-50 max-w-lg font-medium">
                Garam Garam Food Delivery and Premium Electrician Service. Cash on Delivery (COD) fast service across Dadu City.
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">Riders Active in Dadu Now</span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl flex items-center gap-2">
                  <span className="text-xs font-bold text-yellow-300">⚡ 30 Min Fast Delivery</span>
                </div>
              </div>
            </div>

            {/* Quick Hero Banner visual card toggle */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveTab('food')}
                className={`group p-5 rounded-2xl border text-left transition-all duration-300 ${
                  activeTab === 'food' 
                    ? 'bg-white text-gray-900 border-white shadow-xl scale-[1.03]' 
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mb-3 group-hover:scale-110 transition-transform">
                  <Utensils className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base">Garam Khana</h3>
                <p className={`text-xs mt-1 leading-relaxed ${activeTab === 'food' ? 'text-gray-500' : 'text-yellow-105'}`}>
                  Special Dadu Biryani, Zinger, Sajji and Sweet Rabri.
                </p>
                <span className="inline-flex items-center text-xs font-bold gap-1 mt-3 text-amber-600">
                  Order Now Check <ChevronRight className="w-3 h-3 text-amber-600" />
                </span>
              </button>

              <button 
                onClick={() => setActiveTab('electrician')}
                className={`group p-5 rounded-2xl border text-left transition-all duration-300 ${
                  activeTab === 'electrician' 
                    ? 'bg-white text-gray-900 border-white shadow-xl scale-[1.03]' 
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                  <Wrench className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base">Electrician Work</h3>
                <p className={`text-xs mt-1 leading-relaxed ${activeTab === 'electrician' ? 'text-gray-500' : 'text-yellow-105'}`}>
                  AC Gas, Fan, UPS charging, and House wiring diagnostic repair.
                </p>
                <span className="inline-flex items-center text-xs font-bold gap-1 mt-3 text-blue-600">
                  Book Now <ChevronRight className="w-3 h-3 text-blue-600" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 SEARCH AND FILTERS */}
      {activeTab !== 'tracking' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/40 p-4 border border-gray-100 flex items-center justify-between gap-4">
            {/* Live Search bar */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search biryani, zinger, AC service, fan repair..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-gray-50 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 border border-gray-100 text-xs sm:text-sm font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📦 CORE CONTENT SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* 📍 CUSTOMER REAL-TIME PROFILE SYNC BANNER */}
        {activeTab !== 'tracking' && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                      👤 Mera Account / Delivery Profile
                      {profileSavedMsg && (
                        <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full animate-pulse">
                          {profileSavedMsg}
                        </span>
                      )}
                    </h3>
                    
                    {!customerName ? (
                      <p className="text-xs text-slate-500 mt-1">
                        Welcome to Dadu 24#7! Enter your phone number/address once to save time on all future orders.
                      </p>
                    ) : !isEditingProfile ? (
                      <div className="text-xs text-slate-600 mt-1.5 space-y-1">
                        <p className="font-bold text-gray-800">
                          Welcome Back, <span className="text-amber-600 font-extrabold">{customerName}</span>!
                        </p>
                        <p className="text-slate-500">
                          📞 Phone: <span className="font-mono font-bold text-gray-900">{phoneNumber}</span> | 📍 Address: <span className="font-bold text-gray-850">{deliveryAddress}</span> {nearestLandmark && <>| 🏫 Landmark: <span className="font-bold text-gray-800">{nearestLandmark}</span></>}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">
                        Enter your correct Dadu address and active mobile number so we can register you.
                      </p>
                    )}
                  </div>
                </div>

                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer"
                  >
                    ✏️ Edit Details / Badlein
                  </button>
                )}
              </div>

              {isEditingProfile && (
                <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="mt-6 pt-6 border-t border-gray-100 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aslam Ali"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Active Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 03001234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Home Delivery Address (Dadu)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Girls College Road, Ward 3, Dadu"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Nearest Landmark (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Sindhi Hotel or Grid Station"
                        value={nearestLandmark}
                        onChange={(e) => setNearestLandmark(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold uppercase shrink-0 transition flex items-center justify-center cursor-pointer min-w-[100px]"
                      >
                        {isSavingProfile ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Save & Sync"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-semibold">Please wait while we fetch items...</p>
          </div>
        ) : activeTab === 'food' ? (
          /* FOOD SECTION & THEN ELECTRICIAN SECTION SEQUENTIALLY */
          <div className="space-y-16">
            {renderFoodsSection()}
            
            {/* Visual separator banner */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="inline-block px-2.5 py-1 bg-white/20 text-blue-100 rounded-full text-[10px] font-black uppercase tracking-wider bg-opacity-30">
                  ⚡ Doorstep Electrical Care
                </span>
                <h3 className="text-lg sm:text-xl font-black">Need Quick Electrician Repairs in Dadu?</h3>
                <p className="text-xs text-blue-100 max-w-xl font-medium leading-relaxed">
                  AC gas charging, fan wiring, board repairing, UPS installation and home diagnostics. No visiting fees, honest prices!
                </p>
              </div>
              <button 
                onClick={() => {
                  const el = document.getElementById('electrician-section-anchor');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md active:scale-95 whitespace-nowrap shrink-0"
              >
                Explore Electricians 👇
              </button>
            </div>

            <div id="electrician-section-anchor" className="pt-2">
              {renderElectricianSection()}
            </div>
          </div>
        ) : activeTab === 'electrician' ? (
          /* ELECTRICIAN SPECIALS & THEN FOOD SECTION SEQUENTIALLY */
          <div className="space-y-16">
            {renderElectricianSection()}

            {/* Visual separator banner */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-amber-500 to-orange-600 p-6 text-white shadow-lg shadow-amber-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="inline-block px-2.5 py-1 bg-white/20 text-yellow-105 rounded-full text-[10px] font-black uppercase tracking-wider bg-opacity-30">
                  🍔 Garam Garam Delivery
                </span>
                <h3 className="text-lg sm:text-xl font-black">Hungry? Order delicious Dadu Food!</h3>
                <p className="text-xs text-yellow-105 max-w-xl font-medium leading-relaxed">
                  Tasty Biryani, spicy Burgers, sweet Rabri & special items from best cooks in Dadu sent straight to your door step!
                </p>
              </div>
              <button 
                onClick={() => {
                  const el = document.getElementById('food-section-anchor');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 bg-white hover:bg-gray-50 text-amber-600 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md active:scale-95 whitespace-nowrap shrink-0"
              >
                Order Hot Food 👇
              </button>
            </div>

            <div id="food-section-anchor" className="pt-2">
              {renderFoodsSection()}
            </div>
          </div>
        ) : (
          /* REALTIME ORDER TRACKER AREA FOR CLIENTS */
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                📋 Live Status of Your Orders
              </h2>
              <p className="text-xs text-gray-500">Apne order ki delivery aur electrician ke ride ka rasta dekhain.</p>
            </div>

            <OrderTrackerView />
          </div>
        )}
      </main>

      {/* 🧾 BOTTOM FLOATING CART SUMMARY (Desktop/Mobile overlay) */}
      {cart.length > 0 && activeTab !== 'admin' && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-150 px-4 py-3 sm:py-4 shadow-2xl flex items-center justify-between max-w-7xl mx-auto rounded-t-2xl animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">{cart.length} item selected</p>
              <p className="text-xs text-amber-600 font-extrabold flex items-center gap-1">
                <span>Total:</span>
                <span className="text-sm font-black text-gray-900">Rs. {cartTotal}</span>
                <span className="text-[10px] text-gray-400 font-normal">(including Rs. {DELIVERY_FEE} Delivery)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase rounded-xl transition"
            >
              View Cart
            </button>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-md shadow-amber-500/20 active:scale-95"
            >
              Checkout Now
            </button>
          </div>
        </div>
      )}

      {/* 🛒 MAIN CART DRAWER OVERLAY */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-slide-left">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-900 text-base">Shopping Cart</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg text-lg"
              >
                &times;
              </button>
            </div>

            {/* Cart Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-24 space-y-3">
                  <span className="text-5xl">🛒</span>
                  <h4 className="font-bold text-gray-700">Aapka Cart khaali hai</h4>
                  <p className="text-xs text-gray-400">Pehle mazedaar food ya service add karain!</p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setActiveTab('food');
                    }}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold"
                  >
                    Go Back To Menu
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl relative group">
                      <div className="flex-1 min-w-0 pr-3">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          item.type === 'food' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {item.type}
                        </span>
                        <h4 className="font-bold text-gray-800 text-sm mt-1 truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Rs. {item.price} each
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Increment / Decrement controls */}
                        <div className="flex items-center bg-gray-50 border border-gray-150 rounded-lg p-0.5">
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="w-6 h-6 hover:bg-gray-250 text-gray-600 rounded flex items-center justify-center font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-extrabold text-gray-800 px-2">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleAddToCart(item.id, item.name, item.price, item.type)}
                            className="w-6 h-6 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded flex items-center justify-center font-bold text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Complete remove */}
                        <button
                          onClick={() => handleWipeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-gray-100 bg-gray-50/70 space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>Rs. {cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Dadu Rider Shipping Fee</span>
                    <span>Rs. {DELIVERY_FEE}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-extrabold text-sm pt-2 border-t border-gray-200">
                    <span>Total Bill (Rupees)</span>
                    <span className="text-amber-600">Rs. {cartTotal}</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2 text-[11px] text-amber-800 font-medium">
                  <CreditCard className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">Cash on Delivery (COD) Only</span>
                    Rider aane par aapko cash me pay karna hoga. Online payment blocked.
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-1/2 py-3 bg-white hover:bg-gray-50 text-gray-600 font-bold border border-gray-200 text-xs uppercase tracking-wider rounded-xl transition"
                  >
                    Keep Shopping
                  </button>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-1/2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition text-center shadow-md shadow-amber-500/20 active:scale-95"
                  >
                    Checkout Info
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🖊️ CHECKOUT DETAILED MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                  <Bike className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delivery &amp; Booking Details</h3>
                  <p className="text-xs text-gray-500">Dadu Rider aane p cash payment krni hogi</p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg text-lg"
              >
                &times;
              </button>
            </div>

            {/* Checkout Items Summary */}
            <div className="p-3.5 bg-gray-50 rounded-xl text-xs space-y-1 mb-4">
              <span className="font-bold text-gray-700 uppercase tracking-wide block mb-1">Your Order Items</span>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-gray-600">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-bold">Rs. {item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-1.5 flex justify-between text-amber-700 font-bold">
                <span>Rider Shipping Fee + Subtotal:</span>
                <span className="text-sm font-black text-gray-900">Rs. {cartTotal}</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-500" /> Your Full Name *
                </label>
                <input
                  type="text"
                  placeholder="E.g., Muhammad Ali, Kamran, Mehran"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-500" /> Mobile Number (Rider Will Call) *
                </label>
                <input
                  type="tel"
                  placeholder="E.g., 03001234567, 03277004471"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" /> Complete Delivery Address / House Number *
                </label>
                <textarea
                  placeholder="E.g., House No. C-4, Sector 3, Girls College Road, Dadu City."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm h-16 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-amber-500" /> Nearest Landmark / Famous Place
                </label>
                <input
                  type="text"
                  placeholder="E.g., Near Girls High School, Shahi Bazar or Civil Hospital."
                  value={nearestLandmark}
                  onChange={(e) => setNearestLandmark(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide mb-1">
                  Special Instructions / Rider Notes
                </label>
                <input
                  type="text"
                  placeholder="E.g., Call before coming, door bell ring loudly."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              {/* COD Caution */}
              <div className="p-3 bg-red-50 text-red-650 rounded-xl border border-red-100 flex items-start gap-2 text-xs font-semibold">
                <Bike className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block">Cash on Delivery (COD) Approved!</span>
                  Dadu 24#7 order direct notification system me jaega. Maqami Rider aapko call karega. No online pay required!
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-1/2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="w-1/2 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 text-xs flex items-center justify-center gap-1.5"
                >
                  {isSubmittingOrder ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Confirm Order (Rs. {cartTotal})</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        {/* 🎉 ORDER PLACED SUCCESS POPUP */}
      {orderSuccessModal && placedOrder && (
        <div className="fixed inset-0 z-55 overflow-y-auto bg-black/85 p-4 flex items-center justify-center backdrop-blur-xs">
          <motion.div 
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-100 text-center space-y-6 relative overflow-hidden"
          >
            {/* Ambient Animated Sunburst backgrounds */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-amber-300/30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-yellow-300/30 rounded-full blur-2xl pointer-events-none" />
            
            {/* Animated Celebration Ring */}
            <div className="relative pt-4">
              <motion.div 
                initial={{ rotate: -15, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", damping: 12, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg relative z-10"
              >
                <CheckCircle className="w-14 h-14 stroke-[2.5]" />
              </motion.div>
              
              {/* Multipoint Rich Confetti Particle Blast */}
              {[...Array(12)].map((_, index) => {
                const angle = (index * 360) / 12;
                const radians = (angle * Math.PI) / 180;
                const distanceX = Math.cos(radians) * (80 + Math.random() * 40);
                const distanceY = Math.sin(radians) * (80 + Math.random() * 40);
                const emojis = ['🎈', '🔥', '⚡', '🍔', '🎉', '💥', '✨'];
                const randomEmoji = emojis[index % emojis.length];

                return (
                  <motion.div
                    key={index}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.2 }}
                    animate={{ 
                      x: distanceX, 
                      y: distanceY, 
                      opacity: [1, 1, 0], 
                      scale: [0.3, 1.3, 0.4],
                      rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)]
                    }}
                    transition={{ 
                      duration: 2.2, 
                      repeat: Infinity, 
                      repeatType: "loop", 
                      delay: Math.random() * 0.4,
                      ease: "easeOut"
                    }}
                    className="absolute top-1/2 left-1/2 -mt-3 -ml-3 text-lg pointer-events-none z-0"
                  >
                    {randomEmoji}
                  </motion.div>
                );
              })}
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Mubarak Ho! Order Placed! 🎉</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                Aapka order <span className="font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-black">#{placedOrder.id.substring(0, 8)}</span> Dadu 24#7 live dispatch system par register ho chuka hai!
              </p>
            </div>

            {/* Receipt Summary Card */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-b from-gray-50/80 to-slate-50/40 border border-gray-150 p-5 rounded-2xl text-left text-xs space-y-3 shadow-xs relative"
            >
              <div className="flex justify-between font-bold border-b border-gray-200/70 pb-2">
                <span className="text-gray-400 uppercase font-mono tracking-wider text-[10px]">Recipient:</span>
                <span className="text-gray-900 font-extrabold">{placedOrder.customerName}</span>
              </div>
              
              <div className="space-y-1.5 text-gray-600">
                <p className="flex items-center gap-1.5">
                  <span className="text-slate-400">📞 Phone:</span> 
                  <span className="font-mono text-gray-900 font-bold">{placedOrder.phoneNumber}</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-slate-400 shrink-0">📍 Address:</span> 
                  <span className="text-gray-900 font-medium">{placedOrder.deliveryAddress}</span>
                </p>
                {placedOrder.nearestLandmark && (
                  <p className="flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50/60 p-1.5 rounded-lg border border-amber-100/30">
                    <span>🏛️ Landmark:</span> 
                    <span>{placedOrder.nearestLandmark}</span>
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-slate-500 leading-none">
                  <span>📦 Category:</span> 
                  <span className="font-bold text-slate-700">{placedOrder.items[0]?.type === 'food' ? '🍔 Punjabi / Desi Food' : '⚡ Electrician Dispatch Pack'}</span>
                </p>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-2.5 flex justify-between items-center text-amber-700 font-bold">
                <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">Pay on Delivery (COD):</span>
                <span className="text-base font-black text-gray-900">Rs. {placedOrder.totalAmount}</span>
              </div>
            </motion.div>

            {/* Cute bouncing delivery bike representation */}
            <div className="flex items-center justify-center gap-1.5 py-1 px-4 bg-amber-50/45 rounded-lg border border-amber-100/20 w-fit mx-auto">
              <motion.span 
                animate={{ x: [-2, 2], y: [0, -1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="text-base"
              >
                🏍️
              </motion.span>
              <span className="text-[10px] text-amber-800 font-bold tracking-tight">Rider is cooking/preparing package...</span>
            </div>

            <p className="text-[10px] text-gray-400 font-bold italic leading-tight">
              Hamara staff order confirm karne k liye jald call karega. Aap live order track bhi kr sakte hain.
            </p>

            <motion.div 
              className="flex gap-2"
              initial={{ scale: 0.98 }}
              animate={{ scale: [0.98, 1.01, 0.98] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <button
                type="button"
                onClick={() => {
                  setOrderSuccessModal(false);
                  setPlacedOrder(null);
                  setActiveTab('tracking');
                }}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
              >
                Track Order Live / Status Dekhein ➔
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// 📋 NESTABLE CLIENT LIVE ORDER TRACKER VIEW
function OrderTrackerView() {
  const [localOrderIds, setLocalOrderIds] = useState<string[]>([]);
  const [syncedOrders, setSyncedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from LocalStorage
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem('dadu247_order_ids') || '[]');
    setLocalOrderIds(ids);
  }, []);

  // Poll Orders from Firestore and matches local Storage ID list
  useEffect(() => {
    const unsub = subscribeToOrders((allOrders) => {
      const ids = JSON.parse(localStorage.getItem('dadu247_order_ids') || '[]');
      const matched = allOrders.filter(o => ids.includes(o.id));
      setSyncedOrders(matched);
      setLoading(false);
    });
    return unsub;
  }, []);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200/50';
      case 'Accepted': return 'bg-blue-100 text-blue-800 border-blue-200/50';
      case 'Preparing': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Out for Delivery': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200/50';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-250';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusProgress = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 15;
      case 'Accepted': return 40;
      case 'Preparing': return 65;
      case 'Out for Delivery': return 85;
      case 'Completed': return 100;
      case 'Cancelled': return 0;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-gray-500 text-xs">Connecting to rider dispatch metrics...</p>
      </div>
    );
  }

  if (syncedOrders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center max-w-md mx-auto">
        <span className="text-5xl block mb-3">🛵</span>
        <h3 className="font-bold text-gray-800 text-lg">No Orders Placed Yet</h3>
        <p className="text-xs text-gray-500 mt-1">Aap ki local browser stream par koyi order maujood nahi hai.</p>
        <p className="text-[10px] text-gray-400 mt-1">Jab aap is mobile ya device se order place krtay hain, tou complete real-time status yahan show hota hai.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {syncedOrders.map((order) => (
        <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs relative overflow-hidden">
          {order.status !== 'Completed' && order.status !== 'Cancelled' && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100">
              <div 
                className="h-full bg-linear-to-r from-amber-400 to-amber-600 transition-all duration-1000"
                style={{ width: `${getStatusProgress(order.status)}%` }}
              />
            </div>
          )}

          {/* Card Top Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-4 mb-4 mt-1.5">
            <div>
              <span className="text-xs font-mono font-black text-gray-400 uppercase tracking-widest">
                Order ID: #{order.id.substring(0, 8)}
              </span>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">
                Saved time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(order.createdAt).toLocaleDateString()})
              </p>
            </div>

            <span className={`px-3 py-1 text-xs font-black rounded-full border ${getStatusColor(order.status)} uppercase tracking-wider text-center`}>
              {order.status === 'Completed' ? '✅ Completed / Delivered' : order.status}
            </span>
          </div>

          {/* Dispatch Metrics progress items */}
          {order.status !== 'Cancelled' && (
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-extrabold uppercase tracking-wider text-gray-400 border-b border-gray-50 pb-4 mb-4">
              <div className={order.status === 'Pending' ? 'text-yellow-600 font-black scale-105' : 'text-gray-900'}>
                <span className="block text-base">⏳</span>
                Pending
              </div>
              <div className={order.status === 'Accepted' || order.status === 'Preparing' ? 'text-orange-600 font-black scale-105' : syncedOrders.some(x => ['Accepted','Preparing','Out for Delivery','Completed'].includes(order.status)) ? 'text-gray-900 font-bold' : ''}>
                <span className="block text-base">👨‍🍳</span>
                Preparing
              </div>
              <div className={order.status === 'Out for Delivery' ? 'text-purple-600 font-black scale-105' : syncedOrders.some(x => ['Out for Delivery','Completed'].includes(order.status)) ? 'text-gray-900 font-bold' : ''}>
                <span className="block text-base">🏍️</span>
                Out for Ride
              </div>
              <div className={order.status === 'Completed' ? 'text-emerald-600 font-black scale-105' : ''}>
                <span className="block text-base">🎁</span>
                Received
              </div>
            </div>
          )}

          {/* Details list of items inside orders */}
          <div className="space-y-3.5">
            <div>
              <span className="text-[10px] font-mono font-extrabold text-gray-400 uppercase tracking-wider block">Items Placed</span>
              <div className="mt-1 space-y-1 bg-gray-50 rounded-xl p-3 text-xs text-gray-700">
                {order.items.map((i) => (
                  <div key={i.id} className="flex justify-between font-medium">
                    <span>{i.quantity}x {i.name} ({i.type})</span>
                    <span className="font-extrabold text-gray-950">Rs. {i.price * i.quantity}</span>
                  </div>
                ))}
                <div className="border-t border-gray-150 pt-1.5 mt-1.5 flex justify-between font-black text-amber-700 text-sm">
                  <span>Pay Rider on Delivery:</span>
                  <span className="text-gray-950">Rs. {order.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Address fields representation for proof */}
            <div className="grid sm:grid-cols-2 gap-3 text-xs bg-amber-50/15 p-3 rounded-xl border border-amber-100/30">
              <div>
                <span className="text-[10px] font-bold text-gray-400 block">Deliver To / Phone</span>
                <p className="font-extrabold text-gray-800">{order.customerName}</p>
                <p className="font-semibold text-gray-500 font-mono mt-0.5">{order.phoneNumber}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 block">Dadu Address</span>
                <p className="font-bold text-gray-800 leading-tight">{order.deliveryAddress}</p>
                {order.nearestLandmark && (
                  <p className="text-[10px] text-amber-600 font-extrabold mt-0.5"> Landmark: {order.nearestLandmark}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
