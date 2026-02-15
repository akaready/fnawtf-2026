import { NextResponse } from 'next/server';

/**
 * GET /api/projects/featured
 * Returns featured projects for the homepage
 */
export async function GET() {
  // Mock data - will be replaced with Supabase query
  const featuredProjects = [
    { 
      id: '1', 
      title: 'Aurora Rising', 
      subtitle: 'Brand Documentary', 
      slug: 'aurora-rising', 
      thumbnail_url: '/images/projects/placeholder.svg',
      category: 'Documentary'
    },
    { 
      id: '2', 
      title: 'Nexus Launch', 
      subtitle: 'Product Launch Video', 
      slug: 'nexus-launch', 
      thumbnail_url: '/images/projects/placeholder.svg',
      category: 'Commercial'
    },
    { 
      id: '3', 
      title: 'Horizon Studios', 
      subtitle: 'Brand Campaign', 
      slug: 'horizon-studios', 
      thumbnail_url: '/images/projects/placeholder.svg',
      category: 'Campaign'
    },
    { 
      id: '4', 
      title: 'Velocity', 
      subtitle: 'Sports Documentary', 
      slug: 'velocity', 
      thumbnail_url: '/images/projects/placeholder.svg',
      category: 'Documentary'
    },
    { 
      id: '5', 
      title: 'Synthwave', 
      subtitle: 'Music Video', 
      slug: 'synthwave', 
      thumbnail_url: '/images/projects/placeholder.svg',
      category: 'Music Video'
    },
    { 
      id: '6', 
      title: 'Ember', 
      subtitle: 'Fashion Campaign', 
      slug: 'ember', 
      thumbnail_url: '/images/projects/placeholder.svg',
      category: 'Campaign'
    }
  ];

  return NextResponse.json(featuredProjects);
}
