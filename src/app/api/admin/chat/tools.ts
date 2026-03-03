import Anthropic from '@anthropic-ai/sdk';
import { SupabaseClient } from '@supabase/supabase-js';

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  // ── Projects ──────────────────────────────────────────────
  {
    name: 'query_projects',
    description:
      'Search or list projects. Can filter by published status, client, type, featured, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: {
          type: 'string',
          description: 'Text search on title, subtitle, client_name',
        },
        client_id: { type: 'string' },
        published: { type: 'boolean' },
        featured: { type: 'boolean' },
        type: { type: 'string', enum: ['video', 'design'] },
        limit: { type: 'number', description: 'Max results, default 20' },
      },
    },
  },
  {
    name: 'get_project',
    description:
      'Get a single project by ID with all related data (videos, credits, BTS images)',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },

  // ── Credits (crew/cast on projects) ───────────────────────
  {
    name: 'search_credits',
    description:
      'Search project_credits by person name or role. Use this to find which projects a person (crew, cast, talent) worked on. Returns credits enriched with project title and client_name.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Person name to search (partial match)' },
        role: { type: 'string', description: 'Role to filter by, e.g. "Director", "DP", "Editor"' },
        project_id: { type: 'string', description: 'Filter credits for a specific project' },
        limit: { type: 'number', description: 'Max results, default 50' },
      },
    },
  },

  // ── Clients ───────────────────────────────────────────────
  {
    name: 'query_clients',
    description: 'Search or list clients/companies.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Text search on name, company, email' },
        industry: { type: 'string' },
        limit: { type: 'number', description: 'Max results, default 20' },
      },
    },
  },
  {
    name: 'get_client',
    description:
      'Get a single client by ID with their projects, proposals, testimonials, and meetings.',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },

  // ── Contacts (CRM people) ─────────────────────────────────
  {
    name: 'query_contacts',
    description:
      'Search or list contacts in the CRM. NOTE: to find which projects a person worked on, use search_credits instead.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Searches first_name, last_name, email' },
        type: { type: 'string', enum: ['contact', 'crew', 'staff', 'partner', 'cast'] },
        limit: { type: 'number', description: 'Max results, default 20' },
      },
    },
  },
  {
    name: 'get_contact',
    description:
      'Get a single contact by ID with their roles, headshots, and linked project credits.',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },

  // ── Proposals ─────────────────────────────────────────────
  {
    name: 'query_proposals',
    description: 'Search or list proposals with status, contact, and financial data.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Text search on title, contact_name, contact_company' },
        status: { type: 'string' },
        limit: { type: 'number', description: 'Max results, default 20' },
      },
    },
  },
  {
    name: 'get_proposal',
    description: 'Get a single proposal by ID with sections, quotes, milestones, projects, and view count.',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },

  // ── Meetings ──────────────────────────────────────────────
  {
    name: 'query_meetings',
    description: 'Search or list meetings. Can filter by upcoming only or by attendee email.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Text search on title' },
        upcoming_only: { type: 'boolean' },
        attendee_email: { type: 'string', description: 'Find all meetings a specific person attended (by email)' },
        limit: { type: 'number', description: 'Max results, default 20' },
      },
    },
  },
  {
    name: 'get_meeting',
    description:
      'Get a single meeting by ID with attendees, transcript text, and linked client/contact relationships.',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },

  // ── Testimonials ──────────────────────────────────────────
  {
    name: 'query_testimonials',
    description: 'List testimonials, optionally filtered by client or project.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string' },
        project_id: { type: 'string' },
        limit: { type: 'number', description: 'Max results, default 20' },
      },
    },
  },

  // ── Tags & Roles ──────────────────────────────────────────
  {
    name: 'query_tags',
    description: 'List tags, optionally filtered by category.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', enum: ['style', 'technique', 'addon', 'deliverable', 'project_type'] },
      },
    },
  },
  {
    name: 'query_roles',
    description: 'List all production roles (Director, DP, Editor, etc.).',
    input_schema: { type: 'object' as const, properties: {} },
  },

  // ── Content Snippets ──────────────────────────────────────
  {
    name: 'query_content_snippets',
    description: 'Search or list content snippets used in proposals.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string' },
        category: { type: 'string' },
        snippet_type: { type: 'string' },
        limit: { type: 'number', description: 'Max results, default 20' },
      },
    },
  },

  // ── Website Placements ────────────────────────────────────
  {
    name: 'query_placements',
    description:
      'List website_project_placements — shows where projects appear on the public site (homepage, work, services pages). Returns project titles.',
    input_schema: {
      type: 'object' as const,
      properties: {
        page: { type: 'string', description: 'Filter by page slug, e.g. "homepage", "work", "services"' },
        project_id: { type: 'string' },
      },
    },
  },

  // ── SEO Settings ─────────────────────────────────────────
  {
    name: 'query_seo_settings',
    description: 'List SEO metadata (meta titles, descriptions, OG tags) for website pages.',
    input_schema: {
      type: 'object' as const,
      properties: {
        page_slug: { type: 'string', description: 'Filter by specific page slug' },
      },
    },
  },

  // ── Proposal Views (analytics) ──────────────────────────
  {
    name: 'query_proposal_views',
    description:
      'List individual proposal views/opens with timestamps and viewer info. Useful for analytics on proposal engagement.',
    input_schema: {
      type: 'object' as const,
      properties: {
        proposal_id: { type: 'string', description: 'Filter views for a specific proposal' },
        limit: { type: 'number', description: 'Max results, default 50' },
      },
    },
  },

  // ── Scripts ───────────────────────────────────────────────
  {
    name: 'query_scripts',
    description: 'Search or list scripts. Can filter by status or linked project.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Text search on title' },
        status: { type: 'string', enum: ['draft', 'review', 'locked'] },
        project_id: { type: 'string', description: 'Filter scripts linked to a specific project' },
        limit: { type: 'number', description: 'Max results, default 20' },
      },
    },
  },
  {
    name: 'get_script',
    description:
      'Get a full script by ID including scenes (with beats), characters (with cast contacts), locations, tags, and storyboard frame count.',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },

  // ── Locations ─────────────────────────────────────────────
  {
    name: 'query_locations',
    description: 'Search or list global locations. Can filter by city, state, or status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Text search on name, description, address, city' },
        city: { type: 'string' },
        state: { type: 'string' },
        status: { type: 'string', enum: ['active', 'archived'] },
        limit: { type: 'number', description: 'Max results, default 20' },
      },
    },
  },
  {
    name: 'get_location',
    description:
      'Get a single location by ID with its images, linked projects, and Peerspace summary.',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },

  // ── Contracts ─────────────────────────────────────────────
  {
    name: 'query_contract_templates',
    description: 'List active contract templates by type (SOW, MSA, NDA, etc.).',
    input_schema: {
      type: 'object' as const,
      properties: {
        contract_type: { type: 'string', description: 'e.g. "sow", "msa", "nda", "amendment", "custom"' },
      },
    },
  },
  {
    name: 'query_contracts',
    description: 'Search or list contracts with status, type, and client info.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Text search on title' },
        status: { type: 'string', description: 'e.g. "draft", "sent", "signed", "declined", "voided"' },
        contract_type: { type: 'string' },
        client_id: { type: 'string' },
        limit: { type: 'number', description: 'Max results, default 20' },
      },
    },
  },
  {
    name: 'get_contract',
    description:
      'Get a single contract by ID with signers, recent audit events, and linked proposal/quote info.',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },

  // ── Intake Submissions ────────────────────────────────────
  {
    name: 'query_intake_submissions',
    description:
      'Search or list intake form submissions (new project inquiries from the public site).',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Text search on name, email, project_name' },
        status: { type: 'string', enum: ['new', 'reviewed', 'converted', 'archived'] },
        limit: { type: 'number', description: 'Max results, default 20' },
      },
    },
  },

  // ── Pricing Leads ─────────────────────────────────────────
  {
    name: 'query_pricing_leads',
    description: 'List leads captured from the pricing calculator.',
    input_schema: {
      type: 'object' as const,
      properties: {
        timeline: { type: 'string', enum: ['asap', 'soon', 'later', 'specific', 'unsure'] },
        source: { type: 'string', enum: ['gate', 'save_quote'] },
        limit: { type: 'number', description: 'Max results, default 50' },
      },
    },
  },

  // ── AI Prompt Log ─────────────────────────────────────────
  {
    name: 'query_ai_prompt_log',
    description:
      'Query the AI API call log for storyboard generation — cost estimates, token usage, success/failure rates.',
    input_schema: {
      type: 'object' as const,
      properties: {
        script_id: { type: 'string', description: 'Filter log entries for a specific script' },
        status: { type: 'string', enum: ['success', 'error'] },
        source: { type: 'string', description: 'e.g. "storyboard"' },
        limit: { type: 'number', description: 'Max results, default 50' },
      },
    },
  },

  // ── Transcript Search ─────────────────────────────────────
  {
    name: 'search_transcripts',
    description:
      'Full-text search across all meeting transcript text. Use this to find meetings where a topic was discussed (e.g. "pricing", "crowdfunding", "budget").',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Keyword or phrase to search for in transcript text' },
        limit: { type: 'number', description: 'Max results, default 10' },
      },
      required: ['query'],
    },
  },

  // ── Proposal Milestones ───────────────────────────────────
  {
    name: 'query_proposal_milestones',
    description: 'Get the production timeline milestones for a proposal.',
    input_schema: {
      type: 'object' as const,
      properties: {
        proposal_id: { type: 'string', description: 'The proposal ID to fetch milestones for' },
      },
      required: ['proposal_id'],
    },
  },

  // ── Client Portal Attempts ────────────────────────────────
  {
    name: 'query_client_portal_attempts',
    description: 'List client portal login attempts — audit log of who tried to access the client portal and when.',
    input_schema: {
      type: 'object' as const,
      properties: {
        email: { type: 'string', description: 'Filter by email address (partial match)' },
        limit: { type: 'number', description: 'Max results, default 50' },
      },
    },
  },

  // ── Aggregate / Analytics ─────────────────────────────────
  {
    name: 'run_aggregate_query',
    description: 'Run count/aggregate queries for analytics.',
    input_schema: {
      type: 'object' as const,
      properties: {
        table: {
          type: 'string',
          enum: [
            'projects', 'clients', 'contacts', 'proposals', 'meetings', 'testimonials',
            'tags', 'roles', 'project_credits', 'proposal_views', 'seo_settings',
            'content_snippets', 'website_project_placements',
            'scripts', 'locations', 'contracts', 'contract_templates',
            'intake_submissions', 'pricing_leads', 'ai_prompt_log',
            'proposal_milestones', 'client_login_attempts',
          ],
        },
        count_by: { type: 'string', description: 'Column to group by (optional)' },
        filter: { type: 'object', description: 'Key-value filters' },
      },
      required: ['table'],
    },
  },
];

