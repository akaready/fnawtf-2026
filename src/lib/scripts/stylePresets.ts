import type { StoryboardStylePreset } from '@/types/scripts';

// Shared prohibition header — kept for panel display only
const PRESET_PROHIBITIONS =
  'NO TEXT anywhere in the image — not on whiteboards (show them blank), not on screens (show abstract glowing shapes), not as captions, overlays, statistics, infographics, frame numbers, or directional arrows. NO BORDERS: no storyboard panel frames, no rectangular outlines, no decorative edges drawn within the image. Art fills every pixel edge-to-edge. ';

export interface StyleJsonBlock {
  name: string;
  medium: string;
  color_palette: string[];
  strictly_exclude_colors?: string[];
  line_weight?: string;
  shading: string;
  depth_of_field: string;
  lighting: string;
  rendering: string;
  style_references: string[];
  feel: string;
  focus?: string;
}

export interface StylePresetConfig {
  label: string;
  image: string;
  /** Human-readable string — used for panel display/preview only */
  prompt: string;
  /** Structured JSON block injected into the Gemini prompt */
  jsonStyle: StyleJsonBlock;
}

export const STYLE_PRESETS: Record<StoryboardStylePreset, StylePresetConfig> = {
  sketch: {
    label: 'Sketch',
    image: '/images/storyboard-presets/sketch.png',
    prompt:
      PRESET_PROHIBITIONS +
      "Hand-drawn pencil storyboard sketch on white paper. Strict color palette: pure black graphite lines and neutral cool-gray wash fills only — absolutely no warm tones, no sepia, no blue tints, no hue shifts of any kind. Every frame in this storyboard uses identical line weight (medium, confident strokes), identical gray wash shading, and identical white paper ground. Medium-weight pencil with cross-hatching for shadow depth. Loose perspective lines visible. Focus on composition, character blocking, and camera framing (medium shots, close-ups, wide establishing frames) rather than fine rendering detail. Slightly unfinished edges, imperfect but expressive. Evokes a traditional storyboard artist's rapid pre-production visualization.",
    jsonStyle: {
      name: 'Hand-drawn pencil storyboard sketch',
      medium: 'graphite pencil on white paper',
      color_palette: [
        'pure black graphite lines',
        'neutral cool-gray wash fills',
        'white paper ground',
      ],
      strictly_exclude_colors: [
        'warm tones',
        'sepia',
        'blue tints',
        'any color hue whatsoever — monochrome graphite only',
      ],
      line_weight: 'medium confident strokes, cross-hatching for shadow depth',
      shading: 'neutral cool-gray wash only — absolutely no color',
      depth_of_field: 'f/2.0 equivalent — subject sharp, background suggested with looser line detail',
      lighting: 'implied through line weight and gray wash — no color temperature, chiaroscuro only',
      focus: 'composition, character blocking, camera framing (medium shots, close-ups, wide establishing frames) — not fine rendering detail',
      rendering: 'loose perspective lines visible, slightly unfinished expressive edges',
      style_references: [
        'Ralph McQuarrie pre-production storyboard sketches',
        'Ridley Scott alien/blade runner storyboard drawings',
        'Akira Kurosawa hand-drawn storyboards',
      ],
      feel: "traditional storyboard artist's rapid pre-production visualization — identical line weight and gray wash every single frame",
    },
  },

  comic: {
    label: 'Comic',
    image: '/images/storyboard-presets/comic.png',
    prompt:
      PRESET_PROHIBITIONS +
      'Full-color comic book illustration. Bold, confident ink outlines with thick-to-thin line weight variation. Cel-shaded coloring with a rich, saturated palette — strong complementary color choices, deep shadows in darker hues rather than black. Dramatic directional lighting (key light at 45°, strong rim light on opposite side). Dynamic composition: low-angle perspectives, dramatic foreshortening, purposeful negative space. Background elements present but atmospheric — color washes with simplified detail. Art fills every pixel to the frame edge; completely borderless. Feels like a single frame from a high-end graphic novel — Moebius meets modern Marvel concept art. Expressive, stylized but grounded in real human proportions.',
    jsonStyle: {
      name: 'Comic book illustration',
      medium: 'bold ink outlines with cel-shaded digital color',
      color_palette: [
        'rich saturated complementary colors',
        'deep hue-shifted shadows — never flat black',
        'strong color contrast between light and shadow areas',
      ],
      line_weight: 'bold confident ink outlines with thick-to-thin variation',
      shading: 'cel-shaded flat color fills with hard shadow edges',
      depth_of_field: 'f/2.0 — subject sharp with clear separation from atmospheric background',
      lighting: 'dramatic directional — key light 45 degrees, strong rim light opposite side',
      rendering: 'dynamic composition with low-angle perspectives and dramatic foreshortening, atmospheric background color washes with simplified detail',
      style_references: [
        'Moebius / Jean Giraud bande dessinée illustration style',
        'modern Marvel concept art by artists like John Cassaday',
        'Mike Mignola Hellboy — bold shadows and graphic shapes',
      ],
      feel: 'expressive, stylized but grounded in real human proportions — same ink weight and color palette every frame',
    },
  },

  studio: {
    label: 'Studio',
    image: '/images/storyboard-presets/studio.png',
    prompt:
      PRESET_PROHIBITIONS +
      'Clean professional studio illustration rendered in a photorealistic style. Controlled three-point lighting setup: warm key light from upper-left, soft fill light from right, subtle rim light separating subject from background. Vibrant but naturalistic color palette with punchy saturation. Composition following rule of thirds with subjects placed at intersection points. Neutral or subtly textured backgrounds — solid gradients or minimal environmental context. Skin tones natural and well-lit with clean shadow falloff. Every element intentional and art-directed. Polished, premium, commercially viable — like a high-end advertising visual. Spatial anchors: subjects positioned clearly in relation to foreground and background elements.',
    jsonStyle: {
      name: 'Professional studio illustration',
      medium: 'photorealistic digital render',
      color_palette: [
        'vibrant naturalistic colors with punchy saturation',
        'neutral or subtly textured backgrounds — solid gradients or minimal environmental context',
      ],
      shading: 'smooth gradient shading with clean shadow falloff, natural well-lit skin tones',
      depth_of_field: 'f/2.0 — subject sharp, background softly blurred but recognizable',
      lighting: 'three-point studio setup: warm key light upper-left, soft fill light from right, subtle rim light separating subject from background',
      rendering: 'rule of thirds composition with subjects at intersection points, all elements intentional and art-directed',
      style_references: [
        'Annie Leibovitz commercial portrait photography',
        'high-end advertising campaigns — clean, premium, controlled',
        'Apple product photography aesthetic — minimal, polished',
      ],
      feel: 'polished, premium, commercially viable — same studio lighting setup and color palette every frame',
    },
  },

  cinematic: {
    label: 'Cinematic',
    image: '/images/storyboard-presets/cinematic.png',
    prompt:
      PRESET_PROHIBITIONS +
      'Cinematic still rendered in the style of 35mm analog filmmaking. Shallow depth of field with creamy bokeh (f/1.4–f/2.0 fast prime). Rich color grading: warm ambers and honey tones in highlights, deep teals in shadows. Motivated practical light sources visible in frame — window light, lamp glow, street light. Subtle analog film grain throughout. Anamorphic lens characteristics: gentle horizontal lens flares, slightly oval bokeh, mild barrel distortion at frame edges. Atmospheric haze or dust particles catching shafts of light. Purposeful negative space. Feels like a still from a Terrence Malick or Roger Deakins production — contemplative, emotionally resonant. Camera language: wide establishing shots, intimate medium close-ups, low-angle perspectives.',
    jsonStyle: {
      name: 'Cinematic 35mm analog film still',
      medium: 'analog film photography aesthetic',
      color_palette: [
        'warm ambers and honey tones in highlights',
        'deep teals in shadows',
        'motivated practical light sources — orange lamp glow, blue window light — visible in frame',
      ],
      shading: 'subtle analog film grain throughout; anamorphic lens characteristics: gentle horizontal lens flares, oval bokeh, mild barrel distortion at frame edges; atmospheric haze and dust particles in light shafts',
      depth_of_field: 'f/1.4 to f/2.0 fast prime — creamy oval bokeh, subject sharply isolated from background',
      lighting: 'motivated practicals: window light, lamp glow, street light visible and sourced within frame; atmospheric haze and dust particles catching shafts of light',
      rendering: 'purposeful negative space, contemplative framing',
      style_references: [
        'Terrence Malick — Days of Heaven (Nestor Almendros cinematography)',
        'Roger Deakins — Blade Runner 2049 and Skyfall color palette',
        'Emmanuel Lubezki natural light work — The Revenant, Gravity',
      ],
      feel: 'contemplative, emotionally resonant — same warm-amber/teal color grade, same film grain, same bokeh every frame',
    },
  },

  watercolor: {
    label: 'Watercolor',
    image: '/images/storyboard-presets/watercolor.png',
    prompt:
      PRESET_PROHIBITIONS +
      'Soft watercolor painting on textured cold-press paper. Translucent washes of muted, harmonious color bleeding organically at wet edges. Granulation effects where pigment pools in paper texture. Warm and cool tones coexist — blues and greens for backgrounds, warm ochres and rose for subjects. Composition suggested rather than rigidly defined: some areas left as bare white paper for breathing room, edges softly dissolving. Consistent loose expressive brushwork throughout — never tight or digital-feeling. Dreamy and atmospheric. Feels like a fine art storyboard from a Hayao Miyazaki pre-production bible. Every frame uses the same paper texture, same color temperature palette, same loose wet-on-wet technique.',
    jsonStyle: {
      name: 'Watercolor painting on cold-press paper',
      medium: 'translucent watercolor washes on textured cold-press paper',
      color_palette: [
        'muted harmonious blues and greens for backgrounds',
        'warm ochres and rose tones for subjects',
        'bare white paper intentionally left in breathing areas',
      ],
      shading: 'granulation where pigment pools in paper texture, wet edges bleeding organically — absolutely never hard or digital edges',
      depth_of_field: 'f/2.0 equivalent — foreground washes richer and more saturated, distance washes paler and more diffuse',
      lighting: 'soft diffused ambient light implied through warm/cool wash relationships — no hard light sources',
      rendering: 'loose expressive brushwork, composition suggested rather than rigidly defined, some areas left as bare white paper, edges softly dissolving',
      style_references: [
        'Hayao Miyazaki and Studio Ghibli pre-production watercolor concept art',
        'Eyvind Earle background paintings — Sleeping Beauty',
        'JMW Turner atmospheric washes — mist and soft dissolving edges',
      ],
      feel: 'dreamy, atmospheric — same cold-press paper texture and wet-on-wet technique every frame',
    },
  },

  noir: {
    label: 'Noir',
    image: '/images/storyboard-presets/noir.png',
    prompt:
      PRESET_PROHIBITIONS +
      'High-contrast black and white film noir. Pure monochrome — no color, no warm or cool tinting, no sepia. Deep inky blacks and blown-out whites with minimal midtone gradation (strong chiaroscuro). Dramatic hard-shadow lighting: venetian blind shadows, single overhead practical bulb, streetlamp shaft of light. Strong Dutch angles and diagonal compositions. Environmental atmosphere: cigarette smoke, rain on glass, fog catching light. Gritty analog film grain. Feels like a still from Double Indemnity or Touch of Evil. Camera language: low-angle shots looking up, tight close-ups on faces, wide shots with dramatic foreground elements. Every frame: same high-contrast monochrome treatment, same grain texture, same hard-shadow technique.',
    jsonStyle: {
      name: 'High-contrast film noir',
      medium: 'pure monochrome — absolute grayscale only',
      color_palette: [
        'pure black',
        'blown-out white',
        'minimal midtone — strong chiaroscuro contrast',
      ],
      strictly_exclude_colors: [
        'any color whatsoever',
        'warm tinting',
        'cool blue tinting',
        'sepia tone',
        'blue-black',
        'brown-black — pure neutral grayscale only',
      ],
      shading: 'deep inky blacks, minimal midtone gradation, gritty analog film grain throughout',
      depth_of_field: 'f/2.0 — sharp subject contrasted against deep black or blown-out white background',
      lighting: 'hard dramatic shadows: venetian blind shadow patterns, single overhead practical bulb, streetlamp shaft cutting through darkness; atmosphere: cigarette smoke, rain on glass, fog catching shafts of light',
      rendering: 'Dutch angles and diagonal compositions for tension, low-angle shots looking up, tight close-ups on faces',
      style_references: [
        'Double Indemnity (1944) — Billy Wilder / John F. Seitz cinematography',
        "Touch of Evil (1958) — Orson Welles' extreme angles and shadows",
        "Carol Reed's The Third Man — zither, sewers, shadows",
        'Weegee crime photography — harsh flash, deep shadow',
      ],
      feel: 'same high-contrast monochrome treatment, same film grain texture, same hard-shadow technique every frame',
    },
  },

  documentary: {
    label: 'Documentary',
    image: '/images/storyboard-presets/documentary.png',
    prompt:
      PRESET_PROHIBITIONS +
      'Observational documentary photography illustration. Available natural light only — no studio setups, no artificial fill. Slightly desaturated, true-to-life color palette with honest, unmanipulated tones. Medium depth of field keeping both subject and surrounding environment readable. Candid, unposed compositions that feel captured in the moment rather than staged. Subtle motion blur on peripheral elements suggesting real-time observation. Wide-angle lens with mild barrel distortion. Camera language: handheld-feel framing with slight horizon tilt, subjects caught mid-action, environment providing context. Feels like Werner Herzog or Frederick Wiseman — deeply human, fly-on-the-wall. Every frame: same desaturated palette, same available-light quality, same candid composition approach.',
    jsonStyle: {
      name: 'Observational documentary photography illustration',
      medium: 'available natural light photography aesthetic',
      color_palette: [
        'slightly desaturated true-to-life colors',
        'honest unmanipulated tones — no color grading, no correction',
      ],
      shading: 'subtle motion blur on peripheral elements suggesting real-time movement and observation',
      depth_of_field: 'f/2.0 — medium depth, both subject and surrounding environment readable and in context',
      lighting: 'available natural light only — no studio setups, no artificial fill lights, no motivated practicals added in post',
      rendering: 'candid unposed compositions catching subjects mid-action, wide-angle lens with mild barrel distortion, handheld-feel framing with slight horizon tilt, environment providing human context',
      style_references: [
        'Werner Herzog observational documentary style — Grizzly Man, Cave of Forgotten Dreams',
        'Frederick Wiseman fly-on-the-wall cinema — Titicut Follies, Hospital',
        'Henri Cartier-Bresson decisive moment photography — unposed, candid, expressive',
      ],
      feel: 'deeply human, fly-on-the-wall observation — same desaturated palette and available-light quality every frame',
    },
  },

  anime: {
    label: 'Anime',
    image: '/images/storyboard-presets/anime.png',
    prompt:
      PRESET_PROHIBITIONS +
      'High-quality theatrical anime key frame illustration. Clean, precise linework with consistent medium line weight throughout. Vibrant saturated color palette with smooth gradient cel-shading — warm ambient occlusion in shadow areas, bright specular highlights. Detailed backgrounds with atmospheric perspective: foreground elements crisp, distance elements soft and desaturated. Expressive character features. Dynamic lighting: visible soft light rays, gentle bloom on highlights, environmental color cast from light sources. Feels like a key frame from Studio Ghibli, Makoto Shinkai, or Ufotable. Camera language: wide environmental establishing shots, medium character shots, dramatic low-angle hero shots. Every frame: same linework weight, same color saturation level, same cel-shading technique.',
    jsonStyle: {
      name: 'Theatrical anime key frame illustration',
      medium: 'clean digital linework with smooth gradient cel-shading',
      color_palette: [
        'vibrant saturated colors',
        'warm ambient occlusion tones in shadow areas',
        'bright sharp specular highlights',
      ],
      line_weight: 'precise consistent medium line weight throughout — zero variation in stroke weight',
      shading: 'smooth gradient cel-shading with soft shadow edges and ambient occlusion warmth',
      depth_of_field: 'f/2.0 equivalent — foreground characters crisp and sharp, background detailed but softened with atmospheric perspective (desaturated at distance)',
      lighting: 'dynamic: soft visible light rays, gentle bloom glow on highlights, environmental color cast from practical light sources in scene',
      rendering: 'foreground elements crisp and sharply detailed, distance elements progressively softer and more desaturated; expressive character facial features',
      style_references: [
        'Studio Ghibli key frame paintings — My Neighbor Totoro, Princess Mononoke',
        'Makoto Shinkai — Your Name, Weathering With You (hyperdetailed atmospheric backgrounds)',
        'Ufotable — Demon Slayer, Fate/Zero (cinematic lighting and bloom effects)',
      ],
      feel: 'same precise linework weight, same color saturation level, same cel-shading technique every frame',
    },
  },
};
