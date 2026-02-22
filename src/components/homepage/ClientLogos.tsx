/**
 * Client Logos Section
 * Grid of client logos with cycling fade animation
 * Implements: resources/logo-wall-cycle.md
 */

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';
import { ClientLogosCycle } from './ClientLogosCycle';

type ClientRow = Pick<Database['public']['Tables']['clients']['Row'], 'id' | 'name' | 'logo_url'>;

export async function ClientLogos() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('clients')
    .select('id, name, logo_url')
    .not('logo_url', 'is', null)
    .order('name');

  const clients = ((data ?? []) as ClientRow[]).map((c) => ({
    id: c.id,
    name: c.name,
    logoUrl: c.logo_url as string,
  }));

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Trusted by Founders
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We partner with ambitious teams to bring their unique stories to life.
          </p>
        </div>

        <ClientLogosCycle clients={clients} />
      </div>
    </section>
  );
}
