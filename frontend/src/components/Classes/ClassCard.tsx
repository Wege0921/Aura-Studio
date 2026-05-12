import React from 'react';
import { format } from 'date-fns';

interface Class {
  id: string;
  name: string;
  description?: string;
  instructor: string;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  classType: string;
  availableSpots: number;
  isFullyBooked: boolean;
}

interface ClassCardProps {
  classItem: Class;
  onBook?: (classId: string) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ classItem, onBook }) => {
  const classTypeColors = {
    YOGA: 'bg-purple-100 text-purple-800',
    PILATES: 'bg-pink-100 text-pink-800',
    MEDITATION: 'bg-blue-100 text-blue-800',
  };

  const handleBookClick = () => {
    if (onBook && !classItem.isFullyBooked) {
      onBook(classItem.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{classItem.name}</h3>
          <p className="text-gray-600 text-sm mb-2">{classItem.description}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classTypeColors[classItem.classType as keyof typeof classTypeColors]}`}>
          {classItem.classType}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {classItem.instructor}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {format(new Date(classItem.date), 'MMM dd, yyyy')} at {classItem.time}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {classItem.duration} minutes
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {classItem.availableSpots} of {classItem.capacity} spots available
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className={`text-sm font-medium ${classItem.isFullyBooked ? 'text-red-600' : 'text-green-600'}`}>
          {classItem.isFullyBooked ? 'Fully Booked' : `${classItem.availableSpots} spots left`}
        </div>
        
        <button
          onClick={handleBookClick}
          disabled={classItem.isFullyBooked}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
            classItem.isFullyBooked
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
          }`}
        >
          {classItem.isFullyBooked ? 'Booked' : 'Book Now'}
        </button>
      </div>
    </div>
  );
};

export default ClassCard;
