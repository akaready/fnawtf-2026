const RECALL_BASE = `https://${process.env.RECALL_REGION || 'us-east-1'}.recall.ai/api/v1`;

function headers() {
  return {
    Authorization: `Token ${process.env.RECALL_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function createRecallBot(params: {
  meeting_url: string;
  bot_name?: string;
  join_at?: string;
}) {
  const res = await fetch(`${RECALL_BASE}/bot/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      meeting_url: params.meeting_url,
      bot_name: params.bot_name || 'FNA.wtf Meeting Bot',
      bot_image: 'https://fna.wtf/images/logo/fna-logo.svg',
      join_at: params.join_at,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Recall createBot failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getRecallBot(botId: string) {
  const res = await fetch(`${RECALL_BASE}/bot/${botId}/`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Recall getBot failed: ${res.status}`);
  return res.json();
}

/** Kick off async transcription for a recording (step 4 in the docs) */
export async function createAsyncTranscript(recordingId: string) {
  const res = await fetch(
    `${RECALL_BASE}/recording/${recordingId}/create_transcript/`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        provider: {
          recallai_async: {
            language_code: 'en',
          },
        },
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Recall createAsyncTranscript failed: ${res.status} ${text}`);
  }
  return res.json();
}

/** Fetch a completed transcript by its ID (step 6 in the docs) */
export async function getTranscript(transcriptId: string) {
  const res = await fetch(`${RECALL_BASE}/transcript/${transcriptId}/`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Recall getTranscript failed: ${res.status}`);
  return res.json();
}

/** Download transcript data from the pre-signed URL */
export async function downloadTranscript(downloadUrl: string) {
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Failed to download transcript: ${res.status}`);
  return res.json();
}

export async function deleteRecallBot(botId: string) {
  const res = await fetch(`${RECALL_BASE}/bot/${botId}/`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Recall deleteBot failed: ${res.status}`);
  }
}
