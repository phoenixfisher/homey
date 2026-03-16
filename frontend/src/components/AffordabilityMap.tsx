import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';

interface Location {
  city: string;
  state: string;
  avgPrice: number;
  x: number;
  y: number;
}

interface AffordabilityMapProps {
  targetPrice: number;
}

export function AffordabilityMap({ targetPrice }: AffordabilityMapProps) {
  const locations: Location[] = [
    { city: 'Seattle', state: 'WA', avgPrice: 750000, x: 15, y: 15 },
    { city: 'Portland', state: 'OR', avgPrice: 550000, x: 12, y: 25 },
    { city: 'San Francisco', state: 'CA', avgPrice: 1200000, x: 8, y: 40 },
    { city: 'Los Angeles', state: 'CA', avgPrice: 850000, x: 10, y: 50 },
    { city: 'San Diego', state: 'CA', avgPrice: 800000, x: 12, y: 58 },
    { city: 'Phoenix', state: 'AZ', avgPrice: 450000, x: 22, y: 55 },
    { city: 'Denver', state: 'CO', avgPrice: 600000, x: 35, y: 40 },
    { city: 'Austin', state: 'TX', avgPrice: 550000, x: 45, y: 65 },
    { city: 'Dallas', state: 'TX', avgPrice: 400000, x: 48, y: 58 },
    { city: 'Houston', state: 'TX', avgPrice: 350000, x: 50, y: 68 },
    { city: 'Chicago', state: 'IL', avgPrice: 350000, x: 60, y: 35 },
    { city: 'Minneapolis', state: 'MN', avgPrice: 380000, x: 55, y: 22 },
    { city: 'Nashville', state: 'TN', avgPrice: 450000, x: 62, y: 52 },
    { city: 'Atlanta', state: 'GA', avgPrice: 400000, x: 68, y: 58 },
    { city: 'Miami', state: 'FL', avgPrice: 550000, x: 78, y: 80 },
    { city: 'Charlotte', state: 'NC', avgPrice: 380000, x: 75, y: 52 },
    { city: 'Washington DC', state: 'DC', avgPrice: 650000, x: 80, y: 42 },
    { city: 'Philadelphia', state: 'PA', avgPrice: 400000, x: 82, y: 38 },
    { city: 'New York', state: 'NY', avgPrice: 900000, x: 85, y: 32 },
    { city: 'Boston', state: 'MA', avgPrice: 750000, x: 88, y: 28 },
  ];

  const affordableLocations = locations.filter(loc => loc.avgPrice <= targetPrice);
  const unaffordableLocations = locations.filter(loc => loc.avgPrice > targetPrice);

  return (
    <div className="relative w-full h-80 glass rounded-2xl p-6">
      <div className="mb-4">
        <h3 className="text-white text-lg mb-1">Where You Can Live</h3>
        <p className="text-white/70 text-sm">
          Based on ${targetPrice.toLocaleString()} target price
        </p>
      </div>

      <div className="relative w-full h-56 bg-white/5 rounded-xl overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full opacity-20"
          preserveAspectRatio="none"
        >
          <path
            d="M 10 20 L 15 15 L 85 15 L 90 20 L 90 70 L 80 85 L 50 80 L 20 85 L 10 70 Z"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>

        {unaffordableLocations.map((location, index) => (
          <motion.div
            key={`unaffordable-${index}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ delay: index * 0.05 }}
            className="absolute"
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="relative group">
              <MapPin className="w-5 h-5 text-white/40" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 rounded text-xs text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {location.city}, {location.state}
                <div className="text-white/40">${(location.avgPrice / 1000).toFixed(0)}k</div>
              </div>
            </div>
          </motion.div>
        ))}

        {affordableLocations.map((location, index) => (
          <motion.div
            key={`affordable-${index}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.2 }}
            className="absolute"
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="relative group">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
              >
                <MapPin className="w-6 h-6 text-[#bdc4a7] drop-shadow-lg" fill="#bdc4a7" />
              </motion.div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 glass rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="font-medium">{location.city}, {location.state}</div>
                <div className="text-white/80">${(location.avgPrice / 1000).toFixed(0)}k avg</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#bdc4a7]" fill="#bdc4a7" />
          <span className="text-white/80">Affordable ({affordableLocations.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-white/40" />
          <span className="text-white/60">Not in range ({unaffordableLocations.length})</span>
        </div>
      </div>
    </div>
  );
}
