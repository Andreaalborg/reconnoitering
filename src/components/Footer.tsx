import Link from 'next/link';
import { Mail, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--primary)] text-white mt-20">
      <div className="container-wide">
        <div className="py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-serif mb-4">Reconnoitering</h2>
            <p className="text-gray-300 mb-6 max-w-sm">
              Discover extraordinary art exhibitions worldwide. Your gateway to 
              the global art scene, curated for the curious mind.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Discover */}
          <div>
            <h3 className="font-medium text-lg mb-4">Discover</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/exhibitions" className="text-gray-300 hover:text-white transition-colors">
                  All Exhibitions
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-gray-300 hover:text-white transition-colors">
                  Interactive Map
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="text-gray-300 hover:text-white transition-colors">
                  Calendar View
                </Link>
              </li>
              <li>
                <Link href="/tags" className="text-gray-300 hover:text-white transition-colors">
                  Browse by Tags
                </Link>
              </li>
              <li>
                <Link href="/nearby" className="text-gray-300 hover:text-white transition-colors">
                  Nearby Exhibitions
                </Link>
              </li>
            </ul>
          </div>

          {/* Plan */}
          <div>
            <h3 className="font-medium text-lg mb-4">Plan</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/day-planner" className="text-gray-300 hover:text-white transition-colors">
                  Day Planner
                </Link>
              </li>
              <li>
                <Link href="/date-search" className="text-gray-300 hover:text-white transition-colors">
                  Search by Date
                </Link>
              </li>
              <li>
                <Link href="/account/favorites" className="text-gray-300 hover:text-white transition-colors">
                  My Favorites
                </Link>
              </li>
              <li>
                <Link href="/account/preferences" className="text-gray-300 hover:text-white transition-colors">
                  Set Preferences
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-medium text-lg mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/partnerships" className="text-gray-300 hover:text-white transition-colors">
                  Partnerships
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-300 hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-white/20 mt-12 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-medium mb-2">Stay in the Loop</h3>
              <p className="text-gray-300">
                Get weekly updates on the latest exhibitions and art events.
              </p>
            </div>
            <div>
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:border-white/40 transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-white text-[var(--primary)] rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Mail className="w-4 h-4" />
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-12 pt-8 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} Reconnoitering. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;