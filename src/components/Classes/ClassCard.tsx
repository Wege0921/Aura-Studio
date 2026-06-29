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
  imageUrl?: string;
  availableSpots: number;
  isFullyBooked: boolean;
  price?: number;
}

interface ClassCardProps {
  classItem: Class;
  onBook?: (classId: string) => void;
  onJoinWaitlist?: (classId: string) => void;
  onWaitlist?: boolean;
}

const classTypeLabels: Record<string, string> = {
  PILATES: 'Pilates',
  PRENATAL: 'Prenatal',
  POSTPARTUM: 'Postpartum',
  MEDITATION: 'Meditation',
};

const ClassCard: React.FC<ClassCardProps> = ({ classItem, onBook, onJoinWaitlist, onWaitlist = false }) => {
  const classTypeColors: Record<string, string> = {
    PILATES: 'bg-aura-clay/20 text-aura-cream',
    PRENATAL: 'bg-aura-sand/10 text-aura-cream',
    POSTPARTUM: 'bg-aura-clay/15 text-aura-cream',
    MEDITATION: 'bg-purple-500/15 text-aura-cream',
  };

  const handleBookClick = () => {
    if (onBook && !classItem.isFullyBooked) {
      onBook(classItem.id);
    }
  };

  return (
    <div className="bg-aura-ink rounded-xl shadow-lg shadow-black/20 p-6 hover:shadow-xl transition-shadow duration-200 border border-aura-sand/10">
      {/* Header — like PackageCard */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-aura-cream">{classItem.name}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classTypeColors[classItem.classType] || 'bg-aura-sand/15 text-aura-cream'}`}>
              {classTypeLabels[classItem.classType] || classItem.classType}
            </span>
          </div>
          {classItem.description && (
            <p className="text-aura-sand text-sm">{classItem.description}</p>
          )}
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classItem.isFullyBooked ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
          {classItem.isFullyBooked ? 'Full' : 'Open'}
        </span>
      </div>

      {/* Details — flex rows like PackageCard */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-aura-sand">Instructor:</span>
          <span className="text-sm font-medium text-aura-cream">{classItem.instructor}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-aura-sand">Date:</span>
          <span className="text-sm font-medium text-aura-cream">{format(new Date(classItem.date), 'MMM dd, yyyy')}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-aura-sand">Time:</span>
          <span className="text-sm font-medium text-aura-cream">{classItem.time}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-aura-sand">Duration:</span>
          <span className="text-sm font-medium text-aura-cream">{classItem.duration} min</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-aura-sand">Spots:</span>
          <span className={`text-sm font-medium ${classItem.isFullyBooked ? 'text-red-400' : 'text-aura-cream'}`}>
            {classItem.availableSpots} / {classItem.capacity}
          </span>
        </div>
      </div>

      {/* Price + CTA — like PackageCard */}
      <div className="border-t border-aura-sand/10 pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-aura-cream">
            {classItem.price ? `ETB ${classItem.price.toLocaleString()}` : 'Free'}
          </span>
          <span className="text-sm text-aura-sand">
            {classItem.isFullyBooked ? 'Waitlist available' : `${classItem.availableSpots} spots left`}
          </span>
        </div>

        {classItem.isFullyBooked ? (
          <button
            onClick={() => onJoinWaitlist && !onWaitlist && onJoinWaitlist(classItem.id)}
            disabled={onWaitlist}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              onWaitlist
                ? 'bg-amber-900/30 text-amber-300 cursor-default'
                : 'bg-amber-700 text-aura-cream hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
            }`}
          >
            {onWaitlist ? 'On Waitlist' : 'Join Waitlist'}
          </button>
        ) : (
          <button
            onClick={handleBookClick}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Book Now
          </button>
        )}
      </div>
    </div>
  );
};

export default ClassCard;
