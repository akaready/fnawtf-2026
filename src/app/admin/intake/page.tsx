import { getIntakeSubmissions, getClients, getContacts } from '../actions';
import { IntakePageClient } from './_components/IntakePageClient';

export const dynamic = 'force-dynamic';

export default async function IntakePage() {
  const [submissions, clients, contacts] = await Promise.all([
    getIntakeSubmissions(),
    getClients(),
    getContacts(),
  ]);

  return (
    <IntakePageClient
      submissions={submissions}
      clients={clients}
      contacts={contacts}
    />
  );
}
