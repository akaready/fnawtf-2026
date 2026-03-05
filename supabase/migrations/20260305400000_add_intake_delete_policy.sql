-- Add missing DELETE policy for intake_submissions
-- (RLS was enabled but only INSERT/SELECT/UPDATE policies existed)
create policy "Authenticated users can delete intake submissions"
  on public.intake_submissions
  for delete
  to authenticated
  using (true);
