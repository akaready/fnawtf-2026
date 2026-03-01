import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StyleGuideClient } from './_components/StyleGuideClient';

export default async function StyleGuidePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || session.user.email !== 'ready@fna.wtf') {
    redirect('/admin');
  }

  return <StyleGuideClient />;
}
