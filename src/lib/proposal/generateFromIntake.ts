/**
 * Shared helpers and core logic for generating a proposal from an intake submission.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase/service';
import { addBusinessDays, nextTuesday, ymd } from '@/lib/proposal/milestoneColors';

const MODEL = 'claude-sonnet-4-20250514';

// ── Small helpers ────────────────────────────────────────────────────────

export function deriveProposalType(phases: string[]): string {
  if (phases.includes('build') && phases.includes('launch')) return 'build-launch';
  if (phases.includes('fundraising')) return 'fundraising';
  if (phases.includes('launch')) return 'launch';
  if (phases.includes('scale')) return 'scale';
  return 'build';
}

export function deriveStartDate(timeline: string, timelineDate: string | null): Date {
  if (timeline === 'specific' && timelineDate) return new Date(timelineDate);
  const now = new Date();
  now.setDate(now.getDate() + (timeline === 'asap' ? 7 : 14));
  return now;
}

export function getGapMultiplier(timeline: string): number {
  switch (timeline) {
    case 'asap': return 0.6;
    case 'later':
    case 'specific': return 1.3;
    default: return 1.0;
  }
}

export function getExtraBuffer(timeline: string): number {
  return timeline === 'unsure' ? 2 : 0;
}

// ── Milestone template ───────────────────────────────────────────────────

const MILESTONE_TEMPLATE = [
  { label: 'Kickoff', gap: 0, phase: 'pre-production', desc: 'Project kickoff meeting to align on creative direction.' },
  { label: 'Script Rev 1', gap: 5, phase: 'pre-production', desc: 'First draft script delivered for client review and feedback.' },
  { label: 'Script Rev 2', gap: 3, phase: 'pre-production', desc: 'Revised script incorporating client notes from the first round.' },
  { label: 'Final Script', gap: 3, phase: 'pre-production', desc: 'Approved final script locked for production.' },
  { label: 'Location Scout', gap: 3, phase: 'pre-production', desc: 'Scouting and securing locations for production.' },
  { label: 'Production', gap: 5, phase: 'production', desc: 'On-set filming of all planned scenes and coverage.' },
  { label: 'Edit Rev 1', gap: 4, phase: 'post-production', desc: 'First rough cut delivered for client review.' },
  { label: 'Edit Rev 2', gap: 3, phase: 'post-production', desc: 'Revised edit incorporating client feedback.' },
  { label: 'Final Delivery', gap: 3, phase: 'post-production', desc: 'Final deliverables rendered and delivered.' },
  { label: 'Launch Support', gap: 5, phase: 'post-production', desc: 'Post-delivery support for launch and distribution.' },
];

// ── Claude helpers ───────────────────────────────────────────────────────

function buildIntakeContext(intake: Record<string, unknown>): string {
  const lines: string[] = [];
  const add = (label: string, val: unknown) => {
    if (val !== null && val !== undefined && val !== '') {
      lines.push(`**${label}:** ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`);
    }
  };
  add('Contact', `${intake.first_name} ${intake.last_name}`);
  add('Company', intake.company_name);
  add('Project', intake.project_name);
  add('Phases', (intake.phases as string[])?.join(', '));
  add('Pitch', intake.pitch);
  add('Excitement', intake.excitement);
  add('Key Feature', intake.key_feature);
  add('Vision', intake.vision);
  add('What to Avoid', intake.avoid);
  add('Audience', intake.audience);
  add('Challenge', intake.challenge);
  add('Competitors', intake.competitors);
  add('Deliverables', (intake.deliverables as string[])?.join(', '));
  add('Deliverable Notes', intake.deliverable_notes);
  add('Timeline', intake.timeline);
  add('Timeline Date', intake.timeline_date);
  add('Timeline Notes', intake.timeline_notes);
  add('Priorities', (intake.priority_order as string[])?.join(', '));
  add('Experience Level', intake.experience);
  add('Experience Notes', intake.experience_notes);
  add('Partners', (intake.partners as string[])?.join(', '));
  add('Partner Details', intake.partner_details);
  add('Video Links', intake.video_links);
  return lines.join('\n');
}

async function generateSection(
  anthropic: InstanceType<typeof Anthropic>,
  systemPrompt: string,
  opts: { role: 'welcome' | 'approach'; intakeContext: string; styleRef: string },
): Promise<{ title: string; content: string } | null> {
  const roleInstructions = opts.role === 'welcome'
    ? 'Write a Welcome section for the proposal. This is the first thing the client sees. Make it personal, reference their specific project, and convey genuine excitement about the collaboration.'
    : 'Write an Approach section for the proposal. Explain how Friends & Allies will tackle this project — the creative strategy, production methodology, and what makes this approach right for their goals.';

  const styleRefBlock = opts.styleRef
    ? `\n\nHere is a style reference from a recent proposal for tone and length guidance:\n---\n${opts.styleRef}\n---`
    : '';

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `${roleInstructions}${styleRefBlock}\n\nClient intake information:\n${opts.intakeContext}\n\nReturn JSON: { "title": "...", "content": "..." } where content is markdown. Keep the title short (2-5 words). Content should be 2-4 paragraphs.`,
      }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text) as { title: string; content: string };
  } catch (err) {
    console.error(`[generate-proposal] Failed to generate ${opts.role} section:`, err);
    return null;
  }
}

async function selectSamples(
  anthropic: InstanceType<typeof Anthropic>,
  systemPrompt: string,
  intakeContext: string,
  projects: { id: string; title: string; description: string; category: string | null }[],
): Promise<{ project_id: string; blurb: string }[] | null> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Select up to 5 portfolio projects most relevant to this client's needs. For each, write a 1-2 sentence blurb explaining why it's relevant to their project.

Client intake:
${intakeContext}

Available projects (JSON array):
${JSON.stringify(projects)}

Return JSON array: [{ "project_id": "...", "blurb": "..." }]
Only include projects whose IDs exist in the list above. Return valid JSON only.`,
      }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text) as { project_id: string; blurb: string }[];
    const validIds = new Set(projects.map(p => p.id));
    return parsed.filter(s => validIds.has(s.project_id));
  } catch (err) {
    console.error('[generate-proposal] Failed to select samples:', err);
    return null;
  }
}

// ── Main generation function ─────────────────────────────────────────────

/**
 * Generate a full proposal from an intake submission.
 * Can be called from API routes (with userId) or server-side (without).
 */
