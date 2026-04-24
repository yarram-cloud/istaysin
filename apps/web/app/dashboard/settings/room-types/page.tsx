'use client';

import { useEffect, useState, useCallback } from 'react';
import { roomsApi } from '@/lib/api';
import { BedDouble, Plus, Loader2, ArrowLeft, Image as ImageIcon, Users, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RoomType {
  id: string;
  name: string;
  maxOccupancy: number;
  baseRate: number;
  pricingUnit: string;
  _count?: { rooms: number };
}

export default function RoomTypesSettingsPage() {
  const router = useRouter();
  const [types, setTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await roomsApi.getRoomTypes();
      if (res.success) {
        setTypes(res.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to load room types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/dashboard/settings')} className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-900 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </button>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-900 flex items-center gap-3">
            <BedDouble className="w-7 h-7 text-primary-600" />
            Manage Room Types
          </h1>
          <p className="text-surface-500 mt-1">Configure categories, capacities, and base pricing rules.</p>
        </div>
        
        <Link href="/dashboard/settings/room-types/new" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Room Type
        </Link>
      </div>

      {types.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-surface-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BedDouble className="w-8 h-8 text-surface-300" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 mb-1">No room types found</h3>
          <p className="text-surface-500 mb-6 max-w-sm mx-auto">Set up categories like Standard, Deluxe, or Suite to classify your rooms.</p>
          <Link href="/dashboard/settings/room-types/new" className="inline-flex items-center gap-2 px-4 py-2 bg-surface-900 text-white rounded-xl text-sm font-medium hover:bg-surface-800 transition-colors">
            <Plus className="w-4 h-4" /> Create Room Type
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {types.map(rt => (
            <Link key={rt.id} href={`/dashboard/settings/room-types/${rt.id}`} className="group block bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm hover:border-primary-300 hover:shadow-md transition-all">
              <div className="h-32 bg-surface-100 flex items-center justify-center relative overflow-hidden">
                <ImageIcon className="w-8 h-8 text-surface-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <h3 className="text-lg font-bold text-white drop-shadow-md">{rt.name}</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm text-surface-600 font-medium">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    <span className="text-surface-900">₹{rt.baseRate}</span>
                    <span className="text-surface-400 font-normal">/{rt.pricingUnit === 'per_person' ? 'person' : 'night'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-600 font-medium">
                    <Users className="w-4 h-4 text-primary-600" />
                    Up to {rt.maxOccupancy} Guests
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-surface-100 flex items-center justify-between text-sm">
                  <span className="text-surface-500">
                    {rt._count?.rooms || 0} active rooms
                  </span>
                  <span className="font-semibold text-primary-600 group-hover:text-primary-700">
                    Edit &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
