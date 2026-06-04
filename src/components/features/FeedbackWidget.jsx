import { useState } from 'react';
import chatService from '../../services/chatService';

const FeedbackWidget = ({ sessionId }) => {
  const [approved, setApproved] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (approved === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await chatService.submitFeedback(sessionId, { approved, comment });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
        <span className="material-symbols-outlined text-base">check_circle</span>
        Feedback enviado
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm border border-stone-200 dark:border-stone-700 rounded-2xl p-4 bg-white dark:bg-stone-900 flex flex-col gap-3">
      <p className="text-sm font-medium text-stone-700 dark:text-stone-300 text-center">
        ¿La rúbrica generada es útil?
      </p>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setApproved(true)}
          disabled={submitting}
          className={`w-14 h-10 rounded-xl text-lg transition-colors border ${
            approved === true
              ? 'bg-lime-600 border-lime-600 text-white'
              : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 hover:bg-lime-50 dark:hover:bg-lime-950/20'
          }`}
        >
          👍
        </button>
        <button
          onClick={() => setApproved(false)}
          disabled={submitting}
          className={`w-14 h-10 rounded-xl text-lg transition-colors border ${
            approved === false
              ? 'bg-red-500 border-red-500 text-white'
              : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 hover:bg-red-50 dark:hover:bg-red-950/20'
          }`}
        >
          👎
        </button>
      </div>

      <textarea
        className="w-full border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none"
        rows={2}
        maxLength={500}
        placeholder="Comentario opcional para el docente..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        disabled={submitting}
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={approved === null || submitting}
        className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold py-2 rounded-xl hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors flex items-center justify-center gap-2"
      >
        {submitting && (
          <div className="w-4 h-4 border-2 border-white dark:border-stone-900 border-t-transparent rounded-full animate-spin" />
        )}
        Enviar feedback
      </button>
    </div>
  );
};

export default FeedbackWidget;
