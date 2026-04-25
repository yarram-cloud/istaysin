'use client';

import { useEffect, useState, useCallback } from 'react';
import { Star, MessageSquareQuote, CheckCircle, XCircle, Trash2, Reply, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { reviewsApi } from '@/lib/api';

export default function ReviewsPage() {
  const t = useTranslations('Dashboard');
  const [reviews, setReviews] = useState<any[]>([]);
  const [meta, setMeta] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [ratingFilter, setRatingFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (ratingFilter) params.rating = ratingFilter;
      if (publishedFilter !== '') params.isPublished = publishedFilter;
      
      const res = await reviewsApi.getReviews(params);
      if (res.success) {
        setReviews(res.data);
        setMeta(res.meta || { averageRating: 0, totalReviews: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  }, [ratingFilter, publishedFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await reviewsApi.publishReview(id, !currentStatus);
      if (res.success) fetchReviews();
    } catch (err: any) {
      toast.error(err.message || t('actionFailed') || 'Failed to update visibility');
    }
  };

  const submitReply = async (id: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await reviewsApi.replyReview(id, replyText);
      if (res.success) {
        setReplyingTo(null);
        setReplyText('');
        fetchReviews();
      }
    } catch (err: any) {
      toast.error(err.message || t('replyFailed') || 'Failed to submit reply');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = (id: string) => {
    toast(t('confirmDeleteReview') || 'Are you sure you want to permanently delete this review?', {
      description: t('actionCannotBeUndone') || 'This action cannot be undone.',
      action: {
        label: t('confirm') || 'Confirm',
        onClick: async () => {
          try {
            const res = await reviewsApi.deleteReview(id);
            if (res.success) {
               fetchReviews();
               toast.success(t('reviewDeleted') || 'Review deleted successfully');
            }
          } catch (err: any) {
            toast.error(err.message || t('deleteFailed') || 'Failed to delete review');
          }
        }
      },
      cancel: { label: t('cancel') || 'Cancel', onClick: () => {} }
    });
  };

  // Render stars
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-surface-600'}`} />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1">{t('reviewsPage.title')}</h1>
          <p className="text-surface-400">{t('reviewsPage.subtitle')}</p>
        </div>

        {/* Aggregate Stats Card */}
        <div className="bg-surface-800/80 border border-white/[0.06] rounded-xl px-5 py-3 flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs uppercase text-surface-400 font-medium tracking-wider mb-1">{t('reviewsPage.averageRating')}</p>
            <div className="flex items-center justify-center gap-1.5">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-xl font-bold">{meta.averageRating.toFixed(1)}</span>
            </div>
          </div>
          <div className="w-px h-10 bg-white/[0.08]" />
          <div className="text-center">
            <p className="text-xs uppercase text-surface-400 font-medium tracking-wider mb-1">{t('reviewsPage.totalReviews')}</p>
            <div className="flex items-center justify-center gap-1.5">
              <MessageSquareQuote className="w-4 h-4 text-primary-400" />
              <span className="text-xl font-bold">{meta.totalReviews}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="input-field w-auto min-w-[140px]">
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
        <select value={publishedFilter} onChange={(e) => setPublishedFilter(e.target.value)} className="input-field w-auto min-w-[160px]">
          <option value="">All Statuses</option>
          <option value="true">Published</option>
          <option value="false">Hidden</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-surface-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <MessageSquareQuote className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('reviewsPage.noReviews')}</h3>
          <p className="text-surface-400">{t('reviewsPage.noFeedbackMatching')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reviews.map((review) => (
            <div key={review.id} className={`glass-card p-6 border-l-4 ${review.rating >= 4 ? 'border-l-success-500' : review.rating === 3 ? 'border-l-warning-500' : 'border-l-danger-500'}`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{review.guestProfile?.fullName || 'Anonymous'}</h3>
                    <div className="flex gap-0.5 mt-0.5">{renderStars(review.rating)}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-surface-400">
                    <span>Booking: <span className="font-mono text-primary-400">{review.booking?.bookingNumber}</span></span>
                    <span>•</span>
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => togglePublish(review.id, review.isPublished)} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${review.isPublished ? 'bg-success-500/10 text-success-400 border-success-500/20 hover:bg-success-500/20' : 'bg-surface-500/10 text-surface-300 border-surface-500/20 hover:bg-surface-500/20'}`}>
                    {review.isPublished ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {review.isPublished ? t('reviewsPage.published') : t('reviewsPage.hidden')}
                  </button>
                  <button onClick={() => deleteReview(review.id)} className="p-1.5 text-danger-400 hover:bg-danger-500/20 rounded-lg transition-colors" title="Delete Review">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-surface-100 text-sm leading-relaxed mb-4">
                {review.text || <span className="italic text-surface-500">No written feedback provided.</span>}
              </p>

              {review.ownerReply ? (
                <div className="bg-primary-500/5 rounded-xl border border-primary-500/10 p-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-primary-400 text-xs font-medium uppercase tracking-wider">
                      <Reply className="w-3 h-3" /> {t('reviewsPage.propertyResponse')}
                    </div>
                    <button onClick={() => { setReplyingTo(review.id); setReplyText(review.ownerReply); }} className="text-xs text-primary-400 hover:text-primary-300 underline">Edit Reply</button>
                  </div>
                  <p className="text-sm text-surface-200">{review.ownerReply}</p>
                </div>
              ) : replyingTo === review.id ? (
                <div className="mt-4 space-y-3">
                  <textarea 
                    autoFocus
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)} 
                    className="input-field text-sm" 
                    rows={3} 
                    placeholder="Write a public response to your guest..." 
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setReplyingTo(null)} className="btn-secondary py-1.5 px-4 text-sm">Cancel</button>
                    <button onClick={() => submitReply(review.id)} disabled={submitting || !replyText.trim()} className="btn-primary py-1.5 px-4 text-sm flex items-center gap-2">
                      {submitting && <Loader2 className="w-3 h-3 animate-spin" />} Submit Reply
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setReplyingTo(review.id); setReplyText(''); }} className="text-sm text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1.5 mt-2 transition-colors">
                  <Reply className="w-4 h-4" /> {t('reviewsPage.replyToGuest')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
