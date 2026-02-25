import { getContacts } from '../actions';
import { ContactsManager } from '../_components/ContactsManager';

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const contacts = await getContacts();

  return <ContactsManager initialContacts={contacts} />;
}
