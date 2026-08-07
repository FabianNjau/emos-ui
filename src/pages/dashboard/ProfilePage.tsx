/**
 * ProfilePage — CRUD for reusable context profiles.
 * Users define context setups (budget, audience, product type, etc.)
 * that can be quickly applied before starting a new chat.
 */
import { useState } from 'react';
import { useContextProfiles, useCreateContextProfile, useUpdateContextProfile, useDeleteContextProfile, useSetDefaultProfile } from '../../hooks/useContextProfiles';
import type { ContextProfile } from '../../types/api';
import {
  UserCog,
  PlusCircle,
  CheckCircle,
  Trash2,
  Star,
  Loader,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';

const FIELDS: { key: keyof ContextProfile; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Profile name', placeholder: 'e.g. Kenyan SaaS Startup' },
  { key: 'budget', label: 'Marketing budget', placeholder: 'e.g. $500–2,000/month' },
  { key: 'audience', label: 'Target audience', placeholder: 'e.g. B2B founders in Nairobi' },
  { key: 'product_type', label: 'Product / service type', placeholder: 'e.g. SaaS, consulting, physical product' },
  { key: 'location', label: 'Primary market location', placeholder: 'e.g. Kenya, East Africa, Online' },
  { key: 'objective', label: 'Primary objective', placeholder: 'e.g. Lead generation, brand awareness' },
  { key: 'stage', label: 'Business stage', placeholder: 'e.g. Pre-launch, early-stage, scaling' },
];

function ProfileCard({
  profile,
  onApply,
  onSetDefault,
  onDelete,
}: {
  profile: ContextProfile;
  onApply: (p: ContextProfile) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const filledFields = FIELDS.filter(f => f.key !== 'name' && profile[f.key as keyof ContextProfile]);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1rem',
        cursor: 'pointer',
      }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                {profile.name}
              </span>
              {profile.is_default && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: 'rgba(193,125,60,0.12)',
                  color: 'var(--accent)',
                  padding: '2px 7px',
                  borderRadius: 999,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  Default
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {filledFields.length > 0
                ? filledFields.slice(0, 3).map(f => profile[f.key as keyof ContextProfile]).filter(Boolean).join(' · ')
                : 'No details set'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '1rem' }}>
          {/* Field details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1rem' }}>
            {FIELDS.filter(f => f.key !== 'name').map(field => {
              const value = profile[field.key as keyof ContextProfile] as string | null;
              return value ? (
                <div key={field.key}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 2 }}>
                    {field.label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {value}
                  </div>
                </div>
              ) : null;
            })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => onApply(profile)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.5rem 0.875rem',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Zap size={14} />
              Use this profile
            </button>
            {!profile.is_default && (
              <button
                onClick={() => onSetDefault(profile.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.5rem 0.875rem',
                  background: 'var(--surface-2)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 7,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <Star size={14} />
                Set as default
              </button>
            )}
            <button
              onClick={() => onDelete(profile.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.5rem 0.875rem',
                background: 'none',
                color: 'var(--text-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 7,
                fontSize: 13,
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileForm({
  onSubmit,
  onCancel,
  loading,
}: {
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--accent)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
      }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
        New Context Profile
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1rem' }}>
        {FIELDS.map(field => (
          <div key={field.key} style={field.key === 'name' ? { gridColumn: '1 / -1' } : {}}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              {field.label} {field.key === 'name' ? '*' : ''}
            </label>
            <input
              type="text"
              value={values[field.key] ?? ''}
              onChange={e => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.key === 'name'}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 14,
                color: 'var(--text-primary)',
                background: 'var(--bg)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--surface-2)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0.5rem 1rem',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading && <Loader size={13} className="spin" />}
          Save profile
        </button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  const { data: profiles = [], isLoading } = useContextProfiles();
  const createProfile = useCreateContextProfile();
  const updateProfile = useUpdateContextProfile();
  const deleteProfile = useDeleteContextProfile();
  const setDefault = useSetDefaultProfile();

  const [showForm, setShowForm] = useState(false);

  const handleApply = (profile: ContextProfile) => {
    // Store in sessionStorage so AskPage can pick it up
    sessionStorage.setItem('emos_context_profile', JSON.stringify(profile));
    window.location.href = '/ask';
  };

  const handleSubmit = (values: Record<string, string>) => {
    createProfile.mutate(
      {
        name: values.name,
        budget: values.budget || null,
        audience: values.audience || null,
        product_type: values.product_type || null,
        location: values.location || null,
        objective: values.objective || null,
        stage: values.stage || null,
        is_default: profiles.length === 0, // first profile is default
      },
      {
        onSuccess: () => setShowForm(false),
      },
    );
  };

  return (
    <div style={{ padding: '2rem 0', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Context Profiles
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 500 }}>
            Save reusable context setups — budget, audience, product type — so you can fast-fill EMOS before a new session.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0.5rem 1rem',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <PlusCircle size={15} />
            New profile
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ marginBottom: '1.5rem' }}>
          <ProfileForm
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            loading={createProfile.isPending}
          />
        </div>
      )}

      {/* Profiles list */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader size={22} className="spin" />
        </div>
      ) : profiles.length === 0 && !showForm ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--text-tertiary)',
          fontSize: 14,
        }}>
          <UserCog size={28} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p>No context profiles yet.</p>
          <p style={{ marginTop: 6 }}>
            Create one to save your go-to context setups — then apply them instantly before new chats.
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              marginTop: 16,
              padding: '0.5rem 1rem',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Create your first profile
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {profiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onApply={handleApply}
              onSetDefault={id => setDefault.mutate(id)}
              onDelete={id => {
                if (!confirm('Delete this profile?')) return;
                deleteProfile.mutate(id);
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
