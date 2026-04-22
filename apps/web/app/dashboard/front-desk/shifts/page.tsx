'use client';

import { Clock, Plus, Users, CalendarClock } from 'lucide-react';

export default function StaffShiftsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900 mb-1">Staff Shifts</h1>
          <p className="text-surface-500">Manage front-desk and housekeeping schedules.</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Assign Shift
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-700" />
            </div>
            <h3 className="font-semibold text-surface-900">On Duty Now</h3>
          </div>
          <p className="text-3xl font-bold text-surface-900">4 <span className="text-sm font-normal text-surface-500">Staff members</span></p>
        </div>
        
        <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-700" />
            </div>
            <h3 className="font-semibold text-surface-900">Next Shift Change</h3>
          </div>
          <p className="text-3xl font-bold text-surface-900">2:00 <span className="text-sm font-normal text-surface-500">PM</span></p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-green-700" />
            </div>
            <h3 className="font-semibold text-surface-900">Open Shifts</h3>
          </div>
          <p className="text-3xl font-bold text-surface-900">0 <span className="text-sm font-normal text-surface-500">This week</span></p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center bg-surface-50">
          <h2 className="font-semibold text-surface-900">Today's Schedule</h2>
        </div>
        
        <div className="divide-y divide-surface-100 p-4 flex flex-col items-center justify-center h-48 text-surface-500">
           <Clock className="w-10 h-10 mb-3 text-surface-300" />
           <p>No shift data to display for today.</p>
        </div>
      </div>
    </div>
  );
}
