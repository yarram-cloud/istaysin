'use client';

import { useEffect, useState, useCallback } from 'react';
import { roomsApi, uploadApi } from '@/lib/api';
import { BedDouble, ArrowLeft, Loader2, Save, Image as ImageIcon, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function EditRoomTypePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxOccupancy: 2,
    baseRate: 0,
    pricingUnit: 'nightly',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await roomsApi.getRoomTypes();
      if (res.success) {
        const type = res.data?.find((t: any) => t.id === params.id);
        if (type) {
          setFormData({
            name: type.name || '',
            description: type.description || '',
            maxOccupancy: type.maxOccupancy || 2,
            baseRate: type.baseRate || 0,
            pricingUnit: type.pricingUnit || 'nightly',
          });
          setPhotos(type.photos || []);
        } else {
          toast.error('Room type not found');
          router.push('/dashboard/settings/room-types');
        }
      }
    } catch (err: any) {
      toast.error('Failed to load room type details');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Name is required');
    if (formData.baseRate < 0) return toast.error('Base rate cannot be negative');
    
    setSaving(true);
    try {
      await roomsApi.updateRoomType(params.id, formData);
      toast.success('Room type updated successfully');
      router.push('/dashboard/settings/room-types');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update room type');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    toast('Delete this room type?', {
      description: 'This cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          setDeleting(true);
          try {
            await roomsApi.deleteRoomType(params.id);
            toast.success('Room type deleted safely');
            router.push('/dashboard/settings/room-types');
            router.refresh();
          } catch (err: any) {
            toast.error(err.message || 'Failed to delete room type');
          } finally {
            setDeleting(false);
          }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  }

  async function handlePhotoUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (photos.length >= 5) {
        toast.error('Maximum 5 photos per room type');
        return;
      }
      // 5 MB limit
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 5 MB.');
        return;
      }
      setUploading(true);
      try {
        // Step 1: Upload file to /api/upload (local disk or Cloudinary)
        const uploadRes = await uploadApi.uploadFile(file);
        if (!uploadRes.url) throw new Error('Upload failed');
        
        // Step 2: Persist as a RoomPhoto record
        const photoRes = await roomsApi.addRoomTypePhoto(params.id, {
          url: uploadRes.url,
          sortOrder: photos.length,
        });
        if (photoRes.success && photoRes.data) {
          setPhotos(prev => [...prev, photoRes.data]);
          toast.success('Photo uploaded successfully');
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to upload photo');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  async function handlePhotoDelete(photoId: string) {
    try {
      const res = await roomsApi.deleteRoomTypePhoto(params.id, photoId);
      if (res.success) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        toast.success('Photo removed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove photo');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-surface-100 text-surface-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-900 flex items-center gap-3">
            <BedDouble className="w-7 h-7 text-primary-600" />
            Edit Room Type
          </h1>
          <p className="text-surface-500 mt-1">Configure pricing, capacity, and details for {formData.name || 'this category'}.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <form id="roomTypeForm" onSubmit={handleSubmit} className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 sm:p-8 space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-surface-900 border-b border-surface-100 pb-2">Basic Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Room Type Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full form-input"
                  placeholder="e.g. Deluxe Suite, Premium King"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full form-textarea h-24"
                  placeholder="Briefly describe the key features of this room type..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-surface-900 border-b border-surface-100 pb-2 mt-6">Capacity & Pricing</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Max Occupancy</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxOccupancy}
                    onChange={e => setFormData({ ...formData, maxOccupancy: parseInt(e.target.value) || 1 })}
                    className="w-full form-input"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Base Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.baseRate}
                    onChange={e => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                    className="w-full form-input"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Pricing Unit</label>
                  <select 
                    value={formData.pricingUnit}
                    onChange={e => setFormData({ ...formData, pricingUnit: e.target.value })}
                    className="w-full form-select"
                  >
                    <option value="nightly">Per Night</option>
                    <option value="per_person">Per Person</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-8 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-surface-700 bg-surface-50 hover:bg-surface-100 border border-surface-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name.trim()}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Photo Gallery Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary-600" />
                Photo Gallery
              </h4>
              <span className="text-xs text-surface-400 font-medium">{photos.length}/5</span>
            </div>

            {/* Existing Photos */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {photos.map((photo: any, i: number) => (
                  <div key={photo.id} className="relative group aspect-[4/3] rounded-xl overflow-hidden border border-surface-200 bg-surface-50">
                    <Image
                      src={photo.url}
                      alt={photo.caption || `Room photo ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 200px"
                      unoptimized={photo.url.startsWith('/uploads/')}
                    />
                    {i === 0 && (
                      <div className="absolute top-1.5 left-1.5 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider z-10">
                        Hero
                      </div>
                    )}
                    <button
                      onClick={() => handlePhotoDelete(photo.id)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-600/90 hover:bg-red-700 text-white rounded-lg flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md z-10"
                      title="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {photos.length < 5 && (
              <button
                onClick={handlePhotoUpload}
                disabled={uploading}
                className="w-full border-2 border-dashed border-surface-200 hover:border-primary-400 bg-surface-50 hover:bg-primary-50/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                ) : (
                  <Upload className="w-6 h-6 text-surface-400 group-hover:text-primary-500 transition-colors" />
                )}
                <span className="text-xs font-semibold text-surface-500 group-hover:text-primary-600 transition-colors">
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </span>
              </button>
            )}

            {photos.length === 0 && !uploading && (
              <p className="text-xs text-surface-400 text-center mt-3">
                First photo will be the hero image on your website.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
