// Slack notification utility — per-client channels via Bot API + webhook fallback
// Creates dedicated channels for each client, posts rich Block Kit messages, pins intakes

import { WebClient } from '@slack/web-api';
import { calcTotalFromQuote } from '@/lib/pricing/calc';
import type { ProposalQuoteRow } from '@/types/proposal';
import { buildAddOns, launchAddOns, fundraisingIncluded, fundraisingAddOns } from '@/app/pricing/pricing-data';

// ── Event Types ─────────────────────────────────────────────────────────────

export type SlackEvent =
  | {
      type: 'intake_submitted';
      data: {
        name: string;
        email: string;
        title?: string | null;
        company?: string | null;
        companyUrl?: string | null;
        project: string;
        deliverables: string[];
        budget?: string | null;
        timeline?: string | null;
        timelineDate?: string | null;
        timelineNotes?: string | null;
        pitch?: string | null;
        phases?: string[] | null;
        experience?: string | null;
        experienceNotes?: string | null;
        referral?: string | null;
        excitement?: string | null;
        keyFeature?: string | null;
        vision?: string | null;
        avoid?: string | null;
        audience?: string | null;
        challenge?: string | null;
        priorityOrder?: string[] | null;
        partners?: string[] | null;
        partnerDetails?: string | null;
        publicGoal?: string | null;
        internalGoal?: string | null;
        emailListSize?: string | null;
        anythingElse?: string | null;
        quoteData?: Record<string, unknown> | null;
        budgetInteracted?: boolean;
      };
    }
  | {
      type: 'contract_viewed';
      data: {
        contractId: string;
        title: string;
        signerEmail: string;
        companyName?: string | null;
        slackChannelId?: string | null;
      };
    }
  | {
      type: 'contract_signed';
      data: {
        contractId: string;
        title: string;
        signerEmail: string;
        allSigned: boolean;
        companyName?: string | null;
        slackChannelId?: string | null;
      };
    }
  | {
      type: 'contract_declined';
      data: {
        contractId: string;
        title: string;
        signerEmail: string;
        companyName?: string | null;
        slackChannelId?: string | null;
      };
    }
  | {
      type: 'contract_sent';
      data: {
        contractId: string;
        title: string;
        contractType: string;
        signers: { name: string; email: string; role: string }[];
        companyName?: string | null;
        slackChannelId?: string | null;
      };
    }
  | {
      type: 'contract_voided';
      data: {
        contractId: string;
        title: string;
        reason?: string | null;
        companyName?: string | null;
        slackChannelId?: string | null;
      };
    }
  | {
      type: 'transcript_ready';
      data: { meetingTitle: string };
    }
  | {
      type: 'proposal_created';
      data: { id: string; title: string; company: string; slug: string };
    }
  | {
      type: 'proposal_viewed';
      data: {
        proposalId: string;
        title: string;
        slug: string;
        viewerEmail: string;
        viewerName?: string | null;
        companyName?: string | null;
        slackChannelId?: string | null;
      };
    }
  | {
      type: 'project_published';
      data: { id: string; title: string; clientName: string };
    }
  | {
      type: 'pricing_lead';
      data: {
        name: string;
        email: string;
        company?: string | null;
        timeline: string;
        source: string;
      };
    }
  | {
      type: 'portal_login';
      data: {
        proposalId: string;
        slug: string;
        proposalTitle: string;
        viewerEmail: string;
        viewerName?: string | null;
        companyName?: string | null;
        slackChannelId?: string | null;
      };
    };

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fire-and-forget Slack notification. Never blocks, never throws.
 * For intake_submitted, returns the created/found channel ID (or null).
 */
export function notifySlack(event: SlackEvent): Promise<string | null> {
  return _send(event).catch((err) => {
    console.error('[Slack] notification failed:', event.type, err);
    return null;
  });
}

// ── Slack Bot Client ────────────────────────────────────────────────────────

let _client: WebClient | null = null;

function getSlackClient(): WebClient | null {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;
  if (!_client) _client = new WebClient(token);
  return _client;
}

// ── Channel Name Generation ─────────────────────────────────────────────────

/**
 * Generate a Slack channel name from a company/person name.
 * Format: {3-letter-code}-{name_slugged}
 *
 * Always exactly 3 letters:
 * - 3+ words: first letter of each (first 3). "Acme Productions Inc" → api
 * - 2 words: first letter of word1 + first letter of word2 + second letter of word2. "Blue Sky" → bsk
 * - 1 word: first 3 letters. "Netflix" → net
 * - Pad with 'x' if less than 3 chars. "AI" → aix
 */
