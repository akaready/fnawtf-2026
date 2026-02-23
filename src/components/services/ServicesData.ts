/**
 * Static content data for the Services page variants.
 * Project data is fetched at runtime from Supabase; this file handles copy,
 * tags, phase metadata, and crowdfunding/fundraising content.
 */

export interface ServiceProject {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  thumbnail_url?: string;
  category?: string;
  flagship_video_id?: string;
  flagship_protected?: boolean;
  flagship_password?: string | null;
  thumbnail_time?: number;
}

export interface ServicesProjectData {
  build: ServiceProject[];
  launch: ServiceProject[];
  scale: ServiceProject[];
  crowdfunding: ServiceProject[];
  fundraising: ServiceProject[];
}

export interface PhaseData {
  id: 'build' | 'launch' | 'scale';
  number: string;
  title: string;
  tagline: string;
  description: string;
  tags: string[];
  startingAt: string;
  icon: string;
}

export const PHASES: PhaseData[] = [
  {
    id: 'build',
    number: '01',
    title: 'Build',
    tagline: 'The foundation before the frame.',
    description:
      'Before the camera rolls, we do the work that makes everything else work. Brand positioning, narrative architecture, copywriting, and strategy. This is where your story gets its spine. Plus, a launch page and a micro-shoot to validate your product-market fit.',
    tags: [
      'Consulting',
      'Brand Identity',
      'Positioning',
      'Messaging',
      'Copywriting',
      'Scripting',
      'Pre-Launch',
      'Micro-Shoot',
      'Market Validation',
    ],
    startingAt: '$3,500+',
    icon: 'Hammer',
  },
  {
    id: 'launch',
    number: '02',
    title: 'Launch',
    tagline: 'Shoot day. Post. Delivery.',
    description:
      'Full production, from initial concept to final cut. A dedicated team from start to finish, and all the deliverables that matter to build a complete campaign. Flagship video, the social cutdowns and stills. All complete with branded motion graphics. Designed to convert.',
    tags: [
      'Storyboarding',
      'Casting',
      'Location Scouting',
      'Video Production',
      'Photography',
      'Post Production',
      'Motion Graphics',
      'Social Cutdowns',
    ],
    startingAt: '$7,000+',
    icon: 'Rocket',
  },
  {
    id: 'scale',
    number: '03',
    title: 'Scale',
    tagline: 'Ongoing creative partnership.',
    description:
      'Not a retainer, a relationship. We already know the ethos, now we deepen the creative collaboration. Brand, content and marketing strategy. Execution that becomes regularly scheduled programming (ad and asset refreshes). Volume pricing, platform optimizations, and AI automations.',
    tags: [
      'Content Strategy',
      'Ongoing Engagement',
      'Customer Testimonials',
      'Platform Optimizations',
      'Volume Pricing',
      'Priority Scheduling',
      'AI Automations'
    ],
    startingAt: 'Custom',
    icon: 'TrendingUp',
  },
];

export const CROWDFUNDING = {
  title: 'Crowdfunding',
  tagline: 'Risk-aligned pricing for campaigns.',
  description:
    'We\'ve run campaigns ourselves and understand cash flow concerns. We offer risk-aligned terms that defer up to 60% of costs until post-campaign, and discounts in exchange for a small percentage of your raise. When you win, we win together.',
  tiers: [
    { discount: 10, percentage: 2.5, label: 'for 2.5% of your raise' },
    { discount: 20, percentage: 5.0, label: 'for 5% of your raise' },
    { discount: 30, percentage: 10,  label: 'for 10% of your raise' },
  ],
  note: 'Applies to any Launch or Scale engagement.',
};

export const FUNDRAISING = {
  title: 'Fundraising',
  tagline: 'Investor-grade video, deferred payment.',
  description:
    'For founders raising capital we offer a conversational pitch video package that introduces you and your company to investors. Includes a private website with your scripted video, deck, and calendar link. Only 20% down, with the balance due after you raise.',
  startingAt: '$15,000',
  minimumDown: '$3,000 (20%)',
  paymentTerm: '180 days or after your raise',
  included: [
    'Scripting and Q&A support',
    '1-day interview production',
    'One speaker, prompter, lighting',
    'Editorial, color, sound mix',
    'Branded motion graphics',
    '~~https://~~==YourCompanyName.Pitch.Page==',
  ],
};
