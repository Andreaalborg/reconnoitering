// src/components/CalendarExportButtons.tsx
'use client';

import { useState } from 'react';
import { exportExhibitionToCalendar } from '@/services/calendarExport';

interface CalendarExportButtonsProps {
  exhibition: any;
}

export default function CalendarExportButtons({ exhibition }: CalendarExportButtonsProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExport = () => {
    try {
      exportExhibitionToCalendar(exhibition);
    } catch (error) {
      console.error('Error exporting to calendar:', error);
      alert('Failed to generate calendar file. Please try again.');
    }
  };

  const handleShare = () => {
    alert('This feature is coming soon! For now, you can download the calendar file and share it manually.');
  };

  return (
    <div className="relative">
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 flex items-center"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
        Add to Calendar
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 ml-1 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg z-10 overflow-hidden w-48">
          <button
            className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
            onClick={handleExport}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2 text-gray-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
              />
            </svg>
            Download .ics file
          </button>
          
          <button
            className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 border-t border-gray-100"
            onClick={handleShare}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2 text-gray-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" 
              />
            </svg>
            Share by Email
          </button>
          
          <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
            Compatible with Outlook, Google Calendar, Apple Calendar and other calendar apps
          </div>
        </div>
      )}
    </div>
  );
}