-- Rename "introductions" category → "welcome"
UPDATE content_snippets
SET category = 'welcome', updated_at = now()
WHERE lower(category) = 'introductions';

-- Seed "approach" category snippets
INSERT INTO content_snippets (title, body, snippet_type, category, sort_order)
VALUES
  (
    'Brand-First Creative Philosophy',
    'Every frame, transition, and sound cue is designed to reinforce your brand identity. We don''t just make videos — we build visual systems that feel unmistakably *yours*. From color grading to motion language, every creative decision ladders back to who you are and how you want to be remembered.',
    'general', 'approach', 0
  ),
  (
    'Story-Driven Production',
    'Great content starts with a great story. We begin every engagement by identifying the emotional core of your message — the tension, the transformation, the payoff — and build the entire production around that narrative spine. The result is content that doesn''t just inform, it *moves* people.',
    'general', 'approach', 1
  ),
  (
    'Audience-Obsessed Strategy',
    'We study your audience before we ever pick up a camera. What platforms do they live on? What captures their attention? What makes them share? Our creative strategy is shaped by real audience behavior, not assumptions — so the work performs where it matters most.',
    'general', 'approach', 2
  ),
  (
    'Cinematic Craft, Commercial Instinct',
    'We bring cinematic production value with a commercial mindset. Every shot is composed with intention, every edit serves the message, and the final product is built to drive action — whether that''s a click, a signup, or a purchase.',
    'general', 'approach', 3
  ),
  (
    'Collaborative Process',
    'This is your project, and you''ll never feel out of the loop. We work in close partnership with your team at every stage — from creative brief through final delivery. Expect clear timelines, transparent communication, and a process designed to surface the best ideas from both sides.',
    'general', 'approach', 4
  ),
  (
    'Built for Your Platform',
    'A YouTube hero video is not a TikTok ad is not a homepage reel. We design and edit specifically for the platforms and contexts where your content will live — aspect ratios, pacing, hooks, CTAs — so nothing feels repurposed or out of place.',
    'general', 'approach', 5
  ),
  (
    'Product as Hero',
    'Your product is the star. We craft visual narratives that put your product front and center — showing it in use, in context, and at its best. Through lighting, movement, and pacing, we make your product feel aspirational and essential.',
    'general', 'approach', 6
  ),
  (
    'Launch-Ready Momentum',
    'We don''t just deliver a video — we deliver a launch asset. Every piece is built to create momentum: teasers that build anticipation, hero content that converts, and cutdowns that sustain attention across channels. The work is designed to drive your launch forward.',
    'general', 'approach', 7
  ),
  (
    'Data-Informed Iteration',
    'Great creative gets better with feedback. We build in review checkpoints and, post-launch, analyze performance data to refine future work. Every engagement teaches us more about what resonates with your audience — and we carry those insights forward.',
    'general', 'approach', 8
  ),
  (
    'End-to-End Ownership',
    'From concept to color grade, we handle the full production pipeline in-house. That means fewer handoffs, tighter creative control, and a cohesive final product. You get a single team that owns the vision from start to finish.',
    'general', 'approach', 9
  ),
  (
    'Founder-Centric Storytelling',
    'Your founder''s story *is* your brand story. We help distill the passion, mission, and vision behind the company into compelling content that builds trust and emotional connection — because people don''t buy products, they buy into people.',
    'general', 'approach', 10
  ),
  (
    'Premium Without the Overhead',
    'You get agency-level creative and production quality without the bloated timelines and inflated budgets. Our lean, senior-led team moves fast, communicates clearly, and delivers work that punches well above its weight class.',
    'general', 'approach', 11
  );
