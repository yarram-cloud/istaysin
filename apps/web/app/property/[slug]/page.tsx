import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { MapPin, Star, User, Wifi, Coffee, Tv, Car, Wind, UserCheck, ShieldCheck, BedDouble } from 'lucide-react';

const amenityIcons: Record<string, any> = {
  Wifi, Coffee, Tv, Car, Wind, UserCheck, ShieldCheck, MapPin, Star, User
};

export default async function PropertyHomePage({ params }: { params: { slug: string } }) {
  let property = null;
  try {
    const res = await publicApi.property(params.slug);
    if (res.success && res.data) {
      property = res.data;
    }
  } catch (error) {
    console.error('Failed to load property:', error);
  }

  if (!property) {
    notFound();
  }

  const config = property.config?.websiteBuilder || {};

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center bg-surface-900">
        {property.heroImage && (
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={property.heroImage} alt="Hero" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/40 to-transparent" />
          </div>
        )}
        <div className="relative z-10 text-center max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            {config.heroHeadline || `Welcome to ${property.name}`}
          </h2>
          <p className="text-lg md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            {config.heroSubheadline || property.description || property.tagline}
          </p>
          <a
            href={`/property/${params.slug}/book`}
            className="property-theme-primary property-theme-hover text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-black/20 transition-transform hover:scale-105 inline-block"
          >
            Check Availability
          </a>
        </div>
      </section>

      {/* About Section */}
      {(config.aboutHtml || property.description) && (
        <section id="about" className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-8">About Our Property</h3>
            {config.aboutHtml ? (
              <div className="text-surface-600 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: config.aboutHtml }} />
            ) : (
              <p className="text-surface-600 leading-relaxed text-lg">{property.description}</p>
            )}
          </div>
        </section>
      )}

      {/* Amenities Section */}
      {config.amenities && config.amenities.length > 0 && (
        <section id="amenities" className="py-16 bg-surface-50 border-y border-surface-200">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-3xl font-bold mb-12 text-center">Amenities & Features</h3>
            <div className="flex flex-wrap justify-center gap-6">
              {config.amenities.map((amenity: any, i: number) => {
                const Icon = amenityIcons[amenity.icon] || Star;
                return (
                  <div key={i} className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-surface-200 flex items-center gap-3 w-48 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full property-theme-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 property-theme-text" />
                    </div>
                    <span className="font-semibold">{amenity.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {config.gallery && config.gallery.length > 0 && (
        <section className="py-20 bg-surface-50">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-3xl font-bold mb-12 text-center">Gallery</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {config.gallery.map((img: string, i: number) => (
                <div key={i} className="rounded-2xl overflow-hidden aspect-[4/3] group shadow-sm bg-surface-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Rooms Section */}
      {property.roomTypes && property.roomTypes.length > 0 && (
        <section id="rooms" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-3xl font-bold mb-12 text-center">Our Accommodations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {property.roomTypes.map((rt: any) => (
                <div key={rt.id} className="border border-surface-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition-shadow bg-surface-50">
                  <div className="aspect-[16/9] bg-surface-200 relative">
                    {rt.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={rt.photos[0].url} alt={rt.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-surface-400">No Image</div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-xl font-bold">{rt.name}</h4>
                      <div className="text-right">
                        <span className="text-lg font-bold">₹{rt.baseRate}</span>
                        <span className="text-xs text-surface-500 block">/ night</span>
                      </div>
                    </div>
                    <p className="text-surface-600 text-sm mb-6 flex-1 line-clamp-3">{rt.description}</p>
                    <div className="flex items-center gap-4 text-sm text-surface-500 mb-6">
                      <div className="flex items-center gap-1"><User className="w-4 h-4" /> Up to {rt.baseOccupancy} guests</div>
                      <div className="flex items-center gap-1"><BedDouble className="w-4 h-4" /> {rt.bedType}</div>
                    </div>
                    <a
                      href={`/property/${params.slug}/book?roomType=${rt.id}`}
                      className="w-full property-theme-primary text-white text-center py-3 rounded-xl font-semibold hover:brightness-110 transition-all"
                    >
                      Book this Room
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section */}
      {property.reviews && property.reviews.length > 0 && (
        <section id="reviews" className="py-20 bg-surface-50">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-3xl font-bold mb-12 text-center">Guest Reviews</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {property.reviews.map((rev: any) => (
                <div key={rev.id} className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-5 h-5 ${s <= rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-surface-300'}`} />
                    ))}
                  </div>
                  <p className="text-surface-700 italic mb-4">"{rev.text}"</p>
                  <p className="text-sm font-semibold text-surface-900">- {rev.guestProfile?.fullName || 'Anonymous'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact & Location Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold mb-12 text-center">Location & Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h4 className="text-xl font-bold mb-4">Get in Touch</h4>
                <p className="text-surface-600 mb-6">We're here to help you plan your perfect stay. Reach out to us via phone, email, or WhatsApp.</p>
                <div className="space-y-4">
                  {property.contactPhone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center">📞</div>
                      <div>
                        <span className="block text-sm text-surface-500">Call Us</span>
                        <a href={`tel:${property.contactPhone}`} className="font-semibold hover:property-theme-text transition-colors">{property.contactPhone}</a>
                      </div>
                    </div>
                  )}
                  {property.contactEmail && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center">✉️</div>
                      <div>
                        <span className="block text-sm text-surface-500">Email Us</span>
                        <a href={`mailto:${property.contactEmail}`} className="font-semibold hover:property-theme-text transition-colors">{property.contactEmail}</a>
                      </div>
                    </div>
                  )}
                  {property.contactPhone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">💬</div>
                      <div>
                        <span className="block text-sm text-surface-500">WhatsApp</span>
                        <a href={`https://wa.me/${property.contactPhone.replace(/\D/g, '')}?text=Hi,%20I%20would%20like%20to%20know%20more%20about%20booking%20a%20stay.`} target="_blank" rel="noreferrer" className="font-semibold text-green-600 hover:text-green-700 transition-colors">Chat with us</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-xl font-bold mb-4">Address</h4>
                <div className="flex gap-3">
                  <div className="mt-1"><MapPin className="w-5 h-5 property-theme-text" /></div>
                  <p className="text-surface-600 leading-relaxed">
                    {property.name}<br />
                    {property.address}<br />
                    {property.city}, {property.state} {property.pincode}
                  </p>
                </div>
              </div>
            </div>
            <div className="h-[400px] bg-surface-200 rounded-3xl overflow-hidden shadow-sm border border-surface-200">
              {property.latitude && property.longitude ? (
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${property.latitude},${property.longitude}`}
                ></iframe>
              ) : (
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(`${property.name}, ${property.city}, ${property.state}`)}&output=embed`}
                ></iframe>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
