"use client"

import React, { useState, useEffect } from 'react';
import { Heart, MapPin, DollarSign, Home as HomeIcon, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { AuthGuard } from '@/components/auth-guard';
import Image from 'next/image';
import { SearchBar } from '@/components/search-bar';

//  ใช้ค่าจาก env หรือ default 8080
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// --- Interfaces ---
interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  description: string;
  image: string;
}

interface Favorite {
  id: number;
  userId: number;
  propertyId: number;
  createdAt: string;
}

// --- Favorites Store (Session Based) ---
interface FavoritesState {
  favorites: Set<number>;
  loadFavorites: (userId: number) => Promise<void>;
  toggleFavorite: (userId: number, propertyId: number) => Promise<void>;
}

const createStore = <T extends object>(initialState: T) => {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (updates: Partial<T>) => {
      state = { ...state, ...updates };
      listeners.forEach(listener => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
};

const useStore = <T extends object>(store: ReturnType<typeof createStore<T>>) => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    return store.subscribe(() => forceUpdate({}));
  }, [store]);

  return store.getState();
};

const STORAGE_KEY = (userId: number) => `favorites_user_${userId}`;

const favoritesStore = createStore<FavoritesState>({
  favorites: new Set(),

  loadFavorites: async (userId: number) => {
    // 1. โหลดจาก LocalStorage ก่อน (เร็ว)
    const localData = localStorage.getItem(STORAGE_KEY(userId));
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
           favoritesStore.setState({ favorites: new Set(parsed) });
        }
      } catch (e) {
        console.error("Local storage parse error", e);
      }
    }

    // 2. โหลดจาก Server (Session Based)
    try {
      const res = await fetch(`${API_URL}/favorites/${userId}`, {
        // สำคัญ: ส่ง Cookie/Session ไปด้วย
        credentials: 'include' 
      });
      
      if (!res.ok) return;

      const data: Favorite[] = await res.json();
      const serverSet = new Set<number>(data.map((f) => f.propertyId));

      favoritesStore.setState({ favorites: serverSet });
      localStorage.setItem(STORAGE_KEY(userId), JSON.stringify([...serverSet]));
    } catch (error) {
      console.warn('Background sync failed, using local data');
    }
  },

  toggleFavorite: async (userId: number, propertyId: number) => {
    const { favorites } = favoritesStore.getState();
    const oldFavorites = new Set(favorites); // เก็บค่าเก่าไว้ Rollback

    // 1. Optimistic Update (เปลี่ยนสีทันที)
    const isFavorite = favorites.has(propertyId);
    const newFavorites = new Set(favorites);
    if (isFavorite) {
      newFavorites.delete(propertyId);
    } else {
      newFavorites.add(propertyId);
    }
    favoritesStore.setState({ favorites: newFavorites });

    try {
      // ✅ เช็คว่ามี User ID ไหม
      if (!userId) {
         throw new Error("User not found");
      }

      const res = await fetch(`${API_URL}/favorites`, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { 
            'Content-Type': 'application/json',
            //ใช้ Session Cookie แทนการส่ง Token
        },
        credentials: 'include', //สำคัญ: ส่ง Cookie/Session ไปยืนยันตัวตน
        body: JSON.stringify({ userId, propertyId })
      });

      // ถ้า Session หมดอายุ หรือ Server ตอบกลับมาว่า Error
      if (!res.ok) {
         if (res.status === 401 || res.status === 403) {
             alert('Session expired. Please login again.');
             window.location.href = '/login';
             return;
         }
         throw new Error('Server reject');
      }

      // ถ้าสำเร็จ อัปเดต LocalStorage
      localStorage.setItem(STORAGE_KEY(userId), JSON.stringify([...newFavorites]));

    } catch (error) {
      console.error('Action failed:', error);
      // Rollback ค่ากลับเป็นเหมือนเดิม
      favoritesStore.setState({ favorites: oldFavorites });
      
      if (error instanceof Error && error.message === "User not found") {
        alert("Please sign in to manage favorites.");
      } else {
        console.error("Connection failed. Please try again.");
      }
    }
  }
});

// --- Property Card Component ---
const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
  const { user } = useAuth();
  const favs = useStore(favoritesStore);
  const isFavorite = favs.favorites.has(property.id);

  const handleToggleFavorite = () => {
    if (user) {
      favs.toggleFavorite(user.id, property.id);
    } else {
      alert("Please sign in to add favorites");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
      <div className="relative h-48 w-full">
        <Image
          src={property.image}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <button
          onClick={handleToggleFavorite}
          className={`absolute top-3 right-3 p-2 rounded-full ${
            isFavorite
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-gray-600 hover:bg-white'
          } transition-all shadow-sm hover:shadow-md`}
        >
          <Heart className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate">
          {property.title}
        </h3>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-1 shrink-0" />
          <span className="text-sm truncate">{property.location}</span>
        </div>

        <div className="flex items-center text-indigo-600 font-bold text-lg">
          <DollarSign className="h-5 w-5" />
          <span>{property.price.toLocaleString()}</span>
        </div>

        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{property.description}</p>
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---
function Dashboard() {
  const { user, logout } = useAuth();
  const favs = useStore(favoritesStore);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for Filter & Search
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/properties`);
      const data = await res.json();
      setProperties(data);

      if (user) {
        await favs.loadFavorites(user.id);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
      alert('Failed to load properties. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Logic กรองข้อมูล (Case Insensitive + Trim)
  const filteredProperties = properties.filter(p => {
    // 1. กรองตาม Tab
    const matchesTab = filter === 'all' || favs.favorites.has(p.id);

    // 2. กรองตามคำค้นหา (ทำเป็นตัวพิมพ์เล็กทั้งหมดก่อนเทียบ)
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      (p.title?.toLowerCase() || '').includes(query) ||
      (p.location?.toLowerCase() || '').includes(query) ||
      (p.description?.toLowerCase() || '').includes(query);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <HomeIcon className="h-8 w-8 text-indigo-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800 hidden sm:block">RealEstate</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
              <User className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">{user?.email?.split('@')[0]}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-indigo-600 pb-16 pt-8 px-4">
         <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-white text-3xl font-bold mb-2">Find Your Dream Home</h2>
            <p className="text-indigo-100 text-lg">Search properties by location, name, or description</p>
         </div>
      </div>

      {/* Search Bar (วางซ้อน Banner) */}
      <SearchBar onSearch={(query) => setSearchQuery(query)} />

      {/* Filter Tabs */}
      <div className="mt-8 max-w-7xl mx-auto px-4">
        <div className="flex gap-6 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`pb-3 font-medium text-lg transition-colors border-b-2 ${
              filter === 'all'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            All Properties <span className="text-sm ml-1 bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{properties.length}</span>
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`pb-3 font-medium text-lg transition-colors border-b-2 flex items-center gap-2 ${
              filter === 'favorites'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Favorites <span className="text-sm ml-1 bg-red-100 px-2 py-0.5 rounded-full text-red-600">{favs.favorites.size}</span>
          </button>
        </div>
      </div>

      {/* Properties Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-medium text-gray-900">No properties found</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              {searchQuery 
                ? `We couldn't find anything matching "${searchQuery}". Try changing your keywords.`
                : filter === 'favorites'
                  ? 'You haven\'t added any favorites yet. Browse properties and click the heart icon!'
                  : 'No properties available at the moment.'}
            </p>
            {searchQuery && (
               <button 
                 onClick={() => setSearchQuery('')}
                 className="mt-6 text-indigo-600 font-semibold hover:text-indigo-700 hover:underline"
               >
                 Clear Search
               </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Main Page with AuthGuard
export default function Home() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}