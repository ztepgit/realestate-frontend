"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>; // ✅ แก้เป็น Promise เพราะมีการยิง API ไปบอก Server
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  useEffect(() => {
    // โหลดข้อมูล User (Profile) ที่จำไว้ใน LocalStorage เพื่อแสดงผลชื่อมุมขวาบน
    // (Note: นี่ไม่ใช่ Token เป็นแค่ข้อมูล User ทั่วไป)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        // 1. หัวใจสำคัญ: สั่งให้ Browser รับ/ส่ง Cookie Session
        credentials: 'include', 
      });

      if (!res.ok) throw new Error('Login failed');

      const data = await res.json(); 

      // 2.Cookie ถูกฝังลง Browser อัตโนมัติ

      // 3. จัดการข้อมูล User (Profile)
      // ถ้า Backend ส่งข้อมูล User กลับมาให้ใช้ข้อมูลนั้น
      // ถ้าไม่ส่ง (ส่งมาแค่ status OK) เราก็จำลองเอาจาก email ที่กรอก
      const userProfile: User = data.id ? data : {
        id: data.userId || 1, // เผื่อ Backend ส่งมาเป็น userId
        email: email
      };

      // บันทึก Profile ลง State และ LocalStorage (เอาไว้โชว์ชื่อตอน Refresh)
      localStorage.setItem('user', JSON.stringify(userProfile));
      setUser(userProfile);

    } catch (error) {
      alert('Login failed. Please check your credentials.');
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        // signup อาจจะไม่ต้องใช้ credentials ก็ได้ แต่ใส่ไว้ไม่เสียหาย
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Signup failed');
      }
    } catch (error: unknown) { 
      console.error(error);
      let errorMessage = 'Signup failed. Email may already exist.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
        // 4. แจ้ง Server ให้ทำลาย Session (ลบ Cookie ทิ้ง)
        // ถ้าไม่ยิงไปบอก Server Cookie เดิมจะยังใช้ได้อยู่ ซึ่งไม่ปลอดภัย
        await fetch(`${API_URL}/auth/logout`, { 
            method: 'POST',
            credentials: 'include' // ต้องแนบ Cookie ไปด้วย Server จะได้รู้ว่าลบของใคร
        });
    } catch (error) {
        console.warn("Logout request failed", error);
    } finally {
        // ล้างข้อมูลฝั่งหน้าบ้าน
        localStorage.removeItem('user');
        // localStorage.removeItem('token'); // ❌ ไม่ต้องลบ Token เพราะไม่มีแล้ว
        setUser(null);
        // Refresh หน้าจอ หรือ redirect ไปหน้า login
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