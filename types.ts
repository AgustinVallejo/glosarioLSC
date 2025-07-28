export interface SignVideo {
  id: string
  video_url: string  // Changed from dataUrl to video_url
  timestamp: number  // We'll convert created_at to timestamp for compatibility
  note?: string  // Optional note about this specific sign
  location?: {   // Optional GPS location for this specific sign
    latitude: number
    longitude: number
    city?: string  // Optional nearby city name
  }
}

export interface Word {
  id: string
  name: string
  signs: SignVideo[]
}

// Utility function to convert Supabase data to your existing format
export function convertSupabaseToAppFormat(supabaseWords: any[]): Word[] {
  console.log('🔄 [Types] Converting Supabase data to app format...', supabaseWords.length, 'words')
  
  const convertedWords = supabaseWords.map((word, wordIndex) => {
    console.log(`🔄 [Types] Converting word ${wordIndex + 1}: "${word.name}"`)
    console.log(`  📊 Raw word data:`, word)
    
    const convertedSigns = word.signs.map((sign: any, signIndex: number) => {
      console.log(`  🎥 Converting sign ${signIndex + 1}:`, sign)
      const convertedSign: SignVideo = {
        id: sign.id,
        video_url: sign.video_url,
        timestamp: new Date(sign.created_at).getTime()
      }

      // Add note if it exists for this sign
      if (sign.note) {
        convertedSign.note = sign.note
      }

      // Add location if it exists for this sign
      if (sign.latitude !== null && sign.longitude !== null) {
        convertedSign.location = {
          latitude: sign.latitude,
          longitude: sign.longitude,
          city: sign.city || undefined
        }
      }

      console.log(`  ✅ Converted sign:`, convertedSign)
      return convertedSign
    }).sort((a: SignVideo, b: SignVideo) => b.timestamp - a.timestamp)
    
    const convertedWord: Word = {
      id: word.id,
      name: word.name,
      signs: convertedSigns
    }
    
    console.log(`✅ [Types] Converted word "${word.name}":`, convertedWord)
    return convertedWord
  })
  
  console.log('🎉 [Types] Conversion completed:', convertedWords.length, 'words converted')
  return convertedWords
}

// Utility function to find the nearest city given coordinates
export function getNearestCityText(latitude: number, longitude: number, city?: string): string {
  if (city) {
    return `${latitude.toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}, ${longitude.toFixed(2)}°${longitude >= 0 ? 'E' : 'W'} (Cerca de ${city})`
  } else {
    return `${latitude.toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}, ${longitude.toFixed(2)}°${longitude >= 0 ? 'E' : 'W'}`
  }
}

// Simple function to get approximate city name based on coordinates
// This is a basic implementation - in production you'd use a proper geocoding service
export async function getCityFromCoordinates(latitude: number, longitude: number): Promise<string | undefined> {
  try {
    // Colombian major cities with approximate coordinates (within 200km radius)
    const cities = [
      { name: "Bogotá", lat: 4.6097, lng: -74.0817, radius: 200 },
      { name: "Medellín", lat: 6.2442, lng: -75.5812, radius: 200 },
      { name: "Cali", lat: 3.4516, lng: -76.5320, radius: 200 },
      { name: "Barranquilla", lat: 10.9639, lng: -74.7964, radius: 200 },
      { name: "Cartagena", lat: 10.3910, lng: -75.4794, radius: 200 },
      { name: "Bucaramanga", lat: 7.1253, lng: -73.1198, radius: 200 },
      { name: "Pereira", lat: 4.8133, lng: -75.6961, radius: 200 },
      { name: "Santa Marta", lat: 11.2408, lng: -74.1990, radius: 200 },
      { name: "Ibagué", lat: 4.4389, lng: -75.2322, radius: 200 },
      { name: "Manizales", lat: 5.0703, lng: -75.5138, radius: 200 }
    ];

    // Calculate distance to each city
    for (const city of cities) {
      const distance = calculateDistance(latitude, longitude, city.lat, city.lng);
      if (distance <= city.radius) {
        return city.name;
      }
    }

    return undefined;
  } catch (error) {
    console.error('Error getting city from coordinates:', error);
    return undefined;
  }
}

// Calculate distance between two points in kilometers using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}