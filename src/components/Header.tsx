'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

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
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md py-5 px-5 md:px-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex justify-between w-full md:w-auto items-center">
          <Link href="/" className="text-rose-500 text-2xl font-bold">
            Reconnoitering
          </Link>
          
          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"} />
            </svg>
          </button>
        </div>

        <div ref={searchRef} className="relative w-full md:w-auto max-w-sm my-4 md:my-0 md:mx-4">
          <form 
            onSubmit={handleSearch}
            className="flex items-center border border-gray-300 rounded-full py-2 px-4 shadow-sm hover:shadow-md transition-shadow duration-200 w-full"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              placeholder="Search exhibitions..."
              className="flex-grow outline-none text-gray-600 placeholder-gray-400"
            />
            <button 
              type="submit"
              className="bg-rose-500 text-white p-2 rounded-full ml-2"
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
                    See all results for "{searchQuery}"
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

        <nav className={`${menuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 w-full md:w-auto mt-4 md:mt-0`}>
          <Link href="/exhibitions" className="text-gray-700 hover:text-gray-900">
            Exhibitions
          </Link>
          <Link href="/date-search" className="text-gray-700 hover:text-gray-900">
            Search by Date
          </Link>
          <Link href="/day-planner" className="text-gray-700 hover:text-gray-900">
            Day Planner
          </Link>
          <Link href="/nearby" className="text-gray-700 hover:text-gray-900">
            Nearby
          </Link>
          <Link href="/map" className="text-gray-700 hover:text-gray-900">
            Map
          </Link>
          
          {status === 'authenticated' ? (
            <div className="relative group">
              <button className="text-gray-700 hover:text-gray-900">
                {session.user?.name || 'Account'} <span className="ml-1">▼</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 hidden group-hover:block">
                <Link href="/account/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Profile
                </Link>
                <Link href="/account/favorites" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  My Favorites
                </Link>
                {session.user?.role === 'admin' && (
                  <>
                    <Link href="/admin/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Admin Dashboard
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
            </div>
          ) : (
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              <Link href="/auth/login" className="text-rose-500 hover:text-rose-700">
                Sign In
              </Link>
              <Link href="/auth/register" className="bg-rose-500 text-white px-3 py-1 rounded hover:bg-rose-600">
                Register
              </Link>
            </div>
          )}
          
          {status === 'authenticated' && session.user?.role === 'admin' && (
            <Link href="/admin/dashboard" className="md:hidden text-gray-700 hover:text-gray-900">
              Admin Dashboard
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;