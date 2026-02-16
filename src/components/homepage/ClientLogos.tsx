/**
 * Client Logos Section
 * Grid of client logos with cycling fade animation
 * Implements: resources/logo-wall-cycle.md
 */

import { ClientLogosCycle } from './ClientLogosCycle';

export async function ClientLogos() {
  // Using local logo files from /public/images/clients/
  // When Supabase is configured, replace with:
  // const supabase = createClient();
  // const { data: clients } = await supabase
  //   .from('clients')
  //   .select('id, name, logo_url')
  //   .order('name');

  const clients = [
    { id: '1', name: 'Cal Water', logoUrl: '/images/clients/cal-water.png' },
    { id: '2', name: 'Couples Institute', logoUrl: '/images/clients/couples-institute.png' },
    { id: '3', name: 'Crave', logoUrl: '/images/clients/crave.png' },
    { id: '4', name: 'Daily Grill', logoUrl: '/images/clients/daily-grill.png' },
    { id: '5', name: 'Dell', logoUrl: '/images/clients/dell.png' },
    { id: '6', name: 'Designer Pages', logoUrl: '/images/clients/designer-pages.png' },
    { id: '7', name: 'Epson', logoUrl: '/images/clients/epson.png' },
    { id: '8', name: 'ERI', logoUrl: '/images/clients/eri-logo.png' },
    { id: '9', name: 'KEY', logoUrl: '/images/clients/key-logo.png' },
    { id: '10', name: 'Light Pong', logoUrl: '/images/clients/light-pong.png' },
    { id: '11', name: 'Lumen', logoUrl: '/images/clients/lumen.png' },
    { id: '12', name: 'Lumos', logoUrl: '/images/clients/lumos.png' },
    { id: '13', name: 'Lynx', logoUrl: '/images/clients/lynx-1.png' },
    { id: '14', name: 'Monterey Bay Aquarium', logoUrl: '/images/clients/monteray-bay-aquarium.png' },
    { id: '15', name: 'New Holland', logoUrl: '/images/clients/new-holland.png' },
    { id: '16', name: 'Nine Arches', logoUrl: '/images/clients/nine-arches.png' },
    { id: '17', name: 'Octopus Camera', logoUrl: '/images/clients/octopus-camera.png' },
    { id: '18', name: 'Omega Events', logoUrl: '/images/clients/omega-events.png' },
    { id: '19', name: 'Planned Parenthood', logoUrl: '/images/clients/planned-parenthood.png' },
    { id: '20', name: 'Samsung', logoUrl: '/images/clients/samsung.png' },
  ];

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Trusted by Founders
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We partner with visionary founders and ambitious teams to bring their stories to life through compelling visual content.
          </p>
        </div>

        <ClientLogosCycle clients={clients} />
      </div>
    </section>
  );
}
