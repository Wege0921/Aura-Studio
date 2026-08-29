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
  hideInstructor?: boolean;
  hideSpots?: boolean;
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
    PILATES: 'bg-accent-100 text-content',
    PRENATAL: 'bg-[var(--state-hover)] text-content',
    POSTPARTUM: 'bg-accent-50 text-content',
    MEDITATION: 'bg-accent-400/15 text-content',
  };

  const classDateTime = new Date(`${classItem.date.split('T')[0]}T${classItem.time}`);
  const isPast = classDateTime < new Date();

  const handleBookClick = () => {
    if (onBook && !classItem.isFullyBooked && !isPast) {
      onBook(classItem.id);
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-elev-1 p-6 hover:shadow-elev-2 transition-shadow duration-200 border border-edge">
      {/* Header — like PackageCard */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-content">{classItem.name}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classTypeColors[classItem.classType] || 'bg-[var(--state-hover)] text-content'}`}>
              {classTypeLabels[classItem.classType] || classItem.classType}
            </span>
          </div>
          {classItem.description && (
            <p className="text-content-secondary text-sm">{classItem.description}</p>
          )}
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPast ? 'bg-surface-sunken text-content-muted' : classItem.isFullyBooked ? 'bg-danger-bg text-danger' : 'bg-success-bg text-success'}`}>
          {isPast ? 'Past' : classItem.isFullyBooked ? 'Full' : 'Open'}
        </span>
      </div>

      {/* Details — flex rows like PackageCard */}
      <div className="space-y-2 mb-4">
        {!classItem.hideInstructor && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-content-secondary">Instructor:</span>
            <span className="text-sm font-medium text-content">{classItem.instructor}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-content-secondary">Date:</span>
          <span className="text-sm font-medium text-content">{format(new Date(classItem.date), 'MMM dd, yyyy')}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-content-secondary">Time:</span>
          <span className="text-sm font-medium text-content">{classItem.time}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-content-secondary">Duration:</span>
          <span className="text-sm font-medium text-content">{classItem.duration} min</span>
        </div>

        {!classItem.hideSpots && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-content-secondary">Spots:</span>
            <span className={`text-sm font-medium ${classItem.isFullyBooked ? 'text-danger' : 'text-content'}`}>
              {classItem.availableSpots} / {classItem.capacity}
            </span>
          </div>
        )}
      </div>

      {/* Price + CTA — like PackageCard */}
      <div className="border-t border-edge pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-content">
            {classItem.price ? `ETB ${classItem.price.toLocaleString()}` : 'Free'}
          </span>
          {!classItem.hideSpots && (
            <span className="text-sm text-content-secondary">
              {classItem.isFullyBooked ? 'Waitlist available' : `${classItem.availableSpots} spots left`}
            </span>
          )}
        </div>

        {isPast ? (
          <button
            disabled
            className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-surface-sunken text-content-muted cursor-not-allowed"
          >
            Past Class
          </button>
        ) : classItem.isFullyBooked ? (
          <button
            onClick={() => onJoinWaitlist && !onWaitlist && onJoinWaitlist(classItem.id)}
            disabled={onWaitlist}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              onWaitlist
                ? 'bg-warning-bg text-warning cursor-default'
                : 'bg-warning text-content-on-accent hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-warning focus:ring-offset-2'
            }`}
          >
            {onWaitlist ? 'On Waitlist' : 'Join Waitlist'}
          </button>
        ) : (
          <button
            onClick={handleBookClick}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 bg-accent-600 text-content-on-accent hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
          >
            Book Now
          </button>
        )}
      </div>
    </div>
  );
};

export default ClassCard;
