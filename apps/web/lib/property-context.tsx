'use client';

import { createContext, useContext } from 'react';

export type PropertyType = 'hotel' | 'lodge' | 'resort' | 'homestay' | 'guest_house' | 'pg' | 'hostel';

interface PropertyTypeContextValue {
  propertyType: PropertyType;
  /** True for PG / Paying Guest */
  isPG: boolean;
  /** True for Hostel */
  isHostel: boolean;
  /** True for any long-stay property (PG or Hostel) — controls monthly billing defaults */
  isLongStay: boolean;
  /** True for nightly-stay properties (hotel, lodge, resort, homestay, guest_house) */
  isHotel: boolean;
}

const PropertyTypeContext = createContext<PropertyTypeContextValue>({
  propertyType: 'hotel',
  isPG: false,
  isHostel: false,
  isLongStay: false,
  isHotel: true,
});

export function PropertyTypeProvider({
  propertyType,
  children,
}: {
  propertyType: PropertyType;
  children: React.ReactNode;
}) {
  const isPG = propertyType === 'pg';
  const isHostel = propertyType === 'hostel';
  const isLongStay = isPG || isHostel;
  const isHotel = !isLongStay;

  return (
    <PropertyTypeContext.Provider value={{ propertyType, isPG, isHostel, isLongStay, isHotel }}>
      {children}
    </PropertyTypeContext.Provider>
  );
}

export function usePropertyType() {
  return useContext(PropertyTypeContext);
}
