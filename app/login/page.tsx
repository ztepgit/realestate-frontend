"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Home as HomeIcon, Loader2 } from 'lucide-react';
import SuccessModal from '@/components/success-modal'; // 1. Import Modal

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // 2. State คุม Modal
  
  const { login, signup } = useAuth();
  const router = useRouter();

  // FormEvent เพื่อรองรับการ submit จากฟอร์ม
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // กันหน้าเว็บ refresh เอง
    
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    if (password.length < 4) {
      alert('Password must be at least 4 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isLogin) {
        // --- LOGIC LOGIN ---
        await login(email, password);
        router.push('/');
      } else {
        // --- LOGIC SIGNUP ---
        await signup(email, password);
        
        // 3. สมัครผ่านแล้ว -> หยุดโหลด -> โชว์ Modal
        setIsLoading(false);
        setShowSuccessModal(true);

        // 4. ตั้งเวลาหน่วง 3 วินาที แล้วค่อยสลับไปหน้า Sign In
        setTimeout(() => {
            handleCloseModal();
        }, 3000);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setIsLoading(false);
    }
  };

  // ฟังก์ชันปิด Modal แล้วสลับไปหน้า Login
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setIsLogin(true); // สลับ Tab เป็น Login
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <HomeIcon className="h-10 w-10 text-indigo-600 mr-2" />
          <h1 className="text-3xl font-bold text-black">RealEstate</h1>
        </div>
        
        <h2 className="text-2xl font-semibold text-center mb-6 text-black">
          {isLogin ? 'Welcome to Promiseland' : 'Create Account'}
        </h2>
        
    
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Email
            </label>
            <input
              data-testid="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Password
            </label>
            <input
              data-testid="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="••••••••"
            />
          </div>
          
          <button
            data-testid="submit-btn"
            type="submit" 
            disabled={isLoading}
            className={`w-full py-2 rounded-lg font-medium transition-all flex items-center justify-center
              ${isLoading 
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
              }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-white" />
                <span className="text-white">Processing...</span>
              </>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>
        
        <div className="text-center mt-4 text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            data-testid="toggle-mode-btn"
            type="button" // ใส่ type="button" กันมันไป trigger submit โดยไม่ตั้งใจ
            onClick={() => setIsLogin(!isLogin)}
            disabled={isLoading}
            className="text-indigo-600 hover:text-indigo-700 font-medium disabled:text-indigo-300"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
      {/* Modal */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        title="Account Created!"
        message="Your account has been successfully created. Redirecting to sign in..."
      />
    </div>
  );
}