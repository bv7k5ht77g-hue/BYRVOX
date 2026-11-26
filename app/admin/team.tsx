'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Link2, UserPlus } from 'lucide-react';
import { NEWSROOM_URL } from '../../lib/site-url';

import type { NewsroomRole } from '../../lib/access';
type MemberRole = Exclude<NewsroomRole, 'owner'>;
type Member = { email: string; role: MemberRole; acceptedAt: string | null; createdAt: string };
type Team = { members: Member[]; owners: string[] };
export const roleNames: Record<NewsroomRole,string> = {
  owner: 'Propriétaire', approver: 'Approbateur', contributor: 'Contributeur',
};

async function getTeam(signal?: AbortSignal): Promise<Team> {
  const response = await fetch('/api/newsroom/team', {cache:'no-store', signal});
  if (!response.ok) throw Error('Impossible de charger les accès de la rédaction.');
  return response.json();
}

function RoleOptions() {
  return <><option value="contributor">Contributeur</option><option value="approver">Approbateur</option></>;
}

function MemberRow({member, busy, update, revoke}: {
  member: Member; busy: boolean; update: (email: string, role: MemberRole) => void; revoke: (email: string) => void;
}) {
  const [selected, setSelected] = useState(member.role);
  useEffect(() => setSelected(member.role), [member.role]);
  return <li className="portal-member">
    <div><strong>{member.email}</strong><small>{member.acceptedAt ? 'Accès activé' : 'En attente de première connexion'}</small></div>
    <div className="button-row">
      <select aria-label={'Rôle de ' + member.email} value={selected} disabled={busy}
        onChange={event => setSelected(event.target.value as MemberRole)}><RoleOptions/></select>
      <button type="button" className="outline" disabled={busy || selected === member.role}
        onClick={() => update(member.email, selected)}>Enregistrer le rôle</button>
      <button type="button" className="text-button" disabled={busy} aria-label={'Révoquer l’accès de ' + member.email}
        onClick={() => revoke(member.email)}>Révoquer</button>
    </div>
  </li>;
}

export function TeamPanel() {
  const [team, setTeam] = useState<Team | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('contributor');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getTeam(controller.signal).then(setTeam).catch((error: Error) => {
      if (!controller.signal.aborted) setMessage(error.message);
    });
    return () => controller.abort();
  }, [reload]);

  async function save(method: 'POST' | 'DELETE', address: string, memberRole?: MemberRole, invitation = false) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/newsroom/team', {
        method, headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:address, role:memberRole}),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as {error?: string};
        throw Error(result.error || 'Les accès n’ont pas pu être mis à jour.');
      }
      if (invitation) { setEmail(''); setRole('contributor'); }
      setMessage(method === 'DELETE' ? 'Accès révoqué pour ' + address + '.' : invitation
        ? 'Accès enregistré pour ' + address + '. Transmets le lien du portail à cette personne.' : 'Rôle mis à jour pour ' + address + '.');
      setTeam(await getTeam());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de mettre à jour les accès.');
    } finally { setBusy(false); }
  }
  function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save('POST', email.trim(), role, true);
  }
  function revoke(address: string) {
    if (window.confirm('Révoquer l’accès au portail pour ' + address + ' ?')) void save('DELETE', address);
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(NEWSROOM_URL); setCopyMessage('Lien du portail copié.'); }
    catch { setCopyMessage('Sélectionne le lien affiché pour le copier.'); }
  }
  return <div className="portal-team">
    <section className="panel"><h2>Inviter un collaborateur</h2>
      <p>Saisis l’adresse associée à son compte de connexion. Le contributeur prépare ses articles et les soumet à la rédaction. L’approbateur peut aussi vérifier, renvoyer et publier les articles soumis.</p>
      <form className="portal-invite" onSubmit={invite}>
        <label>Adresse courriel<input type="email" required maxLength={254} autoComplete="off" value={email}
          onChange={event => setEmail(event.target.value)} placeholder="nom@exemple.ca"/></label>
        <label>Rôle<select value={role} onChange={event => setRole(event.target.value as MemberRole)}><RoleOptions/></select></label>
        <button className="red" disabled={busy || !team} type="submit"><UserPlus size={16} aria-hidden="true"/> Ajouter l’accès</button>
      </form>
      <div className="portal-invite-link"><p>Partage ensuite le lien du portail. La première connexion avec l’adresse invitée active l’accès.</p>
        <a href={NEWSROOM_URL}>{NEWSROOM_URL}</a>
        <button className="outline" type="button" onClick={copyLink}><Link2 size={16} aria-hidden="true"/> Copier le lien</button>
        {copyMessage && <small role="status">{copyMessage}</small>}
      </div>
    </section>
    {message && <p className="admin-note" role="status">{message}</p>}
    <section className="panel"><h2>Accès à la rédaction</h2>
      {!team && (message ? <button className="outline" onClick={() => { setMessage(''); setReload(v => v + 1); }}>Réessayer</button> : <p>Chargement des accès…</p>)}
      {team && <ul className="portal-members">
        {team.owners.map(address => <li key={address} className="portal-member"><div><strong>{address}</strong>
          <small>Propriétaire · gestion des accès</small></div></li>)}
        {team.members.map(member => <MemberRow key={member.email} member={member} busy={busy}
          update={(address, nextRole) => void save('POST', address, nextRole)} revoke={revoke}/>)}
      </ul>}
    </section>
  </div>;
}
