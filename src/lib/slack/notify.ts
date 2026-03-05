// Slack notification utility — per-client channels via Bot API + webhook fallback
// Creates dedicated channels for each client, posts rich Block Kit messages, pins intakes

import { WebClient } from '@slack/web-api';

// ── Event Types ─────────────────────────────────────────────────────────────

export type SlackEvent =
  | {
      type: 'intake_submitted';
      data: {
        name: string;
        email: string;
        company?: string | null;
        project: string;
        deliverables: string[];
        budget?: string | null;
        timeline?: string | null;
        pitch?: string | null;
        phases?: string[] | null;
        experience?: string | null;
        referral?: string | null;
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
      type: 'transcript_ready';
      data: { meetingTitle: string };
    }
  | {
      type: 'proposal_created';
      data: { id: string; title: string; company: string; slug: string };
    }
  | {
      type: 'project_published';
      data: { id: string; title: string; clientName: string };
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

// ── Post to #fna-alerts ─────────────────────────────────────────────────────

const ALERTS_CHANNEL = 'fna-alerts';

async function sendToAlerts(blocks: Block[]): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  // Find the alerts channel by name
  const channelId = await findChannelByName(ALERTS_CHANNEL);
  if (!channelId) {
    console.warn(`[Slack] #${ALERTS_CHANNEL} channel not found`);
    return;
  }

  await postToChannel(channelId, blocks, 'FNA Dashboard notification');
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
      const { name, email, company, project, deliverables, budget, timeline, pitch, phases, experience, referral } =
        event.data;
      const blocks: Block[] = [
        {
          type: 'header',
          text: { type: 'plain_text', text: ':clipboard:  New Intake Submission', emoji: true },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*${name}*${company ? ` — ${company}` : ''}` },
        },
      ];
      pushIf(blocks, fieldPair(['Email', email], ['Project', project]));
      pushIf(blocks, fieldPair(['Budget', budget], ['Timeline', timeline]));
      pushIf(blocks, fieldPair(
        ['Phases', phases?.join(', ')],
        ['Experience', experience],
      ));
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `*Deliverables:*\n${deliverables.map((d) => `  \u2022  ${d.replace(/_/g, ' ')}`).join('\n')}` },
      });
      if (pitch) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `*Pitch:*\n${pitch}` },
        });
      }
      if (referral) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `*Referral:*\n${referral}` },
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

    case 'contract_viewed':
    case 'contract_signed':
    case 'contract_declined': {
      const { slackChannelId, companyName } = event.data;
      const channelId = await resolveClientChannel(slackChannelId, companyName);
      if (channelId) {
        await postToChannel(channelId, blocks, `Contract event: ${event.type}`);
      } else {
        await sendToAlerts(blocks);
      }
      return null;
    }

    case 'proposal_created': {
      const channelId = await resolveClientChannel(null, event.data.company);
      if (channelId) {
        await postToChannel(channelId, blocks, `New proposal: ${event.data.title}`);
      } else {
        await sendToAlerts(blocks);
      }
      return null;
    }

    case 'transcript_ready':
    case 'project_published': {
      await sendToAlerts(blocks);
      return null;
    }
  }
}
