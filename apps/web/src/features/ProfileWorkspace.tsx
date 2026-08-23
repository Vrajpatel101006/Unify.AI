import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { User, Mail, Phone, Github, Globe, Building, Save, RefreshCw } from 'lucide-react';

export function ProfileWorkspace() {
  const { user, updateUserProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [githubAcc, setGithubAcc] = useState(user?.githubAcc || '');
  const [country, setCountry] = useState(user?.country || '');
  const [company, setCompany] = useState(user?.company || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setMobile(user.mobile || '');
      setGithubAcc(user.githubAcc || '');
      setCountry(user.country || '');
      setCompany(user.company || '');
      setBio(user.bio || '');
      setWebsite(user.website || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({
        name,
        email,
        mobile,
        githubAcc,
        country,
        company,
        bio,
        website,
      });
      alert('Profile updated and saved to local database successfully.');
    } catch (err: any) {
      alert('Failed to save profile: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--color-bg-primary)] p-6 overflow-y-auto select-text">
      {/* Top Banner */}
      <div className="border-b border-[var(--color-border-default)] pb-4 mb-6 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <User size={16} className="text-[var(--color-accent-primary)]" />
            User Profile Settings
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Manage your personal details, GitHub connections, and workspace identity.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 max-w-4xl">
        {/* Left Side: Avatar & Bio QuickView */}
        <div className="w-full lg:w-1/3 flex flex-col items-center p-5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] gap-4 h-fit shrink-0">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full border-2 border-[var(--color-accent-primary)] overflow-hidden shadow-xl">
              <img 
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`} 
                alt={name} 
                className="h-full w-full object-cover" 
              />
            </div>
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] text-white font-semibold">
              Update
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{name || 'Developer'}</h3>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)] mt-0.5 block">{email}</span>
          </div>

          {bio && (
            <p className="text-[11px] text-[var(--color-text-secondary)] text-center italic bg-[var(--color-bg-tertiary)]/50 p-2.5 rounded-lg border border-[var(--color-border-default)] w-full">
              "{bio}"
            </p>
          )}

          <div className="w-full border-t border-[var(--color-border-default)] pt-3 flex flex-col gap-2 text-[10px] text-[var(--color-text-muted)]">
            <div className="flex justify-between">
              <span>Auth Provider:</span>
              <span className="font-semibold text-[var(--color-text-primary)] capitalize">{user?.provider}</span>
            </div>
            <div className="flex justify-between">
              <span>Database Sync:</span>
              <span className="font-semibold text-[var(--color-status-success)] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-status-success)] animate-pulse" /> Local SQL
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Details Form */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Full Name</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vraj Patel"
                  className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] pl-9 pr-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Email Address</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. vraj@unify.ai"
                  className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] pl-9 pr-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Mobile No. */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Mobile No.</label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] pl-9 pr-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* GitHub Account */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">GitHub Account Username</label>
              <div className="relative">
                <Github size={13} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={githubAcc}
                  onChange={(e) => setGithubAcc(e.target.value)}
                  placeholder="e.g. Vrajpatel101006"
                  className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] pl-9 pr-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Country */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Country</label>
              <div className="relative">
                <Globe size={13} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. India"
                  className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] pl-9 pr-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Company */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Company</label>
              <div className="relative">
                <Building size={13} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google DeepMind"
                  className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] pl-9 pr-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Website Link */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Website / Blog Link</label>
            <div className="relative">
              <Globe size={13} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. https://vrajpatel.dev"
                className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] pl-9 pr-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Bio Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Bio / Profile Description</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-all h-20 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-fit rounded-lg bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] px-5 py-2 text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{saving ? 'Saving...' : 'Save Profile Details'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
