'use client';

import { useState, useRef, useCallback, useEffect, useMemo, createRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  User, Mail, Briefcase, Users, Rocket, Sparkles, Star, Eye,
  Ban, Target, AlertTriangle, Shield, Play, Package, Calendar,
  Gauge, Link2, MailOpen, Upload, FileText,
  MessageSquare, Heart, X, Check, ArrowRight, Trash2, GripVertical,
  ChevronLeft, ChevronRight, LogOut, BarChart3, Megaphone, Globe,
  PenTool, Search as SearchIcon, Home, Camera, Code, Share2,
  Send, CalendarCheck, HelpCircle, Hammer, TrendingUp, Coins, BadgeDollarSign, Building2, HeartHandshake,
  Palette, Type, Trophy, Flame,
} from 'lucide-react';
import Cal, { getCalApi } from '@calcom/embed-react';
import confetti from 'canvas-confetti';
import { useDirectionalFill } from '@/hooks/useDirectionalFill';
import { submitIntakeForm, uploadIntakeFile } from '@/lib/intake/actions';
import type { IntakeFormData } from '@/lib/intake/actions';
import { ProposalCalculatorEmbed } from '@/components/proposal/ProposalCalculatorEmbed';
import type { CalculatorStateSnapshot, PricingType } from '@/components/proposal/ProposalCalculatorEmbed';
import type { ProposalType } from '@/types/proposal';

// ── Constants ────────────────────────────────────────────────────────────────

const DELIVERABLE_OPTIONS = [
  // Row 1: Strategy & branding
  { value: 'consulting', label: 'Consulting', icon: FileText },
  { value: 'brand_strategy', label: 'Brand Strategy', icon: Target },
  { value: 'copywriting', label: 'Copywriting', icon: Type },
  { value: 'logo_design', label: 'Logo Design', icon: Palette },
  // Row 2: Web & digital
  { value: 'web_design', label: 'Web Design', icon: Code },
  { value: 'landing_page', label: 'Launch Page', icon: Globe },
  { value: 'email_campaign', label: 'Email Campaigns', icon: MailOpen },
  { value: 'ads', label: 'Ad Creative', icon: Megaphone },
  // Row 3: Video
  { value: 'flagship', label: 'Flagship Video', icon: Star },
  { value: 'motion_graphics', label: 'Motion Graphics', icon: Sparkles },
  { value: 'social_cuts', label: 'Social Cutdowns', icon: Play },
  { value: 'gifs', label: 'GIFs & Web Loops', icon: Rocket },
  // Row 4: Photography & interviews
  { value: 'photography_product', label: 'Product Photography', icon: Package },
  { value: 'photography_lifestyle', label: 'Lifestyle Photography', icon: Eye },
  { value: 'testimonials', label: 'Testimonials', icon: Heart },
  { value: 'pitch_video', label: 'Pitch Video', icon: Briefcase },
] as const;

const DELIVERABLE_META_OPTIONS = [
  { value: 'all', label: 'All of the above', icon: Check },
  { value: 'unsure', label: 'Help us decide', icon: MessageSquare },
] as const;

const PROJECT_PHASES = [
  { value: 'build', label: 'Build', subtitle: 'Brand, strategy & scripting', icon: Hammer },
  { value: 'launch', label: 'Launch', subtitle: 'Production & delivery', icon: Rocket },
  { value: 'scale', label: 'Scale', subtitle: 'Ongoing creative partnership', icon: TrendingUp },
  { value: 'crowdfunding', label: 'Crowdfunding', subtitle: 'Risk-aligned campaign pricing for Kickstarter and IndieGoGo, available for Build and Launch', icon: Coins },
  { value: 'fundraising', label: 'Fundraising', subtitle: 'Investor-grade "pitch video" for private equity funding or friends and family rounds', icon: BadgeDollarSign },
] as const;

// Valid phase combinations: build/launch can pair with each other and with crowdfunding. scale and fundraising are standalone.
const PHASE_RULES: Record<string, string[]> = {
  build: ['launch', 'crowdfunding'],
  launch: ['build', 'crowdfunding'],
  crowdfunding: ['build', 'launch'],
  scale: [],
  fundraising: [],
};

const TIMELINE_STOPS = [
  { value: 'asap', label: 'Urgent', description: 'We need it yesterday', icon: AlertTriangle },
  { value: 'soon', label: '6 Weeks', description: 'Sooner the better', icon: Gauge },
  { value: 'later', label: '2+ Months', description: 'We have some time', icon: Calendar },
  { value: 'specific', label: 'Specific', description: 'We have a target date', icon: CalendarCheck },
] as const;

const PRIORITY_ITEMS = [
  { id: 'quality', label: 'Quality', description: 'Exceptional craft and production value', color: '#a14dfd' },
  { id: 'speed', label: 'Speed', description: 'Fast turnaround and tight deadlines', color: '#38bdf8' },
  { id: 'cost', label: 'Cost', description: 'Budget-conscious and efficient', color: '#34d399' },
] as const;

const EXPERIENCE_OPTIONS = [
  { value: 'none', label: 'First time', description: 'Brand new to professional video', videos: '0', icon: Sparkles },
  { value: 'inhouse', label: 'In-house only', description: "We've handled it ourselves so far", videos: '1–3', icon: Home },
  { value: 'some', label: 'Some experience', description: "Worked with a production team", videos: '1–5', icon: Flame },
  { value: 'experienced', label: 'Experienced', description: 'Video is a regular part of our strategy', videos: '5+', icon: Trophy },
] as const;

const PARTNER_OPTIONS = [
  { value: 'ad_tracking', label: 'Ad Tracking', icon: BarChart3 },
  { value: 'pr', label: 'Public Relations', icon: Megaphone },
  { value: 'email_list', label: 'Email List Gen', icon: MailOpen },
  { value: 'landing_page', label: 'Landing Page', icon: Globe },
  { value: 'marketing_agency', label: 'Marketing Agency', icon: PenTool },
  { value: 'photographer', label: 'Photographer', icon: Camera },
  { value: 'web_dev', label: 'Web Developer', icon: Code },
  { value: 'social_media', label: 'Social Media', icon: Share2 },
] as const;

const PARTNER_STATUS_OPTIONS = [
  { value: 'interviewing', label: 'Interviewing', icon: SearchIcon },
  { value: 'none', label: 'None Yet', icon: X },
  { value: 'open_to_recs', label: 'Open to Recs', icon: HeartHandshake },
] as const;

const EMAIL_LIST_OPTIONS = [
  { value: '0-100', label: '0–100' },
  { value: '100-500', label: '100–500' },
  { value: '500-1000', label: '500–1,000' },
  { value: '1000-5000', label: '1,000–5,000' },
  { value: '5000-10000', label: '5,000–10,000' },
  { value: '25000+', label: '25,000+' },
] as const;

const SLIDE_NAMES = ['People', 'Project', 'Vision', 'Challenges', 'References', 'Deliverables', 'Timeline', 'Priorities', 'Experience', 'Partners', 'Goals', 'Investment', 'Extras', 'Submit'];
const TOTAL_SLIDES = SLIDE_NAMES.length;
const GOALS_SLIDE_INDEX = 10;

function phasesToQuoteType(phases: string[]): PricingType {
  if (phases.includes('fundraising')) return 'fundraising';
  if (phases.includes('build') && phases.includes('launch')) return 'build-launch';
  if (phases.includes('launch')) return 'launch';
  if (phases.includes('scale')) return 'scale';
  return 'build';
}

const FIELD_META: Record<string, { label: string; explanation: string; slide: number }> = {
  name:          { label: 'Your name',        explanation: 'We need to know who we\'re working with.',                      slide: 0 },
  email:         { label: 'Email address',    explanation: 'This is how we\'ll send confirmations and follow up.',          slide: 0 },
  title:         { label: 'Your title',       explanation: 'Helps us understand your role in the project.',                 slide: 0 },
  companyName:   { label: 'Company name',     explanation: 'We need to know which company or brand this is for.',           slide: 1 },
  projectName:   { label: 'Project name',     explanation: 'Every project needs a name so we can keep things organized.',   slide: 1 },
  pitch:         { label: 'One-liner',        explanation: 'Your one-liner helps us understand the core idea instantly.',   slide: 1 },
  excitement:    { label: 'What excites you', explanation: 'This tells us what to amplify in the creative.',                slide: 2 },
  keyFeature:    { label: 'Key feature',      explanation: 'Knowing your standout feature helps us focus the story.',       slide: 2 },
  deliverables:  { label: 'Deliverables',     explanation: 'We need to know what you\'re looking for us to create.',        slide: 5 },
  timeline:      { label: 'Timeline',         explanation: 'Timing shapes everything — budget, team, and scope.',           slide: 6 },
  timelineDate:  { label: 'Target date',      explanation: 'We need the actual target date to plan around.',                slide: 6 },
  priorityOrder: { label: 'Priorities',       explanation: 'Rank all three so we can balance quality, speed, and cost.',    slide: 7 },
  experience:    { label: 'Experience level',  explanation: 'This helps us calibrate our process to your comfort level.',   slide: 8 },
  partners:      { label: 'Partners',         explanation: 'Let us know who else is involved so we can coordinate.',        slide: 9 },
  publicGoal:    { label: 'Public goal',      explanation: 'We need your crowdfunding target to shape the campaign.',       slide: 10 },
  internalGoal:  { label: 'Internal goal',    explanation: 'Knowing your real target helps us plan strategy.',              slide: 10 },
  emailListSize: { label: 'Email list size',  explanation: 'List size helps us estimate launch-day performance.',           slide: 10 },
};

const STORAGE_KEY = 'fna-intake-draft';

// ── Shared styles ────────────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-black border border-white/10 rounded-xl text-base text-foreground placeholder:text-white/40 focus:outline-none focus:border-accent/50 transition-colors font-body';

const textareaClass = `${inputClass} resize-none scrollbar-hide`;

const labelClass = 'block text-base font-medium text-white/90 mb-2.5';

const helperClass = 'text-sm text-white/50 mt-2 leading-relaxed';

// ── Framer icon reveal (matching proposal exactly) ───────────────────────────

