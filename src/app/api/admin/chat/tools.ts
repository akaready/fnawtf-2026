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
    description: 'Get a single proposal by ID with sections, quotes, projects, and view count.',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },

  // ── Meetings ──────────────────────────────────────────────
  {
    name: 'query_meetings',
    description: 'Search or list meetings. Can filter by upcoming only.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Text search on title' },
        upcoming_only: { type: 'boolean' },
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

  // ── Aggregate / Analytics ─────────────────────────────────
  {
    name: 'run_aggregate_query',
    description: 'Run count/aggregate queries for analytics.',
    input_schema: {
      type: 'object' as const,
      properties: {
        table: {
          type: 'string',
          enum: ['projects', 'clients', 'contacts', 'proposals', 'meetings', 'testimonials', 'tags', 'roles', 'project_credits', 'proposal_views', 'seo_settings', 'content_snippets', 'website_project_placements'],
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
        .select('*, proposal_sections(*), proposal_quotes(*), proposal_projects(*), proposal_views(count)')
        .eq('id', input.id as string)
        .single();
      return { data, error: error?.message };
    }

    // ── Meetings ──
    case 'query_meetings': {
      let query = db
        .from('meetings')
        .select('id, title, start_time, end_time, status, transcript_status, meeting_url, created_at');
      if (input.search) query = query.or(`title.ilike.%${input.search}%`);
      if (input.upcoming_only) query = query.gte('start_time', new Date().toISOString());
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
