'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Check, Star, User } from 'lucide-react';
import { ProposalCalculatorEmbed } from '@/components/proposal/ProposalCalculatorEmbed';
import type { ProposalCalculatorSaveHandle, CalculatorStateSnapshot } from '@/components/proposal/ProposalCalculatorEmbed';
import { SlideHeader } from '@/components/proposal/SlideHeader';
import { useDirectionalFill } from '@/hooks/useDirectionalFill';
import { saveClientQuote, renameClientQuote, deleteClientQuote, updateClientQuoteDescription } from '@/app/p/[slug]/actions';
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
}

export function InvestmentSlide({
  proposalId,
  proposalType,
  quotes: initialQuotes,
  crowdfundingApproved,
  slideRef,
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
  const isLocked = activeQuote?.id === recommendedQuote?.id;

  // New quote creation
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [savingQuote, setSavingQuote] = useState(false);

  // Rename state
  const [renamingQuoteId, setRenamingQuoteId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Delete confirm state
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);

  // Description editing (auto-save on blur / debounce)
  const descriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [editingDescription, setEditingDescription] = useState(activeQuote?.description ?? '');

  // Sync description text when switching tabs
  useEffect(() => {
    setEditingDescription(activeQuote?.description ?? '');
  }, [activeQuoteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDescriptionChange = useCallback((value: string) => {
    setEditingDescription(value);
    if (!activeQuoteId || isLocked) return;
    if (descriptionTimeoutRef.current) clearTimeout(descriptionTimeoutRef.current);
    descriptionTimeoutRef.current = setTimeout(async () => {
      try {
        await updateClientQuoteDescription(activeQuoteId, value);
        setQuotes((prev) =>
          prev.map((q) => q.id === activeQuoteId ? { ...q, description: value } : q)
        );
      } catch (err) {
        console.error('Failed to update description:', err);
      }
    }, 1000);
  }, [activeQuoteId, isLocked]);

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
  const MAX_SAVED_QUOTES = 5;
  const handleSaveQuote = useCallback(async () => {
    if (!saveLabel.trim()) return;
    if (clientQuotes.length >= MAX_SAVED_QUOTES) return;
    const currentState = calcSaveRef.current?.getState();
    if (!currentState) return;
    setSavingQuote(true);
    try {
      const newQuote = await saveClientQuote(proposalId, {
        label: saveLabel.trim(),
        ...currentState,
        defer_payment: false,
        friendly_discount_pct: 0,
        total_amount: null,
        down_amount: null,
      });
      setQuotes((prev) => [...prev, newQuote]);
      setActiveQuoteId(newQuote.id);
      setShowSaveModal(false);
      setSaveLabel('');
    } catch (err) {
      console.error('Failed to save quote:', err);
    } finally {
      setSavingQuote(false);
    }
  }, [saveLabel, proposalId, clientQuotes.length]);

  // ── Rename handler ──
  const handleRename = useCallback(async (quoteId: string) => {
    if (!renameValue.trim()) return;
    try {
      await renameClientQuote(quoteId, renameValue.trim());
      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, label: renameValue.trim() } : q))
      );
      setRenamingQuoteId(null);
      setRenameValue('');
    } catch (err) {
      console.error('Failed to rename quote:', err);
    }
  }, [renameValue]);

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

  // Active quote is the currently selected client quote (for toolbox)
  const isClientQuoteActive = activeQuote && !activeQuote.is_fna_quote;
  const isDeleting = isClientQuoteActive && deletingQuoteId === activeQuote?.id;

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
            <div className={`rounded-lg border border-purple-500/40 overflow-hidden mb-5 transition-opacity duration-300 ${
              activeQuoteId === recommendedQuote.id ? 'opacity-100' : 'opacity-60'
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
          <div className="flex items-center gap-3 mb-3 flex-shrink-0" style={{ minHeight: 40 }}>
            {comparisonQuotes.length > 0 && (
              <div className="inline-flex rounded-lg border border-cyan-700/60 overflow-hidden">
                {comparisonQuotes.map((q, idx) => {
                  const isFna = q.is_fna_quote;
                  const isRenaming = !isFna && renamingQuoteId === q.id;
                  const isActive = activeQuoteId === q.id;

                  return isRenaming ? (
                    <form
                      key={q.id}
                      onSubmit={(e) => { e.preventDefault(); handleRename(q.id); }}
                      className={`flex items-center ${idx > 0 ? 'border-l border-cyan-700/30' : ''}`}
                    >
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => { if (renameValue.trim()) handleRename(q.id); else { setRenamingQuoteId(null); setRenameValue(''); } }}
                        onKeyDown={(e) => { if (e.key === 'Escape') { setRenamingQuoteId(null); setRenameValue(''); } }}
                        className="px-4 py-2.5 text-sm font-medium bg-cyan-700 text-white outline-none w-28 placeholder:text-white/50 ring-2 ring-cyan-400/60 ring-inset"
                        placeholder={q.label}
                      />
                    </form>
                  ) : (
                    <button
                      key={q.id}
                      onClick={() => setActiveQuoteId(q.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-cyan-600 text-white'
                          : 'bg-cyan-950/40 text-cyan-300/60 hover:text-white/80 hover:bg-cyan-900/40'
                      } ${idx > 0 ? 'border-l border-cyan-700/30' : ''}`}
                    >
                      {isFna ? (
                        <Star size={16} className="flex-shrink-0 text-current opacity-70" />
                      ) : (
                        <User size={16} className="flex-shrink-0 text-current opacity-70" />
                      )}
                      {q.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pencil + Trash toolbox — only for client (non-FNA) quotes */}
            {isClientQuoteActive && (
              <div className="inline-flex items-center gap-1">
                {renamingQuoteId === activeQuoteId ? (
                  <>
                    <button
                      onClick={() => handleRename(activeQuote!.id)}
                      className="h-[28px] w-[28px] flex items-center justify-center rounded transition-colors text-green-400 hover:text-green-300 hover:bg-green-400/10"
                      title="Confirm rename"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => { setRenamingQuoteId(null); setRenameValue(''); }}
                      className="h-[28px] w-[28px] flex items-center justify-center rounded transition-colors text-white/40 hover:text-white hover:bg-white/10"
                      title="Cancel rename"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (isDeleting) {
                          handleDelete(activeQuote!.id);
                        } else {
                          setRenamingQuoteId(activeQuote!.id);
                          setRenameValue(activeQuote!.label);
                        }
                      }}
                      className={`h-[28px] w-[28px] flex items-center justify-center rounded transition-colors ${
                        isDeleting
                          ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
                          : 'text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                      title={isDeleting ? 'Confirm delete' : 'Rename'}
                    >
                      {isDeleting ? <Check size={16} /> : <Pencil size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        if (isDeleting) {
                          setDeletingQuoteId(null);
                        } else {
                          setDeletingQuoteId(activeQuote!.id);
                        }
                      }}
                      className={`h-[28px] w-[28px] flex items-center justify-center rounded transition-colors ${
                        isDeleting
                          ? 'text-white/40 hover:text-white hover:bg-white/10'
                          : 'text-white/40 hover:text-red-400 hover:bg-red-400/10'
                      }`}
                      title={isDeleting ? 'Cancel' : 'Delete'}
                    >
                      {isDeleting ? <X size={16} /> : <Trash2 size={16} />}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* New Comparison Quote — right-aligned, directional fill button */}
            <button
              ref={newBtnRef}
              onClick={() => clientQuotes.length < MAX_SAVED_QUOTES && setShowSaveModal(true)}
              disabled={clientQuotes.length >= MAX_SAVED_QUOTES}
              className={`relative ml-auto h-[36px] px-4 font-medium border rounded-lg overflow-hidden ${
                clientQuotes.length >= MAX_SAVED_QUOTES
                  ? 'text-white/20 bg-white/5 border-white/10 cursor-not-allowed'
                  : 'text-black bg-white border-white'
              }`}
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
                New Comparison Quote
              </span>
            </button>
          </div>

          {/* Client description — directly under client row when client quote is active */}
          {!isLocked && (
            <div className="mb-4">
              <textarea
                value={editingDescription}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Add a note about this quote..."
                rows={2}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white/60 placeholder:text-white/15 outline-none focus:border-cyan-500/40 transition-colors resize-none"
              />
            </div>
          )}

          {/* Save name modal (inline popover) */}
          {showSaveModal && (
            <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-sm">
              <p className="text-white/60 text-sm mb-3">Name your comparison quote</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveQuote();
                }}
                className="flex items-center gap-3"
              >
                <input
                  autoFocus
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                  placeholder="e.g. Budget Option"
                  className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500 transition-colors placeholder:text-white/20"
                />
                <button
                  type="submit"
                  disabled={!saveLabel.trim() || savingQuote}
                  className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium disabled:opacity-40 hover:brightness-110 transition-all"
                >
                  {savingQuote ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveModal(false);
                    setSaveLabel('');
                  }}
                  className="text-white/40 hover:text-white/60 p-1 transition-colors"
                >
                  <X size={18} />
                </button>
              </form>
            </div>
          )}

          {/* Calculator content */}
          <div className={comparisonQuotes.length === 0 && !showSaveModal ? 'mt-3' : ''}>
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
            />
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
