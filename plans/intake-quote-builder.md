# Intake Form — Quote Builder Integration

## Context
The intake form collects project details but has no way for prospects to express pricing expectations. The proposal system already has a polished calculator (`ProposalCalculatorEmbed`) with add-on sections, sliders, tier toggles, crowdfunding, and a summary — all styled in the cyan "client quote" aesthetic. We want to reuse that calculator in the intake form so prospects can build a single custom quote that saves locally (like all other intake fields) and submits with their intake data.

## High-Level Approach
1. Add a new **"Investment" slide** (index 11) to the intake form, pushing Extras → 12, Submit → 13
2. Reuse `ProposalCalculatorEmbed` in a **standalone/local mode** — no `proposalId`, no server saves, just local state
3. The quote type auto-sets based on the user's phase selection (build → 'build', build+launch → 'build-launch', scale → 'scale', fundraising → 'fundraising', crowdfunding → 'build' with crowdfunding enabled)
4. Quote state saves to sessionStorage alongside all other intake fields
5. On submit, quote data is stored as a JSONB column on `intake_submissions`
6. **No compare logic** — single quote, no tabs, no recommended vs. client distinction
7. **Optional** — users can skip it entirely and still submit

## Files to Modify

### 1. `src/components/proposal/ProposalCalculatorEmbed.tsx`
Add a **standalone mode** prop so the calculator can work without a proposalId or server actions:

- Add `standalone?: boolean` prop
- When `standalone === true`:
  - Skip all `saveClientQuote` / `updateClientQuote` server calls
  - Instead, call a new `onStateChange?: (state: CalculatorStateSnapshot) => void` callback on every change (debounced)
  - Hide the "Saved" indicator (no server persistence)
  - Skip `allQuotes` / compare features
  - The type bar still works (user picks build/launch/etc.)

### 2. `src/app/start/_components/IntakeFormClient.tsx`
Major changes:

**a) Update slide structure:**
- Add `'Investment'` to `SLIDE_NAMES` at index 11 → `['People', 'Project', 'Vision', 'Challenges', 'References', 'Deliverables', 'Timeline', 'Priorities', 'Experience', 'Partners', 'Goals', 'Investment', 'Extras', 'Submit']`
- `TOTAL_SLIDES` becomes 14
- `GOALS_SLIDE_INDEX` stays 10
- Add `INVESTMENT_SLIDE_INDEX = 11`
- Update all hardcoded slide indices for Extras (now 12) and Submit (now 13)
- Update `slideRefsArr` to have 14 refs
- The Investment slide should be **conditionally visible** — only show when phases include build, launch, scale, or fundraising (always, basically — but hide if no phases selected yet so the form doesn't show an empty calculator)

**b) Add quote state:**
```ts
const [quoteState, setQuoteState] = useState<CalculatorStateSnapshot | null>(null);
```

**c) Map phases → quote type:**
```ts
function phasesToQuoteType(phases: string[]): PricingType {
  if (phases.includes('fundraising')) return 'fundraising';
  if (phases.includes('build') && phases.includes('launch')) return 'build-launch';
  if (phases.includes('launch')) return 'launch';
  if (phases.includes('scale')) return 'scale';
  return 'build';
}
```

**d) Investment slide JSX (index 11):**
```tsx
<section ref={slideRefsArr.current[11]} className={slideClass}>
  <div className="max-w-4xl mx-auto">
    <SlideHeader eyebrow="12" title="Investment" subtitle="Build your ideal quote — adjust add-ons and options to match your budget." />
    <ProposalCalculatorEmbed
      proposalId=""
      proposalType={phasesToQuoteType(phases) as ProposalType}
      standalone
      typeOverride={phasesToQuoteType(phases)}
      crowdfundingOverride={phases.includes('crowdfunding')}
      onStateChange={(state) => setQuoteState(state)}
      initialQuote={quoteState ? quoteStateToRow(quoteState) : undefined}
    />
  </div>
</section>
```

**e) Save/restore:**
- Add `quoteState` to the sessionStorage save object
- Restore `quoteState` from sessionStorage on load
- Include `quoteState` in the submit payload

**f) Validation:**
- Investment is **NOT required** (optional — they're building a rough estimate)
- No validation entry needed in `FIELD_META`
- Update `errorSlideMap` indices if any slide indices shifted

**g) Update `hiddenIndices`:**
- Goals (10) already hidden when no crowdfunding
- Investment (11) hidden when `phases.length === 0` (no services selected yet)

### 3. Database: New migration
`supabase/migrations/20260228700000_add_quote_to_intake.sql`:
```sql
ALTER TABLE public.intake_submissions ADD COLUMN quote_data jsonb;
```

### 4. `src/lib/intake/actions.ts`
- Add `quote_data?: Record<string, unknown>` to `IntakeFormData`
- Add `quote_data: data.quote_data || null` to the insert

### 5. `src/app/admin/actions.ts`
- Add `quote_data: Record<string, unknown> | null` to `IntakeSubmission` interface

### 6. `src/app/admin/intake/_components/IntakePageClient.tsx`
- Show quote summary in the intake detail drawer (future — can be a simple display for now, or skip entirely and add later)

## What We're NOT Doing
- No compare logic (no recommended vs. client)
- No server-side quote persistence (sessionStorage only until submit)
- No separate `proposal_quotes` rows for intake — the quote is embedded as JSONB
- No admin quote editing for intake submissions (yet)
- No `CalculatorSummary` comparison dropdown

## Key Helper: `quoteStateToRow`
Since `ProposalCalculatorEmbed` accepts `initialQuote` as a `ProposalQuoteRow`, we need a small converter:
```ts
function quoteStateToRow(state: CalculatorStateSnapshot): Partial<ProposalQuoteRow> {
  return {
    quote_type: state.quote_type,
    selected_addons: state.selected_addons,
    slider_values: state.slider_values,
    tier_selections: state.tier_selections,
    location_days: state.location_days,
    photo_count: state.photo_count,
    crowdfunding_enabled: state.crowdfunding_enabled,
    crowdfunding_tier: state.crowdfunding_tier,
    fundraising_enabled: state.fundraising_enabled,
    friendly_discount_pct: state.friendly_discount_pct,
  };
}
```

## Implementation Order
1. Add `standalone` mode to `ProposalCalculatorEmbed`
2. Add migration for `quote_data` column
3. Update `IntakeFormData` + submit action + admin type
4. Add Investment slide to `IntakeFormClient.tsx` (slide structure, state, JSX, save/restore)
5. Test end-to-end

## Verification
- Go to `/start` → select "Build + Launch" on Project slide
- Navigate to Investment slide (11) → see calculator with build + launch sections
- Toggle add-ons, adjust sliders → quote state saves locally
- Navigate away and back → state persists
- Change phases to "Fundraising" on Project slide → calculator switches to fundraising mode
- Complete form and submit → `quote_data` saved to DB as JSONB
- Check admin intake detail → quote data present on the submission