// ── Tool Execution ──────────────────────────────────────────

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  db: SupabaseClient,
): Promise<unknown> {
  switch (name) {
    // ── Projects ──
    case 'query_projects': {
      let query = db
        .from('projects')
        .select('id, title, subtitle, client_name, type, published, featured, category, client_id, created_at');
      if (input.search) {
        const s = `%${input.search}%`;
        query = query.or(`title.ilike.${s},subtitle.ilike.${s},client_name.ilike.${s}`);
      }
      if (input.published !== undefined) query = query.eq('published', input.published as boolean);
      if (input.client_id) query = query.eq('client_id', input.client_id as string);
      if (input.featured !== undefined) query = query.eq('featured', input.featured as boolean);
      if (input.type) query = query.eq('type', input.type as string);
      const { data, error } = await query.order('created_at', { ascending: false }).limit((input.limit as number) || 20);
      return { data, error: error?.message };
    }

    case 'get_project': {
      const { data, error } = await db
        .from('projects')
        .select('*, project_videos(*), project_credits(*), project_bts_images(*)')
        .eq('id', input.id as string)
        .single();
      return { data, error: error?.message };
    }

    // ── Credits ──
    case 'search_credits': {
      let query = db
        .from('project_credits')
        .select('id, project_id, name, role, sort_order, role_id, contact_id');
      if (input.name) query = query.ilike('name', `%${input.name}%`);
      if (input.role) query = query.ilike('role', `%${input.role}%`);
      if (input.project_id) query = query.eq('project_id', input.project_id as string);
      const { data, error } = await query.order('sort_order').limit((input.limit as number) || 50);
      if (error) return { error: error.message };

      // Enrich with project titles
      if (data && data.length > 0) {
        const ids = [...new Set((data as Array<{ project_id: string }>).map((c) => c.project_id))];
        const { data: projects } = await db.from('projects').select('id, title, client_name').in('id', ids);
        const map = new Map((projects || []).map((p: { id: string; title: string; client_name: string }) => [p.id, p]));
        return {
          data: (data as Array<{ project_id: string }>).map((c) => ({ ...c, project: map.get(c.project_id) || null })),
        };
      }
      return { data };
    }

    // ── Clients ──
    case 'query_clients': {
      let query = db
        .from('clients')
        .select('id, name, company, email, industry, location, website_url, logo_url, created_at');
      if (input.search) {
        const s = `%${input.search}%`;
        query = query.or(`name.ilike.${s},company.ilike.${s},email.ilike.${s}`);
      }
      if (input.industry) query = query.eq('industry', input.industry as string);
      const { data, error } = await query.order('created_at', { ascending: false }).limit((input.limit as number) || 20);
      return { data, error: error?.message };
    }

    case 'get_client': {
      const { data: client, error } = await db
        .from('clients')
        .select('*')
        .eq('id', input.id as string)
        .single();
      if (error) return { error: error.message };

      const [projects, proposals, testimonials, meetingRels] = await Promise.all([
        db.from('projects').select('id, title, type, published, category').eq('client_id', input.id as string).order('created_at', { ascending: false }),
        db.from('proposals').select('id, title, status, proposal_number, created_at').eq('contact_company', client.company || '').order('created_at', { ascending: false }),
        db.from('testimonials').select('id, quote, person_name, person_title').eq('client_id', input.id as string),
        db.from('meeting_relationships').select('meeting_id').eq('client_id', input.id as string),
      ]);

      let meetings: unknown[] = [];
      if (meetingRels.data && meetingRels.data.length > 0) {
        const mIds = (meetingRels.data as Array<{ meeting_id: string }>).map((r) => r.meeting_id);
        const { data: mData } = await db.from('meetings').select('id, title, start_time, status').in('id', mIds).order('start_time', { ascending: false });
        meetings = mData || [];
      }

      return { data: { ...client, projects: projects.data, proposals: proposals.data, testimonials: testimonials.data, meetings } };
    }

    // ── Contacts ──
    case 'query_contacts': {
      let query = db
        .from('contacts')
        .select('id, first_name, last_name, email, phone, type, company, role, linkedin_url, created_at');
      if (input.search) {
        const s = `%${input.search}%`;
        query = query.or(`first_name.ilike.${s},last_name.ilike.${s},email.ilike.${s}`);
      }
      if (input.type) query = query.eq('type', input.type as string);
      const { data, error } = await query.order('created_at', { ascending: false }).limit((input.limit as number) || 20);
      return { data, error: error?.message };
    }

    case 'get_contact': {
      // Get contact with roles and headshots
      const { data: contact, error } = await db
        .from('contacts')
        .select('*')
        .eq('id', input.id as string)
        .single();
      if (error) return { error: error.message };

      // Get roles
      const { data: contactRoles } = await db
        .from('contact_roles')
        .select('role_id')
        .eq('contact_id', input.id as string);
      let roles: unknown[] = [];
      if (contactRoles && contactRoles.length > 0) {
        const roleIds = (contactRoles as Array<{ role_id: string }>).map((cr) => cr.role_id);
        const { data: roleData } = await db.from('roles').select('id, name').in('id', roleIds);
        roles = roleData || [];
      }

      // Get headshots
      const { data: headshots } = await db
        .from('headshots')
        .select('id, url, featured, width, height')
        .eq('contact_id', input.id as string);

      // Get project credits
      const { data: credits } = await db
        .from('project_credits')
        .select('id, project_id, role, name')
        .eq('contact_id', input.id as string);

      return { data: { ...contact, roles, headshots, project_credits: credits } };
    }

    // ── Proposals ──
    case 'query_proposals': {
      let query = db
        .from('proposals')
        .select('id, title, slug, contact_name, contact_company, status, proposal_number, proposal_type, created_at');
      if (input.search) {
        const s = `%${input.search}%`;
        query = query.or(`title.ilike.${s},contact_name.ilike.${s},contact_company.ilike.${s}`);
      }
      if (input.status) query = query.eq('status', input.status as string);
      const { data, error } = await query.order('created_at', { ascending: false }).limit((input.limit as number) || 20);
      return { data, error: error?.message };
    }

    case 'get_proposal': {
      const { data, error } = await db
        .from('proposals')
        .select('*, proposal_sections(*), proposal_quotes(*), proposal_projects(*), proposal_milestones(*), proposal_views(count)')
        .eq('id', input.id as string)
        .single();
      return { data, error: error?.message };
    }

    // ── Meetings ──
    case 'query_meetings': {
      // If filtering by attendee email, resolve meeting IDs first
      let meetingIdFilter: string[] | null = null;
      if (input.attendee_email) {
        const { data: attendees } = await db.from('meeting_attendees').select('meeting_id').ilike('email', `%${input.attendee_email}%`);
        meetingIdFilter = (attendees || []).map((a: { meeting_id: string }) => a.meeting_id);
        if (meetingIdFilter.length === 0) return { data: [] };
      }

      let query = db
        .from('meetings')
        .select('id, title, start_time, end_time, status, transcript_status, meeting_url, created_at');
      if (input.search) query = query.ilike('title', `%${input.search}%`);
      if (input.upcoming_only) query = query.gte('start_time', new Date().toISOString());
      if (meetingIdFilter) query = query.in('id', meetingIdFilter);
      const { data, error } = await query.order('start_time', { ascending: false }).limit((input.limit as number) || 20);
      return { data, error: error?.message };
    }

    case 'get_meeting': {
      const { data, error } = await db
        .from('meetings')
        .select('*, meeting_attendees(*), meeting_transcripts(*), meeting_relationships(*)')
        .eq('id', input.id as string)
        .single();
      return { data, error: error?.message };
    }

    // ── Testimonials ──
    case 'query_testimonials': {
      let query = db
        .from('testimonials')
        .select('id, quote, person_name, person_title, company, project_id, client_id, created_at');
      if (input.client_id) query = query.eq('client_id', input.client_id as string);
      if (input.project_id) query = query.eq('project_id', input.project_id as string);
      const { data, error } = await query.order('display_order').limit((input.limit as number) || 20);
      return { data, error: error?.message };
    }

    // ── Tags & Roles ──
    case 'query_tags': {
      let query = db.from('tags').select('id, name, category');
      if (input.category) query = query.eq('category', input.category as string);
      const { data, error } = await query.order('name');
      return { data, error: error?.message };
    }

    case 'query_roles': {
      const { data, error } = await db.from('roles').select('id, name').order('name');
      return { data, error: error?.message };
    }

    // ── Content Snippets ──
    case 'query_content_snippets': {
      let query = db
        .from('content_snippets')
        .select('id, title, body, snippet_type, category, sort_order');
      if (input.search) {
        const s = `%${input.search}%`;
        query = query.or(`title.ilike.${s},body.ilike.${s}`);
      }
      if (input.category) query = query.eq('category', input.category as string);
      if (input.snippet_type) query = query.eq('snippet_type', input.snippet_type as string);
      const { data, error } = await query.order('sort_order').limit((input.limit as number) || 20);
      return { data, error: error?.message };
    }

    // ── Website Placements ──
    case 'query_placements': {
      let query = db
        .from('website_project_placements')
        .select('id, project_id, page_slug, sort_order');
      if (input.page) query = query.eq('page_slug', input.page as string);
      if (input.project_id) query = query.eq('project_id', input.project_id as string);
      const { data, error } = await query.order('sort_order');
      if (error) return { error: error.message };

      // Enrich with project titles
      if (data && data.length > 0) {
        const ids = [...new Set((data as Array<{ project_id: string }>).map((p) => p.project_id))];
        const { data: projects } = await db.from('projects').select('id, title').in('id', ids);
        const map = new Map((projects || []).map((p: { id: string; title: string }) => [p.id, p]));
        return {
          data: (data as Array<{ project_id: string }>).map((p) => ({ ...p, project: map.get(p.project_id) || null })),
        };
      }
      return { data };
    }

    // ── SEO Settings ──
    case 'query_seo_settings': {
      let query = db.from('seo_settings').select('id, page_slug, meta_title, meta_description, og_title, og_description, og_image_url, canonical_url, no_index, updated_at');
      if (input.page_slug) query = query.eq('page_slug', input.page_slug as string);
      const { data, error } = await query.order('page_slug');
      return { data, error: error?.message };
    }

    // ── Proposal Views ──
    case 'query_proposal_views': {
      let query = db.from('proposal_views').select('*');
      if (input.proposal_id) query = query.eq('proposal_id', input.proposal_id as string);
      const { data, error } = await query.order('created_at', { ascending: false }).limit((input.limit as number) || 50);
      return { data, error: error?.message };
    }

    // ── Scripts ──
    case 'query_scripts': {
      let query = db.from('scripts').select('id, title, status, version, notes, project_id, created_by, created_at, updated_at');
      if (input.search) query = query.ilike('title', `%${input.search}%`);
      if (input.status) query = query.eq('status', input.status as string);
      if (input.project_id) query = query.eq('project_id', input.project_id as string);
      const { data, error } = await query.order('updated_at', { ascending: false }).limit((input.limit as number) || 20);
      return { data, error: error?.message };
    }

    case 'get_script': {
      const id = input.id as string;
      const [scriptRes, scenesRes, charactersRes, tagsRes, locationsRes, framesRes] = await Promise.all([
        db.from('scripts').select('*').eq('id', id).single(),
        db.from('script_scenes').select('id, sort_order, location_name, time_of_day, int_ext, scene_notes, location_id').eq('script_id', id).order('sort_order'),
        db.from('script_characters').select('id, name, description, color, sort_order').eq('script_id', id).order('sort_order'),
        db.from('script_tags').select('id, name, slug, category, color').eq('script_id', id).order('name'),
        db.from('script_locations').select('id, name, description, color, sort_order, global_location_id').eq('script_id', id).order('sort_order'),
        db.from('script_storyboard_frames').select('id, beat_id, scene_id').eq('script_id', id),
      ]);
      if (scriptRes.error) return { error: scriptRes.error.message };

      // Fetch beats for each scene
      const scenes = scenesRes.data || [];
      const sceneIds = scenes.map((s: { id: string }) => s.id);
      const beatsMap: Record<string, unknown[]> = {};
      if (sceneIds.length > 0) {
        const { data: beats } = await db.from('script_beats').select('id, scene_id, sort_order, audio_content, visual_content, notes_content').in('scene_id', sceneIds).order('sort_order');
        for (const beat of beats || []) {
          const b = beat as { scene_id: string };
          if (!beatsMap[b.scene_id]) beatsMap[b.scene_id] = [];
          beatsMap[b.scene_id].push(beat);
        }
      }

      // Enrich locations with global location name
      const locations = locationsRes.data || [];
      const globalIds = locations.filter((l: { global_location_id: string | null }) => l.global_location_id).map((l: { global_location_id: string }) => l.global_location_id);
      const globalMap: Map<string, { name: string; city: string }> = new Map();
      if (globalIds.length > 0) {
        const { data: globals } = await db.from('locations').select('id, name, city').in('id', globalIds);
        for (const g of globals || []) globalMap.set((g as { id: string; name: string; city: string }).id, g as { name: string; city: string });
      }

      const frameCount = (framesRes.data || []).length;

      return {
        data: {
          ...scriptRes.data,
          scenes: scenes.map((s: { id: string }) => ({ ...s, beats: beatsMap[s.id] || [] })),
          characters: charactersRes.data || [],
          tags: tagsRes.data || [],
          locations: (locations as Array<{ global_location_id: string | null }>).map((l) => ({
            ...l,
            global_location: l.global_location_id ? (globalMap.get(l.global_location_id) || null) : null,
          })),
          storyboard_frame_count: frameCount,
        },
      };
    }

    // ── Locations ──
    case 'query_locations': {
      let query = db.from('locations').select('id, name, description, address, city, state, status, tags, featured_image, peerspace_url, created_at, updated_at');
      if (input.search) {
        const s = `%${input.search}%`;
        query = query.or(`name.ilike.${s},description.ilike.${s},address.ilike.${s},city.ilike.${s}`);
      }
      if (input.city) query = query.ilike('city', `%${input.city}%`);
      if (input.state) query = query.eq('state', input.state as string);
      if (input.status) query = query.eq('status', input.status as string);
      const { data, error } = await query.order('name').limit((input.limit as number) || 20);
      return { data, error: error?.message };
    }

    case 'get_location': {
      const { data: location, error } = await db.from('locations').select('id, name, description, address, city, state, zip, google_maps_url, featured_image, status, tags, notes, appearance_prompt, peerspace_url, peerspace_id, peerspace_data, created_at, updated_at').eq('id', input.id as string).single();
      if (error) return { error: error.message };

      const [imagesRes, projectsRes] = await Promise.all([
        db.from('location_images').select('id, image_url, alt_text, source, is_featured, sort_order').eq('location_id', input.id as string).order('sort_order'),
        db.from('location_projects').select('project_id').eq('location_id', input.id as string),
      ]);

      let projects: unknown[] = [];
      const projectIds = (projectsRes.data || []).map((r: { project_id: string }) => r.project_id);
      if (projectIds.length > 0) {
        const { data: projData } = await db.from('projects').select('id, title, type, published').in('id', projectIds);
        projects = projData || [];
      }

      // Summarize peerspace_data rather than returning full blob
      const loc = location as Record<string, unknown>;
      const ps = loc.peerspace_data as Record<string, unknown> | null;
      const peerspaceSummary = ps ? {
        capacity: ps.capacity,
        hourly_rate: ps.hourly_rate,
        reviews_count: ps.reviews_count,
        rating: ps.rating,
      } : null;

      return {
        data: {
          ...loc,
          peerspace_data: undefined,
          peerspace_summary: peerspaceSummary,
          images: imagesRes.data || [],
          projects,
        },
      };
    }

    // ── Contracts ──
    case 'query_contract_templates': {
      let query = db.from('contract_templates').select('id, name, description, contract_type, is_active, sort_order, merge_fields').eq('is_active', true);
      if (input.contract_type) query = query.eq('contract_type', input.contract_type as string);
      const { data, error } = await query.order('sort_order');
      return { data, error: error?.message };
    }

    case 'query_contracts': {
      let query = db.from('contracts').select('id, contract_number, title, contract_type, status, client_id, contact_id, proposal_id, signwell_status, signwell_signed_at, created_at, updated_at');
      if (input.search) query = query.ilike('title', `%${input.search}%`);
      if (input.status) query = query.eq('status', input.status as string);
      if (input.contract_type) query = query.eq('contract_type', input.contract_type as string);
      if (input.client_id) query = query.eq('client_id', input.client_id as string);
      const { data, error } = await query.order('created_at', { ascending: false }).limit((input.limit as number) || 20);
      if (error) return { error: error.message };

      // Enrich with signer count
      if (data && data.length > 0) {
        const ids = (data as Array<{ id: string }>).map((c) => c.id);
        const { data: signers } = await db.from('contract_signers').select('contract_id').in('contract_id', ids);
        const signerCounts = new Map<string, number>();
        for (const s of signers || []) signerCounts.set((s as { contract_id: string }).contract_id, (signerCounts.get((s as { contract_id: string }).contract_id) || 0) + 1);
        return { data: (data as Array<{ id: string }>).map((c) => ({ ...c, signer_count: signerCounts.get(c.id) || 0 })) };
      }
      return { data };
    }

    case 'get_contract': {
      const { data: contract, error } = await db.from('contracts').select('id, contract_number, title, contract_type, status, client_id, contact_id, proposal_id, quote_id, body, manual_fields, signwell_document_id, signwell_status, signwell_signed_at, signwell_expires_at, notes, created_at, updated_at').eq('id', input.id as string).single();
      if (error) return { error: error.message };

      const c = contract as Record<string, unknown>;
      const [signersRes, eventsRes] = await Promise.all([
        db.from('contract_signers').select('id, name, email, role, sort_order, status, signed_at, viewed_at').eq('contract_id', input.id as string).order('sort_order'),
        db.from('contract_events').select('id, event_type, actor_email, signer_email, occurred_at').eq('contract_id', input.id as string).order('occurred_at', { ascending: false }).limit(10),
      ]);

      // Optionally enrich with proposal title
      let proposalTitle: string | null = null;
      if (c.proposal_id) {
        const { data: prop } = await db.from('proposals').select('title').eq('id', c.proposal_id as string).single();
        proposalTitle = (prop as { title: string } | null)?.title || null;
      }

      return {
        data: {
          ...c,
          signers: signersRes.data || [],
          recent_events: eventsRes.data || [],
          proposal_title: proposalTitle,
        },
      };
    }

    // ── Intake Submissions ──
    case 'query_intake_submissions': {
      let query = db.from('intake_submissions').select('id, name, email, title, project_name, pitch, timeline, timeline_date, budget, deliverables, phases, status, client_id, contact_id, project_id, created_at, updated_at');
      if (input.search) {
        const s = `%${input.search}%`;
        query = query.or(`name.ilike.${s},email.ilike.${s},project_name.ilike.${s}`);
      }
      if (input.status) query = query.eq('status', input.status as string);
      const { data, error } = await query.order('created_at', { ascending: false }).limit((input.limit as number) || 20);
      return { data, error: error?.message };
    }

    // ── Pricing Leads ──
    case 'query_pricing_leads': {
      let query = db.from('pricing_leads').select('id, name, email, timeline, timeline_date, source, created_at');
      if (input.timeline) query = query.eq('timeline', input.timeline as string);
      if (input.source) query = query.eq('source', input.source as string);
      const { data, error } = await query.order('created_at', { ascending: false }).limit((input.limit as number) || 50);
      return { data, error: error?.message };
    }

    // ── AI Prompt Log ──
    case 'query_ai_prompt_log': {
      let query = db.from('ai_prompt_log').select('id, script_id, beat_id, scene_id, model, prompt_text, response_summary, input_tokens, output_tokens, cost_estimate, duration_ms, status, source, image_url, created_at');
      if (input.script_id) query = query.eq('script_id', input.script_id as string);
      if (input.status) query = query.eq('status', input.status as string);
      if (input.source) query = query.eq('source', input.source as string);
      const { data, error } = await query.order('created_at', { ascending: false }).limit((input.limit as number) || 50);
      return { data, error: error?.message };
    }

    // ── Transcript Search ──
    case 'search_transcripts': {
      const q = input.query as string;
      const { data, error } = await db.from('meeting_transcripts').select('meeting_id, formatted_text').ilike('formatted_text', `%${q}%`).limit((input.limit as number) || 10);
      if (error) return { error: error.message };
      if (!data || data.length === 0) return { data: [] };

      // Enrich with meeting title/time and extract excerpt
      const meetingIds = (data as Array<{ meeting_id: string }>).map((t) => t.meeting_id);
      const { data: meetings } = await db.from('meetings').select('id, title, start_time').in('id', meetingIds);
      const meetingMap = new Map((meetings || []).map((m: { id: string; title: string; start_time: string }) => [m.id, m]));

      return {
        data: (data as Array<{ meeting_id: string; formatted_text: string }>).map((t) => {
          const idx = t.formatted_text?.toLowerCase().indexOf(q.toLowerCase()) ?? -1;
          const start = Math.max(0, idx - 120);
          const end = Math.min((t.formatted_text || '').length, idx + 180);
          const excerpt = idx >= 0 ? `...${t.formatted_text.slice(start, end)}...` : null;
          return {
            meeting_id: t.meeting_id,
            meeting: meetingMap.get(t.meeting_id) || null,
            excerpt,
          };
        }),
      };
    }

    // ── Proposal Milestones ──
    case 'query_proposal_milestones': {
      const { data, error } = await db.from('proposal_milestones').select('id, label, start_date, end_date, phase, description, sort_order').eq('proposal_id', input.proposal_id as string).order('sort_order');
      return { data, error: error?.message };
    }

    // ── Client Portal Attempts ──
    case 'query_client_portal_attempts': {
      let query = db.from('client_login_attempts').select('id, name, email, attempted_at');
      if (input.email) query = query.ilike('email', `%${input.email}%`);
      const { data, error } = await query.order('attempted_at', { ascending: false }).limit((input.limit as number) || 50);
      return { data, error: error?.message };
    }

    // ── Aggregate ──
    case 'run_aggregate_query': {
      const table = input.table as string;
      const filter = (input.filter as Record<string, unknown>) || {};

      if (input.count_by) {
        let query = db.from(table).select(`${input.count_by}`);
        for (const [key, val] of Object.entries(filter)) {
          query = query.eq(key, val as string);
        }
        const { data, error } = await query;
        if (error) return { error: error.message };
        const counts: Record<string, number> = {};
        for (const row of data || []) {
          const k = String((row as unknown as Record<string, unknown>)[input.count_by as string] ?? 'null');
          counts[k] = (counts[k] || 0) + 1;
        }
        return { counts, total: data?.length || 0 };
      } else {
        let query = db.from(table).select('id', { count: 'exact', head: true });
        for (const [key, val] of Object.entries(filter)) {
          query = query.eq(key, val as string);
        }
        const { count, error } = await query;
        return { count, error: error?.message };
      }
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
