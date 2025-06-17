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
  
  // Console log session for debugging
  useEffect(() => {
    if (session?.user) {
      console.log("Session user data:", session.user);
    }
  }, [session]);

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
  
  const navLinks = [
    { href: "/exhibitions", title: "All Exhibitions", description: "Browse our full catalog of art events.", icon: <ListIcon /> },
    { href: "/calendar", title: "Calendar View", description: "See exhibitions on a monthly calendar.", icon: <CalendarIcon /> },
    { href: "/date-search", title: "Search by Date", description: "Find events for your specific travel dates.", icon: <SearchIcon /> },
    { href: "/nearby", title: "Nearby Me", description: "Discover exhibitions close to your location.", icon: <CompassIcon /> },
    { href: "/map", title: "Interactive Map", description: "Explore events visually on a world map.", icon: <MapIcon /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-rose-500 text-2xl font-bold">
            Reconnoitering
          </Link>
          
          {/* Center section with nav and search */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Desktop Navigation */}
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/" className={`text-gray-600 hover:text-rose-500 transition-colors ${pathname === '/' ? 'text-rose-500' : ''}`}>
                Home
              </Link>
              
              <div onMouseEnter={handleMegaMenuEnter} onMouseLeave={handleMegaMenuLeave} className="relative">
                <button className={`flex items-center text-gray-600 hover:text-rose-500 transition-colors ${megaMenuOpen ? 'text-rose-500' : ''}`}>
                  Explore
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ml-1 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`}>
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {megaMenuOpen && (
                  <div ref={megaMenuRef} className="absolute -left-1/2 top-full mt-4 w-screen max-w-md transform -translate-x-1/2 px-4">
                    <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="relative grid gap-6 bg-white px-5 py-6 sm:gap-8 sm:p-8">
                        {navLinks.map((item) => (
                          <Link
                            key={item.title}
                            href={item.href}
                            onClick={() => setMegaMenuOpen(false)}
                            className="-m-3 flex items-start rounded-lg p-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-rose-500 text-white sm:h-12 sm:w-12">
                              {item.icon}
                            </div>
                            <div className="ml-4">
                              <p className="text-base font-bold text-gray-900">{item.title}</p>
                              <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Link href="/day-planner" className={`text-gray-600 hover:text-rose-500 transition-colors ${pathname === '/day-planner' ? 'text-rose-500' : ''}`}>
                Day Planner
              </Link>
            </nav>
            
            {/* Search Bar */}
            <div ref={searchRef} className="relative">
              <form 
                onSubmit={handleSearch}
                className="flex items-center border border-gray-200 rounded-full py-1.5 px-3 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  placeholder="Search exhibitions..."
                  className="w-40 bg-transparent outline-none text-gray-600 placeholder-gray-400 text-sm"
                />
                <button 
                  type="submit"
                  className="bg-rose-500 text-white p-1 rounded-full ml-2"
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
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                  <ul className="py-1">
                    {searchResults.map((result) => (
                      <li key={result._id} className="hover:bg-gray-100">
                        <Link 
                          href={`/exhibition/${result._id}`}
                          className="block px-4 py-2"
                          onClick={() => setShowResults(false)}
                        >
                          <div className="font-medium text-gray-800 text-sm">{result.title}</div>
                          <div className="text-xs text-gray-500">{result.location.name}, {result.location.city}</div>
                        </Link>
                      </li>
                    ))}
                    <li className="border-t border-gray-100">
                      <button 
                        onClick={handleSearch}
                        className="block w-full text-left px-4 py-2 text-rose-500 hover:bg-gray-100 text-sm"
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
          <div className="flex items-center">
            {status === 'authenticated' ? (
              <div className="relative" ref={userDropdownRef}>
                <button 
                  onClick={toggleUserDropdown}
                  className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  {session?.user?.image ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                      <Image 
                        src={session.user.image} 
                        alt="Profile" 
                        width={32} 
                        height={32} 
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center mr-2">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium">{session?.user?.name || 'Account'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ml-1 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg overflow-hidden z-20 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
                    </div>
                    <div className="border-t border-gray-100"></div>
                    <Link href="/account/profile" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                    <Link href="/account/favorites" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Favorites</Link>
                    {session?.user?.role === 'admin' && (
                      <Link href="/admin/dashboard" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin Dashboard</Link>
                    )}
                    <div className="border-t border-gray-100"></div>
                    <button 
                      onClick={() => signOut({ callbackUrl: '/' })} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link href="/auth/login" className="text-gray-600 hover:text-rose-500 text-sm font-medium transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/register" className="bg-rose-500 text-white px-4 py-2 rounded-md hover:bg-rose-600 text-sm font-medium transition-all">
                  Register
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="ml-4 md:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"} />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {menuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.title}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  <div className="mr-3">{link.icon}</div>
                  {link.title}
                </Link>
              ))}
              <Link
                  href="/day-planner"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  <div className="mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  </div>
                  Day Planner
              </Link>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              {status === 'authenticated' ? (
                <div className="space-y-1">
                  <div className="px-3 py-2">
                    <p className="font-medium text-gray-800">{session.user.name}</p>
                    <p className="text-sm text-gray-500">{session.user.email}</p>
                  </div>
                  <Link href="/account/profile" onClick={() => setMenuOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">Your Profile</Link>
                  <Link href="/account/favorites" onClick={() => setMenuOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">My Favorites</Link>
                  {session?.user?.role === 'admin' && (
                    <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">Admin</Link>
                  )}
                  <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }} className="w-full text-left block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/auth/login" className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-rose-500 hover:bg-rose-600">
                    Sign In
                  </Link>
                  <p className="mt-2 text-center text-base font-medium text-gray-500">
                    New customer?{' '}
                    <Link href="/auth/register" className="text-rose-500 hover:text-rose-600">
                      Create an account
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;