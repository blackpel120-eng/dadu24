import React, { useState, useEffect } from 'react';
import { FoodItem, ElectricianService, Order, OrderStatus, RegisteredUser } from '../types';
import { 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Clipboard, 
  Check, 
  AlertTriangle,
  FileText,
  Utensils,
  Wrench,
  Sparkles,
  RefreshCw,
  Phone,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { 
  addFoodItem, 
  updateFoodItem, 
  deleteFoodItem, 
  addElectricianService, 
  updateElectricianService, 
  deleteElectricianService, 
  updateOrderStatus,
  subscribeToFoods,
  subscribeToServices,
  subscribeToOrders,
  subscribeToRegisteredUsers,
  seedDatabaseIfEmpty,
  PRESET_FOODS,
  PRESET_SERVICES,
  updateDeliveryFee,
  subscribeToDeliveryFee
} from '../lib/firebase';

// Beautiful ready-to-use Preset Image Suggestion lists to make inputs extremely fast was requested
const FOOD_IMAGE_SUGGESTIONS = [
  { name: '🍳 Biryani', url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=600&auto=format&fit=crop' },
  { name: '🍔 Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop' },
  { name: '🍢 Seekh Kebab / Tikka', url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=600&auto=format&fit=crop' },
  { name: '🍛 Salan / Gravy', url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=600&auto=format&fit=crop' },
  { name: '🍕 Pizza Slices', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop' },
  { name: '🍨 Local Desserts', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=600&auto=format&fit=crop' },
  { name: '🥤 Pakola / Beverages', url: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?q=80&w=600&auto=format&fit=crop' },
  { name: '🍟 Fries Side', url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=600&auto=format&fit=crop' }
];

const SERVICE_IMAGE_SUGGESTIONS = [
  { name: '❄️ AC/Cooling', url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=600&auto=format&fit=crop' },
  { name: '🔌 Fault Finding / Board', url: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?q=80&w=600&auto=format&fit=crop' },
  { name: '🔋 UPS / Battery', url: 'https://images.unsplash.com/photo-1558489823-3b767c600262?q=80&w=600&auto=format&fit=crop' },
  { name: '💡 Fan & Lighting', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop' },
  { name: '🚜 Generator Check', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=600&auto=format&fit=crop' }
];

export default function AdminPanel() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [services, setServices] = useState<ElectricianService[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);

  const [activeFormTab, setActiveFormTab] = useState<'orders' | 'manage_foods' | 'manage_services' | 'customers' | 'settings'>('orders');

  // Delivery Setting State
  const [adminDeliveryFee, setAdminDeliveryFee] = useState<string>('60');
  const [updatingFee, setUpdatingFee] = useState<boolean>(false);

  const displayFoods = foods.length > 0 ? foods : PRESET_FOODS.map((item, index) => ({ ...item, id: `preset-food-${index}` } as FoodItem));
  const isFoodsFallback = foods.length === 0;

  const displayServices = services.length > 0 ? services : PRESET_SERVICES.map((item, index) => ({ ...item, id: `preset-service-${index}` } as ElectricianService));
  const isServicesFallback = services.length === 0;

  // Food Form State
  const [foodName, setFoodName] = useState('');
  const [foodPrice, setFoodPrice] = useState('');
  const [foodDesc, setFoodDesc] = useState('');
  const [foodCategory, setFoodCategory] = useState('Biryani');
  const [foodImg, setFoodImg] = useState(FOOD_IMAGE_SUGGESTIONS[0].url);
  const [foodCount, setFoodCount] = useState(0);

  // Electrician Form State
  const [srvName, setSrvName] = useState('');
  const [srvPrice, setSrvPrice] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvCategory, setSrvCategory] = useState('AC & Cooling');
  const [srvImg, setSrvImg] = useState(SERVICE_IMAGE_SUGGESTIONS[0].url);

  // Alerts/Statuses indicators
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const handleRestoreDefaults = async () => {
    setSeeding(true);
    try {
      await seedDatabaseIfEmpty();
      triggerSuccess("Baseline menu items and electrician packages synced in Firestore!");
    } catch (err) {
      triggerError("Restoring default data failed. Verify Firebase configuration.");
    } finally {
      setSeeding(false);
    }
  };

  // Monitor Collections in real-time
  useEffect(() => {
    const unsubFoods = subscribeToFoods((data) => setFoods(data));
    const unsubServices = subscribeToServices((data) => setServices(data));
    const unsubOrders = subscribeToOrders((data) => setOrders(data));
    const unsubUsers = subscribeToRegisteredUsers((data) => setRegisteredUsers(data));
    const unsubFee = subscribeToDeliveryFee((amount) => {
      setAdminDeliveryFee(amount.toString());
    });

    return () => {
      unsubFoods();
      unsubServices();
      unsubOrders();
      unsubUsers();
      unsubFee();
    };
  }, []);

  const handleUpdateDeliverySetting = async (e: React.FormEvent) => {
    e.preventDefault();
    const feeNum = parseFloat(adminDeliveryFee);
    if (isNaN(feeNum) || feeNum < 0) {
      triggerError("Specify a valid positive delivery charge!");
      return;
    }
    setUpdatingFee(true);
    try {
      await updateDeliveryFee(feeNum);
      triggerSuccess(`Delivery charges successfully set to Rs. ${feeNum}!`);
    } catch (err) {
      triggerError("Failed to update delivery charges. Try again!");
    } finally {
      setUpdatingFee(false);
    }
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3050);
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 3050);
  };

  // Add Food Item Submit Handlers
  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !foodPrice || !foodDesc) {
      triggerError("Fill all food criteria fields before saving!");
      return;
    }

    const priceNum = parseFloat(foodPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      triggerError("Specify a valid positive Rupees value!");
      return;
    }

    try {
      await addFoodItem({
        name: foodName,
        price: priceNum,
        description: foodDesc,
        category: foodCategory,
        imageUrl: foodImg || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500',
        isAvailable: true
      });

      setFoodName('');
      setFoodPrice('');
      setFoodDesc('');
      triggerSuccess(`Successfully added menu dish: "${foodName}" to list!`);
    } catch (err) {
      triggerError("Could not save to remote database. check network!");
    }
  };

  // Add Electrician Service Submit Handlers
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvName || !srvPrice || !srvDesc) {
      triggerError("Supply all electrician checklist metadata details!");
      return;
    }

    const priceNum = parseFloat(srvPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      triggerError("Specify a valid electrical diagnostic base cost!");
      return;
    }

    try {
      await addElectricianService({
        name: srvName,
        basePrice: priceNum,
        description: srvDesc,
        category: srvCategory,
        imageUrl: srvImg || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=500',
        isAvailable: true
      });

      setSrvName('');
      setSrvPrice('');
      setSrvDesc('');
      triggerSuccess(`Certified Electrician Skill Added: "${srvName}"`);
    } catch (err) {
      triggerError("Could not add electrician diagnostic package!");
    }
  };

  // Switch availability of item
  const toggleFoodAvailability = async (id: string, current: boolean) => {
    if (id.startsWith('preset-')) {
      triggerError("Please click 'Seed & Sync Defaults' first to edit default items!");
      return;
    }
    try {
      await updateFoodItem(id, { isAvailable: !current });
      triggerSuccess("Updated food availability state.");
    } catch (err) {
      triggerError("Could not update food state.");
    }
  };

  const toggleServiceAvailability = async (id: string, current: boolean) => {
    if (id.startsWith('preset-')) {
      triggerError("Please click 'Seed & Sync Defaults' first to edit electrician service!");
      return;
    }
    try {
      await updateElectricianService(id, { isAvailable: !current });
      triggerSuccess("Updated electrician availability state.");
    } catch (err) {
      triggerError("Could not update electrician schedule!");
    }
  };

  // Deletion logic
  const handleRemoveFood = async (id: string, name: string) => {
    if (id.startsWith('preset-')) {
      triggerError("Please click 'Seed & Sync Defaults' first to delete default items!");
      return;
    }
    if (!window.confirm(`Delete "${name}" from server list?`)) return;
    try {
      await deleteFoodItem(id);
      triggerSuccess(`Deleted food item: ${name}`);
    } catch (err) {
      triggerError("Deletion failed. Wait & check logs.");
    }
  };

  const handleRemoveService = async (id: string, name: string) => {
    if (id.startsWith('preset-')) {
      triggerError("Please click 'Seed & Sync Defaults' first to delete electrician service!");
      return;
    }
    if (!window.confirm(`Delete "${name}" service pack?`)) return;
    try {
      await deleteElectricianService(id);
      triggerSuccess(`Deleted service: ${name}`);
    } catch (err) {
      triggerError("Deletion failed.");
    }
  };

  // Update status code for live billing dispatcher
  const handleOrderStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      triggerSuccess(`Order #${orderId.substring(0,6)} advanced to status: "${newStatus}"!`);
    } catch (err) {
      triggerError("Could not save status updates.");
    }
  };

  // 📝 GENERATOR: COPY SLIP FOR Delivery Rider on WhatsApp
  const handleCopyRiderCode = (order: Order) => {
    const formattedDate = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let slipText = `🏍️ *DADU 24#7 SHIPPING SLIP*\n`;
    slipText += `===============================\n`;
    slipText += `👤 CUSTOMER: *${order.customerName}*\n`;
    slipText += `📞 PHONE: *${order.phoneNumber}*\n`;
    slipText += `📍 DADU ADDRESS: *${order.deliveryAddress}*\n`;
    if (order.nearestLandmark) {
      slipText += `🏫 LANDMARK: *${order.nearestLandmark}*\n`;
    }
    slipText += `===============================\n`;
    slipText += `📦 ITEMS ORDERED:\n`;
    order.items.forEach((item) => {
      slipText += ` - ${item.quantity}x ${item.name} (Rs. ${item.price * item.quantity})\n`;
    });
    slipText += `===============================\n`;
    slipText += `💵 PAY TO DISPATCHER (COD): *Rs. ${order.totalAmount}*\n`;
    if (order.orderNotes) {
      slipText += `📝 DISPATCH NOTES: "${order.orderNotes}"\n`;
    }
    slipText += `===============================\n`;
    slipText += `⏰ Placed at: ${formattedDate} (${new Date(order.createdAt).toLocaleDateString()})\n`;
    slipText += `*Please call customer before arriving*`;

    navigator.clipboard.writeText(slipText).then(() => {
      setCopiedId(order.id);
      triggerSuccess("Rider dispatch clip copied to clipboard! Ready to paste into WhatsApp.");
      setTimeout(() => setCopiedId(null), 3500);
    }).catch(() => {
      triggerError("Clipboard copy blocked by browser. Drag select and copy text below!");
    });
  };

  // Calculates financial states
  const totalSalesOfAllCompletedOrders = orders
    .filter(o => o.status === 'Completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingConfirmationLength = orders.filter(o => o.status === 'Pending').length;
  const dispatchActiveLength = orders.filter(o => ['Accepted', 'Preparing', 'Out for Delivery'].includes(o.status)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* HEADER STATEMENT OF ADMIN CONTROL PANEL */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-200 pb-5 mb-8 gap-4">
        <div>
          <span className="text-xs font-mono font-black py-1 px-2.5 bg-red-100 text-red-700 rounded-full inline-block mb-1">
            SECRET LEVEL PORTAL ACCESS (dadu 24#7)
          </span>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            🛠️ Main Store Control Room
          </h2>
          <p className="text-xs text-gray-500">Live order details, menu creation checklist, electrician dispatch matrices.</p>
        </div>

        {/* Form sub tabs selector */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-full md:w-auto">
          <button
            onClick={() => setActiveFormTab('orders')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeFormTab === 'orders' 
                ? 'bg-white text-gray-950 shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📋 Live Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveFormTab('manage_foods')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeFormTab === 'manage_foods' 
                ? 'bg-white text-gray-950 shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            🍔 Edit Food Menu ({foods.length})
          </button>
          <button
            onClick={() => setActiveFormTab('manage_services')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeFormTab === 'manage_services' 
                ? 'bg-white text-gray-950 shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            ⚡ Electricians ({services.length})
          </button>
          <button
            onClick={() => setActiveFormTab('customers')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeFormTab === 'customers' 
                ? 'bg-white text-gray-950 shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            👥 Customers ({registeredUsers.length})
          </button>
          <button
            onClick={() => setActiveFormTab('settings')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeFormTab === 'settings' 
                ? 'bg-white text-gray-950 shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            ⚙️ Delivery Charges
          </button>
        </div>
      </div>

      {/* METRICS DASHBOARD - PRECISE COUNTERS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Completed Sales</p>
            <span className="text-lg font-black text-gray-900 block mt-1">Rs. {totalSalesOfAllCompletedOrders}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
            <Clipboard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none font-sans">Pending Ring</p>
            <span className="text-lg font-black text-amber-500 block mt-0.5 animate-pulse">{pendingConfirmationLength} Orders</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Active Dispatch</p>
            <span className="text-lg font-black text-orange-600 block mt-0.5">{dispatchActiveLength} In-progress</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Catalog Depth</p>
            <span className="text-lg font-black text-blue-700 block mt-0.5">{foods.length + services.length} items live</span>
          </div>
        </div>
      </div>

      {/* DYNAMIC ALERT POPUPS */}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 rounded-r-xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <Check className="w-4 h-4 text-emerald-500" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 border-l-4 border-red-500 rounded-r-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          {errorMessage}
        </div>
      )}

      {/* TAB CONTENT: 1. ORDERS LIST & ACTIONS */}
      {activeFormTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-gray-950 flex items-center gap-1.5">
              📋 Live Orders Feed
            </h3>
            <span className="px-2.5 py-1 bg-red-50 text-red-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
              {orders.length} orders total
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-150 p-16 text-center max-w-md mx-auto">
              <span className="text-5xl block mb-3">🔔</span>
              <h4 className="font-bold text-gray-800 text-lg">No Orders Placed Yet</h4>
              <p className="text-xs text-gray-500 mt-1">Client application jab user side se log order karenge to aapko dher saare live requests yahan dikhenge.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {orders.map((order) => {
                const isItemCopied = copiedId === order.id;

                return (
                  <div 
                    key={order.id} 
                    className={`bg-white rounded-2xl border ${
                      order.status === 'Pending' 
                        ? 'border-yellow-300 ring-2 ring-yellow-400/25 shadow-yellow-50/50' 
                        : 'border-gray-100 shadow-xs'
                    } p-5 grid lg:grid-cols-12 gap-5 transition-all duration-300 relative`}
                  >
                    {/* Urgency signal dot */}
                    {order.status === 'Pending' && (
                      <div className="absolute top-4 right-4 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                      </div>
                    )}

                    {/* Column A: USER DETAILS (4 columns) */}
                    <div className="lg:col-span-4 space-y-4">
                      <div>
                        <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest block">Customer Info</span>
                        <h4 className="font-black text-gray-900 text-base leading-tight mt-0.5">{order.customerName}</h4>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <a 
                            href={`tel:${order.phoneNumber}`} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100 hover:bg-amber-100 active:scale-95 transition"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {order.phoneNumber}
                          </a>
                        </div>
                      </div>

                      <div className="space-y-1.5 bg-gray-50/70 rounded-xl p-3 text-xs border border-gray-100">
                        <div className="flex items-start gap-1.5 text-gray-700">
                          <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold block text-gray-400 text-[10px] uppercase leading-none">Address</span>
                            <span className="font-bold text-gray-800 leading-normal">{order.deliveryAddress}</span>
                          </div>
                        </div>

                        {order.nearestLandmark && (
                          <div className="text-amber-800 font-extrabold pl-5 text-[11px] bg-amber-50/30 p-1.5 rounded-md">
                            🏛️ Landmark: {order.nearestLandmark}
                          </div>
                        )}

                        {order.orderNotes && (
                          <div className="text-gray-500 pl-5 text-[11px] italic mt-1 bg-white p-1.5 rounded border border-gray-50">
                            💬 Notes: "{order.orderNotes}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column B: ORDERED ITEMS & RECEIPT (4 columns) */}
                    <div className="lg:col-span-4 space-y-3.5">
                      <div>
                        <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest block">Ordered Items Detail</span>
                        <div className="mt-1.5 space-y-1.5">
                          {order.items.map((it) => (
                            <div key={it.id} className="flex items-start justify-between text-xs text-gray-800 bg-gray-50/50 p-2 rounded-lg border border-gray-50">
                              <div>
                                <span className="font-black text-amber-600">{it.quantity}x</span>
                                <span className="ml-1.5 font-bold">{it.name}</span>
                                <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">{it.type} item</span>
                              </div>
                              <span className="font-extrabold text-gray-900">Rs. {it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 bg-amber-50 rounded-xl text-xs space-y-1 text-amber-900 font-semibold border border-amber-100/40">
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Payment Choice:</span>
                          <span className="font-extrabold underline block">CASH ON DELIVERY (COD)</span>
                        </div>
                        <div className="flex justify-between text-gray-800 font-extrabold text-sm pt-2 border-t border-amber-100">
                          <span>Cash to Collect:</span>
                          <span className="text-gray-950 font-black text-base">Rs. {order.totalAmount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Column C: WORKFLOW STATUS ACTIONS & WhatsApp SLIP (4 columns) */}
                    <div className="lg:col-span-4 flex flex-col justify-between gap-4 bg-gray-50/30 p-3 rounded-xl border border-gray-100/50">
                      
                      {/* Live Selector Button */}
                      <div>
                        <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest block mb-2">Live Order Station</span>
                        
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => handleOrderStatusChange(order.id, 'Pending')}
                            className={`py-1.5 text-xs font-bold rounded-lg border ${
                              order.status === 'Pending' 
                                ? 'bg-yellow-400 border-yellow-500 text-yellow-950 shadow-sm' 
                                : 'bg-white border-gray-150 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            ⏳ Pending
                          </button>
                          <button
                            onClick={() => handleOrderStatusChange(order.id, 'Accepted')}
                            className={`py-1.5 text-xs font-bold rounded-lg border ${
                              order.status === 'Accepted' 
                                ? 'bg-blue-500 border-blue-650 text-white shadow-sm' 
                                : 'bg-white border-gray-150 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            👨‍🍳 Accept
                          </button>
                          <button
                            onClick={() => handleOrderStatusChange(order.id, 'Preparing')}
                            className={`py-1.5 text-xs font-bold rounded-lg border ${
                              order.status === 'Preparing' 
                                ? 'bg-orange-500 border-orange-655 text-white shadow-sm' 
                                : 'bg-white border-gray-150 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            🔥 Preparing
                          </button>
                          <button
                            onClick={() => handleOrderStatusChange(order.id, 'Out for Delivery')}
                            className={`py-1.5 text-xs font-bold rounded-lg border ${
                              order.status === 'Out for Delivery' 
                                ? 'bg-purple-600 border-purple-750 text-white shadow-sm' 
                                : 'bg-white border-gray-150 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            🏍️ Dispatch
                          </button>
                        </div>

                        {/* Critical End Conditions */}
                        <div className="grid grid-cols-2 gap-1.5 mt-2">
                          <button
                            onClick={() => handleOrderStatusChange(order.id, 'Completed')}
                            className={`py-2 text-xs font-extrabold rounded-xl border ${
                              order.status === 'Completed' 
                                ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm' 
                                : 'bg-emerald-50 border-emerald-100 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            ✅ Complete
                          </button>
                          <button
                            onClick={() => handleOrderStatusChange(order.id, 'Cancelled')}
                            className={`py-2 text-xs font-bold rounded-xl border ${
                              order.status === 'Cancelled' 
                                ? 'bg-red-600 border-red-700 text-white shadow-sm' 
                                : 'bg-red-50 border-red-100 text-red-800 hover:bg-red-100'
                            }`}
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>

                      {/* AMAZING WhatsApp SLIP Dispatcher FOR SOLO OWNER (rider ko btao!) */}
                      <div className="pt-2.5 border-t border-gray-150">
                        <button
                          onClick={() => handleCopyRiderCode(order)}
                          className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                            isItemCopied 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/10'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          {isItemCopied ? 'Copied Details! ✔️' : 'Copy Dispatch Note (Rider WhatsApp)'}
                        </button>
                        <p className="text-[9px] text-gray-500 font-medium text-center mt-1">
                          Clicking this copies ready-made address + items detail to send to Rider via Whatsapp!
                        </p>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 2. FOOD MENU BUILDER & MANAGEMENT */}
      {activeFormTab === 'manage_foods' && (
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Menu Form Input (5 columns) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-6 shadow-xs h-fit sticky top-24">
            <h3 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-1.5">
              <Utensils className="w-5 h-5 text-amber-500" /> Save New Food Dish
            </h3>

            <form onSubmit={handleAddFood} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Food Item Name *
                </label>
                <input
                  type="text"
                  placeholder="E.g., Special Sindhi Beef Biryani"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-35">
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    Price (PKR Rupees) *
                  </label>
                  <input
                    type="number"
                    placeholder="E.g., 350"
                    value={foodPrice}
                    onChange={(e) => setFoodPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={foodCategory}
                    onChange={(e) => setFoodCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                  >
                    <option value="Biryani">Biryani 🍳</option>
                    <option value="Desi Salan">Desi Salan 🍛</option>
                    <option value="Fast Food">Fast Food 🍔</option>
                    <option value="Desi Fast Food">Desi Fast Food 🍢</option>
                    <option value="Sweets">Sweets 🍨</option>
                    <option value="Beverages">Beverages 🥤</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Short Description *
                </label>
                <textarea
                  placeholder="E.g., Garam garam pathan ki biryani layered with rice, meat, and dry spices."
                  value={foodDesc}
                  onChange={(e) => setFoodDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm h-16 resize-none"
                  required
                />
              </div>

              {/* Picture Source */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1 flex justify-between">
                  <span>Food Image URL *</span>
                  <span className="text-[10px] text-amber-600 font-bold">Suggested Presets 👇</span>
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={foodImg}
                  onChange={(e) => setFoodImg(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs font-mono"
                  required
                />

                {/* Preselected Preset buttons */}
                <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                  {FOOD_IMAGE_SUGGESTIONS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFoodImg(preset.url)}
                      className={`text-[9px] font-extrabold py-1 px-1.5 rounded-md border text-center whitespace-nowrap overflow-hidden text-ellipsis ${
                        foodImg === preset.url 
                          ? 'bg-amber-100 border-amber-400 text-amber-800' 
                          : 'bg-gray-50 border-gray-150 text-gray-600 hover:bg-gray-100'
                      }`}
                      title={preset.name}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm uppercase rounded-xl transition shadow-md shadow-amber-500/10 active:scale-95 flex items-center justify-center gap-1.5 mt-2"
              >
                <Plus className="w-4 h-4" /> Save Food Item To Catalog
              </button>
            </form>
          </div>

          {/* Current Food Items listing (7 columns) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-1.5">
              🍔 Currently Active Menu Items
            </h3>

            {isFoodsFallback && (
              <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 text-xs text-amber-900 font-semibold space-y-2 mb-2">
                <p className="flex items-center gap-1.5 font-bold text-amber-800">
                  ⚠️ Default Local Presets Mode (Read-Only)
                </p>
                <p className="font-normal text-[11.5px] text-amber-700 leading-relaxed font-sans">
                  Aapke server-side database (Firestore) me koi items active nahi hain. Neeche default previews show ho rahe hain. Inhe custom add, edit ya delete karne ke liye backup baseline initialize karein:
                </p>
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  disabled={seeding}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition cursor-pointer active:scale-95 inline-flex items-center gap-1.5 shadow-sm"
                >
                  {seeding ? "Restoring baseline..." : "⚡ Seed & Save Preset Foods To Firestore"}
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs divide-y divide-gray-55">
              {displayFoods.map((food) => (
                <div key={food.id} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition duration-150">
                  <img
                    src={food.imageUrl}
                    alt={food.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0 bg-gray-50 animate-none mt-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300';
                    }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[8px] font-black uppercase tracking-wider rounded border border-amber-100/40">
                        {food.category}
                      </span>
                      <span className={`text-[9px] font-bold ${food.isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                        ● {food.isAvailable ? 'In Stock' : 'Sold Out'}
                      </span>
                      {food.id.startsWith('preset-') && (
                        <span className="px-1.5 py-0.2 bg-gray-100 text-gray-500 text-[8px] font-bold uppercase rounded border border-gray-200">
                          PRESET
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-sm text-gray-900 mt-1 truncate">{food.name}</h4>
                    <p className="text-xs font-black text-gray-950 mt-0.5">Rs. {food.price}</p>
                  </div>

                  {/* Operational controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleFoodAvailability(food.id, food.isAvailable)}
                      className="p-1.5 text-gray-550 hover:bg-gray-50 hover:text-gray-950 rounded-lg"
                      title={food.isAvailable ? "Set Sold Out" : "Set In Stock"}
                    >
                      {food.isAvailable ? (
                        <ToggleRight className="w-7 h-7 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-gray-300" />
                      )}
                    </button>

                    <button
                      onClick={() => handleRemoveFood(food.id, food.name)}
                      className="p-2 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition"
                      title="Delete Permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: 3. ELECTRICIANS DIRECTORY & FORM */}
      {activeFormTab === 'manage_services' && (
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Professional Electrician Form (5 columns) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-6 shadow-xs h-fit sticky top-24">
            <h3 className="text-base font-black text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-1.5">
              <Wrench className="w-5 h-5 text-amber-500" /> Add Electrician Package
            </h3>

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Service Title *
                </label>
                <input
                  type="text"
                  placeholder="E.g., Special AC Split Service / Repair"
                  value={srvName}
                  onChange={(e) => setSrvName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-35">
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    Diagnostic Fee (Rs) *
                  </label>
                  <input
                    type="number"
                    placeholder="E.g., 600"
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    Class Category *
                  </label>
                  <select
                    value={srvCategory}
                    onChange={(e) => setSrvCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                  >
                    <option value="AC & Cooling">AC &amp; Cooling ⚡</option>
                    <option value="Fans & Lighting">Fans &amp; Lighting 💡</option>
                    <option value="UPS & Backup">UPS &amp; Backup 🔋</option>
                    <option value="House Wiring">House Wiring 🔌</option>
                    <option value="Appliances Repair">Appliances Repair ⚙️</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Skill description (What will mechanic fix?) *
                </label>
                <textarea
                  placeholder="E.g., Copper pipeline pressure checkup, complete gas charging with R22/R410 refill."
                  value={srvDesc}
                  onChange={(e) => setSrvDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm h-16 resize-none"
                  required
                />
              </div>

              {/* Service picture choice presets */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-1 flex justify-between">
                  <span>Display Illustrative URL *</span>
                  <span className="text-[10px] text-amber-600 font-bold font-sans">Stock presets 👇</span>
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash..."
                  value={srvImg}
                  onChange={(e) => setSrvImg(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs font-mono"
                  required
                />

                <div className="grid grid-cols-3 gap-1 mt-2">
                  {SERVICE_IMAGE_SUGGESTIONS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSrvImg(preset.url)}
                      className={`text-[9px] font-black py-1 px-1 rounded-md border truncate-text text-ellipsis ${
                        srvImg === preset.url 
                          ? 'bg-blue-100 border-blue-400 text-blue-800 font-semibold' 
                          : 'bg-gray-50 border-gray-150 text-gray-600 hover:bg-gray-100'
                      }`}
                      title={preset.name}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm uppercase rounded-xl transition shadow-md shadow-blue-500/10 active:scale-95 flex items-center justify-center gap-1.5 mt-2"
              >
                <Plus className="w-4 h-4" /> Launch Electrician Service
              </button>
            </form>
          </div>

          {/* Service listings (7 columns) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-1.5">
              ⚡ Launched Electrician Diagnostic Packages
            </h3>

            {isServicesFallback && (
              <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-5 text-xs text-blue-900 font-semibold space-y-2 mb-2">
                <p className="flex items-center gap-1.5 font-bold text-blue-800">
                  ⚠️ Default Local Electricians Mode (Read-Only)
                </p>
                <p className="font-normal text-[11.5px] text-blue-700 leading-relaxed font-sans">
                  Aapke server-side database (Firestore) me koi services active nahi hain. Neeche default diagnostic packages show ho rahe hain. Inhe edit, state change, ya delete karne ke liye server sync karein:
                </p>
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  disabled={seeding}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition cursor-pointer active:scale-95 inline-flex items-center gap-1.5 shadow-sm"
                >
                  {seeding ? "Restoring baseline..." : "⚡ Seed & Save Preset Services To Firestore"}
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs divide-y divide-gray-50">
              {displayServices.map((srv) => (
                <div key={srv.id} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition">
                  <img
                    src={srv.imageUrl}
                    alt={srv.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0 bg-gray-50"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=300';
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-black uppercase tracking-wider rounded border border-blue-105">
                        {srv.category}
                      </span>
                      <span className={`text-[9px] font-bold ${srv.isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                        ● {srv.isAvailable ? 'Accepting Orders' : 'Offline / busy'}
                      </span>
                      {srv.id.startsWith('preset-') && (
                        <span className="px-1.5 py-0.2 bg-gray-100 text-gray-500 text-[8px] font-bold uppercase rounded border border-gray-200">
                          PRESET
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-sm text-gray-900 mt-1 truncate">{srv.name}</h4>
                    <p className="text-xs font-black text-gray-950 mt-0.5">Rs. {srv.basePrice}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleServiceAvailability(srv.id, srv.isAvailable)}
                      className="p-1.5 text-gray-450 hover:text-gray-950 rounded-lg"
                      title={srv.isAvailable ? "Set Busy/Offline" : "Set Active"}
                    >
                      {srv.isAvailable ? (
                        <ToggleRight className="w-7 h-7 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-gray-300" />
                      )}
                    </button>

                    <button
                      onClick={() => handleRemoveService(srv.id, srv.name)}
                      className="p-2 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition"
                      title="Delete Permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: 4. REGISTERED CUSTOMERS DATABASE LIST */}
      {activeFormTab === 'customers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-gray-950 flex items-center gap-1.5">
                👥 Registered Customers (Phone Registry)
              </h3>
              <p className="text-xs text-gray-500 mt-1">Jab bhi naye users app me apna account details load/save karengay ya order place karay ge tou unki details automatic real-time yahan show hon gi.</p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider self-start sm:self-auto border border-amber-100">
              {registeredUsers.length} total registered
            </span>
          </div>

          {registeredUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-150 p-16 text-center max-w-sm mx-auto">
              <span className="text-5xl block mb-3 font-bold">🎯</span>
              <h4 className="font-bold text-gray-800 text-lg">No Users Registered Yet</h4>
              <p className="text-xs text-gray-500 mt-1">
                Jab direct phone number, naam ya user profile details load hon gi, tab yahan unka mobile sheet and location real-time show ho ga!
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 uppercase tracking-widest text-[9px] font-black text-gray-400">
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Phone Number / Calling</th>
                      <th className="p-4">Dadu Delivery Address</th>
                      <th className="p-4">Famous Landmark</th>
                      <th className="p-4">Registered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium text-gray-755">
                    {registeredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-amber-50/15 transition-colors">
                        <td className="p-4 font-extrabold text-gray-950 text-sm">
                          {user.customerName}
                        </td>
                        <td className="p-4">
                          <a 
                            href={`tel:${user.phoneNumber}`}
                            className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 font-mono font-bold hover:bg-amber-100 transition whitespace-nowrap"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {user.phoneNumber}
                          </a>
                        </td>
                        <td className="p-4 font-bold max-w-xs truncate" title={user.deliveryAddress}>
                          {user.deliveryAddress}
                        </td>
                        <td className="p-4 text-slate-550 font-extrabold">
                          {user.nearestLandmark ? (
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full text-[10px]">
                              🏛️ {user.nearestLandmark}
                            </span>
                          ) : (
                            <span className="text-gray-300 italic font-normal">None entered</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-[10px]">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 5. DELIVERY CHARGES CONFIGURATION PANEL */}
      {activeFormTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-gray-150 shadow-md p-6 max-w-xl mx-auto">
          <h3 className="text-lg font-black text-gray-950 mb-2 flex items-center gap-2">
            ⚙️ Delivery Charges Settings
          </h3>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Yahan se aap Dadu City ke food orders par flat delivery charges set kar sakte hain. Jab bhi customer buy karega ya order confirm karega, use direct yahi dynamic charges buy screen par lag kar total calculate ho ga.
          </p>

          <form onSubmit={handleUpdateDeliverySetting} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                Flat Delivery Fee (Rs. PKR)
              </label>
              <div className="relative rounded-xl overflow-hidden border border-gray-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-205 transition-all">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                  Rs.
                </span>
                <input
                  type="number"
                  value={adminDeliveryFee}
                  onChange={(e) => setAdminDeliveryFee(e.target.value)}
                  placeholder="e.g. 60"
                  className="w-full pl-12 pr-4 py-3 text-sm font-bold text-gray-800 bg-white focus:outline-hidden"
                  required
                  min="0"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingFee}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 font-extrabold text-white text-xs uppercase tracking-wider rounded-xl transition shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              {updatingFee ? 'Updating delivery charges...' : 'Save delivery charges'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
