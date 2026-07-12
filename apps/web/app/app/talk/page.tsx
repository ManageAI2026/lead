import { getSessionContext, getTalkMessages, type TalkMessage } from '@/lib/data';
import { TalkClient } from '@/components/dashboard/TalkClient';

export const dynamic = 'force-dynamic';

/**
 * Talk screen. Server component: loads the signed-in user + org, then the org's
 * persisted Operator conversation. Hands the initial messages to the client,
 * which owns the composer, the demo build-task card, and the changelog rail.
 * Never crashes when the user has no org — renders an empty chat.
 */
export default async function TalkPage() {
  const ctx = await getSessionContext();
  const messages: TalkMessage[] = ctx?.org ? await getTalkMessages(ctx.org.id) : [];
  return <TalkClient messages={messages} />;
}
