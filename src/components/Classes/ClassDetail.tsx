import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useSEO } from '../../hooks/useSEO';
import BookingModal from '../Booking/BookingModal';

interface ClassDetailData {
  id: string;
  name: string;
  description?: string;
  instructor: string;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  classType: string;
  price?: number;
  imageUrl?: string;
  availableSpots: number;
  isFullyBooked: boolean;
  hideInstructor?: boolean;
  hideSpots?: boolean;
  bookings: { id: string; user: { name: string } }[];
}

const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cls, setCls] = useState<ClassDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activePackages, setActivePackages] = useState<{ id: string; name: string; remainingSessions: number }[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewAvg, setReviewAvg] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);

  useSEO(
    cls
      ? { title: `${cls.name} — AURA Studio`, description: cls.description || 'Join this class at AURA Studio', canonicalPath: `/classes/${id}` }
      : { title: 'Class Details — AURA Studio', description: 'Join this class at AURA Studio', canonicalPath: `/classes/${id}` }
  );

  const fetchClass = useCallback(async () => {
    try {
      const [classRes, reviewsRes] = await Promise.all([
        fetch(`/api/classes/${id}`),
        fetch(`/api/reviews/class/${id}`),
      ]);
      if (classRes.ok) {
        const data = await classRes.json();
        setCls(data);
      } else {
        setError('Class not found');
      }
      if (reviewsRes.ok) {
        const reviewData = await reviewsRes.json();
        setReviews(reviewData.reviews || []);
        setReviewAvg(reviewData.average || 0);
        setReviewCount(reviewData.count || 0);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchActivePackages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('/api/packages/my-packages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const active = data
          .filter((pkg: any) => pkg.remainingSessions > 0 && (!pkg.expiresAt || new Date(pkg.expiresAt) >= new Date()))
          .map((pkg: any) => ({
            id: pkg.id,
            name: pkg.package.name,
            remainingSessions: pkg.remainingSessions,
          }));
        setActivePackages(active);
      }
    } catch (e) {
      console.error('Failed to fetch active packages', e);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchClass();
    fetchActivePackages();
  }, [id, fetchClass, fetchActivePackages]);

  const handleSubmitReview = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setReviewLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ classId: id, ...reviewForm }),
      });
      if (response.ok) {
        setReviewForm({ rating: 5, comment: '' });
        fetchClass();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit review');
      }
    } catch {
      alert('Network error');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleOpenBooking = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async (paymentMethod: string, receiptFile?: File, usePackageSession?: boolean) => {
    if (!cls) return;
    try {
      setBookingLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('classId', cls.id);
      formData.append('paymentMethod', paymentMethod);
      formData.append('paymentAmount', (cls.price || 0).toString());
      if (usePackageSession) {
        formData.append('usePackageSession', 'true');
      }
      if (receiptFile) {
        formData.append('paymentReceipt', receiptFile);
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setShowBookingModal(false);
        fetchClass();
      } else {
        alert(data.error || 'Booking failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: cls?.name || 'AURA Studio Class',
        text: `Join ${cls?.name} with ${cls?.instructor} at AURA Studio!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600" />
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-danger-bg border border-danger-border text-danger px-4 py-3 rounded">
          {error || 'Class not found'}
        </div>
        <button
          onClick={() => navigate('/classes')}
          className="mt-4 bg-accent-600 text-content-on-accent px-4 py-2 rounded-lg hover:bg-accent-700"
        >
          Back to Classes
        </button>
      </div>
    );
  }

  const classDateTime = new Date(`${cls.date.split('T')[0]}T${cls.time}`);
  const isPast = classDateTime < new Date();
  const isWithin2Hours = !isPast && classDateTime.getTime() - new Date().getTime() < 2 * 60 * 60 * 1000;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/classes')}
        className="text-content-secondary hover:text-content text-sm flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Classes
      </button>

      <div className="bg-surface rounded-xl shadow-elev-1 border border-edge overflow-hidden">
        {cls.imageUrl && (
          <div className="h-48 md:h-64 w-full bg-canvas">
            <img src={cls.imageUrl} alt={cls.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-content mb-2">{cls.name}</h1>
              <p className="text-content-secondary">{cls.description || 'A rejuvenating pilates session.'}</p>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-canvas border border-edge text-content-secondary hover:text-content transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-canvas rounded-lg p-4 border border-edge">
              <p className="text-xs text-content-secondary uppercase tracking-wider">Date</p>
              <p className="text-content font-medium">{format(new Date(cls.date), 'MMM dd, yyyy')}</p>
            </div>
            <div className="bg-canvas rounded-lg p-4 border border-edge">
              <p className="text-xs text-content-secondary uppercase tracking-wider">Time</p>
              <p className="text-content font-medium">{cls.time}</p>
            </div>
            <div className="bg-canvas rounded-lg p-4 border border-edge">
              <p className="text-xs text-content-secondary uppercase tracking-wider">Duration</p>
              <p className="text-content font-medium">{cls.duration} min</p>
            </div>
            {(!cls.hideInstructor || !cls.hideSpots) && (
              <>
                {!cls.hideInstructor && (
                  <div className="bg-canvas rounded-lg p-4 border border-edge">
                    <p className="text-xs text-content-secondary uppercase tracking-wider">Instructor</p>
                    <p className="text-content font-medium">{cls.instructor}</p>
                  </div>
                )}
                {!cls.hideSpots && (
                  <div className="bg-canvas rounded-lg p-4 border border-edge">
                    <p className="text-xs text-content-secondary uppercase tracking-wider">Availability</p>
                    <p className="text-content font-medium">{cls.availableSpots} of {cls.capacity} spots</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            {!cls.hideSpots && (
              <span className="text-sm text-content-secondary">
                {cls.availableSpots} of {cls.capacity} spots available
              </span>
            )}
            {cls.isFullyBooked && (
              <span className="px-2 py-1 rounded bg-danger-bg text-danger text-xs font-medium">Fully Booked</span>
            )}
            {cls.price !== undefined && cls.price > 0 && (
              <span className="px-2 py-1 rounded bg-accent-700/40 text-accent-100 text-xs font-medium">
                ETB {cls.price.toLocaleString()}
              </span>
            )}
          </div>

          {!isPast && (
            <div className="mt-6">
              <button
                onClick={handleOpenBooking}
                disabled={cls.isFullyBooked || isWithin2Hours}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                  cls.isFullyBooked || isWithin2Hours
                    ? 'bg-accent-200/40 text-accent-200 cursor-not-allowed'
                    : 'bg-accent-600 text-content-on-accent hover:bg-accent-700'
                }`}
              >
                {cls.isFullyBooked
                  ? 'Fully Booked'
                  : isWithin2Hours
                  ? 'Booking closed'
                  : 'Book Now'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmBooking}
        classInfo={cls ? {
          name: cls.name,
          instructor: cls.instructor,
          date: cls.date,
          time: cls.time,
          duration: cls.duration,
          price: cls.price,
        } : null}
        loading={bookingLoading}
        activePackages={activePackages}
      />

      {/* Reviews */}
      <div className="bg-surface rounded-xl shadow-elev-1 border border-edge p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-content">Reviews</h2>
          {reviewCount > 0 && (
            <span className="text-content-secondary text-sm">
              {reviewAvg} ★ ({reviewCount})
            </span>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="text-content-secondary text-sm">No reviews yet. Be the first to review after attending!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r: any) => (
              <div key={r.id} className="border-b border-edge pb-3 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-content font-medium text-sm">{r.user?.name || 'Anonymous'}</span>
                  <span className="text-warning text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p className="text-content-secondary text-sm">{r.comment}</p>}
                <p className="text-content-secondary text-xs mt-1">{format(new Date(r.createdAt), 'MMM dd, yyyy')}</p>
              </div>
            ))}
          </div>
        )}

        {user && (
          <div className="mt-6 pt-4 border-t border-edge">
            <h3 className="text-sm font-medium text-content mb-2">Write a Review</h3>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-content-secondary">Rating:</label>
              <select
                value={reviewForm.rating}
                onChange={e => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                className="bg-canvas border border-edge rounded text-content text-sm px-2 py-1"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience..."
              rows={3}
              className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content text-sm focus:outline-none focus:ring-2 focus:ring-content-secondary mb-2"
            />
            <button
              onClick={handleSubmitReview}
              disabled={reviewLoading}
              className="bg-accent-600 text-content-on-accent px-4 py-2 rounded-lg text-sm hover:bg-accent-700 transition-colors disabled:opacity-50"
            >
              {reviewLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetail;
