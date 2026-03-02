import { NextResponse } from 'next/server';
import { handleSignWellWebhook } from '@/lib/contracts/actions';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // SignWell sends events with event_type and data fields
    const eventType = body.event_type || body.event;
    const documentId = body.data?.document?.id || body.document_id;
    const signerData = body.data?.recipient || body.signer;

    if (!eventType || !documentId) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    await handleSignWellWebhook({
      event_type: eventType,
      document_id: documentId,
      signer: signerData
        ? { id: signerData.id, email: signerData.email }
        : undefined,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('SignWell webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