const iconVariants = {
  hidden: { opacity: 0, x: 8, width: 0, marginLeft: -8 },
  visible: { opacity: 1, x: 0, width: 'auto', marginLeft: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

// ── Confirm-delete button (click trash → check/X) ───────────────────────────

function ConfirmDeleteButton({ onConfirm, className }: { onConfirm: () => void; className?: string }) {
  const [armed, setArmed] = useState(false);

  if (armed) {
    return (
      <span className={`inline-flex items-center gap-3 sm:gap-1 ${className ?? ''}`}>
        <button type="button" onClick={onConfirm} className="p-1.5 sm:p-0 text-red-400 hover:text-red-300 transition-colors" aria-label="Confirm delete">
          <Check className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
        <button type="button" onClick={() => setArmed(false)} className="p-1.5 sm:p-0 text-white/30 hover:text-white/50 transition-colors" aria-label="Cancel delete">
          <X className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setArmed(true)}
      className={`p-1.5 sm:p-0 text-white/15 hover:text-red-400 transition-colors ${className ?? ''}`} aria-label="Delete">
      <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
    </button>
  );
}

// ── Stakeholder row (name full-width, email + title on second row) ───────────

function StakeholderRow({ stakeholder, onChange, onRemove }: {
  stakeholder: { name: string; email: string; title: string };
  onChange: (s: { name: string; email: string; title: string }) => void;
  onRemove: () => void;
}) {
  const [focused, setFocused] = useState<'name' | 'email' | 'title' | null>(null);

  const flexFor = (field: 'name' | 'email' | 'title') => {
    if (!focused) return 1;
    return field === focused ? 3 : 0.5;
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
        <input type="text" placeholder="Name" value={stakeholder.name}
          onChange={(e) => onChange({ ...stakeholder, name: e.target.value })}
          onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
          className={`${inputClass} min-w-0`}
          style={{ flex: flexFor('name'), transition: 'flex 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }} />
        <input type="email" placeholder="Email" value={stakeholder.email}
          onChange={(e) => onChange({ ...stakeholder, email: e.target.value })}
          onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
          className={`${inputClass} min-w-0`}
          style={{ flex: flexFor('email'), transition: 'flex 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }} />
        <input type="text" placeholder="Title / Role" value={stakeholder.title}
          onChange={(e) => onChange({ ...stakeholder, title: e.target.value })}
          onFocus={() => setFocused('title')} onBlur={() => setFocused(null)}
          className={`${inputClass} min-w-0`}
          style={{ flex: flexFor('title'), transition: 'flex 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }} />
      </div>
      <ConfirmDeleteButton onConfirm={onRemove} className="flex-shrink-0" />
    </div>
  );
}

// ── Slide Header ─────────────────────────────────────────────────────────────

function SlideHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-10">
      <p className="text-sm tracking-[0.4em] uppercase text-accent font-mono mb-3">{eyebrow}</p>
      <h2 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight">{title}</h2>
      {subtitle && <p className="text-base text-white/40 mt-3 max-w-xl leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function FieldLabel({ icon: Icon, label, required }: { icon: React.ElementType; label: string; required?: boolean }) {
  return (
    <label className={labelClass}>
      <span className="inline-flex items-center gap-2">
        <Icon className="w-4 h-4 text-accent/70" />
        {label}
        {required && <span className="text-accent text-sm">*</span>}
      </span>
    </label>
  );
}

// ── Chip select (multi) ──────────────────────────────────────────────────────

function ChipSelect({
  options, selected, onChange, large, compact, cols, allValues,
}: {
  options: readonly { value: string; label: string; icon?: React.ElementType }[];
  selected: string[];
  onChange: (values: string[]) => void;
  large?: boolean;
  compact?: boolean;
  cols?: number;
  allValues?: string[];
}) {
  const toggle = (val: string) => {
    if (val === 'unsure') { onChange(selected.includes('unsure') ? [] : ['unsure']); return; }
    if (val === 'all' && allValues) {
      const allSelected = allValues.every((v) => selected.includes(v));
      onChange(allSelected ? [] : [...allValues]);
      return;
    }
    if (val === 'all') { onChange(['all']); return; }
    const without = selected.filter((v) => v !== 'all' && v !== 'unsure');
    onChange(without.includes(val) ? without.filter((v) => v !== val) : [...without, val]);
  };

  const gridClass = cols
    ? 'grid gap-3'
    : large
      ? 'grid gap-3 grid-cols-2 md:grid-cols-4'
      : compact
        ? 'grid gap-3 grid-cols-2 sm:grid-cols-3'
        : 'flex flex-wrap gap-3';

  return (
    <div className={gridClass} style={cols ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}>
      {options.map((opt) => {
        const active = opt.value === 'all' && allValues ? allValues.every((v) => selected.includes(v)) : selected.includes(opt.value);
        const Icon = opt.icon;
        return (
          <button key={opt.value} type="button" onClick={() => toggle(opt.value)}
            className={`inline-flex items-center justify-center gap-2.5 rounded-xl border text-sm transition-all duration-200 ${
              large ? 'flex-col py-5 px-4' : compact ? 'px-3 py-2' : 'px-4 py-2.5'
            } ${active ? 'bg-accent/15 border-accent/40 text-white' : 'bg-black border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'}`}
          >
            {Icon && <Icon className={`${large ? 'w-6 h-6' : 'w-3.5 h-3.5'} ${active ? 'text-accent' : ''}`} />}
            <span className={large ? 'text-xs' : ''}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Timeline Slider ──────────────────────────────────────────────────────────

function TimelineSlider({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isUnsure = value === 'unsure';
  const idx = TIMELINE_STOPS.findIndex((s) => s.value === value);
  const activeIdx = isUnsure ? -1 : idx;

  // Red → Orange → Yellow-green → Green
  const STOP_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'];
  return (
    <div className="space-y-6">
      {/* Unsure — separate option above */}
      <button
        type="button"
        onClick={() => onChange('unsure')}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all duration-200"
        style={{
          borderColor: isUnsure ? '#a14dfd' : '#333333',
          backgroundColor: isUnsure ? '#1a0a2e' : 'transparent',
          color: isUnsure ? '#ffffff' : '#888888',
        }}
      >
        <HelpCircle className="w-5 h-5" style={{ color: isUnsure ? '#a14dfd' : '#888888' }} />
        <div className="text-left">
          <span className="text-base font-medium block">Flexible</span>
          <span className="text-sm" style={{ color: isUnsure ? '#888888' : '#777777' }}>Help us figure out the right timeline</span>
        </div>
      </button>

      {/* Timeline stop buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TIMELINE_STOPS.map((stop, i) => {
          const active = i === activeIdx;
          const Icon = stop.icon;
          return (
            <button
              key={stop.value}
              type="button"
              onClick={() => onChange(stop.value)}
              className="flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200"
              style={{
                color: active ? '#ffffff' : '#777777',
                borderColor: active ? STOP_COLORS[i] : '#222222',
                backgroundColor: active ? `${STOP_COLORS[i]}15` : 'transparent',
              }}
            >
              <Icon className="w-6 h-6 transition-colors" style={{ color: active ? STOP_COLORS[i] : '#777777' }} />
              <span className="text-base font-medium">{stop.label}</span>
              <span className="text-sm hidden sm:block" style={{ color: active ? '#888888' : '#777777' }}>{stop.description}</span>
            </button>
          );
        })}
      </div>

      {/* Gradient track + circles centered under each box (hidden on mobile where grid is 2-col) */}
      <div className="relative hidden sm:block">
        {/* Track bar */}
        <div className="absolute top-1/2 -translate-y-1/2 rounded-full h-2" style={{ left: '12.5%', right: '12.5%', backgroundColor: '#222222' }}>
          {activeIdx >= 0 && (
            <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
              style={{
                width: `${(activeIdx / (TIMELINE_STOPS.length - 1)) * 100}%`,
                background: activeIdx === 0 ? STOP_COLORS[0] : `linear-gradient(to right, ${STOP_COLORS.slice(0, activeIdx + 1).join(', ')})`,
              }}
            />
          )}
        </div>
        {/* Circles */}
        <div className="relative grid grid-cols-4 gap-3">
          {TIMELINE_STOPS.map((stop, i) => (
            <div key={stop.value} className="flex justify-center">
              <button
                type="button"
                onClick={() => onChange(stop.value)}
                className="w-5 h-5 rounded-full border-2 transition-all duration-200"
                style={
                  i === activeIdx
                    ? { backgroundColor: STOP_COLORS[i], borderColor: STOP_COLORS[i], transform: 'scale(1.25)' }
                    : i < activeIdx
                      ? { backgroundColor: STOP_COLORS[i], borderColor: STOP_COLORS[i] }
                      : { backgroundColor: '#000000', borderColor: '#777777' }
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Experience Selector ──────────────────────────────────────────────────────

function ExperienceVisualizer({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const idx = EXPERIENCE_OPTIONS.findIndex((o) => o.value === value);
  const activeIdx = idx >= 0 ? idx : -1;
  const BAR_DATA: { count: string; Icon: React.ElementType }[] = [
    { count: '0 videos', Icon: Sparkles },
    { count: '1–3 videos', Icon: Home },
    { count: '1–5 videos', Icon: Flame },
    { count: '5+ videos', Icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      {/* Desktop: staircase chart + row of buttons */}
      <div className="hidden sm:block space-y-6">
        <div className="flex items-end justify-center gap-3" style={{ height: 180 }}>
          {EXPERIENCE_OPTIONS.map((opt, i) => {
            const isSelected = i === activeIdx;
            const { count, Icon } = BAR_DATA[i];
            const heightPct = i === 0 ? 50 : 25 * (i + 1);
            const isFirst = i === 0;
            return (
              <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
                className="flex-1 h-full flex items-end">
                <div className="relative w-full rounded-lg transition-all duration-300 flex flex-col items-center justify-center gap-1"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: isFirst ? 'transparent' : (isSelected ? '#a14dfd' : '#2a2a2a'),
                    boxShadow: isSelected && !isFirst ? '0 0 16px #a14dfd44' : 'none',
                    border: isFirst
                      ? `2px dashed ${isSelected ? '#a14dfd' : '#333333'}`
                      : `1px solid ${isSelected ? '#a14dfd' : '#333333'}`,
                    overflow: 'hidden',
                  }}>
                  {isSelected && (
                    <>
                      <Icon className="w-8 h-8 relative z-10" style={{ color: isFirst ? '#a14dfd' : '#ffffff' }} />
                      <span className="text-xs font-mono font-bold relative z-10" style={{ color: isFirst ? '#a14dfd' : '#ffffff' }}>
                        {count}
                      </span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex justify-center gap-3">
          {EXPERIENCE_OPTIONS.map((opt, i) => {
            const active = i === activeIdx;
            return (
              <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
                className="flex-1 text-center px-3 py-4 rounded-xl border transition-all duration-200"
                style={{
                  borderColor: active ? '#a14dfd' : '#222222',
                  backgroundColor: active ? '#1a0a2e' : 'transparent',
                  color: active ? '#ffffff' : '#666666',
                }}
              >
                <span className="text-base font-medium block">{opt.label}</span>
                <span className="text-sm mt-1.5 block leading-snug" style={{ color: active ? '#999999' : '#555555' }}>{opt.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: stacked buttons with icon + video count */}
      <div className="sm:hidden flex flex-col gap-3">
        {EXPERIENCE_OPTIONS.map((opt, i) => {
          const active = i === activeIdx;
          const Icon = opt.icon;
          return (
            <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
              className="w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 flex items-center gap-4"
              style={{
                borderColor: active ? '#a14dfd' : '#222222',
                backgroundColor: active ? '#1a0a2e' : 'transparent',
                color: active ? '#ffffff' : '#888888',
              }}
            >
              <div className="flex-1 min-w-0">
                <span className="text-base font-medium block">{opt.label}</span>
                <span className="text-sm mt-1.5 block leading-snug" style={{ color: active ? '#999999' : '#777777' }}>{opt.description}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <Icon size={20} strokeWidth={1.5} style={{ color: active ? '#a14dfd' : '#555555' }} />
                <span className="text-xs font-bold tabular-nums" style={{ color: active ? '#a14dfd' : '#555555' }}>{opt.videos}</span>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: active ? '#a14dfd' : '#444444' }}>videos</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Priority ranking (drag-to-reorder) ───────────────────────────────────────

// Internally uses a fixed 3-element array: ['quality', '', 'cost'] means slot 1 and 3 filled.
// The parent `order` is the compacted version (no blanks). We expand/compact on boundaries.

function PriorityRanker({ order, onChange }: { order: string[]; onChange: (order: string[]) => void }) {
  // Unified 6-position grid: [pool0, pool1, pool2, rank1, rank2, rank3]
  // Items can be freely dragged between any positions.
  type Grid = [string, string, string, string, string, string];
  const [grid, setGrid] = useState<Grid>(() => {
    const g: Grid = ['', '', '', '', '', ''];
    // Place ordered items in rank slots (3-5)
    order.forEach((id, i) => { if (i < 3) g[3 + i] = id; });
    // Place remaining in pool slots (0-2) in their original PRIORITY_ITEMS order
    const placed = new Set(order);
    let poolIdx = 0;
    PRIORITY_ITEMS.forEach((item) => {
      if (!placed.has(item.id) && poolIdx < 3) { g[poolIdx] = item.id; poolIdx++; }
    });
    return g;
  });
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null, null, null]);
  const touchDragId = useRef<string | null>(null);

  const commit = (next: Grid) => {
    setGrid(next);
    // Only rank positions (3-5) count for the parent
    onChange([next[3], next[4], next[5]].filter(Boolean));
  };

  const handleDrop = (targetIdx: number, e?: React.DragEvent) => {
    if (!dragId) return;
    const next: Grid = [...grid];
    const sourceIdx = next.indexOf(dragId);
    const targetItem = next[targetIdx];
    // Swap
    if (sourceIdx >= 0) next[sourceIdx] = targetItem;
    next[targetIdx] = dragId;
    commit(next);
    // Tiny confetti when landing in a rank slot
    if (targetIdx >= 3 && e) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({ particleCount: 12, spread: 40, startVelocity: 15, gravity: 1.2, scalar: 0.6, origin: { x, y }, ticks: 40 });
    }
    setDragId(null);
    setDragOverIdx(null);
  };

  // Touch drag support for mobile
  const [touchDragging, setTouchDragging] = useState<string | null>(null);
  const handleTouchStart = (itemId: string) => { touchDragId.current = itemId; setTouchDragging(itemId); };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragId.current) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const idx = cellRefs.current.findIndex((ref) => ref && ref.contains(el));
    setDragOverIdx(idx >= 0 ? idx : null);
  };
  const handleTouchEnd = () => {
    const wasDropped = touchDragId.current && dragOverIdx !== null;
    if (wasDropped) {
      const next: Grid = [...grid];
      const sourceIdx = next.indexOf(touchDragId.current!);
      const targetItem = next[dragOverIdx!];
      if (sourceIdx >= 0) next[sourceIdx] = targetItem;
      next[dragOverIdx!] = touchDragId.current!;
      commit(next);
    }
    touchDragId.current = null;
    setTouchDragging(null);
    setDragOverIdx(null);
  };

  const renderCell = (idx: number, isRankSlot: boolean) => {
    const itemId = grid[idx];
    const item = itemId ? PRIORITY_ITEMS.find((p) => p.id === itemId) : null;
    const isOver = dragOverIdx === idx;
    const rankNum = isRankSlot ? idx - 2 : null; // 1, 2, 3

    if (item) {
      const isBeingDragged = touchDragging === item.id;
      return (
        <div
          ref={(el) => { cellRefs.current[idx] = el; }}
          key={idx} draggable
          onDragStart={() => setDragId(item.id)}
          onDragEnd={() => { setDragId(null); setDragOverIdx(null); }}
          onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
          onDragLeave={() => setDragOverIdx(null)}
          onDrop={(e) => { e.preventDefault(); handleDrop(idx, e); }}
          onTouchStart={() => handleTouchStart(item.id)}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (touchDragging) return; // Don't trigger tap after drag
            if (!isRankSlot) {
              const next: Grid = [...grid];
              const emptyRank = [3, 4, 5].find((i) => !next[i]);
              if (emptyRank !== undefined) { next[idx] = ''; next[emptyRank] = item.id; commit(next); }
            } else {
              const next: Grid = [...grid];
              const emptyPool = [0, 1, 2].find((i) => !next[i]);
              if (emptyPool !== undefined) { next[idx] = ''; next[emptyPool] = item.id; commit(next); }
            }
          }}
          className={`relative flex items-center gap-4 rounded-xl border cursor-grab active:cursor-grabbing select-none touch-none h-[88px] ${
            isRankSlot ? 'px-6' : 'flex-col justify-center px-4'}`}
          style={{
            borderColor: isBeingDragged ? item.color : isOver ? '#a14dfd' : `${item.color}44`,
            backgroundColor: isBeingDragged ? `${item.color}25` : isOver ? '#a14dfd10' : `${item.color}10`,
            transform: isBeingDragged ? 'scale(1.05)' : 'scale(1)',
            boxShadow: isBeingDragged ? `0 0 24px ${item.color}40` : 'none',
            opacity: isBeingDragged ? 0.9 : 1,
            zIndex: isBeingDragged ? 50 : 'auto',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.2s ease, background-color 0.2s ease',
          }}
        >
          {isRankSlot ? (
            <>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold font-mono flex-shrink-0"
                style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                {rankNum}
              </div>
              <div className="flex-1">
                <span className="text-base font-medium text-white">{item.label}</span>
                <p className="text-sm mt-0.5" style={{ color: '#888888' }}>{item.description}</p>
              </div>
              <GripVertical className="w-4 h-4 text-white/15 flex-shrink-0" />
            </>
          ) : (
            <>
              <GripVertical className="absolute top-1/2 -translate-y-1/2 right-2 w-3.5 h-3.5 text-white/15" />
              <span className="text-base font-medium text-white">{item.label}</span>
            </>
          )}
        </div>
      );
    }

    // Empty cell
    return (
      <div key={idx}
        ref={(el) => { cellRefs.current[idx] = el; }}
        onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
        onDragLeave={() => setDragOverIdx(null)}
        onDrop={(e) => { e.preventDefault(); handleDrop(idx, e); }}
        className="flex items-center gap-4 rounded-xl border-2 border-dashed transition-all duration-200 h-[88px] px-6"
        style={{
          borderColor: isOver ? '#a14dfd' : '#222222',
          backgroundColor: isOver ? '#a14dfd10' : 'transparent',
        }}
      >
        {isRankSlot && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold font-mono flex-shrink-0"
            style={{ backgroundColor: '#1a1a1a', color: '#777777' }}>
            {rankNum}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <p className={helperClass}>Drag each into a slot below, or tap to place in order.</p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[0, 1, 2].map((i) => renderCell(i, false))}
        </div>
      </div>
      <div className="space-y-3">
        {[3, 4, 5].map((i) => renderCell(i, true))}
      </div>
    </div>
  );
}

// ── Video Reference Inputs ───────────────────────────────────────────────────

interface VideoRef { url: string; notes: string }

function VideoReferenceInputs({ videos, onChange }: { videos: VideoRef[]; onChange: (v: VideoRef[]) => void }) {
  const update = (idx: number, field: 'url' | 'notes', val: string) => {
    const copy = [...videos]; copy[idx] = { ...copy[idx], [field]: val }; onChange(copy);
  };
  const add = () => onChange([...videos, { url: '', notes: '' }]);
  const remove = (idx: number) => onChange(videos.filter((_, i) => i !== idx));

  const [brokenThumbs, setBrokenThumbs] = useState<Set<number>>(new Set());

  const getThumbnail = (url: string): string | null => {
    try {
      const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
    } catch { /* ignore */ }
    return null;
  };

  return (
    <div className="space-y-4">
      {videos.map((v, i) => {
        const thumb = !brokenThumbs.has(i) ? getThumbnail(v.url) : null;
        return (
          <div key={i} className="flex flex-col sm:flex-row gap-4 items-start">
            {thumb && (
              <div className="w-full h-32 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center">
                <img src={thumb} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={() => setBrokenThumbs(s => new Set(s).add(i))} />
              </div>
            )}
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center gap-2">
                <input type="url" placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ" value={v.url} onChange={(e) => update(i, 'url', e.target.value)} className={`${inputClass} flex-1`} />
                {videos.length > 1 && (
                  <ConfirmDeleteButton onConfirm={() => remove(i)} className="flex-shrink-0" />
                )}
              </div>
              <textarea placeholder="What do you like about this video?" value={v.notes} onChange={(e) => update(i, 'notes', e.target.value)} rows={3} className={textareaClass} />
            </div>
          </div>
        );
      })}
      {videos.length < 8 && (
        <button type="button" onClick={add} className="text-sm text-white/50 hover:text-white/70 border border-white/10 hover:border-white/20 rounded-lg px-4 py-2 transition-all duration-200">+ Add another video</button>
      )}
    </div>
  );
}

// ── Competitor Link Inputs (with OG meta previews) ──────────────────────────

interface CompetitorLink { url: string; note?: string; }
interface OgMeta { title: string; description: string | null; image: string | null; siteName: string; favicon: string; url: string; }

function CompetitorLinkInputs({ links, onChange }: { links: CompetitorLink[]; onChange: (v: CompetitorLink[]) => void }) {
  const [ogCache, setOgCache] = useState<Record<string, OgMeta | null>>({});
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const update = (idx: number, val: string) => {
    const copy = [...links]; copy[idx] = { ...copy[idx], url: val }; onChange(copy);
    // Debounced OG fetch
    if (debounceTimers.current[idx]) clearTimeout(debounceTimers.current[idx]);
    if (val.trim() && /^https?:\/\/.+\..+/.test(val.trim())) {
      debounceTimers.current[idx] = setTimeout(() => fetchOg(val.trim()), 600);
    }
  };
  const updateNote = (idx: number, val: string) => {
    const copy = [...links]; copy[idx] = { ...copy[idx], note: val }; onChange(copy);
  };
  const add = () => onChange([...links, { url: '' }]);
  const remove = (idx: number) => onChange(links.filter((_, i) => i !== idx));

  const fetchOg = async (url: string) => {
    if (ogCache[url] !== undefined) return;
    try {
      const res = await fetch(`/api/og-meta?url=${encodeURIComponent(url)}`);
      if (!res.ok) { setOgCache((c) => ({ ...c, [url]: null })); return; }
      const data = await res.json();
      setOgCache((c) => ({ ...c, [url]: data }));
    } catch { setOgCache((c) => ({ ...c, [url]: null })); }
  };

  return (
    <div className="space-y-4">
      {links.map((link, i) => {
        const og = link.url.trim() ? ogCache[link.url.trim()] : undefined;
        const ogImg = og?.image || null;
        const hasPreview = ogImg || og?.favicon;
        return (
          <div key={i} className="flex flex-col sm:flex-row gap-4 items-start">
            {hasPreview && (
              <div className="w-full h-32 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center">
                {ogImg ? (
                  <img src={ogImg} alt="" className="w-full h-full object-cover" />
                ) : og?.favicon ? (
                  <img src={og.favicon} alt="" className="w-6 h-6" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : null}
              </div>
            )}
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center gap-2">
                <input type="url" placeholder="https://competitor-website.com" value={link.url} onChange={(e) => update(i, e.target.value)}
                  className={`${inputClass} flex-1`} />
                {links.length > 1 && (
                  <ConfirmDeleteButton onConfirm={() => remove(i)} className="flex-shrink-0" />
                )}
              </div>
              <textarea
                placeholder="What makes you different from this competitor?"
                value={link.note || ''}
                onChange={(e) => updateNote(i, e.target.value)}
                rows={2}
                className={textareaClass}
              />
            </div>
          </div>
        );
      })}
      {links.length < 5 && (
        <button type="button" onClick={add} className="text-sm text-white/50 hover:text-white/70 border border-white/10 hover:border-white/20 rounded-lg px-4 py-2 transition-all duration-200">+ Add another competitor</button>
      )}
    </div>
  );
}

// ── File uploader ────────────────────────────────────────────────────────────

function FileUploader({ files, onAdd, onRemove, uploading }: {
  files: { name: string; url: string }[]; onAdd: (f: FileList) => void; onRemove: (i: number) => void; uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  return (
    <div>
      <div onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files); }}
        className={`flex flex-col items-center justify-center gap-3 py-12 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          dragActive ? 'border-accent/60 bg-accent/5' : 'border-white/10 hover:border-white/20 bg-black'}`}
      >
        <Upload className={`w-8 h-8 ${dragActive ? 'text-accent' : 'text-white/20'}`} />
        <div className="text-center">
          <p className="text-base text-white/50">{uploading ? 'Uploading...' : 'Drop files here or click to browse'}</p>
          <p className="text-sm text-white/20 mt-1">PDFs, images, docs up to 50 MB each.</p>
        </div>
        {uploading && <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />}
      </div>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files?.length && onAdd(e.target.files)} />
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-white/10 bg-black text-sm">
              <FileText className="w-4 h-4 text-accent/60 flex-shrink-0" />
              <span className="text-white/70 truncate flex-1">{f.name}</span>
              <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${f.name}`} className="text-white/20 hover:text-white/50 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mobile Dot Strip with tap-hold scrubber ──────────────────────────────────

function MobileDotStrip({ count, activeIndex, onNavigate, onHome, onExit, hiddenIndices, mobileBarRef }: {
  count: number; activeIndex: number; onNavigate: (i: number) => void; onHome: () => void; onExit: () => void;
  hiddenIndices?: Set<number>; mobileBarRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotsContainerRef = useRef<HTMLDivElement>(null);
  const visibleIndices = useMemo(() => Array.from({ length: count }).map((_: unknown, i: number) => i).filter((i: number) => !hiddenIndices?.has(i)), [count, hiddenIndices]);

  // Scrub indices: -1 = Home, 0..N = slides, -2 = Exit
  const scrubItems = useMemo(() => [-1, ...visibleIndices, -2], [visibleIndices]);

  const getIndexFromTouch = useCallback((clientX: number) => {
    const container = dotsContainerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const idx = Math.round(ratio * (scrubItems.length - 1));
    return scrubItems[idx] ?? null;
  }, [scrubItems]);

  // Use native listeners with { passive: false } so preventDefault actually works
  const scrubbingRef = useRef(false);
  const scrubIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const el = dotsContainerRef.current;
    if (!el) return;

    let tapStartX = 0;

    const doNavigate = (idx: number) => {
      if (idx === -1) onHome();
      else if (idx === -2) onExit();
      else onNavigate(idx);
    };

    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      tapStartX = touch.clientX;
      holdTimer.current = setTimeout(() => {
        scrubbingRef.current = true;
        setScrubbing(true);
        const idx = getIndexFromTouch(touch.clientX);
        scrubIndexRef.current = idx;
        setScrubIndex(idx);
      }, 300);
    };

    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!scrubbingRef.current) {
        // Cancel hold if finger moved too far
        const dx = Math.abs(e.touches[0].clientX - tapStartX);
        if (dx > 10 && holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
        return;
      }
      const touch = e.touches[0];
      const idx = getIndexFromTouch(touch.clientX);
      scrubIndexRef.current = idx;
      setScrubIndex(idx);
    };

    const onEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
      if (scrubbingRef.current && scrubIndexRef.current !== null) {
        // Long hold scrub — navigate to scrub target
        doNavigate(scrubIndexRef.current);
      } else {
        // Short tap — navigate to tapped position
        const touch = e.changedTouches[0];
        const idx = getIndexFromTouch(touch.clientX);
        if (idx !== null) doNavigate(idx);
      }
      scrubbingRef.current = false;
      scrubIndexRef.current = null;
      setScrubbing(false);
      setScrubIndex(null);
    };

    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, [getIndexFromTouch, onNavigate, onHome, onExit]);

  const displayName = scrubIndex === -1 ? 'Home' : scrubIndex === -2 ? 'Exit' : scrubIndex !== null ? SLIDE_NAMES[scrubIndex] : null;

  return (
    <div ref={mobileBarRef as React.RefObject<HTMLDivElement>} className="fixed bottom-6 left-0 right-0 z-[200] flex sm:hidden flex-col items-center px-6 py-3">
      {/* Scrub tooltip */}
      {scrubbing && displayName && (
        <div className="mb-3 px-4 py-2 bg-black/80 border border-white/20 backdrop-blur-2xl rounded-xl text-white text-sm font-semibold tracking-wide animate-in fade-in duration-150">
          {displayName}
        </div>
      )}
      <div
        ref={dotsContainerRef as React.RefObject<HTMLDivElement>}
        className="flex items-center gap-2.5 bg-white/[0.08] border border-white/[0.12] backdrop-blur-2xl rounded-full px-5 py-2.5 select-none"
      >
        <button onClick={onHome} aria-label="Back to intro" className="flex items-center justify-center p-2.5 -m-1.5">
          <Home size={16} strokeWidth={1.5} style={{ color: scrubbing && scrubIndex === -1 ? '#ffffff' : '#999999' }} />
        </button>
        {visibleIndices.map((i) => {
          const isActive = i === activeIndex;
          const isScrubTarget = scrubbing && i === scrubIndex;
          const isLast = i === count - 1;
          if (isLast) {
            return (
              <button key={i} onClick={() => onNavigate(i)} aria-label="Go to submit" className="flex items-center justify-center p-2.5 -m-1.5">
                <Send size={14} strokeWidth={1.8} style={{ color: isActive || isScrubTarget ? '#ffffff' : '#555555' }} />
              </button>
            );
          }
          return (
            <span key={i} className="block rounded-full transition-all duration-200"
              style={{
                width: isActive ? 18 : isScrubTarget ? 14 : 6,
                height: 6,
                backgroundColor: isActive ? '#ffffff' : isScrubTarget ? '#cccccc' : '#555555',
                transform: isScrubTarget && !isActive ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          );
        })}
        <div className="w-px h-4 bg-white/20 mx-1" />
        <button onClick={onExit} aria-label="Save and exit" className="flex items-center justify-center p-2.5 -m-1.5">
          <LogOut size={14} strokeWidth={1.5} style={{ color: scrubbing && scrubIndex === -2 ? '#ffffff' : '#777777' }} />
        </button>
      </div>
    </div>
  );
}

// ── Progress Dots (matching ProposalProgressDots — tooltip, dock scale, reveal) ──

function IntakeProgressDots({ count, activeIndex, onNavigate, onHome, onExit, skipReveal, onRevealed, hiddenIndices }: {
  count: number; activeIndex: number; onNavigate: (i: number) => void; onHome: () => void; onExit: () => void; skipReveal?: boolean; onRevealed?: () => void; hiddenIndices?: Set<number>;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [exitHovered, setExitHovered] = useState(false);
  const [homeHovered, setHomeHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const mobileBarRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const homeBtnRef = useRef<HTMLDivElement>(null);
  const homeSepRef = useRef<HTMLDivElement>(null);
  const separatorRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLDivElement>(null);
  const hasRevealed = useRef(false);

  // Reveal bar from below on mount — animate containers only to avoid
  // GSAP inline styles conflicting with React inline styles on individual dots
  useEffect(() => {
    if (skipReveal || hasRevealed.current) return;
    hasRevealed.current = true;
    onRevealed?.();

    const bar = barRef.current;
    const mobileBar = mobileBarRef.current;
    const barsToAnimate = [bar, mobileBar].filter(Boolean);

    if (bar) gsap.set(bar, { y: 40, opacity: 0 });
    if (mobileBar) gsap.set(mobileBar, { y: 40, opacity: 0 });

    const tl = gsap.timeline({ delay: 1 });
    if (barsToAnimate.length) {
      tl.to(barsToAnimate, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    }
  }, [count, skipReveal]);

  // Compute tooltip position — anchor Y to first dot so tooltips align
  useEffect(() => {
    let el: HTMLDivElement | null = null;
    if (homeHovered) el = homeBtnRef.current;
    else if (hoveredIndex !== null) el = dotRefs.current[hoveredIndex] ?? null;
    else if (exitHovered) el = exitRef.current;

    if (el) {
      const rect = el.getBoundingClientRect();
      const anchorY = dotRefs.current[0]?.getBoundingClientRect().top ?? rect.top;
      setTooltipPos({ x: rect.left + rect.width / 2, y: anchorY });
    } else {
      setTooltipPos(null);
    }
  }, [hoveredIndex, exitHovered, homeHovered]);

  const tooltipLabel =
    homeHovered ? 'Intro'
      : hoveredIndex !== null ? (SLIDE_NAMES[hoveredIndex] ?? '')
        : exitHovered ? 'Exit'
          : '';

  return (
    <>
      {/* Tooltip — rendered outside the backdrop-blur container */}
      {tooltipPos && tooltipLabel && (
        <div
          className="fixed z-[201] pointer-events-none px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm whitespace-nowrap"
          style={{ left: tooltipPos.x, top: tooltipPos.y, transform: 'translate(-50%, calc(-100% - 1.25rem))' }}
        >
          <span className="text-sm font-medium text-white">{tooltipLabel}</span>
        </div>
      )}

      {/* Desktop */}
      <div ref={barRef} className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[200] hidden sm:flex">
        <div className="flex items-center gap-3 bg-white/[0.08] border border-white/[0.14] rounded-xl px-4 py-2.5 backdrop-blur-lg" style={{ transform: 'scale(0.9)', transformOrigin: 'center bottom' }}>
          {/* Home button */}
          <div ref={homeBtnRef} className="relative flex items-center justify-center w-[30px]"
            onMouseEnter={() => setHomeHovered(true)} onMouseLeave={() => setHomeHovered(false)}
          >
            <button onClick={onHome} aria-label="Back to intro"
              className="flex items-center justify-center px-2 py-1.5 rounded-lg transition-all duration-200"
              style={{
                color: activeIndex === -1 ? '#ffffff' : homeHovered ? '#999999' : '#777777',
                backgroundColor: activeIndex === -1 ? 'rgba(255,255,255,0.18)' : homeHovered ? 'rgba(255,255,255,0.10)' : 'transparent',
                transform: homeHovered ? 'scale(1.2)' : 'scale(1)',
              }}
            >
              <Home size={20} strokeWidth={1.5} />
            </button>
          </div>
          <div ref={homeSepRef} className="w-px h-5 bg-white/10 mx-1" />
          {/* Slide dots */}
          {Array.from({ length: count }).map((_, i) => {
            const isHidden = hiddenIndices?.has(i);
            const isActive = i === activeIndex;
            const isHovered = hoveredIndex === i;
            const dockScale = isHovered && !isActive ? 1.1 : 1;

            return (
              <div key={i} ref={(el) => { dotRefs.current[i] = el; }}
                className="relative flex items-center justify-center"
                style={{
                  width: isHidden ? 0 : 30,
                  opacity: isHidden ? 0 : 1,
                  transform: isHidden ? 'translateY(12px)' : 'translateY(0)',
                  marginLeft: isHidden ? -6 : 0,
                  marginRight: isHidden ? -6 : 0,
                  transition: 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), margin 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                onMouseEnter={() => !isHidden ? setHoveredIndex(i) : undefined} onMouseLeave={() => setHoveredIndex(null)}
              >
                <button onClick={() => onNavigate(i)} aria-label={`Go to ${SLIDE_NAMES[i] ?? `slide ${i + 1}`}`}
                  className="flex items-center justify-center"
                >
                  <span className="flex items-center justify-center rounded-lg px-2 py-1.5 transition-all duration-200 w-[34px] h-[30px]"
                    style={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.18)' : isHovered ? 'rgba(255,255,255,0.10)' : 'transparent',
                      transform: `scale(${dockScale})`,
                    }}
                  >
                    {i === count - 1 ? (
                      <Send size={18} strokeWidth={1.8} className="transition-all duration-200" style={{ color: isActive ? '#ffffff' : isHovered ? '#999999' : '#777777' }} />
                    ) : (
                      <span className="block rounded-full transition-all duration-200"
                        style={{
                          width: 9, height: 9,
                          backgroundColor: isActive ? '#ffffff' : isHovered ? '#999999' : '#777777',
                        }}
                      />
                    )}
                  </span>
                </button>
              </div>
            );
          })}
          {/* Separator */}
          <div ref={separatorRef} className="w-px h-5 bg-white/10 mx-1" />
          {/* Exit */}
          <div ref={exitRef} className="relative flex items-center justify-center w-[30px] ml-2"
            onMouseEnter={() => setExitHovered(true)} onMouseLeave={() => setExitHovered(false)}
          >
            <button onClick={onExit} aria-label="Save and exit"
              className="flex items-center justify-center px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-all duration-200"
              style={{ color: exitHovered ? '#999999' : '#777777' }}
            >
              <LogOut size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
      {/* Mobile — dot strip with tap-hold scrubber */}
      {activeIndex >= 0 && (
        <MobileDotStrip
          count={count}
          activeIndex={activeIndex}
          onNavigate={onNavigate}
          onHome={onHome}
          onExit={onExit}
          hiddenIndices={hiddenIndices}
          mobileBarRef={mobileBarRef}
        />
      )}
    </>
  );
}

// ── Nav Arrows (matching ProposalNavArrows) ──────────────────────────────────

function IntakeNavArrows({ onPrev, onNext, isFirst, isLast, onExit }: {
  onPrev: () => void; onNext: () => void; isFirst: boolean; isLast: boolean; onExit: () => void;
}) {
  const leftRef = useRef<HTMLButtonElement>(null);
  const rightRef = useRef<HTMLButtonElement>(null);
  const hasEnteredRef = useRef(false);

  const BRIGHT = { backgroundColor: '#ffffff', color: '#000000', borderColor: 'rgba(255,255,255,0)' };
  const DIM = { backgroundColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.18)' };

  useEffect(() => {
    if (leftRef.current) gsap.set(leftRef.current, { x: -150, opacity: 0, ...BRIGHT });
    if (rightRef.current) gsap.set(rightRef.current, { x: 150, opacity: 0, ...BRIGHT });
  }, []);

  useEffect(() => {
    if (isFirst) {
      if (!hasEnteredRef.current) return;
      // Only hide prev arrow on intro — right arrow stays visible
      if (leftRef.current) gsap.to(leftRef.current, { x: -150, opacity: 0, duration: 0.45, ease: 'power3.in' });
    } else {
      const isFirstEntry = !hasEnteredRef.current;
      hasEnteredRef.current = true;
      const delay = isFirstEntry ? 1.5 : 0.05;
      if (leftRef.current) { gsap.set(leftRef.current, { x: -150, opacity: 0 }); gsap.to(leftRef.current, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay }); }
      if (rightRef.current) { gsap.set(rightRef.current, { x: 150, opacity: 0 }); gsap.to(rightRef.current, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: delay + 0.2 }); }
    }
  }, [isFirst]);

  // After first entry, go to DIM state
  useEffect(() => {
    if (!hasEnteredRef.current) return;
    const targets = [leftRef.current, rightRef.current].filter(Boolean);
    if (!targets.length) return;
    gsap.to(targets, { ...DIM, duration: 0.45, ease: 'power2.out', delay: 2 });
  }, [isFirst]);

  const handleEnter = (ref: React.RefObject<HTMLButtonElement>) => {
    if (ref.current) gsap.to(ref.current, { backgroundColor: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.85)', duration: 0.18 });
  };
  const handleLeave = (ref: React.RefObject<HTMLButtonElement>) => {
    if (ref.current) gsap.to(ref.current, { ...DIM, duration: 0.2 });
  };

  const baseClass = 'fixed top-1/2 -translate-y-1/2 z-[150] hidden lg:flex flex-col items-center justify-center gap-1 py-3 w-12 rounded-xl border backdrop-blur-lg';
  const arrowLabelClass = 'text-[8px] font-mono tracking-[0.3em] uppercase';

  return (
    <>
      <button ref={leftRef} onClick={onPrev} aria-label="Previous" className={`${baseClass} left-5`}
        style={{ pointerEvents: isFirst ? 'none' : 'auto' }} disabled={isFirst}
        onMouseEnter={() => handleEnter(leftRef)} onMouseLeave={() => handleLeave(leftRef)}
      >
        <ChevronLeft size={20} strokeWidth={1.5} />
        <span className={arrowLabelClass}>PREV</span>
      </button>
      <button ref={rightRef} onClick={isLast ? onExit : onNext} aria-label={isLast ? 'Save and exit' : 'Next'}
        className={`${baseClass} right-5`} style={{ pointerEvents: hasEnteredRef.current ? 'auto' : 'none' }}
        onMouseEnter={() => handleEnter(rightRef)} onMouseLeave={() => handleLeave(rightRef)}
      >
        {isLast ? (
          <><LogOut size={20} strokeWidth={1.5} /><span className={arrowLabelClass}>EXIT</span></>
        ) : (
          <><ChevronRight size={20} strokeWidth={1.5} /><span className={arrowLabelClass}>NEXT</span></>
        )}
      </button>
    </>
  );
}

// ── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-black">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="text-center max-w-lg"
      >
        <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-8">
          <Check className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Submission received</h1>
        <p className="text-white/50 text-lg leading-relaxed mb-8">
          Thanks for sharing the details. Our team will review everything and be in touch soon.
        </p>
        <a href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/30 transition-colors">
          Back to site
        </a>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Main component ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function IntakeFormClient() {
  // ── State ────────────────────────────────────────────
  const [started, setStarted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitSlideRef = useRef<HTMLDivElement>(null);
  const dotsRevealed = useRef(false);

  // Contact
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [stakeholders, setStakeholders] = useState<{ name: string; email: string; title: string }[]>([]);

  // Project
  const [companyName, setCompanyName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [phases, setPhases] = useState<string[]>([]);
  const [pitch, setPitch] = useState('');
  const [excitement, setExcitement] = useState('');
  const [keyFeature, setKeyFeature] = useState('');
  const [vision, setVision] = useState('');
  const [avoid, setAvoid] = useState('');
  const [audience, setAudience] = useState('');
  const [challenge, setChallenge] = useState('');
  const [competitors, setCompetitors] = useState<CompetitorLink[]>([{ url: '' }, { url: '' }]);

  // Creative
  const [videoRefs, setVideoRefs] = useState<VideoRef[]>([{ url: '', notes: '' }, { url: '', notes: '' }, { url: '', notes: '' }]);

  // Deliverables
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [deliverableNotes, setDeliverableNotes] = useState('');

  // Timeline
  const [timeline, setTimeline] = useState('');
  const [timelineDate, setTimelineDate] = useState('');
  const [timelineNotes, setTimelineNotes] = useState('');

  // Priorities
  const [priorityOrder, setPriorityOrder] = useState<string[]>([]);

  // Experience
  const [experience, setExperience] = useState('');
  const [experienceNotes, setExperienceNotes] = useState('');

  // Partners
  const [partners, setPartners] = useState<string[]>([]);
  const [partnerDetails, setPartnerDetails] = useState('');

  // Goals/Budget
  const [publicGoal, setPublicGoal] = useState('');
  const [internalGoal, setInternalGoal] = useState('');
  const [budget, setBudget] = useState('');
  const [emailListSize, setEmailListSize] = useState('');

  // Files & misc
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [anythingElse, setAnythingElse] = useState('');
  const [referral, setReferral] = useState('');

  // Quote
  const [quoteState, setQuoteState] = useState<CalculatorStateSnapshot | null>(null);
  const [budgetInteracted, setBudgetInteracted] = useState(false);

  // ── Refs ─────────────────────────────────────────────
  const deckRef = useRef<HTMLDivElement>(null);
  const slideRefsArr = useRef<React.RefObject<HTMLElement>[]>(SLIDE_NAMES.map(() => createRef<HTMLElement>()));

  // Intro slide refs (matching TitleSlide pattern)
  const introSectionRef = useRef<HTMLElement>(null);
  const introInnerRef = useRef<HTMLDivElement>(null);
  const introButtonRef = useRef<HTMLButtonElement>(null);
  const introFillRef = useRef<HTMLDivElement>(null);
  const introEmailRef = useRef<HTMLAnchorElement>(null);
  const introEmailFillRef = useRef<HTMLDivElement>(null);
  const [introHovered, setIntroHovered] = useState(false);
  const [introEmailHovered, setIntroEmailHovered] = useState(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const submitFillRef = useRef<HTMLDivElement>(null);
  const [submitHovered, setSubmitHovered] = useState(false);

  // Directional fill for email button
  useDirectionalFill(introEmailRef as React.RefObject<HTMLAnchorElement>, introEmailFillRef as React.RefObject<HTMLDivElement>, {
    onFillStart: () => {
      setIntroEmailHovered(true);
      const span = introEmailRef.current?.querySelector('span');
      if (span) gsap.to(span, { color: '#000000', duration: 0.3, ease: 'power2.out' });
    },
    onFillEnd: () => {
      setIntroEmailHovered(false);
      const span = introEmailRef.current?.querySelector('span');
      if (span) gsap.to(span, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
    },
  });

  // ── Restore draft from sessionStorage ────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.name) setName(d.name);
      if (d.email) setEmail(d.email);
      if (d.title) setTitle(d.title);
      if (d.stakeholders) {
        if (Array.isArray(d.stakeholders)) setStakeholders(d.stakeholders);
        else if (typeof d.stakeholders === 'string' && d.stakeholders.trim()) setStakeholders([{ name: d.stakeholders, email: '', title: '' }]);
      }
      if (d.projectName) setProjectName(d.projectName);
      if (d.phases && Array.isArray(d.phases)) setPhases(d.phases);
      if (d.pitch) setPitch(d.pitch);
      if (d.excitement) setExcitement(d.excitement);
      if (d.keyFeature) setKeyFeature(d.keyFeature);
      if (d.vision) setVision(d.vision);
      if (d.avoid) setAvoid(d.avoid);
      if (d.audience) setAudience(d.audience);
      if (d.challenge) setChallenge(d.challenge);
      if (d.competitors) {
        if (Array.isArray(d.competitors)) setCompetitors(d.competitors);
        else if (typeof d.competitors === 'string') setCompetitors(d.competitors.split('\n').filter(Boolean).map((u: string) => ({ url: u })));
      }
      if (d.videoRefs) setVideoRefs(d.videoRefs);
      if (d.deliverables) setDeliverables(d.deliverables);
      if (d.deliverableNotes) setDeliverableNotes(d.deliverableNotes);
      if (d.timeline) setTimeline(d.timeline);
      if (d.timelineDate) setTimelineDate(d.timelineDate);
      if (d.timelineNotes) setTimelineNotes(d.timelineNotes);
      if (d.priorityOrder) setPriorityOrder(d.priorityOrder);
      if (d.experience) setExperience(d.experience);
      if (d.experienceNotes) setExperienceNotes(d.experienceNotes);
      if (d.partners) setPartners(d.partners);
      if (d.partnerDetails) setPartnerDetails(d.partnerDetails);
      if (d.publicGoal) setPublicGoal(d.publicGoal);
      if (d.internalGoal) setInternalGoal(d.internalGoal);
      if (d.budget) setBudget(d.budget);
      if (d.emailListSize) setEmailListSize(d.emailListSize);
      if (d.companyName) setCompanyName(d.companyName);
      if (d.anythingElse) setAnythingElse(d.anythingElse);
      if (d.referral) setReferral(d.referral);
      if (d.quoteState) setQuoteState(d.quoteState);
      if (d.budgetInteracted) setBudgetInteracted(true);
    } catch { /* ignore */ }

    // Check for quote state passed from /pricing page
    try {
      const pricingRaw = sessionStorage.getItem('fna-pricing-quote');
      if (pricingRaw) {
        const pq = JSON.parse(pricingRaw);
        const typeToPhases: Record<string, string[]> = {
          'build': ['build'],
          'launch': ['launch'],
          'build-launch': ['build', 'launch'],
          'fundraising': ['fundraising'],
        };
        if (pq.quote_type && typeToPhases[pq.quote_type]) {
          const phasesToSet = [...typeToPhases[pq.quote_type]];
          if (pq.crowdfunding_enabled) phasesToSet.push('crowdfunding');
          setPhases(phasesToSet);
        }
        setQuoteState(pq as CalculatorStateSnapshot);
        setBudgetInteracted(true);
        sessionStorage.removeItem('fna-pricing-quote');
      }
    } catch { /* ignore */ }
  }, []);

  // Track whether the user has already seen the intro animation
  const hasSeenIntro = useRef(false);

  // ── Intro slide GSAP animation (matching TitleSlide) ─
  useEffect(() => {
    if (started) return;
    const section = introSectionRef.current;
    const inner = introInnerRef.current;
    if (!section || !inner) return;

    const isReturn = hasSeenIntro.current;
    hasSeenIntro.current = true;

    const ctx = gsap.context(() => {
      const bgOverlay = section.querySelector('[data-bg-overlay]') as HTMLElement;
      const eyebrow = inner.querySelector('[data-eyebrow]') as HTMLElement;
      const words = inner.querySelectorAll('[data-word]');
      const subtitle = inner.querySelector('[data-subtitle]') as HTMLElement;
      const button = inner.querySelector('[data-button]') as HTMLElement;
      const emailEl = inner.querySelector('[data-email]') as HTMLElement;
      const instructionEls = inner.querySelectorAll('[data-instructions]');

      gsap.set(eyebrow, { opacity: 0, y: 20 });
      gsap.set(words, { y: '115%' });
      if (subtitle) gsap.set(subtitle, { opacity: 0, y: 24 });
      if (button) gsap.set(button, { opacity: 0, y: 32 });
      if (emailEl) gsap.set(emailEl, { opacity: 0, y: 20 });
      if (instructionEls.length) gsap.set(instructionEls, { opacity: 0, y: 12 });

      const tl = gsap.timeline({ delay: isReturn ? 0.05 : 0.3 });
      if (bgOverlay) {
        if (isReturn) gsap.set(bgOverlay, { opacity: 1 });
        tl.to(bgOverlay, { opacity: 0, duration: isReturn ? 0.5 : 0.8, ease: 'power2.out' });
      }
      tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, bgOverlay ? '-=0.3' : '>')
        .to(words, { y: '0%', duration: 1.3, ease: 'expo.out', stagger: 0.07 }, '-=0.3')
        .to(subtitle, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
        .to(button, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3')
        .to(emailEl, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')
        .to(instructionEls, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3');
    }, section);

    return () => ctx.revert();
  }, [started]);

  // Directional fill for CTA button (matching TitleSlide exactly)
  useEffect(() => {
    if (started) return;
    if (!introButtonRef.current || !introFillRef.current) return;
    const button = introButtonRef.current;
    const fill = introFillRef.current;
    const textSpan = button.querySelector('span');

    const onEnter = (e: MouseEvent) => {
      setIntroHovered(true);
      const rect = button.getBoundingClientRect();
      const x = (e.clientX || e.pageX) - rect.left;
      const dir = x < rect.width / 2 ? 'left' : 'right';
      gsap.killTweensOf([fill, textSpan]);
      gsap.fromTo(fill, { scaleX: 0, transformOrigin: dir === 'left' ? '0 50%' : '100% 50%' }, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
      if (textSpan) gsap.to(textSpan, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
    };
    const onLeave = () => {
      setIntroHovered(false);
      gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });
      if (textSpan) gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
    };

    button.addEventListener('mouseenter', onEnter);
    button.addEventListener('mouseleave', onLeave);
    return () => { button.removeEventListener('mouseenter', onEnter); button.removeEventListener('mouseleave', onLeave); };
  }, [started]);

  // Directional fill for submit button (matching intro button)
  useEffect(() => {
    if (!submitButtonRef.current || !submitFillRef.current) return;
    const button = submitButtonRef.current;
    const fill = submitFillRef.current;
    const textSpan = button.querySelector('span');

    const onEnter = (e: MouseEvent) => {
      if (button.disabled) return;
      setSubmitHovered(true);
      const rect = button.getBoundingClientRect();
      const x = (e.clientX || e.pageX) - rect.left;
      const dir = x < rect.width / 2 ? 'left' : 'right';
      gsap.killTweensOf([fill, textSpan]);
      gsap.fromTo(fill, { scaleX: 0, transformOrigin: dir === 'left' ? '0 50%' : '100% 50%' }, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
      if (textSpan) gsap.to(textSpan, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
    };
    const onLeave = () => {
      setSubmitHovered(false);
      gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });
      if (textSpan) gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
    };

    button.addEventListener('mouseenter', onEnter);
    button.addEventListener('mouseleave', onLeave);
    return () => { button.removeEventListener('mouseenter', onEnter); button.removeEventListener('mouseleave', onLeave); };
  }, [booked, submitting]);

  // ── Navigation ───────────────────────────────────────
  const togglePhase = (value: string, stayOnSlide?: number) => {
    const active = phases.includes(value);
    if (active) {
      let next = phases.filter((p) => p !== value);
      // Crowdfunding requires build or launch — remove it if no host remains
      if ((value === 'build' || value === 'launch') && next.includes('crowdfunding') && !next.includes('build') && !next.includes('launch')) {
        next = next.filter((p) => p !== 'crowdfunding');
      }
      setPhases(next);
    } else if (value === 'crowdfunding' && phases.length === 0) {
      setPhases(['build', 'crowdfunding']);
    } else {
      setPhases([...phases, value]);
    }
    // Prevent scroll snap from jumping when Goals slide is revealed/hidden
    if (stayOnSlide !== undefined) {
      requestAnimationFrame(() => {
        const el = slideRefsArr.current[stayOnSlide]?.current;
        if (el) el.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'instant' as ScrollBehavior });
      });
    }
  };

  const showGoals = phases.includes('crowdfunding');

  const dotHiddenIndices = (() => {
    const s = new Set<number>();
    if (!showGoals) s.add(GOALS_SLIDE_INDEX);
    return s.size > 0 ? s : undefined;
  })();

  const navigateTo = useCallback((idx: number) => {
    // Skip goals slide when crowdfunding not selected
    if (idx === GOALS_SLIDE_INDEX && !showGoals) {
      idx = currentSlide < GOALS_SLIDE_INDEX ? GOALS_SLIDE_INDEX + 1 : GOALS_SLIDE_INDEX - 1;
    }
    if (idx < 0 || idx >= TOTAL_SLIDES) return;
    const el = slideRefsArr.current[idx]?.current;
    if (!el) return;
    el.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'smooth' });
  }, [showGoals, currentSlide]);

  // Track showGoals in a ref so the IntersectionObserver (set up once) can read it
  const showGoalsRef = useRef(showGoals);
  useEffect(() => { showGoalsRef.current = showGoals; }, [showGoals]);

  useEffect(() => {
    if (!started) return;
    const observers: IntersectionObserver[] = [];
    slideRefsArr.current.forEach((ref, i) => {
      if (!ref.current) return;
      const obs = new IntersectionObserver(([entry]) => {
        // Never let the Goals slide steal focus via intersection — only explicit navigation
        if (entry.isIntersecting && !(i === GOALS_SLIDE_INDEX && !showGoalsRef.current)) {
          setCurrentSlide(i);
        }
      }, { threshold: 0.5 });
      obs.observe(ref.current);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight') navigateTo(currentSlide + 1);
      if (e.key === 'ArrowLeft') navigateTo(currentSlide - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [started, currentSlide, navigateTo]);

  useEffect(() => {
    if (!started) return;
    const handler = () => {
      const el = slideRefsArr.current[currentSlide]?.current;
      if (el) el.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [started, currentSlide]);

  // Auto-save to sessionStorage
  useEffect(() => {
    if (!started) return;
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          name, email, title, stakeholders, companyName, projectName, phases, pitch, excitement, keyFeature,
          vision, avoid, audience, challenge, competitors, videoRefs, deliverables,
          deliverableNotes, timeline, timelineDate, timelineNotes, priorityOrder,
          experience, experienceNotes, partners, partnerDetails, publicGoal, internalGoal,
          budget, emailListSize, anythingElse, referral, budgetInteracted, quoteState,
        }));
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [started, name, email, title, stakeholders, companyName, projectName, phases, pitch, excitement, keyFeature,
      vision, avoid, audience, challenge, competitors, videoRefs, deliverables,
      deliverableNotes, timeline, timelineDate, timelineNotes, priorityOrder,
      experience, experienceNotes, partners, partnerDetails, publicGoal, internalGoal,
      budget, emailListSize, anythingElse, referral, budgetInteracted, quoteState]);

  // ── File handling ────────────────────────────────────
  const handleFileAdd = useCallback(async (fileList: FileList) => {
    setUploading(true);
    const newFiles: { name: string; url: string }[] = [];
    for (let i = 0; i < fileList.length; i++) {
      try { const fd = new FormData(); fd.append('file', fileList[i]); const url = await uploadIntakeFile(fd); newFiles.push({ name: fileList[i].name, url }); }
      catch { console.warn(`Failed to upload ${fileList[i].name}`); }
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setUploading(false);
  }, []);

  // ── Exit handler (save + navigate home) ──────────────
  const handleExit = useCallback(() => {
    // Draft is already auto-saved via the useEffect above
    window.location.href = '/';
  }, []);

  // ── Validation & submit ──────────────────────────────
  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Required';
    if (!email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Invalid email';
    if (!title.trim()) e.title = 'Required';
    if (!companyName.trim()) e.companyName = 'Required';
    if (!projectName.trim()) e.projectName = 'Required';
    if (!pitch.trim()) e.pitch = 'Required';
    if (!excitement.trim()) e.excitement = 'Required';
    if (!keyFeature.trim()) e.keyFeature = 'Required';
    if (deliverables.length === 0) e.deliverables = 'Please select at least one';
    if (!timeline) e.timeline = 'Required';
    if (timeline === 'specific' && !timelineDate) e.timelineDate = 'Please select a date';
    if (priorityOrder.length < 3) e.priorityOrder = 'Rank all three';
    if (!experience) e.experience = 'Required';
    if (partners.length === 0) e.partners = 'Please select at least one';
    if (phases.includes('crowdfunding')) {
      if (!publicGoal.trim()) e.publicGoal = 'Required';
      if (!internalGoal.trim()) e.internalGoal = 'Required';
      if (!emailListSize) e.emailListSize = 'Required';
    }
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const errorSlideMap: Record<string, number> = { name: 0, email: 0, title: 0, companyName: 1, projectName: 1, pitch: 1, excitement: 2, keyFeature: 2, deliverables: 5, timeline: 6, timelineDate: 6, priorityOrder: 7, experience: 8, partners: 9, publicGoal: 10, internalGoal: 10, emailListSize: 10 };
      const firstKey = Object.keys(errs)[0];
      navigateTo(errorSlideMap[firstKey] ?? 0);
      return;
    }
    setSubmitting(true);
    try {
      const videoLinksText = videoRefs.filter((v) => v.url.trim()).map((v) => `${v.url}${v.notes ? ` — ${v.notes}` : ''}`).join('\n');
      const data: IntakeFormData = {
        name: name.trim(), email: email.trim().toLowerCase(), title: title.trim() || undefined,
        stakeholders: stakeholders.filter((s) => s.name.trim() || s.email.trim()).map((s) => `${s.name.trim()} <${s.email.trim()}>${s.title.trim() ? ` — ${s.title.trim()}` : ''}`).join('\n') || undefined,
        company_name: companyName.trim() || undefined,
        project_name: projectName.trim(), phases: phases.length ? phases : undefined, pitch: pitch.trim(),
        excitement: excitement.trim() || undefined, key_feature: keyFeature.trim() || undefined,
        vision: vision.trim() || undefined, avoid: avoid.trim() || undefined, audience: audience.trim() || undefined,
        challenge: challenge.trim() || undefined,
        competitors: competitors.filter((c) => c.url.trim()).map((c) => ({ url: c.url.trim(), note: c.note?.trim() || undefined })),
        video_links: videoLinksText || undefined, deliverables, deliverable_notes: deliverableNotes.trim() || undefined,
        timeline, timeline_date: timelineDate || undefined, timeline_notes: timelineNotes.trim() || undefined,
        priority_order: priorityOrder, experience, experience_notes: experienceNotes.trim() || undefined,
        partners, partner_details: partnerDetails.trim() || undefined, public_goal: publicGoal.trim() || undefined,
        internal_goal: internalGoal.trim() || undefined, budget: budget.trim() || undefined,
        email_list_size: emailListSize || undefined, file_urls: files.map((f) => f.url),
        anything_else: anythingElse.trim() || undefined, referral: referral.trim() || undefined,
        quote_data: quoteState ? (quoteState as unknown as Record<string, unknown>) : undefined,
        budget_interacted: budgetInteracted,
      };
      await submitIntakeForm(data);
      sessionStorage.removeItem(STORAGE_KEY);
      setSubmitted(true);
    } catch (err) { console.error(err); setErrors({ _form: 'Something went wrong. Please try again.' }); }
    finally { setSubmitting(false); }
  };

  // ── Missing fields for submit gate ──────────────────
  const missingFields = (() => {
    const errs = validate();
    return Object.keys(errs)
      .filter((k) => FIELD_META[k])
      .map((k) => ({ key: k, ...FIELD_META[k] }));
  })();

  // ── Cal.com embed setup + booking listener ──────────
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: 'start-form-review' });
      cal('ui', {
        cssVarsPerTheme: { light: { 'cal-brand': '#9752f4' }, dark: { 'cal-brand': '#9752f4' } },
        hideEventTypeDetails: true,
        layout: 'month_view',
      });
      cal('on', {
        action: 'bookingSuccessful',
        callback: () => setBooked(true),
      });
    })();
  }, []);

  // ── GSAP reveal for submit slide when it scrolls into view ──
  useEffect(() => {
    if (!started) return;
    const el = submitSlideRef.current;
    if (!el) return;

    const heading = el.querySelector('[data-submit-heading]') as HTMLElement;
    const missing = el.querySelector('[data-submit-missing]') as HTMLElement;
    const steps = el.querySelector('[data-submit-steps]') as HTMLElement;
    const calEmbed = el.querySelector('[data-submit-cal]') as HTMLElement;
    const button = el.querySelector('[data-submit-btn]') as HTMLElement;
    const disclaimer = el.querySelector('[data-submit-disclaimer]') as HTMLElement;

    const targets = [heading, missing, steps, calEmbed, button, disclaimer].filter(Boolean);
    gsap.set(targets, { opacity: 0, y: 30 });

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const tl = gsap.timeline();
        if (heading) tl.to(heading, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
        if (missing) tl.to(missing, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');
        if (steps) tl.to(steps, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');
        if (calEmbed) tl.to(calEmbed, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');
        if (button) tl.to(button, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.2');
        if (disclaimer) tl.to(disclaimer, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.2');
        observer.disconnect();
      }
    }, { threshold: 0.3 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  // ── Render: Success ──────────────────────────────────
  if (submitted) return <SuccessScreen />;

  const slidesWrapperRef = useRef<HTMLDivElement>(null);
  const handleGoHome = useCallback(() => {
    const wrapper = slidesWrapperRef.current;
    if (!wrapper) { setStarted(false); return; }
    gsap.to(wrapper, {
      opacity: 0, duration: 0.35, ease: 'power2.in',
      onComplete: () => setStarted(false),
    });
  }, []);

  // ── Render: Intro (matching TitleSlide exactly) ──────
  const handleLeaveIntro = useCallback((then: () => void) => {
    const section = introSectionRef.current;
    const inner = introInnerRef.current;
    const bgOverlay = section?.querySelector('[data-bg-overlay]') as HTMLElement | null;
    if (inner) gsap.to(inner, { opacity: 0, x: -40, duration: 0.35, ease: 'power2.in' });
    if (bgOverlay) {
      gsap.to(bgOverlay, { opacity: 1, duration: 0.4, ease: 'power2.in', onComplete: then });
    } else {
      setTimeout(then, 350);
    }
  }, []);

  // Swipe right on intro to start (mobile)
  const introTouchStart = useRef<{ x: number; y: number } | null>(null);
  const handleIntroTouchStart = useCallback((e: React.TouchEvent) => {
    introTouchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const handleIntroTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!introTouchStart.current) return;
    const dx = e.changedTouches[0].clientX - introTouchStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - introTouchStart.current.y);
    introTouchStart.current = null;
    // Swipe left (finger moves left = navigate right/forward) with enough horizontal distance
    if (dx < -50 && dy < 100) {
      handleLeaveIntro(() => setStarted(true));
    }
  }, [handleLeaveIntro]);

  if (!started) {
    const titleLines = [["Let's", 'build'], ['something', 'great.']];
    return (
      <>
      <section
        ref={introSectionRef}
        onTouchStart={handleIntroTouchStart}
        onTouchEnd={handleIntroTouchEnd}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      >
        <div className="absolute inset-0 pointer-events-none z-0"
          style={{ background: 'radial-gradient(ellipse 85% 100% at 50% 50%, transparent 35%, var(--surface-elevated) 100%)' }} />
        <div data-bg-overlay className="absolute inset-0 pointer-events-none z-[1]" style={{ backgroundColor: 'black' }} />

        <div ref={introInnerRef} className="relative z-10 flex flex-col items-center text-center px-6 sm:px-8 max-w-5xl w-full">
          <p data-eyebrow className="text-sm tracking-[0.45em] uppercase text-white/25 font-mono mb-5" style={{ opacity: 0 }}>
            New Project
          </p>

          <h1 className="font-display font-bold text-white leading-[0.95] mb-6"
            style={{ fontSize: 'clamp(3.25rem, 6.5vw, 7rem)' }}
          >
            {titleLines.map((line, li) => (
              <span key={li} className="block">
                {line.map((word, wi) => (
                    <span key={wi} className="inline-block overflow-hidden pb-[0.22em]" style={{ verticalAlign: 'top' }}>
                      <span data-word className="inline-block" style={{ transform: 'translateY(115%)' }}>
                        {word}{wi < line.length - 1 ? '\u00a0' : ''}
                      </span>
                    </span>
                ))}
              </span>
            ))}
          </h1>

          <p data-subtitle className="text-base sm:text-xl text-white/40 max-w-lg leading-relaxed mb-8" style={{ opacity: 0 }}>
            Tell us about your project. The more detail you share, the better we can tailor our creative approach.
          </p>

          {/* CTA Button — black/white, matching proposal exactly */}
          <div data-button className="w-full max-w-sm mb-5" style={{ opacity: 0 }}>
            <motion.button
              ref={introButtonRef}
              onClick={() => handleLeaveIntro(() => setStarted(true))}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full px-6 py-3 font-medium text-black bg-white border border-white rounded-lg overflow-hidden"
            >
              <div ref={introFillRef} className="absolute inset-0 bg-black pointer-events-none"
                style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }} />
              <span className="relative flex items-center justify-center gap-2 whitespace-nowrap" style={{ zIndex: 10 }}>
                <span className="sm:hidden">Swipe right to start</span>
                <span className="hidden sm:inline">Get Started</span>
                <motion.span variants={iconVariants} initial="hidden" animate={introHovered ? 'visible' : 'hidden'} className="hidden sm:flex items-center text-lg">
                  →
                </motion.span>
              </span>
            </motion.button>
          </div>

          {/* Email Button — matching proposal exactly */}
          <div data-email className="w-full max-w-[12rem] mb-5" style={{ opacity: 0 }}>
            <a ref={introEmailRef} href="mailto:hi@fna.wtf"
              className="relative w-full px-6 py-3 font-medium text-white bg-black border border-white rounded-lg overflow-hidden flex items-center justify-center"
            >
              <div ref={introEmailFillRef} className="absolute inset-0 bg-white pointer-events-none"
                style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }} />
              <span className="relative flex items-center justify-center gap-2 whitespace-nowrap" style={{ zIndex: 10 }}>
                <motion.span variants={iconVariants} initial="hidden" animate={introEmailHovered ? 'visible' : 'hidden'} className="flex items-center">
                  <Mail size={16} strokeWidth={1.5} />
                </motion.span>
                hi@fna.wtf
              </span>
            </a>
          </div>

          {/* Instructions */}
          <p data-instructions className="sm:hidden text-sm text-white/40 max-w-sm leading-relaxed" style={{ opacity: 0 }}>
            Swipe left or right to advance.
          </p>
          <p data-instructions className="hidden sm:block text-sm text-white/40 max-w-sm leading-relaxed" style={{ opacity: 0 }}>
            Navigate with arrow keys, page dots below, or the left/right buttons.
          </p>
        </div>
      </section>
      <IntakeProgressDots count={TOTAL_SLIDES} activeIndex={-1} onNavigate={(i) => { handleLeaveIntro(() => { setStarted(true); setTimeout(() => navigateTo(i), 50); }); }} onHome={() => {}} onExit={handleExit} skipReveal={dotsRevealed.current} onRevealed={() => { dotsRevealed.current = true; }} hiddenIndices={dotHiddenIndices} />
      </>
    );
  }

  // ── Render: Slide deck ───────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];

  const slideClass = '[scroll-snap-align:start] [scroll-snap-stop:always] flex-shrink-0 w-screen h-screen overflow-y-auto scrollbar-hide px-4 sm:px-6 pt-16 pb-44 sm:py-20 md:py-24 bg-black';

  return (
    <div ref={slidesWrapperRef} className="h-screen flex flex-col bg-black">
      <div ref={deckRef} className="flex-1 flex overflow-x-scroll [scroll-snap-type:x_mandatory] [overscroll-behavior-x:contain] scrollbar-hide">

        {/* ── Slide 0: About You ──────────────────────── */}
        <section ref={slideRefsArr.current[0] as React.RefObject<HTMLElement>} className={slideClass}>
          <div className="max-w-2xl mx-auto">
            <SlideHeader eyebrow="01" title="People" subtitle="Who should we be in touch with?" />
            <div className="space-y-6">
              <div id="field-name">
                <FieldLabel icon={User} label="Your name" required />
                <input type="text" placeholder="First and last name" value={name}
                  onChange={(e) => { setName(e.target.value); clearError('name'); }}
                  className={`${inputClass} ${errors.name ? 'border-red-500/50' : ''}`} />
                {errors.name && <p className="text-xs text-red-400 mt-1.5">{errors.name}</p>}
              </div>
              <div id="field-email">
                <FieldLabel icon={Mail} label="Email address" required />
                <input type="email" placeholder="you@company.com" value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                  className={`${inputClass} ${errors.email ? 'border-red-500/50' : ''}`} />
                {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email}</p>}
              </div>
              <div>
                <FieldLabel icon={Briefcase} label="Your title" required />
                <input type="text" placeholder="e.g. Founder, Marketing Director" value={title}
                  onChange={(e) => setTitle(e.target.value)} className={inputClass} />
              </div>
              <div>
                <FieldLabel icon={Users} label="Other stakeholders" />
                <p className={`${helperClass} mb-3`}>Anyone else involved in the project decision-making.</p>
                <div className="space-y-3">
                  {stakeholders.map((s, i) => (
                    <StakeholderRow key={i} stakeholder={s}
                      onChange={(updated) => { const copy = [...stakeholders]; copy[i] = updated; setStakeholders(copy); }}
                      onRemove={() => setStakeholders(stakeholders.filter((_, j) => j !== i))} />
                  ))}
                  <button type="button" onClick={() => setStakeholders([...stakeholders, { name: '', email: '', title: '' }])}
                    className="text-sm text-white/50 hover:text-white/70 border border-white/10 hover:border-white/20 rounded-lg px-4 py-2 transition-all duration-200">
                    + Add stakeholder
                  </button>
                </div>
                {stakeholders.length > 0 && (
                  <p className="text-xs mt-3" style={{ color: '#777777' }}>
                    By adding stakeholders you confirm consent for us to contact them on your behalf.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Slide 1: The Project ─────────────────────── */}
        <section ref={slideRefsArr.current[1] as React.RefObject<HTMLElement>} className={slideClass}>
          <div className="max-w-2xl mx-auto">
            <SlideHeader eyebrow="02" title="Project" subtitle="Help us understand what you're building." />
            <div className="space-y-6">
              <div>
                <FieldLabel icon={Building2} label="Company name" required />
                <input type="text" placeholder='e.g. "Acme Inc."' value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={inputClass} />
              </div>
              <div id="field-projectName">
                <FieldLabel icon={Rocket} label="Project name" required />
                <input type="text" placeholder='e.g. "Product X — Kickstarter Launch"' value={projectName}
                  onChange={(e) => { setProjectName(e.target.value); clearError('projectName'); }}
                  className={`${inputClass} ${errors.projectName ? 'border-red-500/50' : ''}`} />
                {errors.projectName && <p className="text-xs text-red-400 mt-1.5">{errors.projectName}</p>}
              </div>
              <div id="field-pitch">
                <FieldLabel icon={Sparkles} label="What are you making? One sentence." required />
                <input type="text" placeholder="The elevator pitch." value={pitch}
                  onChange={(e) => { setPitch(e.target.value); clearError('pitch'); }}
                  className={`${inputClass} ${errors.pitch ? 'border-red-500/50' : ''}`} />
                {errors.pitch && <p className="text-xs text-red-400 mt-1.5">{errors.pitch}</p>}
              </div>
              <div>
                <FieldLabel icon={Hammer} label="What services are you interested in?" required />
                {[PROJECT_PHASES.slice(0, 3), PROJECT_PHASES.slice(3)].map((row, ri) => (
                  <div key={ri} className={`flex flex-wrap gap-3 ${ri === 0 ? 'mt-3' : 'mt-3'}`}>
                    {row.map((phase) => {
                      const active = phases.includes(phase.value);
                      const compatible = phases.length === 0 || phases.every((p) => PHASE_RULES[p]?.includes(phase.value) ?? false);
                      const disabled = !active && !compatible;
                      const Icon = phase.icon;
                      return (
                        <button
                          key={phase.value}
                          type="button"
                          disabled={disabled}
                          onClick={() => togglePhase(phase.value)}
                          className={`flex-1 flex flex-col items-center gap-2 py-5 px-3 rounded-xl border transition-all duration-200 text-center ${
                            disabled ? 'opacity-25 cursor-not-allowed border-white/5' :
                            active ? 'bg-accent/15 border-accent/40 text-white' : 'bg-black border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${active ? 'text-accent' : ''}`} />
                          <span className="text-base font-medium">{phase.label}</span>
                          <span className="text-sm leading-tight" style={{ color: active ? '#888888' : '#777777' }}>{phase.subtitle}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Slide 2: Vision & Audience ──────────────── */}
        <section ref={slideRefsArr.current[2] as React.RefObject<HTMLElement>} className={slideClass}>
          <div className="max-w-2xl mx-auto">
            <SlideHeader eyebrow="03" title="Vision" subtitle="What does success look like?" />
            <div className="space-y-6">
              <div><FieldLabel icon={Heart} label="What is the product/service vision?" required />
                <textarea placeholder="What excites you most about it?" value={excitement} onChange={(e) => setExcitement(e.target.value)} rows={3} className={textareaClass} /></div>
              <div><FieldLabel icon={Star} label="Key feature or benefit to highlight" required />
                <input type="text" placeholder="The single most important thing." value={keyFeature} onChange={(e) => setKeyFeature(e.target.value)} className={inputClass} /></div>
              <div><FieldLabel icon={Eye} label="Describe your ideal video campaign" required />
                <textarea placeholder="Goals, feelings, visual style, locations, voice-over." value={vision} onChange={(e) => setVision(e.target.value)} rows={4} className={textareaClass} /></div>
              <div><FieldLabel icon={Target} label="Target audience" required />
                <textarea placeholder="Demographics, psychographics, market research." value={audience} onChange={(e) => setAudience(e.target.value)} rows={3} className={textareaClass} /></div>
            </div>
          </div>
        </section>

        {/* ── Slide 3: Challenges ────────────────────────── */}
        <section ref={slideRefsArr.current[3] as React.RefObject<HTMLElement>} className={slideClass}>
          <div className="max-w-2xl mx-auto">
            <SlideHeader eyebrow="04" title="Challenges" subtitle="Help us understand what to avoid and who you're up against." />
            <div className="space-y-6">
              <div><FieldLabel icon={Ban} label="What should we avoid?" required />
                <textarea placeholder="Styles, tones, or approaches that aren't right for your brand." value={avoid} onChange={(e) => setAvoid(e.target.value)} rows={3} className={textareaClass} /></div>
              <div><FieldLabel icon={AlertTriangle} label="Biggest communication challenge" required />
                <textarea placeholder="What's been the hardest part to convey?" value={challenge} onChange={(e) => setChallenge(e.target.value)} rows={3} className={textareaClass} /></div>
              <div><FieldLabel icon={Shield} label="Top competitors" />
                <p className={`${helperClass} mb-3`}>Add links to competitor websites. We will pull their info automatically.</p>
                <CompetitorLinkInputs links={competitors} onChange={setCompetitors} /></div>
            </div>
          </div>
        </section>

        {/* ── Slide 4: Creative References ─────────────── */}
        <section ref={slideRefsArr.current[4] as React.RefObject<HTMLElement>} className={slideClass}>
          <div className="max-w-2xl mx-auto">
            <SlideHeader eyebrow="05" title="References" subtitle="Share videos you love so we can understand your taste and vision." />
            <FieldLabel icon={Play} label="Videos you love" required />
            <p className={`${helperClass} mb-6`}>Add 3–5 links and describe what you like about each.</p>
            <VideoReferenceInputs videos={videoRefs} onChange={setVideoRefs} />
          </div>
        </section>

        {/* ── Slide 5: Deliverables ────────────────────── */}
        <section ref={slideRefsArr.current[5] as React.RefObject<HTMLElement>} className={slideClass}>
          <div className="max-w-2xl mx-auto">
            <SlideHeader eyebrow="06" title="Deliverables" subtitle="What do you need? Select all that apply." />
            <div className="space-y-6">
              <div id="field-deliverables">
                <ChipSelect options={DELIVERABLE_OPTIONS} selected={deliverables} onChange={(v) => { setDeliverables(v); clearError('deliverables'); }} large />
                <div className="mt-3">
                  <ChipSelect options={DELIVERABLE_META_OPTIONS} selected={deliverables} onChange={(v) => { setDeliverables(v); clearError('deliverables'); }} cols={2} allValues={DELIVERABLE_OPTIONS.map((o) => o.value)} />
                </div>
                {errors.deliverables && <p className="text-xs text-red-400 mt-2">{errors.deliverables}</p>}
              </div>
              <div><FieldLabel icon={MessageSquare} label="Additional deliverable details" />
                <textarea placeholder="Specifics about formats, quantities, or custom deliverables." value={deliverableNotes} onChange={(e) => setDeliverableNotes(e.target.value)} rows={3} className={textareaClass} /></div>
            </div>
          </div>
        </section>

        {/* ── Slide 6: Timeline ────────────────────────── */}
        <section ref={slideRefsArr.current[6] as React.RefObject<HTMLElement>} className={slideClass}>
          <div className="max-w-2xl mx-auto">
            <SlideHeader eyebrow="07" title="Timeline" subtitle="When do you need this completed?" />
            <div className="space-y-8">
              <div id="field-timeline">
                <TimelineSlider value={timeline} onChange={(v) => { setTimeline(v); clearError('timeline'); clearError('timelineDate'); setTimelineDate(''); }} />
                {errors.timeline && <p className="text-xs text-red-400 mt-2">{errors.timeline}</p>}
              </div>
              <AnimatePresence>
                {timeline === 'specific' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} id="field-timelineDate">
                    <FieldLabel icon={Calendar} label="Target date" />
                    <input type="date" value={timelineDate} min={todayStr}
                      onChange={(e) => { setTimelineDate(e.target.value); clearError('timelineDate'); }}
                      className={`${inputClass} [color-scheme:dark] w-full max-w-full box-border ${errors.timelineDate ? 'border-red-500/50' : ''}`} />
                    {errors.timelineDate && <p className="text-xs text-red-400 mt-1.5">{errors.timelineDate}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
              <div><FieldLabel icon={MessageSquare} label="Additional timing details" />
                <textarea placeholder="Event dates, launch windows, external deadlines." value={timelineNotes} onChange={(e) => setTimelineNotes(e.target.value)} rows={2} className={textareaClass} /></div>
            </div>
          </div>
        </section>

        {/* ── Slide 7: Priorities ──────────────────────── */}
        <section ref={slideRefsArr.current[7] as React.RefObject<HTMLElement>} className={slideClass}>
          <div className="max-w-2xl mx-auto">
            <SlideHeader eyebrow="08" title="Priorities" subtitle="Balancing quality, speed, and cost is critical." />
            <PriorityRanker order={priorityOrder} onChange={setPriorityOrder} />
          </div>
        </section>

        {/* ── Slide 8: Experience ──────────────────────── */}
        <section ref={slideRefsArr.current[8] as React.RefObject<HTMLElement>} className={slideClass}>
          <div className="max-w-2xl mx-auto">
            <SlideHeader eyebrow="09" title="Experience" subtitle="No wrong answers, just helps us calibrate." />
            <div className="space-y-6">
              <div id="field-experience">
                <ExperienceVisualizer value={experience} onChange={(v) => { setExperience(v); clearError('experience'); }} />
                {errors.experience && <p className="text-xs text-red-400 mt-2">{errors.experience}</p>}
              </div>
              <div><FieldLabel icon={MessageSquare} label="Additional context" />
                <textarea placeholder="Links to previous work, notes on your experience." value={experienceNotes} onChange={(e) => setExperienceNotes(e.target.value)} rows={2} className={textareaClass} /></div>
            </div>
          </div>
        </section>

        {/* ── Slide 9: Partners ────────────────────────── */}
        <section ref={slideRefsArr.current[9] as React.RefObject<HTMLElement>} className={slideClass}>
          <div className="max-w-2xl mx-auto">
            <SlideHeader eyebrow="10" title="Partners" subtitle="Already with any other service providers?" />
            <div className="space-y-6">
              <ChipSelect options={PARTNER_OPTIONS} selected={partners} onChange={setPartners} large />
              <ChipSelect options={PARTNER_STATUS_OPTIONS} selected={partners} onChange={setPartners} cols={1} />
              <div><FieldLabel icon={Link2} label="Who are your partners?" />
                <textarea placeholder="List any companies or agencies you're working with." value={partnerDetails} onChange={(e) => setPartnerDetails(e.target.value)} rows={3} className={textareaClass} /></div>
            </div>
          </div>
        </section>

        {/* ── Slide 10: Goals (crowdfunding only) ── */}
        <section ref={slideRefsArr.current[10] as React.RefObject<HTMLElement>} className={showGoals ? slideClass : ''} style={showGoals ? undefined : { width: 0, minWidth: 0, overflow: 'hidden', padding: 0 }}>
          <div className="max-w-2xl mx-auto">
            <SlideHeader eyebrow="11" title="Goals" subtitle="Help us understand your campaign targets." />
            <div className="space-y-6">
              <div><FieldLabel icon={Target} label="Public goal (e.g. crowdfunding target)" required />
                <input type="text" placeholder='e.g. "Raise $25,000 on Kickstarter"' value={publicGoal} onChange={(e) => setPublicGoal(e.target.value)} className={inputClass} /></div>
              <div><FieldLabel icon={Gauge} label="Internal goal" required />
                <input type="text" placeholder="e.g. Internally, we're projecting $250,000" value={internalGoal} onChange={(e) => setInternalGoal(e.target.value)} className={inputClass} /></div>
              <div><FieldLabel icon={MailOpen} label="Current email list size" required />
                <div className="flex flex-wrap gap-2.5">
                  {EMAIL_LIST_OPTIONS.map((opt) => {
                    const active = emailListSize === opt.value;
                    return (
                      <button key={opt.value} type="button" onClick={() => setEmailListSize(active ? '' : opt.value)}
                        className={`px-4 py-2.5 rounded-xl border text-sm transition-all duration-200 ${
                          active ? 'bg-accent/15 border-accent/40 text-white' : 'bg-black border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'}`}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div></div>
            </div>
          </div>
        </section>

        {/* ── Slide 11: Investment (optional quote builder) ── */}
        <section ref={slideRefsArr.current[11] as React.RefObject<HTMLElement>} className={slideClass}>
          <div className="max-w-4xl mx-auto">
            <SlideHeader eyebrow={showGoals ? '12' : '11'} title="Investment" subtitle="Totally optional — build a rough quote to bring into our call, or skip ahead." />

            {/* ── Phase toggles (wrapping, with labels) ── */}
            <div className="flex flex-wrap gap-2 mt-4">
              {PROJECT_PHASES.map((phase) => {
                const active = phases.includes(phase.value);
                const compatible = phases.length === 0 || phases.every((p) => PHASE_RULES[p]?.includes(phase.value) ?? false);
                const disabled = !active && !compatible;
                const Icon = phase.icon;
                return (
                  <button
                    key={phase.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => togglePhase(phase.value, 11)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border transition-all duration-200 ${
                      disabled ? 'opacity-25 cursor-not-allowed border-white/5' :
                      active ? 'bg-accent/15 border-accent/40 text-white' : 'bg-black border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-accent' : ''}`} />
                    <span className="text-sm font-medium">{phase.label}</span>
                  </button>
                );
              })}
            </div>

            {!(phases.includes('build') || phases.includes('launch') || phases.includes('fundraising')) ? (
              /* ── No quotable phase selected ── */
              <div className="mt-6">
                <p className="text-base" style={{ color: '#888888' }}>
                  {phases.length === 0
                    ? 'Select a service above to configure.'
                    : 'Pricing for this service is custom \u2014 we\u2019ll discuss on our call.'}
                </p>
              </div>
            ) : (
              <div className="mt-6">
              <ProposalCalculatorEmbed
                proposalId=""
                proposalType={phasesToQuoteType(phases) as ProposalType}
                standalone
                typeOverride={phasesToQuoteType(phases)}
                crowdfundingOverride={phases.includes('crowdfunding')}
                onStateChange={(state) => { setQuoteState(state); setBudgetInteracted(true); }}
              />
              </div>
            )}
          </div>
        </section>

        {/* ── Slide 12: Wrap Up ────────────────────────── */}
        <section ref={slideRefsArr.current[12] as React.RefObject<HTMLElement>} className={slideClass}>
          <div className="max-w-2xl mx-auto">
            <SlideHeader eyebrow={showGoals ? '13' : '12'} title="Extras" subtitle="Upload files and add any final context." />
            <div className="space-y-8">
              <div><FieldLabel icon={Upload} label="Files to share" />
                <p className={`${helperClass} mb-3`}>Market research, brand guidelines, NDAs, existing photo or video assets — anything is relevant.</p>
                <FileUploader files={files} onAdd={handleFileAdd} onRemove={(i) => setFiles((p) => p.filter((_, j) => j !== i))} uploading={uploading} /></div>
              <div><FieldLabel icon={MessageSquare} label="Anything else we should know?" />
                <textarea placeholder="Additional context, questions, links." value={anythingElse} onChange={(e) => setAnythingElse(e.target.value)} rows={4} className={textareaClass} /></div>
              <div><FieldLabel icon={Heart} label="Who referred you?" />
                <input type="text" placeholder="Let us know so we can thank them!" value={referral} onChange={(e) => setReferral(e.target.value)} className={inputClass} /></div>
            </div>
          </div>
        </section>

        {/* ── Slide 13: Submit ────────────────────────── */}
        <section ref={slideRefsArr.current[13] as React.RefObject<HTMLElement>} className={slideClass}>
          <div ref={submitSlideRef} className="max-w-4xl mx-auto">
            {missingFields.length > 0 ? (
              <>
                <div data-submit-heading className="text-center mb-10">
                  <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-3">Hold up...</h2>
                  <p className="text-base max-w-lg mx-auto" style={{ color: '#888888' }}>
                    A few details are missing. Please fix these so we can make the most of our call. Thanks!
                  </p>
                </div>

                <div data-submit-missing className="flex flex-col gap-4 max-w-xl mx-auto">
                  {(() => {
                    const grouped = missingFields.reduce<Record<number, typeof missingFields>>((acc, f) => {
                      (acc[f.slide] ??= []).push(f);
                      return acc;
                    }, {});
                    return Object.entries(grouped)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([slide, fields]) => (
                        <button key={slide} onClick={() => navigateTo(Number(slide))}
                          className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 w-full text-left px-5 py-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all group"
                        >
                          <ChevronLeft size={16} className="text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white mb-1">{SLIDE_NAMES[Number(slide)]}</p>
                            {fields.map((f) => (
                              <p key={f.key} className="text-sm mt-1" style={{ color: '#888888' }}>
                                <span className="text-white/60">{f.label}</span> — {f.explanation}
                              </p>
                            ))}
                          </div>
                        </button>
                      ));
                  })()}
                </div>
              </>
            ) : (
              <>
                <div data-submit-heading className="text-center mb-8">
                  <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-3">Book our review call.</h2>
                  <p className="text-base" style={{ color: '#888888' }}>Pick a time that works and we will walk through your submission together.</p>
                </div>

                <div data-submit-steps className="flex justify-center gap-8 mb-8">
                  {[
                    { step: '1', text: 'Book a review call below', done: booked },
                    { step: '2', text: 'Submit your start form', done: submitted },
                    { step: '3', text: 'We chat and review together', done: false },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: item.done ? '#22c55e' : '#2a1a3e', color: item.done ? '#000000' : '#a14dfd' }}>
                        {item.done ? <Check className="w-3.5 h-3.5" /> : item.step}
                      </span>
                      <p className="text-sm" style={{ color: item.done ? '#22c55e' : '#777777' }}>{item.text}</p>
                    </div>
                  ))}
                </div>

                {!booked ? (
                  <div data-submit-cal className="rounded-2xl overflow-hidden border border-white/10 bg-black" style={{ height: 500 }}>
                    <Cal
                      namespace="start-form-review"
                      calLink="fnawtf/start-form-review"
                      style={{ width: '100%', height: '100%', overflow: 'scroll' }}
                      config={{
                        layout: 'month_view',
                        useSlotsViewOnSmallScreen: 'true',
                        name: name.trim(),
                        email: email.trim(),
                        notes: `Company: ${companyName.trim()}\nProject: ${projectName.trim()}\nPitch: ${pitch.trim()}`,
                      }}
                    />
                  </div>
                ) : (
                  <div data-submit-cal className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ backgroundColor: '#22c55e20' }}>
                      <Check className="w-8 h-8" style={{ color: '#22c55e' }} />
                    </div>
                    <p className="text-xl font-medium text-white mb-2">You&apos;re all set!</p>
                    <p className="text-base max-w-md mx-auto" style={{ color: '#888888' }}>
                      Excited to chat with you about your project. Hit submit below and we&apos;ll be ready for our call.
                    </p>
                  </div>
                )}

                <div data-submit-btn className="text-center mt-8">
                  {errors._form && <p className="text-sm text-red-400 mb-4">{errors._form}</p>}
                  <motion.button ref={submitButtonRef} onClick={handleSubmit} disabled={!booked || submitting || uploading}
                    whileHover={booked ? { scale: 1.02 } : {}} transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`relative px-12 py-3 font-medium rounded-lg overflow-hidden border transition-all ${
                      !booked || submitting || uploading
                        ? 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed'
                        : 'bg-white border-white text-black cursor-pointer'}`}
                  >
                    <div ref={submitFillRef} className="absolute inset-0 bg-black pointer-events-none"
                      style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }} />
                    <span className="relative flex items-center justify-center gap-2" style={{ zIndex: 10 }}>
                      {submitting
                        ? (<><span className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />Submitting...</>)
                        : !booked
                          ? (<>Book a call to submit</>)
                          : (<>Submit<motion.span variants={iconVariants} initial="hidden" animate={submitHovered ? 'visible' : 'hidden'} className="flex items-center"><ArrowRight className="w-5 h-5" /></motion.span></>)}
                    </span>
                  </motion.button>
                  <p data-submit-disclaimer className="text-xs mt-4 mx-auto" style={{ color: '#777777' }}>
                    By submitting, you agree to be contacted by Friends &apos;n Allies regarding this project.
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Progress dots + exit */}
      <IntakeProgressDots count={TOTAL_SLIDES} activeIndex={currentSlide} onNavigate={navigateTo} onHome={handleGoHome} onExit={handleExit} skipReveal={dotsRevealed.current} hiddenIndices={dotHiddenIndices} />

      {/* Nav arrows — matching ProposalNavArrows */}
      <IntakeNavArrows
        onPrev={() => navigateTo(currentSlide - 1)}
        onNext={() => navigateTo(currentSlide + 1)}
        isFirst={false}
        isLast={currentSlide === TOTAL_SLIDES - 1}
        onExit={handleExit}
      />
    </div>
  );
}
