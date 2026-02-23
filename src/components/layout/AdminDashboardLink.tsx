'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * Shows an "Admin Dashboard" link in the footer when the user
 * is logged in as an admin. Renders nothing otherwise.
 */
export function AdminDashboardLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsAdmin(true);
    });
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin/projects"
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
    >
      <LayoutGrid className="w-4 h-4" />
      Admin
    </Link>
  );
}
