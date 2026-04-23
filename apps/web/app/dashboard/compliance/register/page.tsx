'use client';

import { useEffect, useState } from 'react';
import { complianceApi } from '@/lib/api';
import { Printer, Send, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ComplianceRegisterPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    fetchRegister();
  }, [startDate, endDate]);

  async function fetchRegister() {
    setLoading(true);
    try {
      const res = await complianceApi.getGuestRegister(startDate, endDate);
      if (res.success) {
        setData(res.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to load guest register');
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleEmailPolice() {
    setSubmitting(true);
    try {
      await complianceApi.submitPoliceRegister(startDate);
      toast.success('Successfully submitted to Station House Officer!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to email police station. Is your email configured in Settings?');
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(isoString: string) {
    if (!isoString || isoString === 'N/A') return 'N/A';
    return new Date(isoString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  return (
    <div className="space-y-6 print:m-0 print:p-0 print:bg-white print:text-black">
      {/* Header - Screen Only */}
      <div className="print:hidden space-y-4">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1">Police Master Register</h1>
          <p className="text-surface-500">Generate Sarai Act compliant guest registers for local authorities</p>
        </div>

        {/* Controls — stack on mobile, inline on md+ */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center bg-surface-100 border border-surface-200 rounded-xl p-1 flex-shrink-0">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-sm text-surface-800 px-3 py-1.5 focus:ring-0 w-36"
            />
            <span className="text-surface-400 px-1">—</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-sm text-surface-800 px-3 py-1.5 focus:ring-0 w-36"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 text-sm">
              <Printer className="w-4 h-4" /> Print PDF
            </button>
            
            <button onClick={handleEmailPolice} disabled={submitting} className="btn-primary flex items-center gap-2 text-sm">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 
              Email to SHO
            </button>
          </div>
        </div>
      </div>

      {/* Print Header (Hidden on Screen, Visible on Print) */}
      <div className="hidden print:block mb-6 text-center border-b border-black pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider">Form F - Hotel Guest Register</h1>
        <p className="font-medium mt-1">Maintained under the Sarai Act, 1867</p>
        <p className="text-sm mt-1">Period: {new Date(startDate).toLocaleDateString('en-IN')} to {new Date(endDate).toLocaleDateString('en-IN')}</p>
      </div>

      {/* Register Table */}
      <div className="glass-card print:border-none print:bg-transparent print:shadow-none print:rounded-none overflow-x-auto -mx-6 sm:mx-0">
        {loading ? (
          <div className="p-12 text-center text-surface-400 flex flex-col items-center print:hidden">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary-500" />
            <p>Compiling register records...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center print:hidden">
            <div className="w-16 h-16 bg-surface-50 border border-surface-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-medium text-surface-800">No Guests Found</h3>
            <p className="text-surface-500 mt-1">We couldn&apos;t find any guests who checked in during this period.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left whitespace-nowrap print:text-[10px] print:whitespace-normal">
            <thead className="text-xs uppercase bg-surface-50 print:bg-gray-100 text-surface-500 print:text-black border-b border-surface-200 print:border-black">
              <tr>
                <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black">S.No</th>
                <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black">Guest Name</th>
                <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black">Father's Name</th>
                <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black">Address</th>
                <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black">Nationality</th>
                <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black">ID Details</th>
                <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black">Visa Details</th>
                <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black">Room</th>
                <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black">Check-In</th>
                <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black">Check-Out</th>
                <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {data.map((guest) => (
                <tr key={guest.guestId} className="border-b border-surface-100 print:border-black hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black text-surface-600">{guest.sNo}</td>
                  <td className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black font-medium text-surface-900 print:text-black">{guest.fullName}</td>
                  <td className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black text-surface-500 print:text-black">{guest.fathersName}</td>
                  <td className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black text-surface-500 print:text-black print:min-w-[100px]">{guest.address}</td>
                  <td className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${guest.nationality.toLowerCase() !== 'indian' && guest.nationality.toLowerCase() !== 'india' ? 'bg-orange-50 text-orange-700 border border-orange-200 print:border-black' : 'bg-surface-100 text-surface-600 border border-surface-200 print:border-black'}`}>
                      {guest.nationality}
                    </span>
                  </td>
                  <td className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black print:min-w-[100px] text-surface-600">{guest.idProof}</td>
                  <td className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black print:min-w-[100px] text-surface-600">{guest.visaDetails}</td>
                  <td className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black text-center text-surface-700 font-medium">{guest.roomNo}</td>
                  <td className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black text-surface-600">{formatDate(guest.checkIn)}</td>
                  <td className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black text-surface-600">{formatDate(guest.checkOut)}</td>
                  <td className="px-4 py-3 print:px-2 print:py-1 print:border print:border-black text-surface-600">{guest.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Print Footer */}
      <div className="hidden print:block mt-8 pt-8">
        <div className="flex justify-between items-end mt-16">
          <div className="text-center">
            <div className="w-48 border-b border-black mb-2"></div>
            <p className="text-sm font-medium">Duty Manager Signature</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-black mb-2"></div>
            <p className="text-sm font-medium">Police Official Signature / Stamp</p>
          </div>
        </div>
      </div>
    </div>
  );
}
