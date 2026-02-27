import { getRoles } from '../actions';
import { RolesPageClient } from './_components/RolesPageClient';

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  const roles = await getRoles();
  return <RolesPageClient initialRoles={roles} />;
}
