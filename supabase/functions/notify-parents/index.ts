// Supabase Edge Function: notify-parents
//
// Triggered by a Database Webhook on INSERT into `parent_updates`. Looks up the
// guardian's Expo push token plus the session note + player name, then sends a
// push via Expo's API.
//
// Deploy:
//   supabase functions deploy notify-parents
// Then create a Database Webhook (Dashboard -> Database -> Webhooks):
//   table: parent_updates, events: INSERT, type: Supabase Edge Function,
//   function: notify-parents.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface WebhookPayload {
  type: 'INSERT';
  record: {
    id: string;
    session_id: string;
    player_id: string;
    guardian_id: string;
  };
}

Deno.serve(async (req) => {
  try {
    const { record } = (await req.json()) as WebhookPayload;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Guardian's push token.
    const { data: guardian } = await admin
      .from('profiles')
      .select('push_token')
      .eq('id', record.guardian_id)
      .single();

    if (!guardian?.push_token) {
      return new Response('no token', { status: 200 });
    }

    // Session + player context for the message body.
    const { data: session } = await admin
      .from('sessions')
      .select('notes, focus_areas, players(full_name)')
      .eq('id', record.session_id)
      .single();

    const playerName =
      (session?.players as { full_name?: string } | null)?.full_name ?? 'your player';
    const body =
      session?.notes ||
      (session?.focus_areas?.length
        ? `Worked on ${session.focus_areas.join(', ')}`
        : 'A new session was logged.');

    const message = {
      to: guardian.push_token,
      sound: 'default',
      title: `New update for ${playerName}`,
      body,
      data: { sessionId: record.session_id },
    };

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return new Response(await res.text(), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
