'use client';

import { forwardRef, CSSProperties, useRef, useEffect } from 'react';
import gsap from 'gsap';

interface NavLogoProps {
  className?: string;
  style?: CSSProperties;
}

export const NavLogo = forwardRef<HTMLAnchorElement, NavLogoProps>(
  ({ className = '', style }, ref) => {
    const fillRef = useRef<HTMLDivElement>(null);
    const svgPathRef = useRef<SVGPathElement>(null);

    useEffect(() => {
      const logo = ref && typeof ref === 'object' ? ref.current : null;
      if (!logo || !fillRef.current || !svgPathRef.current) return;

      const fill = fillRef.current;
      const svgPath = svgPathRef.current;

      const handleMouseEnter = (e: MouseEvent) => {
        if (!fill) return;

        const rect = logo.getBoundingClientRect();
        const x = (e.clientX || e.pageX) - rect.left;
        const direction = x < rect.width / 2 ? 'left' : 'right';

        gsap.killTweensOf([fill, svgPath]);

        if (direction === 'left') {
          gsap.fromTo(
            fill,
            { scaleX: 0, transformOrigin: '0 50%' },
            { scaleX: 1, duration: 0.3, ease: 'power2.out' }
          );
        } else {
          gsap.fromTo(
            fill,
            { scaleX: 0, transformOrigin: '100% 50%' },
            { scaleX: 1, duration: 0.3, ease: 'power2.out' }
          );
        }

        // Animate SVG fill color from white to black
        if (svgPath) {
          gsap.to(svgPath, { fill: '#000000', duration: 0.3, ease: 'power2.out' });
        }
      };

      const handleMouseLeave = () => {
        gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });

        // Animate SVG fill color back to white
        if (svgPath) {
          gsap.to(svgPath, { fill: '#ffffff', duration: 0.3, ease: 'power2.out' });
        }
      };

      logo.addEventListener('mouseenter', handleMouseEnter);
      logo.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        logo.removeEventListener('mouseenter', handleMouseEnter);
        logo.removeEventListener('mouseleave', handleMouseLeave);
      };
    }, [ref]);

    return (
      <a
        ref={ref}
        href="/"
        className={`inline-flex items-center justify-center group ${className}`}
        style={style}
        aria-label="Friends 'n Allies - Home"
      >
        <div className="relative w-14 h-14 bg-black rounded-full flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-[1.08] group-active:scale-[0.92] border border-gray-600 overflow-hidden">
          {/* Fill element for directional animation */}
          <div
            ref={fillRef}
            className="absolute inset-0 bg-white rounded-full pointer-events-none"
            style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
          />

          <svg
            width="28"
            height="37"
            viewBox="0 0 129 168"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10"
          >
            <path
              ref={svgPathRef}
              fillRule="evenodd"
              clipRule="evenodd"
              d="M125.928 77.76L125.518 77.71L78.0582 73.72L69.0882 72.97L62.3482 72.4L53.0582 59.99L74.3782 53.97L125.228 39.62C126.928 39.14 127.928 37.38 127.448 35.67L117.078 2.26C116.558 0.57 114.758 -0.38 113.068 0.14L16.6982 29.12C15.0182 29.62 14.0482 31.39 14.5382 33.08L20.7482 54.53L19.0682 64.56L17.4482 74.26L0.0682187 157.69C-0.291781 159.42 0.808219 161.11 2.53822 161.48L2.73822 161.52L46.6382 167.81C48.3882 168.06 50.0182 166.85 50.2682 165.1L58.9482 115.63L118.298 121.25C120.038 121.42 121.588 120.17 121.798 118.45L128.518 81.48C128.838 79.75 127.678 78.08 125.938 77.76H125.928ZM34.7382 77.42C34.5582 80.38 32.0182 82.64 29.0582 82.46C26.0982 82.28 23.8382 79.74 24.0182 76.78C24.1982 73.82 26.7382 71.56 29.6982 71.74C32.6582 71.92 34.9182 74.46 34.7382 77.42ZM37.1382 57.32C36.9582 60.28 34.4182 62.54 31.4582 62.36C28.4982 62.18 26.2382 59.64 26.4182 56.68C26.5982 53.72 29.1382 51.46 32.0982 51.64C35.0582 51.82 37.3182 54.36 37.1382 57.32ZM57.4982 79.23C57.3182 82.19 54.7782 84.45 51.8182 84.27C48.8582 84.09 46.5982 81.55 46.7782 78.59C46.9582 75.63 49.4982 73.37 52.4582 73.55C55.4182 73.73 57.6782 76.27 57.4982 79.23Z"
              fill="white"
            />
          </svg>
        </div>
      </a>
    );
  }
);

NavLogo.displayName = 'NavLogo';
