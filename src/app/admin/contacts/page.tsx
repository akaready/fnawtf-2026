import { getContacts, getClients } from '../actions';
import { ContactsManager } from '../_components/ContactsManager';

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const [contacts, companies] = await Promise.all([getContacts(), getClients()]);

  return <ContactsManager initialContacts={contacts} companies={companies} />;
}
