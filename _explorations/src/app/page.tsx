"use client";

import { useState, useEffect } from "react";
import { Inter, Manrope, Space_Grotesk, Space_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const manrope = Manrope({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });

// --- COMPONENTS ---

const Toggle = ({
  isOn,
  onToggle,
}: {
  isOn: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-all"
  >
    <span className={isOn ? "text-purple-400" : "text-gray-400"}>Demo</span>
    <div className="w-10 h-5 bg-gray-700 rounded-full relative transition-colors">
      <div
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-purple-500 rounded-full transition-transform ${
          isOn ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </div>
    <span className={!isOn ? "text-purple-400" : "text-gray-400"}>Landing</span>
  </button>
);

const LogoWall = () => (
  <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
    {["TIDBYT", "SONY", "PATREON", "NOTION", "VIMEO"].map((logo) => (
      <span key={logo} className="text-2xl font-light tracking-widest text-white/40">
        {logo}
      </span>
    ))}
  </div>
);

const Marquee = () => (
  <div className="w-full overflow-hidden py-6 border-y border-white/5 bg-black/40">
    <div className="whitespace-nowrap animate-marquee flex gap-8">
      {[...Array(10)].map((_, i) => (
        <span key={i} className="text-lg font-mono text-purple-400/60">
          VIDEO PRODUCTION • DIGITAL STORYTELLING • BRANDING •
        </span>
      ))}
    </div>
  </div>
);

const ProjectCard = ({
  title,
  category,
  imageClass,
}: {
  title: string;
  category: string;
  imageClass: string;
}) => (
  <div className="group relative aspect-[4/3] overflow-hidden bg-gray-900 cursor-pointer">
    <div
      className={`absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black/80 group-hover:opacity-0 transition-opacity duration-500 ${imageClass}`}
    />
    <div className="absolute inset-0 flex flex-col justify-end p-6">
      <span className="text-xs font-mono text-purple-400 mb-2 uppercase tracking-widest">
        {category}
      </span>
      <h3 className="text-2xl font-light text-white">{title}</h3>
    </div>
  </div>
);

const MinimalNav = () => (
  <nav className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-8 py-6 mix-blend-difference text-white">
    <div className="text-xl font-bold tracking-tighter">FNA.WTF</div>
    <div className="flex gap-8 text-sm font-medium">
      <a href="#" className="hover:text-purple-400 transition-colors">Work</a>
      <a href="#" className="hover:text-purple-400 transition-colors">About</a>
      <a href="#" className="hover:text-purple-400 transition-colors">Contact</a>
    </div>
  </nav>
);

const HeroSection = () => (
  <section className="min-h-screen flex flex-col justify-center px-8 md:px-20 pt-32 pb-20 relative">
    <div className="max-w-5xl z-10">
      <h1 className="text-5xl md:text-8xl font-medium leading-[0.9] tracking-tight text-white mb-8">
        We craft visual stories for <span className="text-purple-500">ambitious brands</span>.
      </h1>
      <p className="text-xl text-gray-400 max-w-2xl font-light leading-relaxed">
        Friends 'n Allies is a video production agency helping founders communicate their vision through cinematic storytelling.
      </p>
    </div>
    <div className="absolute bottom-20 right-20 flex items-center gap-4 text-sm font-mono text-gray-500">
      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
      BASED IN LA • AVAILABLE WORLDWIDE
    </div>
  </section>
);

const ProjectsSection = () => (
  <section className="px-8 md:px-20 py-24">
    <div className="mb-16 flex justify-between items-end border-b border-white/10 pb-8">
      <h2 className="text-3xl md:text-4xl font-light text-white">Selected Work</h2>
      <a href="#" className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
        View All Projects &rarr;
      </a>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <ProjectCard title="Tidbyt Gen 2" category="Commercial" imageClass="bg-purple-900" />
      <ProjectCard title="Linear Launch" category="Product Launch" imageClass="bg-indigo-900" />
      <ProjectCard title="Notion Culture" category="Documentary" imageClass="bg-violet-900" />
      <ProjectCard title="Patreon Creator" category="Brand Film" imageClass="bg-fuchsia-900" />
      <ProjectCard title="Sony Alpha" category="Tutorial" imageClass="bg-rose-900" />
      <ProjectCard title="Vimeo Rebrand" category="Campaign" imageClass="bg-red-900" />
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-black text-white py-24 px-8 md:px-20 border-t border-white/10">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="col-span-1 md:col-span-2">
        <h2 className="text-3xl font-bold mb-6 tracking-tighter">Let's create together.</h2>
        <a href="mailto:hello@fna.wtf" className="text-2xl md:text-4xl font-light text-purple-500 hover:text-purple-400 transition-colors">
          hello@fna.wtf
        </a>
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Socials</h3>
        <ul className="space-y-4 text-gray-400">
          <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
          <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Office</h3>
        <p className="text-gray-400 leading-relaxed">
          Los Angeles, CA<br />
          Available for travel worldwide
        </p>
      </div>
    </div>
    <div className="mt-20 pt-8 border-t border-white/5 flex justify-between text-sm text-gray-600 font-mono">
      <span>© 2026 FNA.WTF</span>
      <span>ALL RIGHTS RESERVED</span>
    </div>
  </footer>
);

// --- DEMO EXPLORATION VIEW ---

const AestheticTab = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 text-sm font-medium transition-all border-b-2 ${
      active
        ? "border-purple-500 text-white"
        : "border-transparent text-gray-500 hover:text-gray-300"
    }`}
  >
    {label}
  </button>
);

const AestheticPanel = ({ id }: { id: string }) => {
  // Shared styles
  const containerClass =
    "flex flex-col gap-8 p-8 rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm min-h-[300px]";
  const buttonClass =
    "px-6 py-3 rounded-md font-medium transition-all border border-white/20 hover:bg-white/10";
  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors";

  // Aesthetic specific overrides
  if (id === "minimal") {
    return (
      <div className={containerClass}>
        <div className="flex gap-4">
          <button className="bg-white text-black px-6 py-3 rounded-sm font-medium hover:bg-gray-200 transition-colors">
            Get Started
          </button>
          <button className="text-white px-6 py-3 rounded-sm font-medium hover:text-purple-400 transition-colors">
            Learn More
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Email Address</label>
          <input type="email" className={inputClass} placeholder="you@company.com" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white/5 rounded-sm border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (id === "glass") {
    return (
      <div className={`${containerClass} border-white/20 bg-white/5 backdrop-blur-xl`}>
        <button className="bg-white/10 border border-white/20 text-white px-6 py-3 rounded-full backdrop-blur-md hover:bg-white/20 transition-all">
          Explore Collection
        </button>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-2 flex-1 bg-gradient-to-r from-purple-500/20 to-transparent rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (id === "brutal") {
    return (
      <div className={`${containerClass} border-2 border-white bg-black`}>
        <button className="bg-purple-600 text-white px-8 py-4 text-xl font-bold border-b-4 border-purple-900 active:border-b-0 active:translate-y-1 transition-all">
          INITIALIZE
        </button>
        <div className="font-mono text-xs space-y-2 text-gray-400">
          <div>{`> SYSTEM_READY`}</div>
          <div>{`> CONNECTING...`}</div>
        </div>
      </div>
    );
  }

  // Default
  return (
    <div className={containerClass}>
      <button className={buttonClass}>Primary Action</button>
      <div className="w-full h-32 bg-gradient-to-br from-purple-900/20 to-black/40 rounded-lg border border-white/5" />
    </div>
  );
};

export default function Home() {
  const [mode, setMode] = useState<"landing" | "demo">("landing");
  const [activeAesthetic, setActiveAesthetic] = useState("minimal");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (mode === "demo") {
    return (
      <div className={`min-h-screen bg-black text-white ${inter.className} selection:bg-purple-500/30`}>
        <Toggle isOn={true} onToggle={() => setMode("landing")} />

        <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex overflow-x-auto scrollbar-hide">
            {["minimal", "glass", "brutal", "neo", "cyber", "mono", "retro"].map((a) => (
              <AestheticTab
                key={a}
                label={a.toUpperCase()}
                active={activeAesthetic === a}
                onClick={() => setActiveAesthetic(a)}
              />
            ))}
          </div>
        </header>

        <main className="p-8 md:p-20">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4 capitalize">{activeAesthetic} Aesthetic</h1>
            <p className="text-gray-400 max-w-xl">
              Explore the UI elements and interactions defined for this visual system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-mono text-purple-400 mb-4 uppercase">Components</h3>
              <AestheticPanel id={activeAesthetic} />
            </div>
            <div>
               <h3 className="text-sm font-mono text-purple-400 mb-4 uppercase">Interactions</h3>
               <div className="p-8 border border-dashed border-white/20 rounded-xl flex items-center justify-center text-gray-500 text-sm">
                  Interaction Demos (Hover/Scroll)
               </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // LANDING PAGE MODE
  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30 ${manrope.className}`}>
      <Toggle isOn={false} onToggle={() => setMode("demo")} />
      <MinimalNav />

      <main>
        <HeroSection />
        <Marquee />
        <LogoWall />
        <ProjectsSection />
      </main>

      <Footer />
    </div>
  );
}
