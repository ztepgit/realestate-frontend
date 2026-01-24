"use client"

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    ArrowLeft,
    MapPin,
    DollarSign,
    Phone,
    Building2,
    Calendar,
    ShieldCheck,
    X // เพิ่มไอคอน X สำหรับปิดรูป
} from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface Property {
    id: number;
    title: string;
    location: string;
    price: number;
    description: string;
    image: string;
    createdAt: string;
    agentName: string;
    agentCompany: string;
    agentPhone: string;
    agentAvatar: string;
}

function PropertyDetail() {
    const params = useParams();
    const router = useRouter();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);

    // State สำหรับเปิด/ปิด รูปภาพเต็มจอ
    const [isImageOpen, setIsImageOpen] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetch(`${API_URL}/properties/${params.id}`)
                .then(res => {
                    if (!res.ok) throw new Error('Not found');
                    return res.json();
                })
                .then(data => setProperty(data))
                .catch(err => {
                    console.error(err);
                    alert("Property not found");
                    router.push('/');
                })
                .finally(() => setLoading(false));
        }
    }, [params.id, router]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!property) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-12 relative">

            {/* --- ส่วน Modal แสดงรูปเต็มจอ (Lightbox) --- */}
            {isImageOpen && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setIsImageOpen(false)} // คลิกพื้นที่ว่างเพื่อปิด
                >
                    {/* ปุ่มปิด */}
                    <button
                        onClick={() => setIsImageOpen(false)}
                        className="absolute top-6 right-6 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all"
                    >
                        <X className="h-8 w-8" />
                    </button>

                    {/* รูปเต็มจอ */}
                    <div className="relative w-full h-full max-w-7xl max-h-[90vh]">
                        <Image
                            src={property.image}
                            alt={property.title}
                            fill
                            className="object-contain" // ใช้ object-contain เพื่อให้เห็นรูปครบทุกส่วนไม่โดนตัด
                            quality={100}
                            priority

                        />
                    </div>
                </div>
            )}

            {/* Navbar / Header */}
            <div className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Search
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Property Details */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Main Image (คลิกได้) */}
                        <div
                            className="relative h-[400px] w-full rounded-2xl overflow-hidden shadow-lg bg-gray-200 cursor-zoom-in group"
                            onClick={() => setIsImageOpen(true)} // สั่งเปิดรูปเต็มจอ
                        >
                            <Image
                                src={property.image}
                                alt={property.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                priority
                                unoptimized
                            />
                            <div className="absolute top-4 left-4 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md z-10">
                                For Sale
                            </div>
                            {/* Overlay บอก user ว่าคลิกได้ */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm transition-opacity">
                                    Click to Expand
                                </span>
                            </div>
                        </div>

                        {/* Title & Price */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                                    <div className="flex items-center text-gray-600 text-lg">
                                        <MapPin className="h-5 w-5 mr-2 text-indigo-500" />
                                        {property.location}
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-indigo-600 flex items-center">
                                    <DollarSign className="h-8 w-8" />
                                    {property.price.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">About this property</h2>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                {property.description}
                            </p>
                            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center text-gray-500 text-sm">
                                <Calendar className="h-4 w-4 mr-2" />
                                Listed on {new Date(property.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Agent Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 overflow-hidden">
                                <div className="bg-indigo-600 p-4 text-center">
                                    <h3 className="text-white font-semibold text-lg">Contact Agent</h3>
                                </div>

                                <div className="p-6 flex flex-col items-center text-center">
                                    {/* Avatar (ไม่ใส่ onClick) */}
                                    <div className="relative w-24 h-24 mb-4">
                                        <Image
                                            src={property.agentAvatar || "/placeholder-avatar.png"}
                                            alt={property.agentName}
                                            fill
                                            unoptimized
                                            className="object-cover rounded-full border-4 border-white shadow-md"
                                        />
                                        <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                                            <ShieldCheck className="h-3 w-3 text-white" />
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900">{property.agentName}</h3>
                                    <div className="flex items-center text-gray-500 mt-1 mb-6">
                                        <Building2 className="h-4 w-4 mr-1" />
                                        <span className="text-sm">{property.agentCompany}</span>
                                    </div>

                                    {/* Phone Number Display */}
                                    <div className="w-full bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Phone Number</p>
                                        <div className="flex items-center justify-center text-indigo-700 text-xl font-bold">
                                            <Phone className="h-5 w-5 mr-2 fill-current" />
                                            {property.agentPhone}
                                        </div>
                                    </div>

                                    {/* Call to Action Buttons */}
                                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors mb-3 flex items-center justify-center">
                                        Call Now
                                    </button>
                                    <button className="w-full bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold py-3 px-4 rounded-xl transition-colors">
                                        Send Message
                                    </button>
                                </div>

                                <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
                                    Response time: within 1 hour
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

export default function Page() {
    return (
        <AuthGuard>
            <PropertyDetail />
        </AuthGuard>
    )
}