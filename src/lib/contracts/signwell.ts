const SIGNWELL_BASE = 'https://www.signwell.com/api/v1';

function getApiKey(): string {
  const key = process.env.SIGNWELL_API_KEY;
  if (!key) throw new Error('SIGNWELL_API_KEY environment variable is not set');
  return key;
}

function isTestMode(): boolean {
  return process.env.SIGNWELL_TEST_MODE === 'true' || process.env.NODE_ENV === 'development';
}

async function signwellFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${SIGNWELL_BASE}${path}`, {
    ...options,
    headers: {
      'X-Api-Key': getApiKey(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SignWell API error (${res.status}): ${body}`);
  }
  return res;
}

export async function createSignWellDocument(params: {
  title: string;
  pdfBase64: string;
  signers: Array<{ id: string; name: string; email: string }>;
  expiresInDays?: number;
}): Promise<{ documentId: string; signerIds: Record<string, string> }> {
  const res = await signwellFetch('/documents/', {
    method: 'POST',
    body: JSON.stringify({
      test_mode: isTestMode(),
      name: params.title,
      subject: `Please sign: ${params.title}`,
      message: 'Please review and sign the attached contract.',
      files: [
        {
          name: `${params.title}.pdf`,
          file_base64: params.pdfBase64,
        },
      ],
      recipients: params.signers.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
      })),
      expires_in: params.expiresInDays || 30,
      reminders: true,
    }),
  });

  const data = await res.json();
  const signerIds: Record<string, string> = {};
  if (data.recipients) {
    for (const recipient of data.recipients) {
      // Match our signer ID to the SignWell recipient ID
      const matchedSigner = params.signers.find(
        (s) => s.email === recipient.email
      );
      if (matchedSigner) {
        signerIds[matchedSigner.id] = recipient.id;
      }
    }
  }

  return {
    documentId: data.id,
    signerIds,
  };
}

export async function getSignWellDocumentStatus(documentId: string): Promise<{
  status: string;
  signers: Array<{
    id: string;
    email: string;
    status: string;
    signedAt: string | null;
    viewedAt: string | null;
  }>;
  completedPdfUrl: string | null;
}> {
  const res = await signwellFetch(`/documents/${documentId}`);
  const data = await res.json();

  return {
    status: data.status,
    signers: (data.recipients || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      email: r.email,
      status: r.status,
      signedAt: r.signed_at || null,
      viewedAt: r.viewed_at || null,
    })),
    completedPdfUrl: data.completed_pdf_url || null,
  };
}

export async function voidSignWellDocument(documentId: string): Promise<void> {
  await signwellFetch(`/documents/${documentId}`, {
    method: 'DELETE',
  });
}
