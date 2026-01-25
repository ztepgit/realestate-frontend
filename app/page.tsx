"use client"

import React, { useState, useEffect } from 'react';
import { Heart, MapPin, DollarSign, Home as HomeIcon, LogOut, User, MessageCircle } from 'lucide-react'; // เพิ่ม MessageCircle
import { useAuth } from '@/context/auth-context';
import { AuthGuard } from '@/components/auth-guard';
import Image from 'next/image';
import { SearchBar } from '@/components/search-bar';
import { useRouter } from 'next/navigation';

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
  agentName: string;
  agentAvatar: string;
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
      // เรียก endpoint 'my-favorites' เพื่อดึงข้อมูลของ user ปัจจุบัน
      const res = await fetch(`${API_URL}/favorites/my-favorites`, {
        credentials: 'include' // ส่ง Session ไปด้วย
      });

      if (!res.ok) {
        console.warn("Server fetch failed:", res.status);
        return;
      }

      const data: Favorite[] = await res.json();
      const serverSet = new Set<number>(data.map((f) => f.propertyId));

      favoritesStore.setState({ favorites: serverSet });
      localStorage.setItem(STORAGE_KEY(userId), JSON.stringify([...serverSet]));
    } catch (error) {
      console.warn('Background sync failed', error);
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
      // ส่ง Request
      const res = await fetch(`${API_URL}/favorites`, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ propertyId }) 
      });

      if (!res.ok) {
        console.error("API Error Status:", res.status);
        
        if (res.status === 401 || res.status === 403) {
           alert("Session expired. Please login again.");
           // Rollback ค่ากลับ
           favoritesStore.setState({ favorites: oldFavorites });
           return;
        }

        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Server reject');
      }
      // Success: Update LocalStorage
      localStorage.setItem(STORAGE_KEY(userId), JSON.stringify([...newFavorites]));

    } catch (error) {
      console.error('Toggle failed:', error);
      // Rollback (เด้งกลับ) เฉพาะตอนที่ Error จริงๆ
      favoritesStore.setState({ favorites: oldFavorites });
    }
  }
});

// --- Property Card Component ---
const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
  const { user } = useAuth();
  const favs = useStore(favoritesStore);
  const isFavorite = favs.favorites.has(property.id);
  const router = useRouter();

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // ป้องกันไม่ให้คลิกทะลุไป trigger การ์ด
    if (user) {
      favs.toggleFavorite(user.id, property.id);
    } else {
      alert("Please sign in to add favorites");
    }
  };

  const handleContactAgent = (e: React.MouseEvent) => {
    e.stopPropagation(); // ป้องกัน click ซ้อน
    // ลิงก์ไปหน้าใหม่ โดยส่ง ID ไปด้วย
    router.push(`/property/${property.id}`);
  };

  return (
    <div onClick={() => router.push(`/property/${property.id}`)}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group flex flex-col h-full">
      {/* Image Section */}
      <div className="relative h-48 w-full shrink-0">
        <Image
          src={property.image}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <button
          onClick={handleToggleFavorite}
          className={`absolute top-3 right-3 p-2 rounded-full ${isFavorite
            ? 'bg-red-500 text-white'
            : 'bg-white/80 text-gray-600 hover:bg-white'
            } transition-all shadow-sm hover:shadow-md`}
        >
          <Heart className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col grow">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate">
          {property.title}
        </h3>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-1 shrink-0" />
          <span className="text-sm truncate">{property.location}</span>
        </div>

        <div className="flex items-center text-indigo-600 font-bold text-lg mb-2">
          <DollarSign className="h-5 w-5" />
          <span>{property.price.toLocaleString()}</span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{property.description}</p>

        {/* Spacer to push footer down */}
        <div className="grow"></div>

        {/* --- New: Agent Section & Contact Button --- */}
        <div className="pt-4 border-t border-gray-100 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {/* Agent Avatar */}
              <div className="relative h-8 w-8 rounded-full overflow-hidden border border-gray-200">
                <Image
                  src={property.agentAvatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100"}
                  alt={property.agentName}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Listed by</p>
                <p className="text-sm font-medium text-gray-800 leading-none">{property.agentName}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleContactAgent}
            className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Contact Agent</span>
          </button>
        </div>

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
          <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
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
            className={`pb-3 font-medium text-lg transition-colors border-b-2 ${filter === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
          >
            All Properties <span className="text-sm ml-1 bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{properties.length}</span>
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`pb-3 font-medium text-lg transition-colors border-b-2 flex items-center gap-2 ${filter === 'favorites'
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