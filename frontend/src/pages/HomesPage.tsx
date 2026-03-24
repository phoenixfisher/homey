import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import L from 'leaflet';
import { AppLayout } from '@/components/AppLayout';
import { MainNav } from '@/components/MainNav';
import { AuthHeaderActions } from '@/components/AuthHeaderActions';
import { backendLogout, fetchSessionUser, getUserProfile, isLoggedIn as getIsLoggedIn, logout } from '@/lib/auth';
import { searchHomesByZip, type HomeListing } from '@/lib/homes';
import { fetchUserProfile, updateUserProfile } from '@/lib/profile';

type HomesData = {
  selectedZip: string;
  nearbyZips: string[];
  withinRange: HomeListing[];
  slightlyAboveRange: HomeListing[];
  belowComfortRange: HomeListing[];
};

function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip.trim());
}

function HomeCard({ home }: { home: HomeListing }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div>
        <p className="text-white text-xl">${Math.round(home.price).toLocaleString()}</p>
        <p className="text-white/80 text-sm mt-1">{home.address}</p>
        <p className="text-white/60 text-xs mt-1">ZIP {home.zipCode}</p>
      </div>
      <div className="mt-3 text-sm text-white/75">
        {home.beds || 0} bd • {home.baths || 0} ba • {home.sqft || 0} sqft
      </div>
      {home.detailUrl && (
        <a
          href={home.detailUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-3 px-3 py-1.5 bg-white text-[#3e78b2] rounded-lg hover:bg-white/90 transition-all"
        >
          View Listing
        </a>
      )}
    </div>
  );
}

function InteractiveListingsMap({ homes }: { homes: HomeListing[] }) {
  const mapRootRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const validHomes = homes.filter((h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude));

  useEffect(() => {
    if (!mapRootRef.current || leafletMapRef.current) {
      return;
    }

    const map = L.map(mapRootRef.current, {
      zoomControl: true,
      minZoom: 3,
      maxZoom: 20,
    }).setView([39.5, -98.35], 4);

    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!leafletMapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();
    if (validHomes.length === 0) return;

    const bounds = L.latLngBounds([]);
    validHomes.forEach((home) => {
      const marker = L.marker([home.latitude, home.longitude]);
      marker.bindPopup(
        `<div><strong>${home.address}</strong><br/>$${Math.round(home.price).toLocaleString()}<br/>${home.beds} bd • ${home.baths} ba • ${home.sqft} sqft</div>`,
      );
      marker.addTo(markersRef.current!);
      bounds.extend([home.latitude, home.longitude]);
    });

    if (bounds.isValid()) {
      leafletMapRef.current.fitBounds(bounds.pad(0.65));
    }
  }, [validHomes]);

  return (
    <div className="space-y-3">
      <p className="text-white/70 text-sm">
        Google streets + landmarks layer. Use mouse wheel or +/- to zoom out farther.
      </p>
      <div ref={mapRootRef} className="h-[520px] rounded-2xl overflow-hidden border border-white/15" />
      {validHomes.length === 0 && (
        <p className="text-white/70 text-sm">No map points available for this ZIP search.</p>
      )}
    </div>
  );
}

export function HomesPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [zipInput, setZipInput] = useState('');
  const [selectedZip, setSelectedZip] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [homes, setHomes] = useState<HomesData | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const sessionUser = await fetchSessionUser();
        const authenticated = !!sessionUser || getIsLoggedIn() || !!getUserProfile();
        setIsLoggedIn(authenticated);
        setFirstName(sessionUser?.firstName ?? null);

        if (!authenticated) {
          setLoading(false);
          return;
        }

        const profile = await fetchUserProfile();
        const profileZip = profile?.targetZipCode ?? '';
        if (profileZip) {
          setSelectedZip(profileZip);
          setZipInput(profileZip);
          const result = await searchHomesByZip(profileZip);
          setHomes(result);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unable to load homes right now.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAuthClick = () => {
    if (isLoggedIn) {
      void backendLogout();
      logout();
      setIsLoggedIn(false);
      void navigate('/');
      return;
    }

    void navigate('/login');
  };

  const handleZipSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!isValidZip(zipInput)) {
      setError('Please enter a valid 5-digit ZIP code.');
      return;
    }

    setSearching(true);
    try {
      const zip = zipInput.trim();
      setSelectedZip(zip);
      const profile = await fetchUserProfile();
      if (profile) {
        await updateUserProfile({
          username: profile.username,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          desiredHomePrice: profile.desiredHomePrice,
          creditScore: profile.creditScore,
          monthlyIncome: profile.monthlyIncome,
          monthlyExpenses: profile.monthlyExpenses,
          totalSavings: profile.totalSavings,
          targetZipCode: zip,
          industryOfWork: profile.industryOfWork,
        });
      }
      const result = await searchHomesByZip(zip);
      setHomes(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to search homes.');
    } finally {
      setSearching(false);
    }
  };

  const allMapHomes = useMemo(() => {
    if (!homes) return [];
    return [...homes.withinRange, ...homes.slightlyAboveRange, ...homes.belowComfortRange]
      .filter((h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude));
  }, [homes]);

  return (
    <AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
      <MainNav
        active="homes"
        isLoggedIn={isLoggedIn}
        rightContent={(
          <AuthHeaderActions
            isLoggedIn={isLoggedIn}
            firstName={firstName}
            onAuthClick={handleAuthClick}
          />
        )}
      />

      <main className="flex-1 p-4 md:p-8 relative">
        <div className="max-w-7xl mx-auto relative z-10 space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6 md:p-8"
          >
            <h1 className="text-3xl md:text-4xl text-white mb-2">Homes Near Your ZIP</h1>
            <p className="text-white/75">
              Explore listings in your selected ZIP and nearby ZIP codes, grouped by affordability.
            </p>
          </motion.section>

          {!loading && !isLoggedIn && (
            <div className="glass rounded-3xl p-6 md:p-8">
              <p className="text-white/85 mb-4">Please log in to view homes around your ZIP code.</p>
              <button
                type="button"
                onClick={() => void navigate('/login')}
                className="px-4 py-2 bg-white text-[#3e78b2] rounded-xl hover:bg-white/90 transition-all"
              >
                Go to Login
              </button>
            </div>
          )}

          {isLoggedIn && (
            <>
              <section className="glass rounded-3xl p-6">
                <form onSubmit={handleZipSubmit} className="flex flex-col md:flex-row md:items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-white/90 mb-2">Target ZIP Code</label>
                    <input
                      value={zipInput}
                      onChange={(e) => setZipInput(e.target.value)}
                      placeholder="e.g., 84604"
                      className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-6 py-3 bg-white text-[#3e78b2] rounded-xl hover:bg-white/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {searching ? 'Loading...' : selectedZip ? 'Change ZIP' : 'Set ZIP'}
                  </button>
                </form>
                {error && <p className="mt-3 text-red-100">{error}</p>}
                {homes && (
                  <p className="mt-3 text-white/70 text-sm">
                    Showing homes for ZIP {homes.selectedZip} and nearby ZIPs: {homes.nearbyZips.join(', ')}
                  </p>
                )}
              </section>

              {homes && (
                <>
                  <section className="glass rounded-3xl p-4 md:p-6">
                    <h2 className="text-2xl text-white mb-4">Map</h2>
                    <InteractiveListingsMap homes={allMapHomes} />
                  </section>

                  <section className="space-y-6">
                    <div className="glass rounded-3xl p-6">
                      <h3 className="text-2xl text-white mb-4">Homes You Can Afford</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {homes.withinRange.map((home) => <HomeCard key={home.listingId} home={home} />)}
                      </div>
                    </div>

                    <div className="glass rounded-3xl p-6">
                      <h3 className="text-2xl text-white mb-4">Slightly Above Your Range</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {homes.slightlyAboveRange.map((home) => <HomeCard key={home.listingId} home={home} />)}
                      </div>
                    </div>

                    <div className="glass rounded-3xl p-6">
                      <h3 className="text-2xl text-white mb-4">Below Your Comfortable Range</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {homes.belowComfortRange.map((home) => <HomeCard key={home.listingId} home={home} />)}
                      </div>
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
