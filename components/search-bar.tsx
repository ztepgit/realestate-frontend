// components/search-bar.tsx
"use client"

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(keyword);
  };

  const handleClear = () => {
    setKeyword('');
    onSearch('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto -mt-8 relative z-10 px-4">
      <form 
        onSubmit={handleSubmit}
        className="bg-white p-2 rounded-2xl shadow-xl border border-gray-100 flex flex-col md:flex-row gap-2 items-center"
      >
        {/* ช่องค้นหา */}
        <div className="flex-1 w-full relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              // ถ้าอยากให้ค้นหาทันทีที่พิมพ์ (Real-time) ให้เปิดบรรทัดล่างนี้
              // onSearch(e.target.value); 
            }}
            placeholder="Search property name, location, or description..."
            className="block w-full pl-10 pr-10 py-3 text-gray-900 placeholder-gray-500 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          />
          {keyword && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ปุ่มค้นหา */}
        <button
          type="submit"
          className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95"
        >
          <Search className="h-5 w-5" />
          Search
        </button>
      </form>
    </div>
  );
}