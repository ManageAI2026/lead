import { getSessionContext, getMembers } from '@/lib/data';
import { initialsOf } from '@/components/dashboard/shared';
import { SettingsClient } from '@/components/dashboard/SettingsClient';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

function localPart(email: string): string {
  return email.split('@')[0] ?? email;
}

/**
 * Settings screen. Server component: loads the signed-in user + org, maps the
 * member list into a presentational view-model, then hands off to the client
 * component that owns tab state and the save wiring. Never crashes when the
 * user has no org — falls back to the Profile tab from the session identity.
 */
export default async function SettingsPage() {
  const ctx = await getSessionContext();

  const email = ctx?.email ?? '';
  const profile = {
    name: ctx?.member?.name ?? localPart(email),
    email,
  };
  const orgName = ctx?.org?.name ?? '';

  const rawMembers = ctx?.org ? await getMembers(ctx.org.id) : [];
  const members = rawMembers.map((m) => {
    const displayName = m.name ?? localPart(m.email);
    return {
      name: displayName,
      role: ROLE_LABEL[m.role] ?? m.role,
      you: !!ctx && m.userId === ctx.userId,
      initials: initialsOf(displayName),
    };
  });

  return <SettingsClient profile={profile} orgName={orgName} members={members} />;
}
