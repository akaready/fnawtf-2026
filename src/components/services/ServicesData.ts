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
      'Full production, from initial concept to final cut. A dedicated team from start to finish, and all the deliverables that matter to build a complete campaign. Campaign hero, the social cutdowns, stills, all complete with branded motion graphics. Built to convert.',
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
      'Not a retainer, a relationship. We embed with your brand, build a content rhythm, and grow with you. Volume pricing, multi-day and multi-asset productions, priority scheduling, platform optimizations and AI automations. For brands looking to grow.',
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
    'We believe in our work as a tool to amplify your campaign. We can discount our rates in exchange for a small percentage of what you raise. The bigger the share, the bigger the discount. Everyone wins when you do.',
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
    'For founders raising capital. Includes a private website featuring a scripted pitch video, your deck, and your calendar link. Designed to share with investors. We take 20% down and let you pay the rest after you raise.',
  startingAt: '$15,000',
  minimumDown: '$3,000 (20%)',
  paymentTerm: '180 days or after your raise',
  included: [
    'Scripting and Q&A support',
    '1-day interview production',
    'One speaker, prompter, lighting',
    'Editorial, Color, Sound Mix',
    'Branded motion graphics',
    '~~https://~~==yourCompanyName.Pitch.Page==',
  ],
};
