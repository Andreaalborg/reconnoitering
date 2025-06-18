'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

// --- Icons for Mega Menu ---
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const MapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m-6 3l6-3m0 0l-6-3m6 3V7" /></svg>;
const CompassIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4m8-8h-4M4 12h4m12 0a8 8 0 11-16 0 8 8 0 0116 0z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PlannerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;

interface SearchResult {
  _id: string;
  title: string;
  location: {
    name: string;
    city: string;
  };
}

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  let megaMenuTimeout: NodeJS.Timeout;

  const router = useRouter();
  const { data: session, status } = useSession();
  const searchRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  // Handle search input
  useEffect(() => {
    // Only search if query has 2+ characters
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle clicking outside of search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(`/api/exhibitions?search=${encodeURIComponent(searchQuery)}&limit=5`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setSearchResults(data.data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };
  
  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  const handleMegaMenuEnter = () => {
    clearTimeout(megaMenuTimeout);
    setMegaMenuOpen(true);
  };

  const handleMegaMenuLeave = () => {
    megaMenuTimeout = setTimeout(() => {
      setMegaMenuOpen(false);
    }, 200); // 200ms delay to allow moving mouse between trigger and menu
  };
  
  const exploreMenuItems = {
    discover: [
      { href: "/exhibitions", title: "All Exhibitions", description: "Browse our full catalog", icon: <ListIcon /> },
      { href: "/calendar", title: "Calendar View", description: "Monthly exhibition view", icon: <CalendarIcon /> },
      { href: "/tags", title: "Browse by Tags", description: "Explore categories", icon: <TagIcon /> },
    ],
    plan: [
      { href: "/date-search", title: "Search by Date", description: "Find by travel dates", icon: <SearchIcon /> },
      { href: "/day-planner", title: "Day Planner", description: "Plan your visits", icon: <PlannerIcon /> },
      { href: "/nearby", title: "Nearby Me", description: "Local exhibitions", icon: <CompassIcon /> },
    ],
    explore: [
      { href: "/map", title: "Interactive Map", description: "Visual exploration", icon: <MapIcon /> },
      { href: "/account/favorites", title: "My Favorites", description: "Saved exhibitions", icon: <ClockIcon /> },
    ]
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[var(--border)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-serif text-[var(--primary)]">
            Reconnoitering
          </Link>
          
          {/* Center section with nav and search */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Desktop Navigation */}
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/" className={`text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors ${pathname === '/' ? 'text-[var(--primary)]' : ''}`}>
                Home
              </Link>
              
              <div onMouseEnter={handleMegaMenuEnter} onMouseLeave={handleMegaMenuLeave} className="relative">
                <button className={`flex items-center text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors ${megaMenuOpen ? 'text-[var(--primary)]' : ''}`}>
                  Explore
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ml-1 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`}>
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {megaMenuOpen && (
                  <div ref={megaMenuRef} className="absolute -left-20 top-full mt-3 w-[600px]">
                    <div className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 bg-white">
                      <div className="grid grid-cols-3 gap-6 p-8">
                        {/* Discover Section */}
                        <div>
                          <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">Discover</h3>
                          <div className="space-y-3">
                            {exploreMenuItems.discover.map((item) => (
                              <Link
                                key={item.title}
                                href={item.href}
                                onClick={() => setMegaMenuOpen(false)}
                                className="flex items-start p-2 -m-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors group"
                              >
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--secondary)] group-hover:bg-[var(--secondary)] group-hover:text-white transition-colors">
                                  {item.icon}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-[var(--primary)]">{item.title}</p>
                                  <p className="text-xs text-[var(--text-muted)]">{item.description}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Plan Section */}
                        <div>
                          <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">Plan</h3>
                          <div className="space-y-3">
                            {exploreMenuItems.plan.map((item) => (
                              <Link
                                key={item.title}
                                href={item.href}
                                onClick={() => setMegaMenuOpen(false)}
                                className="flex items-start p-2 -m-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors group"
                              >
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                                  {item.icon}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-[var(--primary)]">{item.title}</p>
                                  <p className="text-xs text-[var(--text-muted)]">{item.description}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Explore More Section */}
                        <div>
                          <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">More</h3>
                          <div className="space-y-3">
                            {exploreMenuItems.explore.map((item) => (
                              <Link
                                key={item.title}
                                href={item.href}
                                onClick={() => setMegaMenuOpen(false)}
                                className="flex items-start p-2 -m-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors group"
                              >
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                                  {item.icon}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-[var(--primary)]">{item.title}</p>
                                  <p className="text-xs text-[var(--text-muted)]">{item.description}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom CTA */}
                      <div className="bg-[var(--primary-light)] px-8 py-4">
                        <p className="text-sm text-[var(--text-muted)]">
                          Looking for something specific? Try our{' '}
                          <Link href="/search" className="text-[var(--secondary)] hover:underline" onClick={() => setMegaMenuOpen(false)}>
                            advanced search
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Link href="/about" className={`text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors ${pathname === '/about' ? 'text-[var(--primary)]' : ''}`}>
                About
              </Link>
              
              <Link href="/contact" className={`text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors ${pathname === '/contact' ? 'text-[var(--primary)]' : ''}`}>
                Contact
              </Link>
              
              <Link href="/faq" className={`text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors ${pathname === '/faq' ? 'text-[var(--primary)]' : ''}`}>
                FAQ
              </Link>
            </nav>
            
            {/* Search Bar */}
            <div ref={searchRef} className="relative">
              <form 
                onSubmit={handleSearch}
                className="flex items-center border border-[var(--border)] rounded-full py-1.5 px-3 hover:border-[var(--primary)] transition-colors duration-200"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  placeholder="Search exhibitions..."
                  className="w-40 bg-transparent outline-none text-[var(--foreground)] placeholder-[var(--text-muted)] text-sm"
                />
                <button 
                  type="submit"
                  className="bg-[var(--secondary)] text-white p-1 rounded-full ml-2 hover:bg-[var(--secondary-hover)] transition-colors"
                >
                  {searching ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  )}
                </button>
              </form>
              
              {showResults && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto border border-[var(--border)]">
                  <ul className="py-1">
                    {searchResults.map((result) => (
                      <li key={result._id} className="hover:bg-[var(--primary-light)]">
                        <Link 
                          href={`/exhibition/${result._id}`}
                          className="block px-4 py-2"
                          onClick={() => setShowResults(false)}
                        >
                          <div className="font-medium text-[var(--foreground)] text-sm">{result.title}</div>
                          <div className="text-xs text-[var(--text-muted)]">{result.location.name}, {result.location.city}</div>
                        </Link>
                      </li>
                    ))}
                    <li className="border-t border-[var(--border)]">
                      <button 
                        onClick={handleSearch}
                        className="block w-full text-left px-4 py-2 text-[var(--secondary)] hover:bg-[var(--primary-light)] text-sm"
                      >
                        See all results for &quot;{searchQuery}&quot;
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {/* User Account / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full"></div>
            ) : session ? (
              <div ref={userDropdownRef} className="relative">
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center space-x-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-[var(--secondary)] text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}>
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 border border-[var(--border)]">
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <p className="text-sm font-medium text-[var(--foreground)]">{session.user?.name || 'User'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{session.user?.email}</p>
                    </div>
                    <ul className="py-1">
                      <li>
                        <Link href="/account/profile" className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--primary-light)]">
                          My Profile
                        </Link>
                      </li>
                      <li>
                        <Link href="/account/favorites" className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--primary-light)]">
                          My Favorites
                        </Link>
                      </li>
                      <li>
                        <Link href="/account/preferences" className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--primary-light)]">
                          Preferences
                        </Link>
                      </li>
                      {session.user?.role === 'admin' && (
                        <>
                          <li className="border-t border-[var(--border)] mt-1">
                            <Link href="/admin/dashboard" className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--primary-light)]">
                              Admin Dashboard
                            </Link>
                          </li>
                        </>
                      )}
                      <li className="border-t border-[var(--border)] mt-1">
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="block w-full text-left px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--primary-light)]"
                        >
                          Sign Out
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/auth/login" 
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/register" 
                  className="btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-[var(--primary)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[var(--border)]">
          <div className="px-4 py-6 space-y-4">
            <form onSubmit={handleSearch} className="flex items-center border border-[var(--border)] rounded-full py-2 px-4 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exhibitions..."
                className="flex-1 bg-transparent outline-none text-[var(--foreground)] placeholder-[var(--text-muted)]"
              />
              <button type="submit" className="ml-2 text-[var(--secondary)]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
            </form>
            
            <nav className="space-y-2">
              <Link href="/" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link href="/exhibitions" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>All Exhibitions</Link>
              <Link href="/calendar" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>Calendar</Link>
              <Link href="/map" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>Map</Link>
              <Link href="/nearby" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>Nearby</Link>
              <Link href="/day-planner" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>Day Planner</Link>
              <Link href="/tags" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>Browse Tags</Link>
              <Link href="/about" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>About</Link>
              <Link href="/contact" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>Contact</Link>
              <Link href="/faq" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>FAQ</Link>
            </nav>
            
            {session ? (
              <div className="pt-4 border-t border-[var(--border)] space-y-2">
                <Link href="/account/profile" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>
                  My Profile
                </Link>
                <Link href="/account/favorites" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>
                  My Favorites
                </Link>
                <Link href="/account/preferences" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>
                  Preferences
                </Link>
                {session.user?.role === 'admin' && (
                  <Link href="/admin/dashboard" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="block w-full text-left py-2 text-[var(--foreground)]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-[var(--border)] space-y-2">
                <Link href="/auth/login" className="block py-2 text-[var(--foreground)]" onClick={() => setMenuOpen(false)}>
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary block text-center" onClick={() => setMenuOpen(false)}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;