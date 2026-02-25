'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { Lock, SlidersHorizontal, Save, Pencil, Trash2, X, Check } from 'lucide-react';
import { ProposalCalculatorEmbed } from '@/components/proposal/ProposalCalculatorEmbed';
import type { ProposalCalculatorSaveHandle, CalculatorStateSnapshot } from '@/components/proposal/ProposalCalculatorEmbed';
import { SlideHeader } from '@/components/proposal/SlideHeader';
import { useDirectionalFill } from '@/hooks/useDirectionalFill';
import { saveClientQuote, renameClientQuote, deleteClientQuote } from '@/app/p/[slug]/actions';
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

  // Save Quote button refs
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  const saveFillRef = useRef<HTMLDivElement>(null);
  const [saveHovered, setSaveHovered] = useState(false);

  // Imperative save handle from ProposalCalculatorEmbed
  const calcSaveRef = useRef<ProposalCalculatorSaveHandle | null>(null);

  const [quotes, setQuotes] = useState(initialQuotes);
  // 0 = Recommended, 1 = Adjust & Compare, 2+ = saved quote (index into savedQuotes)
  const [activeQuoteTab, setActiveQuoteTab] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [savingQuote, setSavingQuote] = useState(false);

  // Rename state
  const [renamingQuoteId, setRenamingQuoteId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Delete confirm state
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);

  // Save confirmation state
  const [savedNewConfirm, setSavedNewConfirm] = useState(false);

  const fnaQuote = quotes.find((q) => q.is_fna_quote) ?? null;
  const allClientQuotes = quotes.filter((q) => !q.is_fna_quote && !q.deleted_at);
  // The first non-FNA quote is the "Adjust & Compare" working scratchpad (Tab 1)
  const workingQuote = allClientQuotes[0] ?? undefined;
  // Named saved quotes (Tab 2+) — everything after the working scratchpad
  const namedQuotes = allClientQuotes.slice(1);

  // Derive what to pass to the calculator
  const isLocked = activeQuoteTab === 0;
  const isCompare = activeQuoteTab >= 1;
  const activeQuote = activeQuoteTab >= 2 ? namedQuotes[activeQuoteTab - 2] : undefined;
  const initialQuoteForCalc = activeQuote ?? workingQuote ?? undefined;
  // Tab 1 (Adjust) targets the working scratchpad; Tab 2+ targets the specific named quote
  const activeQuoteIdForCalc = activeQuoteTab >= 2
    ? activeQuote?.id
    : activeQuoteTab === 1
      ? workingQuote?.id
      : undefined;
  // Dynamic label for the comparison column in the summary
  const comparisonLabel = activeQuote?.label ?? 'Adjusted';

  // Sync local quotes state after any auto-save or manual save so data stays fresh
  const handleQuoteUpdated = useCallback((payload: CalculatorStateSnapshot) => {
    const targetId = activeQuoteIdForCalc;
    if (!targetId) return;
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === targetId
          ? { ...q, ...payload, updated_at: new Date().toISOString() }
          : q
      )
    );
  }, [activeQuoteIdForCalc]);

  // ── Directional fill for Save Quote button ──
  useDirectionalFill(saveBtnRef, saveFillRef, {
    onFillStart: () => {
      setSaveHovered(true);
      const textSpan = saveBtnRef.current?.querySelector('span');
      if (textSpan) gsap.to(textSpan, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
    },
    onFillEnd: () => {
      setSaveHovered(false);
      const textSpan = saveBtnRef.current?.querySelector('span');
      if (textSpan) gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
    },
  });

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

  // ── Save quote handler ──
  const MAX_SAVED_QUOTES = 5;
  const handleSaveQuote = useCallback(async () => {
    if (!saveLabel.trim()) return;
    if (namedQuotes.length >= MAX_SAVED_QUOTES) return;
    // Grab the live calculator state (what the user is actually looking at)
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
      const newSavedIndex = namedQuotes.length;
      setActiveQuoteTab(2 + newSavedIndex);
      setShowSaveModal(false);
      setSaveLabel('');
      // Flash confirmation
      setSavedNewConfirm(true);
      setTimeout(() => setSavedNewConfirm(false), 2000);
    } catch (err) {
      console.error('Failed to save quote:', err);
    } finally {
      setSavingQuote(false);
    }
  }, [saveLabel, proposalId, namedQuotes.length]);

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
      if (activeQuote?.id === quoteId) {
        setActiveQuoteTab(1);
      }
    } catch (err) {
      console.error('Failed to delete quote:', err);
    }
  }, [activeQuote?.id]);

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

      <div ref={innerRef} className="flex flex-col px-12 lg:px-20 pb-20 max-w-4xl mx-auto w-full" style={{ paddingTop: 'var(--slide-pt)', marginTop: 'calc(-1 * var(--slide-pull))' }}>
        {/* SlideHeader */}
        <SlideHeader
          eyebrow="INVESTMENT"
          titleWords={['Pricing']}
          description="Choose the package that works for your budget."
          className="mb-6 flex-shrink-0"
        />

        {/* Quote tabs + content */}
        <div data-content>
          {/* Row 1: Recommended + Adjust & Compare + Save New Quote + action icons */}
          <div className="flex items-center gap-3 mb-3 flex-shrink-0">
            <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
              <button
                onClick={() => setActiveQuoteTab(0)}
                className={`relative px-4 py-2 rounded text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                  activeQuoteTab === 0
                    ? 'text-white bg-[var(--accent)]'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Lock size={14} />
                Recommended
              </button>
              <button
                onClick={() => setActiveQuoteTab(1)}
                className={`relative px-4 py-2 rounded text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                  activeQuoteTab === 1
                    ? 'text-white bg-[var(--accent)]'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <SlidersHorizontal size={14} />
                Adjust &amp; Compare
              </button>
            </div>

            {/* Save New Quote — directional fill + icon reveal */}
            <button
              ref={saveBtnRef}
              onClick={() => namedQuotes.length < MAX_SAVED_QUOTES && setShowSaveModal(true)}
              disabled={namedQuotes.length >= MAX_SAVED_QUOTES}
              className={`relative ml-auto px-4 py-3 font-medium border rounded-lg overflow-hidden text-sm ${
                namedQuotes.length >= MAX_SAVED_QUOTES
                  ? 'text-white/20 bg-white/5 border-white/10 cursor-not-allowed'
                  : 'text-black bg-white border-white'
              }`}
            >
              <div
                ref={saveFillRef}
                className="absolute inset-0 bg-black pointer-events-none"
                style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
              />
              <span className="relative flex items-center justify-center gap-2 whitespace-nowrap" style={{ zIndex: 10 }}>
                {savedNewConfirm ? (
                  <>
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="flex items-center text-green-500"
                    >
                      <Check size={16} strokeWidth={2.5} />
                    </motion.span>
                    Saved!
                  </>
                ) : (
                  <>
                    <motion.span
                      variants={iconVariants}
                      initial="hidden"
                      animate={saveHovered ? 'visible' : 'hidden'}
                      className="flex items-center"
                    >
                      <Save size={16} strokeWidth={2} />
                    </motion.span>
                    Save New Quote
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Row 2: Named saved quote tabs + toolbox (only if any exist) */}
          {namedQuotes.length > 0 && (
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
              {/* Rename inline input */}
              {renamingQuoteId && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRename(renamingQuoteId);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="bg-white/[0.06] border border-white/20 rounded px-2 py-1 text-white text-xs outline-none focus:border-[var(--accent)] transition-colors w-28"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setRenamingQuoteId(null);
                        setRenameValue('');
                      }
                    }}
                  />
                  <button type="submit" className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-white/10 transition-colors">
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRenamingQuoteId(null); setRenameValue(''); }}
                    className="text-white/40 hover:text-white/60 p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </form>
              )}

              <div className="inline-flex flex-wrap items-center rounded-lg border border-white/10 bg-white/[0.04] p-1 gap-0.5">
                {namedQuotes.map((q, i) => {
                  const tabIndex = 2 + i;
                  const isActive = activeQuoteTab === tabIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveQuoteTab(tabIndex)}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors duration-200 cursor-pointer select-none ${
                        isActive
                          ? 'text-white bg-[var(--accent)]'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>

              {/* Toolbox — right-aligned grey box with action icons */}
              {(() => {
                const hasActive = activeQuoteTab >= 2 && activeQuote;
                const isDeleting = hasActive && deletingQuoteId === activeQuote?.id;

                return (
                  <div className="ml-auto inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-1">
                    {/* Rename / Confirm delete */}
                    <button
                      disabled={!hasActive}
                      onClick={() => {
                        if (!hasActive) return;
                        if (isDeleting) {
                          handleDelete(activeQuote!.id);
                        } else {
                          setRenamingQuoteId(activeQuote!.id);
                          setRenameValue(activeQuote!.label);
                        }
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        !hasActive
                          ? 'text-white/15 cursor-not-allowed'
                          : isDeleting
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
                            : 'text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                      title={isDeleting ? 'Confirm delete' : 'Rename'}
                    >
                      {isDeleting ? <Check size={16} /> : <Pencil size={16} />}
                    </button>

                    {/* Delete / Cancel delete */}
                    <button
                      disabled={!hasActive}
                      onClick={() => {
                        if (!hasActive) return;
                        if (isDeleting) {
                          setDeletingQuoteId(null);
                        } else {
                          setDeletingQuoteId(activeQuote!.id);
                        }
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        !hasActive
                          ? 'text-white/15 cursor-not-allowed'
                          : isDeleting
                            ? 'text-white/40 hover:text-white hover:bg-white/10'
                            : 'text-white/40 hover:text-red-400 hover:bg-red-400/10'
                      }`}
                      title={isDeleting ? 'Cancel' : 'Delete'}
                    >
                      {isDeleting ? <X size={16} /> : <Trash2 size={16} />}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Save name modal (inline popover) */}
          {showSaveModal && (
            <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-sm">
              <p className="text-white/60 text-sm mb-3">Name your saved quote</p>
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
                  className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--accent)] transition-colors placeholder:text-white/20"
                />
                <button
                  type="submit"
                  disabled={!saveLabel.trim() || savingQuote}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-40 hover:brightness-110 transition-all"
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

          {/* Content area */}
          <div className={namedQuotes.length === 0 ? 'mt-3' : ''}>
            {fnaQuote && (
              <ProposalCalculatorEmbed
                isLocked={isLocked}
                isCompare={isCompare}
                proposalId={proposalId}
                proposalType={proposalType}
                initialQuote={initialQuoteForCalc}
                prefillQuote={fnaQuote}
                recommendedQuote={fnaQuote}
                crowdfundingApproved={crowdfundingApproved}
                activeQuoteId={activeQuoteIdForCalc}
                saveRef={calcSaveRef}
                onQuoteUpdated={handleQuoteUpdated}
                comparisonLabel={comparisonLabel}
              />
            )}
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