export async function generateProposalFromIntake(
  intakeId: string,
  userId?: string,
): Promise<string> {
  const supabase = createServiceClient();

  // 1. Fetch intake
  const { data: intake, error: intakeErr } = await supabase
    .from('intake_submissions')
    .select('*')
    .eq('id', intakeId)
    .single();
  if (intakeErr || !intake) throw new Error('Intake submission not found');

  // 2. Fetch pipeline settings
  const { data: settingsRows } = await (supabase.from as Function)('pipeline_settings').select('key, value');
  const settings: Record<string, string> = {};
  for (const r of (settingsRows ?? []) as { key: string; value: string }[]) {
    settings[r.key] = r.value;
  }

  // 3. Fetch style reference from most recent sent proposal
  let styleRefWelcome = '';
  let styleRefApproach = '';
  const { data: recentProposal } = await supabase
    .from('proposals')
    .select('id')
    .eq('status', 'sent')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recentProposal) {
    const { data: refSections } = await supabase
      .from('proposal_sections')
      .select('sort_order, custom_title, custom_content')
      .eq('proposal_id', recentProposal.id)
      .in('sort_order', [0, 1])
      .order('sort_order');
    for (const sec of refSections ?? []) {
      if (sec.sort_order === 0) styleRefWelcome = `Title: ${sec.custom_title}\n\n${sec.custom_content}`;
      if (sec.sort_order === 1) styleRefApproach = `Title: ${sec.custom_title}\n\n${sec.custom_content}`;
    }
  }

  // 4. Create proposal shell
  const proposalType = deriveProposalType(intake.phases as string[]);
  const slug = `proposal-${Date.now()}`;
  const contactName = `${intake.first_name} ${intake.last_name}`.trim();

  const { data: proposalRow, error: proposalErr } = await supabase
    .from('proposals')
    .insert({
      title: intake.project_name || 'Untitled Proposal',
      slug,
      contact_name: contactName,
      contact_email: intake.email,
      contact_company: intake.company_name ?? '',
      proposal_password: 'welcome',
      proposal_type: proposalType,
      subtitle: intake.pitch ?? '',
      status: 'generated',
      created_by: userId ?? null,
      intake_id: intakeId,
      generated_by: 'friendly-bot',
    } as never)
    .select('id')
    .single();
  if (proposalErr || !proposalRow) throw new Error(proposalErr?.message ?? 'Failed to create proposal');
  const proposalId = (proposalRow as { id: string }).id;

  // Build shared context
  const intakeContext = buildIntakeContext(intake as unknown as Record<string, unknown>);
  const generalPrompt = settings['general_prompt'] ?? '';
  const baseSystem = [generalPrompt, 'Return valid JSON only — no markdown fences, no explanation outside the JSON.'].filter(Boolean).join('\n\n');
  const anthropic = new Anthropic();

  // 5. Generate welcome section
  const welcomeSystem = [settings['welcome_prompt'], baseSystem].filter(Boolean).join('\n\n');
  const welcomeJson = await generateSection(anthropic, welcomeSystem, { role: 'welcome', intakeContext, styleRef: styleRefWelcome });
  if (welcomeJson) {
    await supabase.from('proposal_sections').insert({
      proposal_id: proposalId, section_type: 'text', snippet_id: null,
      custom_title: welcomeJson.title, custom_content: welcomeJson.content, sort_order: 0,
    } as never);
  }

  // 6. Generate approach section
  const approachSystem = [settings['approach_prompt'], baseSystem].filter(Boolean).join('\n\n');
  const approachJson = await generateSection(anthropic, approachSystem, { role: 'approach', intakeContext, styleRef: styleRefApproach });
  if (approachJson) {
    await supabase.from('proposal_sections').insert({
      proposal_id: proposalId, section_type: 'text', snippet_id: null,
      custom_title: approachJson.title, custom_content: approachJson.content, sort_order: 1,
    } as never);
  }

  // 7. Generate timeline milestones
  const timeline = (intake.timeline as string) ?? 'soon';
  const multiplier = getGapMultiplier(timeline);
  const buffer = getExtraBuffer(timeline);
  let cursor = nextTuesday(deriveStartDate(timeline, intake.timeline_date as string | null));

  const milestoneRows = MILESTONE_TEMPLATE.map((m, i) => {
    const scaledGap = Math.round(m.gap * multiplier) + buffer;
    if (i > 0) cursor = addBusinessDays(cursor, scaledGap);
    const startDate = new Date(cursor);
    const endDate = m.label === 'Production' ? addBusinessDays(startDate, 1) : new Date(startDate);
    return {
      proposal_id: proposalId, label: m.label, description: m.desc,
      start_date: ymd(startDate), end_date: ymd(endDate), sort_order: i, phase: m.phase,
    };
  });
  await supabase.from('proposal_milestones').insert(milestoneRows as never);

  // 8. Select sample projects via Claude
  const { data: allProjects } = await supabase
    .from('projects')
    .select('id, title, ai_description, category')
    .not('ai_description', 'is', null);

  if (allProjects && allProjects.length > 0) {
    const projectList = (allProjects as unknown as { id: string; title: string; ai_description: string; category: string | null }[])
      .map(p => ({ id: p.id, title: p.title, description: p.ai_description, category: p.category }));
    const samplesSystem = [settings['samples_prompt'], baseSystem].filter(Boolean).join('\n\n');
    const samplesJson = await selectSamples(anthropic, samplesSystem, intakeContext, projectList);
    if (samplesJson && samplesJson.length > 0) {
      const projectRows = samplesJson.slice(0, 5).map((s, i) => ({
        proposal_id: proposalId, project_id: s.project_id, sort_order: i, blurb: s.blurb,
      }));
      await supabase.from('proposal_projects').insert(projectRows as never);
    }
  }

  // 9. Copy quote data if present
  if (intake.quote_data) {
    const qd = intake.quote_data as Record<string, unknown>;
    await supabase.from('proposal_quotes').insert({
      proposal_id: proposalId,
      label: (qd.label as string) ?? 'Client Quote',
      is_locked: false, is_fna_quote: false,
      quote_type: (qd.quote_type as string) ?? proposalType,
      selected_addons: qd.selected_addons ?? {},
      slider_values: qd.slider_values ?? {},
      tier_selections: qd.tier_selections ?? {},
      location_days: qd.location_days ?? {},
      photo_count: (qd.photo_count as number) ?? 0,
      crowdfunding_enabled: (qd.crowdfunding_enabled as boolean) ?? false,
      crowdfunding_tier: (qd.crowdfunding_tier as number) ?? 0,
      fundraising_enabled: (qd.fundraising_enabled as boolean) ?? false,
      fundraising_tier: (qd.fundraising_tier as number) ?? 0,
      defer_payment: (qd.defer_payment as boolean) ?? false,
      friendly_discount_pct: (qd.friendly_discount_pct as number) ?? 0,
      additional_discount: (qd.additional_discount as number) ?? 0,
      total_amount: (qd.total_amount as number) ?? null,
      down_amount: (qd.down_amount as number) ?? null,
      sort_order: 0, visible: true,
    } as never);
  }

  return proposalId;
}