export function generateChannelName(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (!words.length) return 'xxx-unknown';

  let code: string;
  if (words.length >= 3) {
    code = words.slice(0, 3).map((w) => w[0]).join('');
  } else if (words.length === 2) {
    code = words[0][0] + words[1][0] + (words[1][1] || 'x');
  } else {
    code = words[0].slice(0, 3);
  }
  code = code.padEnd(3, 'x');

  const slug = clean.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return `${code}-${slug}`.slice(0, 80);
}

// ── Channel Operations ──────────────────────────────────────────────────────

async function findChannelByName(name: string): Promise<string | null> {
  const client = getSlackClient();
  if (!client) return null;

  let cursor: string | undefined;
  do {
    const result = await client.conversations.list({
      types: 'public_channel',
      limit: 200,
      cursor,
    });
    const match = result.channels?.find((ch) => ch.name === name);
    if (match?.id) return match.id;
    cursor = result.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return null;
}

async function getOrCreateClientChannel(companyOrName: string): Promise<string | null> {
  const client = getSlackClient();
  if (!client) return null;

  const channelName = generateChannelName(companyOrName);
  const existing = await findChannelByName(channelName);
  if (existing) return existing;

  try {
    const result = await client.conversations.create({
      name: channelName,
      is_private: false,
    });
    return result.channel?.id ?? null;
  } catch (err: unknown) {
    const slackErr = err as { data?: { error?: string } };
    if (slackErr?.data?.error === 'name_taken') {
      return findChannelByName(channelName);
    }
    console.error('[Slack] Failed to create channel:', err);
    return null;
  }
}

async function inviteUsersToChannel(channelId: string): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  const ids = process.env.SLACK_INVITE_USER_IDS;
  if (!ids) return;

  const userIds = ids.split(',').map((id) => id.trim()).filter(Boolean);
  for (const userId of userIds) {
    try {
      await client.conversations.invite({ channel: channelId, users: userId });
    } catch {
      // already_in_channel, cant_invite_self, etc. — non-critical
    }
  }
}

async function postToChannel(channelId: string, blocks: Block[], text: string): Promise<string | null> {
  const client = getSlackClient();
  if (!client) return null;

  try {
    await client.conversations.join({ channel: channelId });
  } catch {
    // Already in channel or can't join — try posting anyway
  }

  const result = await client.chat.postMessage({
    channel: channelId,
    blocks: blocks as never[],
    text,
    unfurl_links: false,
  });
  return result.ts ?? null;
}

async function pinMessage(channelId: string, messageTs: string): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  try {
    await client.pins.add({ channel: channelId, timestamp: messageTs });
  } catch {
    // already_pinned or other non-critical error
  }
}

// ── Post to named channels ──────────────────────────────────────────────────

async function postToNamedChannel(channelName: string, blocks: Block[], text = 'FNA Dashboard notification'): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  const channelId = await findChannelByName(channelName);
  if (!channelId) {
    console.warn(`[Slack] #${channelName} channel not found`);
    return;
  }

  await postToChannel(channelId, blocks, text);
}

async function sendToAlerts(blocks: Block[]): Promise<void> {
  await postToNamedChannel('fna-alerts', blocks);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

type Block = Record<string, unknown>;

function adminUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://fna.wtf';
  return `${base}${path}`;
}

function fieldPair(
  left: [string, string | null | undefined],
  right?: [string, string | null | undefined],
): Block | null {
  const fields: { type: 'mrkdwn'; text: string }[] = [];
  if (left[1] != null && left[1] !== '') {
    fields.push({ type: 'mrkdwn', text: `*${left[0]}:*\n${left[1]}` });
  }
  if (right && right[1] != null && right[1] !== '') {
    fields.push({ type: 'mrkdwn', text: `*${right[0]}:*\n${right[1]}` });
  }
  return fields.length ? { type: 'section', fields } : null;
}

function footerBlock(): Block {
  const now = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return {
    type: 'context',
    elements: [{ type: 'mrkdwn', text: `FNA Dashboard  \u00b7  ${now}` }],
  };
}

