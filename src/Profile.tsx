// Profile.tsx — single-user profile: name, target role, liked questions

import { useState, useEffect } from 'react';
import { loadProfile, updateProfile, unlikeQuestion } from './userProfile';
import type { UserProfile } from './userProfile';
import { Bob } from './Bob';
import { User, Heart, Trash2, Pencil, Check } from 'lucide-react';

const EMPTY_PROFILE: UserProfile = { name: '', targetRole: '', likedQuestions: [] };

export function Profile() {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [editingName, setEditingName] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState('');

  useEffect(() => {
    loadProfile().then(p => {
      setProfile(p);
      setNameInput(p.name);
      setRoleInput(p.targetRole);
    });
  }, []);

  async function saveName() {
    const updated = await updateProfile({ name: nameInput.trim() });
    setProfile(updated);
    setEditingName(false);
  }

  async function saveRole() {
    const updated = await updateProfile({ targetRole: roleInput.trim() });
    setProfile(updated);
    setEditingRole(false);
  }

  async function handleUnlike(question: string) {
    await unlikeQuestion(question);
    const updated = await loadProfile();
    setProfile(updated);
  }

  const bobMsg = profile.name
    ? `Hey ${profile.name}! Bob's been watching.`
    : "Bob doesn't know your name yet. Add it below.";

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <Bob
          mood={profile.name ? 'cheering' : 'neutral'}
          message={bobMsg}
          size={100}
        />
        <div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, fontSize: '3rem', color: '#1F3D2B', margin: 0, lineHeight: 1 }}>
            My<br />Profile
          </h1>
        </div>
      </div>

      {/* ── Name ── */}
      <div className="nb-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
          <User size={16} style={{ color: '#5A7060' }} />
          <span className="nb-label" style={{ margin: 0 }}>Name</span>
        </div>
        {editingName ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="nb-input"
              style={{ flex: 1 }}
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              autoFocus
              placeholder="Your name"
            />
            <button onClick={saveName} className="btn btn-primary" style={{ padding: '6px 12px' }}>
              <Check size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '1.5rem', color: '#1F3D2B',
            }}>
              {profile.name || <span style={{ color: '#D9CFBF', fontWeight: 400, fontSize: '1rem' }}>Not set</span>}
            </span>
            <button onClick={() => { setNameInput(profile.name); setEditingName(true); }} className="btn btn-ghost" style={{ padding: '4px 10px' }}>
              <Pencil size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Target Role ── */}
      <div className="nb-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
          <span className="nb-label" style={{ margin: 0 }}>Target Role</span>
        </div>
        {editingRole ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="nb-input"
              style={{ flex: 1 }}
              value={roleInput}
              onChange={e => setRoleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveRole()}
              autoFocus
              placeholder="e.g. Software Engineer Intern"
            />
            <button onClick={saveRole} className="btn btn-primary" style={{ padding: '6px 12px' }}>
              <Check size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '1.25rem', color: '#1F3D2B',
            }}>
              {profile.targetRole || <span style={{ color: '#D9CFBF', fontWeight: 400, fontSize: '1rem' }}>Not set</span>}
            </span>
            <button onClick={() => { setRoleInput(profile.targetRole); setEditingRole(true); }} className="btn btn-ghost" style={{ padding: '4px 10px' }}>
              <Pencil size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Liked Questions ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          <Heart size={16} style={{ color: '#C8462B' }} />
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, fontSize: '1.5rem', color: '#1F3D2B', margin: 0 }}>
            Saved Questions
          </h2>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#5A7060', marginLeft: '4px' }}>
            {profile.likedQuestions.length}
          </span>
        </div>

        {profile.likedQuestions.length === 0 ? (
          <div className="nb-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.1rem', color: '#5A7060', margin: 0 }}>
              Tap the heart icon on any question in the report to save it here.
            </p>
          </div>
        ) : (
          <div className="nb-card" style={{ overflow: 'hidden' }}>
            {profile.likedQuestions.map((lq, i) => (
              <div
                key={i}
                style={{
                  padding: '0.875rem 1rem',
                  borderBottom: i < profile.likedQuestions.length - 1 ? '1px solid #D9CFBF' : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                  background: i % 2 === 0 ? '#FDFAF3' : '#faf6ec',
                }}
              >
                <Heart size={14} style={{ color: '#C8462B', flexShrink: 0, marginTop: '3px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '0.9375rem', color: '#1F3D2B', lineHeight: 1.4 }}>
                    {lq.question}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', color: '#5A7060', marginTop: '3px' }}>
                    {lq.company} · {lq.role} · {new Date(lq.likedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleUnlike(lq.question)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D9CFBF', padding: '2px', flexShrink: 0 }}
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
