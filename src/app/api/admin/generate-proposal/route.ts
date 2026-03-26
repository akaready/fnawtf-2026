import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateProposalFromIntake } from '@/lib/proposal/generateFromIntake';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { intakeId } = body as { intakeId: string };
  if (!intakeId) return NextResponse.json({ error: 'intakeId is required' }, { status: 400 });

  try {
    const proposalId = await generateProposalFromIntake(intakeId, user.id);
    return NextResponse.json({ proposalId });
  } catch (err) {
    console.error('[generate-proposal]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
