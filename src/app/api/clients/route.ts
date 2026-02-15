import { NextResponse } from 'next/server';

/**
 * GET /api/clients
 * Returns a list of clients
 */
export async function GET() {
  // Mock data - will be replaced with Supabase query
  const clients = [
    { id: '1', name: 'Stripe', logo_url: '/images/clients/stripe.svg' },
    { id: '2', name: 'Notion', logo_url: '/images/clients/notion.svg' },
    { id: '3', name: 'Linear', logo_url: '/images/clients/linear.svg' },
    { id: '4', name: 'Vercel', logo_url: '/images/clients/vercel.svg' },
    { id: '5', name: 'Figma', logo_url: '/images/clients/figma.svg' },
    { id: '6', name: 'Webflow', logo_url: '/images/clients/webflow.svg' },
    { id: '7', name: 'Framer', logo_url: '/images/clients/framer.svg' },
    { id: '8', name: 'Raycast', logo_url: '/images/clients/raycast.svg' }
  ];

  return NextResponse.json(clients);
}
