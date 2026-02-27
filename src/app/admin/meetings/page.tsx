import { getMeetings, getMeetingsConfig, getClients, getContacts } from '../actions';
import { MeetingsManager } from '../_components/MeetingsManager';

export const dynamic = 'force-dynamic';

export default async function MeetingsPage() {
  const [meetings, config, clients, contacts] = await Promise.all([
    getMeetings().catch(() => []),
    getMeetingsConfig().catch(() => null),
    getClients(),
    getContacts(),
  ]);

  return (
    <MeetingsManager
      initialMeetings={meetings}
      config={config}
      clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      contacts={contacts.map((c) => ({
        id: c.id,
        first_name: c.first_name ?? '',
        last_name: c.last_name ?? '',
      }))}
    />
  );
}
