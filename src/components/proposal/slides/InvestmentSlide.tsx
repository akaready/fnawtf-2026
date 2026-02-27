'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, Star, User } from 'lucide-react';
import { ProposalCalculatorEmbed } from '@/components/proposal/ProposalCalculatorEmbed';
import type { ProposalCalculatorSaveHandle, CalculatorStateSnapshot } from '@/components/proposal/ProposalCalculatorEmbed';
import { SlideHeader } from '@/components/proposal/SlideHeader';
import { useDirectionalFill } from '@/hooks/useDirectionalFill';
import { saveClientQuote, deleteClientQuote } from '@/app/p/[slug]/actions';
import type { ProposalQuoteRow, ProposalType } from '@/types/proposal';

// ── Icon reveal variants (matches site-wide pattern) ─────────────────────────

const iconVariants = {
  hidden: {
    opacity: 0,
    x: -8,
    width: 0,
    marginRight: -8,
  },
  visible: {
    opacity: 1,
    x: 0,
    width: 'auto',
    marginRight: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// ── InvestmentSlide ──────────────────────────────────────────────────────────

interface Props {
  proposalId: string;
  proposalType: ProposalType;
  quotes: ProposalQuoteRow[];
  crowdfundingApproved?: boolean;
  slideRef?: React.RefObject<HTMLElement>;
  viewerName?: string | null;
}

export function InvestmentSlide({
  proposalId,
  proposalType,
  quotes: initialQuotes,
  crowdfundingApproved,
  slideRef,
  viewerName,
}: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const calcSaveRef = useRef<ProposalCalculatorSaveHandle | null>(null);

  // New Comparison Quote button refs (directional fill)
  const newBtnRef = useRef<HTMLButtonElement>(null);
  const newFillRef = useRef<HTMLDivElement>(null);
  const [newHovered, setNewHovered] = useState(false);

  useDirectionalFill(newBtnRef, newFillRef, {
    onFillStart: () => {
      setNewHovered(true);
      const textSpan = newBtnRef.current?.querySelector('span');
      if (textSpan) gsap.to(textSpan, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
    },
    onFillEnd: () => {
      setNewHovered(false);
      const textSpan = newBtnRef.current?.querySelector('span');
      if (textSpan) gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
    },
  });

  const [quotes, setQuotes] = useState(initialQuotes);

  // Derived quote lists
  const allActive = quotes.filter((q) => !q.deleted_at);
  const recommendedQuote = allActive.find((q) => q.is_fna_quote) ?? null; // First FNA = recommended
  const comparisonQuotes = allActive.filter((q) => q !== recommendedQuote); // Everything else
  const clientQuotes = comparisonQuotes.filter((q) => !q.is_fna_quote);

  // ID-based tab system
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(
    recommendedQuote?.id ?? comparisonQuotes[0]?.id ?? null
  );

  const activeQuote = quotes.find((q) => q.id === activeQuoteId) ?? null;
  const isLocked = !!activeQuote?.is_fna_quote;

  // New quote creation
  const [savingQuote, setSavingQuote] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  // Delete confirm state
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);
  const [hoveredIconId, setHoveredIconId] = useState<string | null>(null);
  const [dimmedIconId, setDimmedIconId] = useState<string | null>(null);
  const deletingIconRef = useRef<HTMLSpanElement>(null);

  // Click outside deleting icon cancels delete confirm
  useEffect(() => {
    if (!deletingQuoteId) return;
    const handler = (e: MouseEvent) => {
      if (deletingIconRef.current && !deletingIconRef.current.contains(e.target as Node)) {
        setDeletingQuoteId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [deletingQuoteId]);

  // Sync local quotes state after any auto-save
  const handleQuoteUpdated = useCallback((payload: CalculatorStateSnapshot) => {
    if (!activeQuoteId) return;
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === activeQuoteId
          ? { ...q, ...payload, updated_at: new Date().toISOString() }
          : q
      )
    );
  }, [activeQuoteId]);

  // ── GSAP entrance animation ──
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const eyebrow    = el.querySelector('[data-eyebrow]')     as HTMLElement;
      const wordEls    = el.querySelectorAll('[data-word]');
      const accentLine = el.querySelector('[data-accent-line]') as HTMLElement;
      const descEl     = el.querySelector('[data-desc]')        as HTMLElement;
      const content    = el.querySelector('[data-content]')     as HTMLElement;

      gsap.set(eyebrow,    { opacity: 0, y: 12 });
      gsap.set(wordEls,    { y: '115%' });
      gsap.set(accentLine, { scaleX: 0, transformOrigin: 'left center' });
      if (descEl)  gsap.set(descEl,   { opacity: 0, y: 16 });
      if (content) gsap.set(content,  { opacity: 0, y: 20 });

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            gsap
              .timeline()
              .to(eyebrow,    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
              .to(wordEls,    { y: '0%', duration: 1.0, ease: 'expo.out', stagger: 0.04 }, '-=0.2')
              .to(accentLine, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, '-=0.5')
              .to(descEl,     { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')
              .to(content,    { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, '-=0.2');
          }
        },
        { threshold: 0.35 }
      );

      const section = el.closest('[data-slide]') ?? el;
      observer.observe(section);
      return () => observer.disconnect();
    }, innerRef);

    return () => ctx.revert();
  }, []);

  // ── Save new quote handler ──
  const MAX_SAVED_QUOTES = 1;
  const handleNewQuote = useCallback(async () => {
    if (clientQuotes.length >= MAX_SAVED_QUOTES) return;
    const currentState = calcSaveRef.current?.getState();
    if (!currentState) return;
    const label = viewerName ? `${viewerName}'s Adjusted Quote` : 'My Adjusted Quote';
    setSavingQuote(true);
    try {
      const newQuote = await saveClientQuote(proposalId, {
        label,
        ...currentState,
        defer_payment: false,
        total_amount: null,
        down_amount: null,
      });
      setQuotes((prev) => [...prev, newQuote]);
      setActiveQuoteId(newQuote.id);
      setJustUnlocked(true);
      setTimeout(() => setJustUnlocked(false), 800);
    } catch (err) {
      console.error('Failed to save quote:', err);
    } finally {
      setSavingQuote(false);
    }
  }, [viewerName, proposalId, clientQuotes.length]);

  // ── Delete handler ──
  const handleDelete = useCallback(async (quoteId: string) => {
    try {
      await deleteClientQuote(quoteId);
      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, deleted_at: new Date().toISOString() } : q))
      );
      setDeletingQuoteId(null);
      if (activeQuoteId === quoteId) {
        setActiveQuoteId(recommendedQuote?.id ?? null);
      }
    } catch (err) {
      console.error('Failed to delete quote:', err);
    }
  }, [activeQuoteId, recommendedQuote]);


  return (
    <section
      ref={slideRef as React.RefObject<HTMLElement>}
      data-slide
      className="[scroll-snap-align:start] flex-shrink-0 w-screen h-screen bg-black overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Top gradient mask */}
      <div className="sticky top-0 z-20 pointer-events-none" style={{ height: 'var(--slide-gradient-h)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black to-transparent" />
      </div>

      <div ref={innerRef} className="flex flex-col px-6 sm:px-12 lg:px-20 pb-20 max-w-4xl mx-auto w-full" style={{ paddingTop: 'var(--slide-pt)', marginTop: 'calc(-1 * var(--slide-pull))' }}>
        {/* SlideHeader */}
        <SlideHeader
          eyebrow="INVESTMENT"
          titleWords={['Pricing']}
          description="Choose the package that works for your budget."
          className="mb-6 flex-shrink-0"
        />

        {/* Quote tabs + content */}
        <div data-content>
          {/* ── Recommended quote card (single purple card) ── */}
          {recommendedQuote && (
            <div className={`rounded-lg border overflow-hidden mb-4 transition-all duration-300 ${
              activeQuoteId === recommendedQuote.id ? 'border-purple-400 opacity-100' : 'border-purple-500/50 opacity-60'
            }`}>
              <button
                onClick={() => setActiveQuoteId(recommendedQuote.id)}
                className={`w-full flex items-center gap-2 px-4 py-4 transition-colors duration-300 cursor-pointer text-left ${
                  activeQuoteId === recommendedQuote.id
                    ? 'bg-purple-950 text-white'
                    : 'bg-purple-950/30 text-purple-300/70 hover:text-white hover:bg-purple-950/60'
                }`}
              >
                <Star size={16} fill="currentColor" className={`flex-shrink-0 ${
                  activeQuoteId === recommendedQuote.id ? 'text-purple-400' : 'text-purple-500/50'
                }`} />
                <div className="min-w-0 flex-1">
                  <span className="font-display text-base font-semibold block truncate">
                    {recommendedQuote.label}
                  </span>
                  {recommendedQuote.description && (
                    <p className="text-sm leading-relaxed text-white/40 mt-1">
                      {recommendedQuote.description}
                    </p>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* ── Comparison quotes section (all other FNA + client quotes) ── */}
          <div className="flex items-center gap-3 mb-4 flex-shrink-0" style={{ minHeight: 40 }}>
            {comparisonQuotes.length > 0 && (
              <div className="inline-flex rounded-lg border border-cyan-700/60 overflow-hidden">
                {comparisonQuotes.map((q, idx) => {
                  const isFna = q.is_fna_quote;
                  const isActive = activeQuoteId === q.id;
                  const isThisDeleting = deletingQuoteId === q.id;
                  const isIconHovered = hoveredIconId === q.id;
                  const isIconDimmed = dimmedIconId === q.id;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveQuoteId(q.id)}
                      onMouseEnter={() => !isFna && setHoveredIconId(q.id)}
                      onMouseLeave={() => setHoveredIconId(null)}
                      className={`flex items-center gap-2 pl-3 pr-4 py-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-cyan-600 text-white'
                          : 'bg-cyan-950/40 text-cyan-300/60 hover:text-white/80 hover:bg-cyan-900/40'
                      } ${idx > 0 ? 'border-l border-cyan-700/30' : ''}`}
                    >
                      {isFna ? (
                        <span className="flex-shrink-0 p-1 rounded">
                          <Star size={16} className="text-current opacity-70" />
                        </span>
                      ) : (
                        <span
                          ref={isThisDeleting ? deletingIconRef : null}
                          onMouseEnter={() => setDimmedIconId(q.id)}
                          onMouseLeave={() => setDimmedIconId(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isThisDeleting) handleDelete(q.id);
                            else setDeletingQuoteId(q.id);
                          }}
                          className={`flex-shrink-0 p-1 rounded transition-colors cursor-pointer ${isIconDimmed || isThisDeleting ? 'bg-white/15' : 'bg-transparent'} text-white`}
                        >
                          {isThisDeleting
                            ? <Check size={16} />
                            : isIconHovered
                              ? <Trash2 size={16} />
                              : <User size={16} className="opacity-70" />}
                        </span>
                      )}
                      {q.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Comparison Quote button — hidden once one exists */}
            {clientQuotes.length === 0 && (
              <button
                ref={newBtnRef}
                onClick={handleNewQuote}
                disabled={savingQuote}
                className="relative ml-auto py-2.5 px-4 font-medium border rounded-lg overflow-hidden text-black bg-white border-white disabled:opacity-50"
              >
                <div
                  ref={newFillRef}
                  className="absolute inset-0 bg-black pointer-events-none"
                  style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
                />
                <span className="relative flex items-center justify-center gap-2 whitespace-nowrap text-sm" style={{ zIndex: 10 }}>
                  <motion.span
                    variants={iconVariants}
                    initial="hidden"
                    animate={newHovered ? 'visible' : 'hidden'}
                    className="flex items-center"
                  >
                    <Plus size={16} strokeWidth={2} />
                  </motion.span>
                  Adjust Quote
                </span>
              </button>
            )}
          </div>


          {/* Calculator content */}
          <div className="relative">
            <ProposalCalculatorEmbed
              isLocked={isLocked}
              proposalId={proposalId}
              proposalType={proposalType}
              initialQuote={activeQuote ?? undefined}
              prefillQuote={recommendedQuote ?? undefined}
              crowdfundingApproved={crowdfundingApproved}
              activeQuoteId={activeQuoteId ?? undefined}
              saveRef={calcSaveRef}
              onQuoteUpdated={handleQuoteUpdated}
              allQuotes={quotes.filter((q) => !q.deleted_at)}
              onActiveQuoteChange={(id) => setActiveQuoteId(id)}
              onLockedInteract={isLocked && clientQuotes.length === 0 ? handleNewQuote : undefined}
            />
            {/* Unlock glow burst */}
            <AnimatePresence>
              {justUnlocked && (
                <motion.div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.18) 0%, transparent 70%)' }}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom gradient mask */}
      <div className="sticky bottom-0 z-20 h-48 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 backdrop-blur-[6px]" style={{ maskImage: 'linear-gradient(to top, black 20%, transparent)', WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent)' }} />
      </div>
    </section>
  );
}
