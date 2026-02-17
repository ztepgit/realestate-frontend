"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

// Interfaces
interface User {
  id: number;
  email: string;
  // เพิ่ม field อื่นๆ ถ้ามี เช่น avatar, name
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // แก้ URL ให้ Handle กรณีลืมใส่ / หรือใส่เกิน
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      // 1. โหลดจาก LocalStorage เพื่อให้ UI มาเร็วก่อน (Optimistic UI)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // 2. (Optional แนะนำให้ทำ) ยิงไปเช็ค Server ว่า Cookie ยังอยู่จริงไหม
      // ถ้า Backend ยังไม่มี endpoint นี้ ให้ข้ามขั้นตอนนี้ไปก่อนได้ครับ
      /*
      const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
      if (!res.ok) throw new Error('Session expired');
      const userData = await res.json();
      setUser(userData); // อัปเดตข้อมูลล่าสุดจาก Server
      localStorage.setItem('user', JSON.stringify(userData));
      */

    } catch (error) {
      console.warn('Session check failed, logging out...');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!res.ok) {
        // พยายามอ่าน Error message จาก Backend
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await res.json();

      // ต้องมั่นใจว่า Backend ส่ง ID มาด้วย
      if (!data.id && !data.userId) {
        throw new Error('Invalid response from server: Missing User ID');
      }

      const userProfile: User = {
        id: data.id || data.userId,
        email: data.email || email, // ใช้ email จาก server ถ้ามี หรือใช้ที่กรอก
        ...data
      };

      localStorage.setItem('user', JSON.stringify(userProfile));
      setUser(userProfile);

    } catch (error) {
      // ลบ Alert ออก ให้ UI (LoginPage) เป็นคนแสดง Error
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Signup failed');
      }
    } catch (error) {
      // ลบ Alert ออกเช่นกัน
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.warn("Logout request failed", error);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
      // ใช้ window.location เพื่อ clear state ทั้งหมดให้เกลี้ยง
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}