import { getContacts, getClients, getProjectList, getContactProjectMap, getAllRoles, getContactRoleMap } from '../actions';
import { ContactsManager } from '../_components/ContactsManager';

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const [contacts, companies, projects, contactProjectMap, roles, contactRoleMap] = await Promise.all([
    getContacts(),
    getClients(),
    getProjectList(),
    getContactProjectMap(),
    getAllRoles(),
    getContactRoleMap(),
  ]);

  return (
    <ContactsManager
      initialContacts={contacts}
      companies={companies}
      projects={projects}
      contactProjectMap={contactProjectMap}
      roles={roles}
      contactRoleMap={contactRoleMap}
    />
  );
}