function linkBlock(url: string, label = 'View in Dashboard'): Block {
  return {
    type: 'context',
    elements: [{ type: 'mrkdwn', text: `:link: <${url}|${label}>` }],
  };
}

function pushIf(blocks: Block[], block: Block | null): void {
  if (block) blocks.push(block);
}

// ── Message Formatting ──────────────────────────────────────────────────────

function formatMessage(event: SlackEvent): Block[] {
  switch (event.type) {
    case 'intake_submitted': {
      const d = event.data;
      const titleCase = (s: string) =>
        s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const blocks: Block[] = [
        {
          type: 'header',
          text: { type: 'plain_text', text: ':inbox_tray:  New Intake Submission', emoji: true },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${d.name}*${d.title ? `, ${d.title}` : ''}${d.company ? `  \u2022  ${d.company}` : ''}`,
          },
        },
      ];

      // Contact + Project
      pushIf(blocks, fieldPair(
        [':email:  Email', d.email],
        [':film_projector:  Project', d.project],
      ));

      // Budget + Timeline
      const timelineParts = [
        d.timeline ? titleCase(d.timeline) : null,
        d.timelineDate,
        d.timelineNotes,
      ].filter(Boolean);
      const timelineDisplay = timelineParts.join(' \u2014 ') || null;
      pushIf(blocks, fieldPair(
        [':moneybag:  Budget', d.budget ? titleCase(d.budget) : null],
        [':calendar:  Timeline', timelineDisplay],
      ));

      // Phases + Experience
      pushIf(blocks, fieldPair(
        [':dart:  Phases', d.phases?.map(titleCase).join(', ')],
        [':bar_chart:  Experience', d.experience ? titleCase(d.experience) : null],
      ));
      if (d.experienceNotes) {
        blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: d.experienceNotes }] });
      }

      // Deliverables
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:package:  *Deliverables:*\n${d.deliverables.map((v) => `  \u2022  ${titleCase(v)}`).join('\n')}`,
        },
      });

      // Priority order
      if (d.priorityOrder?.length) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:trophy:  *Priorities:*\n${d.priorityOrder.map((v, i) => `  ${i + 1}.  ${titleCase(v)}`).join('\n')}`,
          },
        });
      }

      // Partners
      if (d.partners?.length) {
        pushIf(blocks, fieldPair(
          [':handshake:  Partners', d.partners.map(titleCase).join(', ')],
          d.partnerDetails ? [':memo:  Details', d.partnerDetails] : undefined,
        ));
      }

      // Crowdfunding goals
      if (d.publicGoal || d.internalGoal) {
        pushIf(blocks, fieldPair(
          [':loudspeaker:  Public Goal', d.publicGoal],
          [':lock:  Internal Goal', d.internalGoal],
        ));
      }

      // Email list + company URL
      if (d.emailListSize || d.companyUrl) {
        pushIf(blocks, fieldPair(
          [':incoming_envelope:  Email List', d.emailListSize],
          [':globe_with_meridians:  Website', d.companyUrl],
        ));
      }

      blocks.push({ type: 'divider' });

      // Pitch
      if (d.pitch) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `:speech_balloon:  *Pitch:*\n${d.pitch}` },
        });
      }

      // Excitement / Key Feature / Vision / Avoid
      if (d.excitement) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `:fire:  *What Excites You Most?*\n${d.excitement}` },
        });
      }
      if (d.keyFeature) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `:key:  *Key Feature:*\n${d.keyFeature}` },
        });
      }
      if (d.vision) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `:crystal_ball:  *Vision:*\n${d.vision}` },
        });
      }
      if (d.avoid) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `:no_entry:  *Want to Avoid:*\n${d.avoid}` },
        });
      }
      if (d.audience) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `:busts_in_silhouette:  *Audience:*\n${d.audience}` },
        });
      }
      if (d.challenge) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `:warning:  *Biggest Challenge:*\n${d.challenge}` },
        });
      }

      // Anything else + Referral
      if (d.anythingElse) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `:thought_balloon:  *Anything Else:*\n${d.anythingElse}` },
        });
      }
      if (d.referral) {
        pushIf(blocks, fieldPair([':wave:  Referral', d.referral]));
      }

      // Quote / Calculator data — compute real totals via pricing engine
      if (d.quoteData && Object.keys(d.quoteData).length > 0) {
        blocks.push({ type: 'divider' });
        try {
          const q = d.quoteData;
          const stub: ProposalQuoteRow = {
            id: '', proposal_id: '', label: 'Intake Quote',
            is_locked: false, is_fna_quote: false,
            quote_type: (q.quote_type as string) || 'build',
            selected_addons: (q.selected_addons as Record<string, number>) || {},
            slider_values: (q.slider_values as Record<string, number>) || {},
            tier_selections: (q.tier_selections as Record<string, string>) || {},
            location_days: (q.location_days as Record<string, number[]>) || {},
            photo_count: (q.photo_count as number) || 0,
            crowdfunding_enabled: (q.crowdfunding_enabled as boolean) || false,
            crowdfunding_tier: (q.crowdfunding_tier as number) || 0,
            fundraising_enabled: (q.fundraising_enabled as boolean) || false,
            fundraising_tier: (q.fundraising_tier as number) || 0,
            defer_payment: false,
            friendly_discount_pct: (q.friendly_discount_pct as number) || 0,
            total_amount: null, down_amount: null, sort_order: 0,
            visible: true, description: null,
            created_at: '', updated_at: '', deleted_at: null, viewer_email: null,
          };
          const allAddOns = [...buildAddOns, ...launchAddOns, ...fundraisingIncluded, ...fundraisingAddOns];
          const c = calcTotalFromQuote(stub, allAddOns);
          const fmt = (n: number) => '$' + n.toLocaleString('en-US');
          const lines: string[] = [];
          const tierLabel = titleCase(stub.quote_type);

          // Tier breakdowns with line items
          if (c.buildActive) {
            lines.push(`${tierLabel.includes('Build') ? 'Build' : tierLabel} Base  ${fmt(c.buildBase)}`);
            for (const item of c.buildItems) lines.push(`  ${item.name}  ${fmt(item.price)}`);
          }
          if (c.launchActive) {
            lines.push(`Launch Base  ${fmt(c.launchBase)}`);
            for (const item of c.launchItems) lines.push(`  ${item.name}  ${fmt(item.price)}`);
          }
          if (c.isFundraising) {
            lines.push(`Fundraising Base  ${fmt(c.fundBase)}`);
            for (const item of c.fundItems) lines.push(`  ${item.name}  ${fmt(item.price)}`);
          }
          if (c.overhead > 0) lines.push(`Overhead (10%)  ${fmt(c.overhead)}`);
          if (c.crowdDiscount > 0) lines.push(`Crowdfunding discount  -${fmt(c.crowdDiscount)}`);
          if (c.friendlyDiscount > 0) lines.push(`Friendly discount (${c.friendlyDiscountPct}%)  -${fmt(c.friendlyDiscount)}`);
          lines.push(`*Total  ${fmt(c.total)}*`);
          lines.push(`Down payment (${Math.round(c.downPercent * 100)}%)  ${fmt(c.downAmount)}`);

          blocks.push({
            type: 'section',
            text: { type: 'mrkdwn', text: `:money_with_wings:  *Quote Builder  \u2022  ${tierLabel}:*\n${lines.join('\n')}` },
          });
        } catch {
          blocks.push({
            type: 'section',
            text: { type: 'mrkdwn', text: `:money_with_wings:  *Quote Builder:*\nUnable to compute totals` },
          });
        }
      } else if (d.budgetInteracted) {
        blocks.push({ type: 'divider' });
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `:money_with_wings:  *Quote Builder:*\nInteracted with calculator but didn't save a quote` },
        });
      }

      blocks.push(
        { type: 'divider' },
        linkBlock(adminUrl('/admin/intake')),
        footerBlock(),
      );
      return blocks;
    }

    case 'contract_viewed': {
      const { contractId, title, signerEmail } = event.data;
      const blocks: Block[] = [
        { type: 'header', text: { type: 'plain_text', text: ':eyes:  Contract Viewed', emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: `*${title}*` } },
      ];
      pushIf(blocks, fieldPair(['Viewed by', signerEmail]));
      blocks.push({ type: 'divider' }, linkBlock(adminUrl(`/admin/contracts?open=${contractId}`)), footerBlock());
      return blocks;
    }

    case 'contract_signed': {
      const { contractId, title, signerEmail, allSigned } = event.data;
      const header = allSigned ? ':black_nib:  Contract Fully Signed!' : ':black_nib:  Contract Signed';
      const blocks: Block[] = [
        { type: 'header', text: { type: 'plain_text', text: header, emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: `*${title}*` } },
      ];
      pushIf(blocks, fieldPair(
        ['Signed by', signerEmail],
        ['Status', allSigned ? 'All signers complete' : 'Awaiting other signers'],
      ));
      blocks.push({ type: 'divider' }, linkBlock(adminUrl(`/admin/contracts?open=${contractId}`)), footerBlock());
      return blocks;
    }

    case 'contract_declined': {
      const { contractId, title, signerEmail } = event.data;
      const blocks: Block[] = [
        { type: 'header', text: { type: 'plain_text', text: ':x:  Contract Declined', emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: `*${title}*` } },
      ];
      pushIf(blocks, fieldPair(['Declined by', signerEmail]));
      blocks.push({ type: 'divider' }, linkBlock(adminUrl(`/admin/contracts?open=${contractId}`)), footerBlock());
      return blocks;
    }

    case 'contract_sent': {
      const { contractId, title, contractType, signers } = event.data;
      const signerList = signers.map((s) => `${s.name} (${s.email})`).join('\n');
      const blocks: Block[] = [
        { type: 'header', text: { type: 'plain_text', text: ':outbox_tray:  Contract Sent for Signing', emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: `*${title}*` } },
      ];
      pushIf(blocks, fieldPair(['Type', contractType.toUpperCase()], ['Signers', String(signers.length)]));
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `*Sent to:*\n${signerList}` },
      });
      blocks.push({ type: 'divider' }, linkBlock(adminUrl(`/admin/contracts?open=${contractId}`)), footerBlock());
      return blocks;
    }

    case 'contract_voided': {
      const { contractId, title, reason } = event.data;
      const blocks: Block[] = [
        { type: 'header', text: { type: 'plain_text', text: ':no_entry_sign:  Contract Voided', emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: `*${title}*` } },
      ];
      if (reason) {
        blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*Reason:*\n${reason}` } });
      }
      blocks.push({ type: 'divider' }, linkBlock(adminUrl(`/admin/contracts?open=${contractId}`)), footerBlock());
      return blocks;
    }

    case 'proposal_viewed': {
      const { proposalId, title, viewerEmail, viewerName } = event.data;
      const viewer = viewerName ? `${viewerName} (${viewerEmail})` : viewerEmail;
      const blocks: Block[] = [
        { type: 'header', text: { type: 'plain_text', text: ':eyes:  Proposal Viewed', emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: `*${title}*` } },
      ];
      pushIf(blocks, fieldPair(['Viewed by', viewer]));
      blocks.push({ type: 'divider' }, linkBlock(adminUrl(`/admin/proposals?open=${proposalId}`)), footerBlock());
      return blocks;
    }

    case 'pricing_lead': {
      const { name, email, company, timeline, source } = event.data;
      const blocks: Block[] = [
        { type: 'header', text: { type: 'plain_text', text: ':bar_chart:  New Pricing Lead', emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: `*${name}*${company ? ` — ${company}` : ''}` } },
      ];
      pushIf(blocks, fieldPair(['Email', email], ['Timeline', timeline]));
      pushIf(blocks, fieldPair(['Source', source === 'gate' ? 'Calculator gate' : 'Save quote']));
      blocks.push({ type: 'divider' }, footerBlock());
      return blocks;
    }

    case 'portal_login': {
      const { slug, proposalTitle, viewerEmail, viewerName } = event.data;
      const viewer = viewerName ? `${viewerName} (${viewerEmail})` : viewerEmail;
      const blocks: Block[] = [
        { type: 'header', text: { type: 'plain_text', text: ':wave:  Client Portal Login', emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: `*${proposalTitle}*` } },
      ];
      pushIf(blocks, fieldPair(['Logged in as', viewer]));
      blocks.push({ type: 'divider' }, linkBlock(adminUrl(`/p/${slug}`), 'View Proposal'), footerBlock());
      return blocks;
    }

    case 'transcript_ready': {
      return [
        { type: 'header', text: { type: 'plain_text', text: ':page_facing_up:  Meeting Transcript Ready', emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: `*${event.data.meetingTitle}*` } },
        { type: 'divider' },
        linkBlock(adminUrl('/admin/meetings')),
        footerBlock(),
      ];
    }

    case 'proposal_created': {
      const { id, title, company, slug } = event.data;
      const publicUrl = adminUrl(`/p/${slug}`);
      const blocks: Block[] = [
        { type: 'header', text: { type: 'plain_text', text: ':memo:  New Proposal Created', emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: `*${title}*` } },
      ];
      pushIf(blocks, fieldPair(['Company', company], ['Public link', `<${publicUrl}|${slug}>`]));
      blocks.push({ type: 'divider' }, linkBlock(adminUrl(`/admin/proposals?open=${id}`)), footerBlock());
      return blocks;
    }

    case 'project_published': {
      const { id, title, clientName } = event.data;
      const blocks: Block[] = [
        { type: 'header', text: { type: 'plain_text', text: ':rocket:  Project Published', emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: `*${title}*` } },
      ];
      pushIf(blocks, fieldPair(['Client', clientName]));
      blocks.push({ type: 'divider' }, linkBlock(adminUrl(`/admin/projects?open=${id}`)), footerBlock());
      return blocks;
    }
  }
}

// ── Send Routing ────────────────────────────────────────────────────────────

async function resolveClientChannel(
  slackChannelId?: string | null,
  companyName?: string | null,
): Promise<string | null> {
  if (slackChannelId) return slackChannelId;
  if (companyName) return findChannelByName(generateChannelName(companyName));
  return null;
}

async function _send(event: SlackEvent): Promise<string | null> {
  const blocks = formatMessage(event);

  switch (event.type) {
    case 'intake_submitted': {
      const companyOrName = event.data.company || event.data.name;
      const client = getSlackClient();

      if (client) {
        const channelId = await getOrCreateClientChannel(companyOrName);
        if (channelId) {
          await inviteUsersToChannel(channelId);
          const ts = await postToChannel(channelId, blocks, `New intake from ${event.data.name}`);
          if (ts) await pinMessage(channelId, ts);

          // Cross-post to #fna-alerts
          await sendToAlerts([
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `:clipboard: *New intake from ${event.data.name}*${event.data.company ? ` (${event.data.company})` : ''}\nSee <#${channelId}> for details`,
              },
            },
            linkBlock(adminUrl('/admin/intake')),
            footerBlock(),
          ]);
          return channelId;
        }
      }
      // Fallback: no bot token or channel creation failed
      await sendToAlerts(blocks);
      return null;
    }

    case 'contract_viewed': {
      const { slackChannelId, companyName } = event.data;
      const channelId = await resolveClientChannel(slackChannelId, companyName);
      if (channelId) {
        await postToChannel(channelId, blocks, `Contract viewed`);
      } else {
        await sendToAlerts(blocks);
      }
      return null;
    }

    case 'contract_signed':
    case 'contract_declined':
    case 'contract_sent':
    case 'contract_voided': {
      const { slackChannelId, companyName } = event.data;
      const channelId = await resolveClientChannel(slackChannelId, companyName);
      if (channelId) {
        const ts = await postToChannel(channelId, blocks, `Contract event: ${event.type}`);
        if (ts) await pinMessage(channelId, ts);
      } else {
        await sendToAlerts(blocks);
      }
      return null;
    }

    case 'proposal_created': {
      const channelId = await resolveClientChannel(null, event.data.company);
      if (channelId) {
        const ts = await postToChannel(channelId, blocks, `New proposal: ${event.data.title}`);
        if (ts) await pinMessage(channelId, ts);
      } else {
        await sendToAlerts(blocks);
      }
      return null;
    }

    case 'proposal_viewed': {
      const { slackChannelId, companyName } = event.data;
      const channelId = await resolveClientChannel(slackChannelId, companyName);
      if (channelId) {
        await postToChannel(channelId, blocks, `Proposal viewed by ${event.data.viewerEmail}`);
      } else {
        await sendToAlerts(blocks);
      }
      return null;
    }

    case 'portal_login': {
      const { slackChannelId, companyName } = event.data;
      const channelId = await resolveClientChannel(slackChannelId, companyName);
      if (channelId) {
        await postToChannel(channelId, blocks, `Portal login: ${event.data.viewerEmail}`);
      } else {
        await sendToAlerts(blocks);
      }
      return null;
    }

    case 'pricing_lead': {
      await postToNamedChannel('alerts', blocks, `New pricing lead: ${event.data.name}`);
      return null;
    }

    case 'transcript_ready':
    case 'project_published': {
      await sendToAlerts(blocks);
      return null;
    }
  }
}
