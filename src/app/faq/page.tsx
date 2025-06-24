'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  // General Questions
  {
    id: 1,
    category: 'General',
    question: 'What is Reconnoitering?',
    answer: 'Reconnoitering is a comprehensive platform for discovering art exhibitions worldwide. We help art enthusiasts find exhibitions based on their location, travel dates, and personal preferences. Our platform connects you with museums, galleries, and cultural institutions around the globe.'
  },
  {
    id: 2,
    category: 'General',
    question: 'Is Reconnoitering free to use?',
    answer: 'Yes! Reconnoitering is completely free for all users. You can browse exhibitions, create an account, save favorites, and plan your visits without any charges. We believe art should be accessible to everyone.'
  },
  {
    id: 3,
    category: 'General',
    question: 'How often is exhibition information updated?',
    answer: 'We work closely with museums and galleries to ensure our information is current. Most exhibitions are updated weekly, and our admin team regularly verifies information. Museums can also directly update their exhibitions through our partnership program.'
  },
  
  // Account & Features
  {
    id: 4,
    category: 'Account',
    question: 'Do I need an account to use Reconnoitering?',
    answer: 'No, you can browse exhibitions without an account. However, creating a free account unlocks additional features like saving favorites, setting preferences for personalized recommendations, creating day plans, and receiving notifications about exhibitions that match your interests.'
  },
  {
    id: 5,
    category: 'Account',
    question: 'How do personalized recommendations work?',
    answer: 'When you create an account and set your preferences (favorite artists, art categories, and locations), our system analyzes current and upcoming exhibitions to suggest ones that match your interests. The more you interact with the platform, the better our recommendations become.'
  },
  {
    id: 6,
    category: 'Account',
    question: 'Can I change my email or password?',
    answer: 'Yes, you can update your email and password from your account settings. Go to your profile page and click on "Account Settings" to make changes. For security reasons, you\'ll need to confirm your current password when making these changes.'
  },
  
  // Exhibitions
  {
    id: 7,
    category: 'Exhibitions',
    question: 'How can I search for exhibitions?',
    answer: 'You can search for exhibitions in multiple ways: use the search bar for keywords, browse by location on our interactive map, filter by dates if you\'re planning a trip, browse by categories or tags, or explore our curated collections. You can also combine multiple filters for more precise results.'
  },
  {
    id: 8,
    category: 'Exhibitions',
    question: 'What information is provided for each exhibition?',
    answer: 'Each exhibition page includes: title and description, venue information and location, dates and opening hours, ticket prices (when available), artist information, high-quality images, venue contact details, and direct links to the official exhibition website when available.'
  },
  {
    id: 9,
    category: 'Exhibitions',
    question: 'Can I buy tickets through Reconnoitering?',
    answer: 'Currently, we don\'t sell tickets directly. However, we provide links to the official exhibition or venue websites where you can purchase tickets. We\'re working on partnerships to enable direct ticket purchasing in the future.'
  },
  
  // Planning & Visiting
  {
    id: 10,
    category: 'Planning',
    question: 'How does the Day Planner work?',
    answer: 'The Day Planner helps you organize museum visits for a specific date. Select a date, add exhibitions you want to visit, and the planner will help you organize them efficiently. You can see opening hours, estimate visit duration, and even get directions between venues.'
  },
  {
    id: 11,
    category: 'Planning',
    question: 'Can I save exhibitions for later?',
    answer: 'Yes! When logged in, you can save exhibitions to your favorites by clicking the heart icon. Access your saved exhibitions anytime from your profile page. You can also create custom lists to organize exhibitions by theme or trip.'
  },
  {
    id: 12,
    category: 'Planning',
    question: 'Does Reconnoitering show current opening hours?',
    answer: 'We display the general opening hours provided by venues. However, we always recommend checking the official venue website or calling ahead, as hours may change due to holidays, special events, or unexpected closures.'
  },
  
  // Museums & Partners
  {
    id: 13,
    category: 'Partners',
    question: 'How can my museum/gallery be listed on Reconnoitering?',
    answer: 'We welcome museums and galleries to join our platform! Contact us through our partnership page or email partnerships@reconnoitering.art. We\'ll review your submission and work with you to showcase your exhibitions to our global audience.'
  },
  {
    id: 14,
    category: 'Partners',
    question: 'Can museums update their own exhibition information?',
    answer: 'Yes, verified museum partners receive access to our admin panel where they can manage their exhibitions, update information, add images, and track visitor interest. Contact us to learn more about our partnership program.'
  },
  {
    id: 15,
    category: 'Partners',
    question: 'Is there a fee for museums to list exhibitions?',
    answer: 'Basic listings are free for all museums and galleries. We offer premium features for partners who want enhanced visibility, detailed analytics, and priority support. Contact our partnerships team for more information.'
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const categories = ['All', ...Array.from(new Set(faqData.map(item => item.category)))];

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    setExpandedItems(filteredFAQs.map(item => item.id));
  };

  const collapseAll = () => {
    setExpandedItems([]);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-[var(--primary-light)]">
        <div className="container-narrow text-center">
          <h1 className="text-5xl font-serif mb-4">Frequently Asked Questions</h1>
          <div className="accent-line mx-auto mb-6"></div>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Find answers to common questions about using Reconnoitering to discover amazing art exhibitions.
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 border-b border-[var(--border)]">
        <div className="container-narrow">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--primary-light)] text-[var(--primary)] hover:bg-[var(--border)]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-4 justify-end">
            <button
              onClick={expandAll}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="py-12">
        <div className="container-narrow">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">
                No questions found matching your search. Try different keywords or browse all categories.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((item) => (
                <div
                  key={item.id}
                  className="border border-[var(--border)] rounded-lg overflow-hidden transition-all duration-200 hover:border-[var(--primary)]"
                >
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[var(--primary-light)] transition-colors"
                  >
                    <div>
                      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                        {item.category}
                      </span>
                      <h3 className="text-lg font-medium text-[var(--foreground)] mt-1">
                        {item.question}
                      </h3>
                    </div>
                    {expandedItems.includes(item.id) ? (
                      <ChevronUp className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
                    )}
                  </button>
                  
                  {expandedItems.includes(item.id) && (
                    <div className="px-6 pb-4">
                      <p className="text-[var(--text-muted)] leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-[var(--primary-light)]">
        <div className="container-narrow text-center">
          <h2 className="text-3xl font-serif mb-4">Still Have Questions?</h2>
          <p className="text-[var(--text-muted)] mb-8 max-w-2xl mx-auto">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <a href="/contact" className="btn-primary">
            Contact Support
          </a>
        </div>
      </section>
    </div>
  );
}