'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
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
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
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
      router.push(`/exhibitions?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-rose-500 text-2xl font-bold">
            Reconnoitering
          </Link>
          
          {/* Center section with nav and search */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div ref={searchRef} className="relative max-w-xs">
              <form 
                onSubmit={handleSearch}
                className="flex items-center border border-gray-300 rounded-full py-2 px-4 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  placeholder="Search..."
                  className="w-40 sm:w-48 outline-none text-gray-600 placeholder-gray-400"
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
              
              {/* Search results dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                  <ul className="py-2">
                    {searchResults.map((result) => (
                      <li key={result._id} className="hover:bg-gray-100">
                        <Link 
                          href={`/exhibition/${result._id}`}
                          className="block px-4 py-2"
                          onClick={() => setShowResults(false)}
                        >
                          <div className="font-medium text-gray-800">{result.title}</div>
                          <div className="text-sm text-gray-600">{result.location.name}, {result.location.city}</div>
                        </Link>
                      </li>
                    ))}
                    <li className="border-t border-gray-100 mt-2 pt-2">
                      <button 
                        onClick={handleSearch}
                        className="block w-full text-left px-4 py-2 text-rose-500 hover:bg-gray-100"
                      >
                        See all results for &quot;{searchQuery}&quot;
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            
            {/* Navigation - Desktop */}
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
                  <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                  <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                </svg>
                Home
              </Link>
              
              <Link href="/exhibitions" className="text-gray-700 hover:text-gray-900">
                Exhibitions
              </Link>
              <Link href="/calendar" className="text-gray-700 hover:text-gray-900">
                Calendar
              </Link>
              <Link href="/date-search" className="text-gray-700 hover:text-gray-900">
                By Date
              </Link>
              <Link href="/nearby" className="text-gray-700 hover:text-gray-900">
                Nearby
              </Link>
              <Link href="/map" className="text-gray-700 hover:text-gray-900">
                Map
              </Link>
            </nav>
          </div>
          
          {/* User Account / Auth Buttons */}
          <div className="flex items-center">
            {status === 'authenticated' ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={toggleDropdown}
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
                  <span className="hidden sm:inline">{session?.user?.name || 'Account'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ml-1 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20">
                    <Link href="/account/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Profile
                    </Link>
                    <Link href="/account/favorites" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      My Favorites
                    </Link>
                    {session?.user?.role === 'admin' && (
                      <>
                        <Link href="/admin/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                          Admin Dashboard
                        </Link>
                        <Link href="/admin/venues" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                          Venues
                        </Link>
                        <Link href="/admin/analytics" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                          Analytics
                        </Link>
                      </>
                    )}
                    <button 
                      onClick={() => signOut({ callbackUrl: '/' })} 
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 border-t border-gray-200"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex space-x-2">
                <Link href="/auth/login" className="text-rose-500 hover:text-rose-700">
                  Sign In
                </Link>
                <Link href="/auth/register" className="bg-rose-500 text-white px-3 py-1 rounded hover:bg-rose-600">
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
            <div className="grid grid-cols-2 gap-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
                  <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                  <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                </svg>
                Home
              </Link>
              <Link href="/exhibitions" className="text-gray-700 hover:text-gray-900">Exhibitions</Link>
              <Link href="/calendar" className="text-gray-700 hover:text-gray-900">Calendar</Link>
              <Link href="/date-search" className="text-gray-700 hover:text-gray-900">By Date</Link>
              <Link href="/nearby" className="text-gray-700 hover:text-gray-900">Nearby</Link>
              <Link href="/map" className="text-gray-700 hover:text-gray-900">Map</Link>
              <Link href="/day-planner" className="text-gray-700 hover:text-gray-900">Day Planner</Link>
              
              {status === 'unauthenticated' && (
                <>
                  <Link href="/auth/login" className="text-rose-500 hover:text-rose-700">Sign In</Link>
                  <Link href="/auth/register" className="bg-rose-500 text-white px-3 py-1 rounded hover:bg-rose-600 flex items-center justify-center">Register</Link>
                </>
              )}
              
              {status === 'authenticated' && session?.user?.role === 'admin' && (
                <Link href="/admin/dashboard" className="text-gray-700 hover:text-gray-900">Admin Dashboard</Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;