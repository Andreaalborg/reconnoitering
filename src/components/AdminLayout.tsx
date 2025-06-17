import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p>Laster...</p></div>;
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    // Videresend til login hvis ikke autentisert eller ikke admin
    // Bruk router.replace for å unngå at brukeren kan gå tilbake til admin-siden
    if (typeof window !== 'undefined') {
        router.replace('/admin/login');
    }
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p>Omdirigerer...</p></div>; 
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/" className="flex-shrink-0 flex items-center text-rose-500 text-xl font-bold">
                Reconnoitering Admin
              </Link>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link href="/admin/dashboard" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Dashboard
                </Link>
                <Link href="/admin/exhibitions/new" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Ny Utstilling
                </Link>
                <Link href="/admin/venues" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Venues
                </Link>
                <Link href="/admin/tags" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Tags
                </Link>
                <Link href="/admin/artists" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Kunstnere
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              {session?.user?.name && <span className="text-gray-700 mr-4 text-sm">Logget inn som {session.user.name}</span>}
              <button
                onClick={() => router.push('/api/auth/signout')}
                className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logg ut
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 