'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { Calendar, Users, CreditCard, ChevronRight, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function formatDisplayDate(dateString: string | Date) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function GuestCheckoutPage({ params }: { params: { slug: string; locale: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [error, setError] = useState('');

  // Step 1 State
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [roomTypeId, setRoomTypeId] = useState('');
  
  // Availability State
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availability, setAvailability] = useState<any>(null);
  
  // Step 2 State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestState, setGuestState] = useState('');
  
  // Booking Submission State
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  useEffect(() => {
    publicApi.property(params.slug)
      .then(res => {
        if (res.success && res.data) {
          setProperty(res.data);
          if (res.data.roomTypes?.length > 0) {
            setRoomTypeId(res.data.roomTypes[0].id);
          }
        } else {
          setError('Property not found');
        }
      })
      .catch((err) => setError('Failed to load property details'))
      .finally(() => setLoading(false));

    // Tomorrow's date default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    setCheckIn(tomorrow.toISOString().split('T')[0]);
    setCheckOut(dayAfter.toISOString().split('T')[0]);
  }, [params.slug]);

  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('Check-out date must be after check-in date');
      return;
    }

    setCheckingAvailability(true);
    setAvailability(null);
    try {
      const res = await fetch(`/api/v1/public/check-availability?tenantId=${property.id}&roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}&extraBeds=0`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setAvailability(data.data);
      } else {
        setError(data.error || 'Failed to check availability');
      }
    } catch (err) {
      setError('An error occurred while checking availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBookNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availability?.available) return;

    setSubmitting(true);
    setError('');
    
    try {
      const res = await publicApi.createBooking({
        tenantId: property.id,
        guestName,
        guestEmail,
        guestPhone,
        guestState,
        source: 'website',
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numAdults: adults,
        numChildren: children,
        roomSelections: [{
          roomTypeId,
          extraBeds: 0,
        }],
      });

      if (res.success) {
        setBookingResult(res.data);
        setStep(3);
      } else {
        setError(res.error || 'Failed to create booking');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary-500" /></div>;
  if (!property) return <div className="p-20 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link href={`/${params.locale}/${params.slug}`} className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Property
      </Link>

      <div className="flex items-center justify-center mb-12">
        <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-surface-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${step >= 1 ? 'border-primary-600 bg-primary-50' : 'border-surface-300'}`}>1</div>
          <span className="ml-3 font-semibold hidden sm:block">Select Room</span>
        </div>
        <div className={`w-16 sm:w-32 h-1 mx-4 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-surface-200'}`} />
        <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-surface-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${step >= 2 ? 'border-primary-600 bg-primary-50' : 'border-surface-300'}`}>2</div>
          <span className="ml-3 font-semibold hidden sm:block">Guest Details</span>
        </div>
        <div className={`w-16 sm:w-32 h-1 mx-4 rounded-full ${step >= 3 ? 'bg-primary-600' : 'bg-surface-200'}`} />
        <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-surface-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${step >= 3 ? 'border-green-600 bg-green-50' : 'border-surface-300'}`}>
            {step === 3 ? <CheckCircle2 className="w-6 h-6" /> : '3'}
          </div>
          <span className="ml-3 font-semibold hidden sm:block">Confirmation</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-8">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">{error}</div>}

          {step === 1 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-surface-200 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold mb-6">Search Availability</h2>
              <form onSubmit={handleCheckAvailability} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-surface-700">Check-In</label>
                    <input type="date" required value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full border border-surface-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-surface-700">Check-Out</label>
                    <input type="date" required value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split('T')[0]} className="w-full border border-surface-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-surface-700">Adults</label>
                    <select value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full border border-surface-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none">
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-surface-700">Children</label>
                    <select value={children} onChange={e => setChildren(Number(e.target.value))} className="w-full border border-surface-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none">
                      {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-surface-700">Room Type</label>
                    <select value={roomTypeId} onChange={e => setRoomTypeId(e.target.value)} className="w-full border border-surface-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none">
                      {property.roomTypes?.map((rt: any) => (
                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={checkingAvailability} className="w-full property-theme-primary property-theme-hover text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                  {checkingAvailability ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check Availability'}
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-surface-200 animate-in fade-in slide-in-from-right-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Guest Details</h2>
                <button type="button" onClick={() => setStep(1)} className="text-primary-600 font-medium text-sm hover:underline">Change Dates</button>
              </div>
              <form onSubmit={handleBookNow} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-surface-700">Full Name *</label>
                  <input type="text" required value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="John Doe" className="w-full border border-surface-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-surface-700">Email Address (for confirmation receipt)</label>
                    <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="john@example.com" className="w-full border border-surface-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-surface-700">Phone Number *</label>
                    <input type="tel" required value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+91 9999999999" className="w-full border border-surface-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-surface-700">State of Residence (for GST purposes) *</label>
                  <select required value={guestState} onChange={e => setGuestState(e.target.value)} className="w-full border border-surface-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="">Select your state...</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Other">Other / International</option>
                  </select>
                </div>

                <button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 mt-8">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Reservation'}
                </button>
                <p className="text-center text-xs text-surface-500">By proceeding, you agree to our terms and cancellation policy.</p>
              </form>
            </div>
          )}

          {step === 3 && bookingResult && (
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-surface-200 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-surface-900 mb-4">Booking Confirmed!</h2>
              <p className="text-lg text-surface-600 mb-8">Thank you, {bookingResult.guestName}. Your reservation is confirmed.</p>
              
              <div className="bg-surface-50 rounded-2xl p-6 border border-surface-200 inline-block text-left mb-8 w-full max-w-sm">
                <div className="mb-4">
                  <span className="text-sm text-surface-500">Booking Reference</span>
                  <p className="font-mono text-lg font-bold">{bookingResult.bookingNumber}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-surface-500">Check-in</span>
                    <p className="font-semibold">{formatDisplayDate(bookingResult.checkInDate)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-surface-500">Check-out</span>
                    <p className="font-semibold">{formatDisplayDate(bookingResult.checkOutDate)}</p>
                  </div>
                </div>
              </div>
              
              <Link href={`/${params.locale}/${params.slug}`} className="block w-full property-theme-primary property-theme-hover text-white py-4 rounded-xl font-bold transition-all">
                Return to Home
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-surface-900 text-white rounded-3xl p-6 shadow-xl sticky top-28">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary-400" /> Order Summary</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <span className="text-surface-400 text-sm block">Property</span>
                <p className="font-semibold">{property.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <span className="text-surface-400 text-sm block">Check-In</span>
                  <p className="font-medium">{formatDisplayDate(checkIn)}</p>
                </div>
                <div>
                  <span className="text-surface-400 text-sm block">Check-Out</span>
                  <p className="font-medium">{formatDisplayDate(checkOut)}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <span className="text-surface-400 text-sm block">Guests</span>
                <p className="font-medium">{adults} Adults, {children} Children</p>
              </div>
            </div>

            {availability?.available === false && (
              <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm border border-red-500/20">
                Sorry, no rooms are available for these dates.
              </div>
            )}

            {availability?.available && availability.pricing && (
              <div className="pt-6 border-t border-white/10 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-300">Room Base Rate (avg)</span>
                  <span>₹{Math.round(availability.pricing.roomTotal / availability.pricing.nightlyRates.length)} x {availability.pricing.nightlyRates.length} nights</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-300">Taxes & GST</span>
                  <span>₹{availability.pricing.totalGst}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white pt-4 border-t border-white/10 mt-2">
                  <span>Total Amount</span>
                  <span className="text-primary-400">₹{availability.pricing.grandTotal}</span>
                </div>
                
                {step === 1 && (
                  <button onClick={() => setStep(2)} className="w-full bg-white text-surface-950 font-bold py-3 rounded-xl mt-6 hover:bg-surface-100 transition-colors flex items-center justify-center gap-2">
                    Proceed to Guest Details <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
