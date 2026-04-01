import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { isTauri, getSetting, setSetting } from '@/services/database.service';

export interface IProfile {
  id: string;
  name: string;
  icon: string;       // emoji
  color: string;      // hex
  routineIds: string[]; // routines included; empty means not yet filtered
}

const LS_KEY = 'routify_profiles';
const LS_ACTIVE_KEY = 'routify_active_profile';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const useProfilesStore = defineStore('profiles', () => {
  const profiles = ref<IProfile[]>(_loadProfiles());
  const activeProfileId = ref<string | null>(_loadActive());

  function _loadProfiles(): IProfile[] {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as IProfile[]) : [];
    } catch {
      return [];
    }
  }

  function _loadActive(): string | null {
    return localStorage.getItem(LS_ACTIVE_KEY) ?? null;
  }

  /** Hydrate from SQLite on app start (no-op in browser). */
  async function init(): Promise<void> {
    // Profiles list
    const raw = await getSetting('profiles');
    if (raw !== null) {
      try { profiles.value = JSON.parse(raw) as IProfile[]; } catch { /* keep */ }
    } else {
      const lsRaw = localStorage.getItem(LS_KEY);
      if (lsRaw) {
        await setSetting('profiles', lsRaw);
        localStorage.removeItem(LS_KEY);
      }
    }

    // Active profile
    const activeRaw = await getSetting('active_profile');
    if (activeRaw !== null) {
      activeProfileId.value = activeRaw === '' ? null : activeRaw;
    } else {
      const lsActive = localStorage.getItem(LS_ACTIVE_KEY);
      if (lsActive !== null) {
        await setSetting('active_profile', lsActive);
        localStorage.removeItem(LS_ACTIVE_KEY);
      }
    }
  }

  function _saveProfiles() {
    void setSetting('profiles', JSON.stringify(profiles.value));
    if (!isTauri) localStorage.setItem(LS_KEY, JSON.stringify(profiles.value));
  }

  function _saveActive() {
    void setSetting('active_profile', activeProfileId.value ?? '');
    if (!isTauri) {
      activeProfileId.value
        ? localStorage.setItem(LS_ACTIVE_KEY, activeProfileId.value)
        : localStorage.removeItem(LS_ACTIVE_KEY);
    }
  }

  const activeProfile = computed(
    () => profiles.value.find((p) => p.id === activeProfileId.value) ?? null,
  );

  function setActiveProfile(id: string | null) {
    activeProfileId.value = id;
    _saveActive();
  }

  function addProfile(data: Omit<IProfile, 'id'>): string {
    const id = generateId();
    profiles.value.push({ ...data, id });
    _saveProfiles();
    return id;
  }

  function updateProfile(id: string, patch: Partial<Omit<IProfile, 'id'>>) {
    const p = profiles.value.find((x) => x.id === id);
    if (!p) return;
    Object.assign(p, patch);
    _saveProfiles();
  }

  function deleteProfile(id: string) {
    profiles.value = profiles.value.filter((p) => p.id !== id);
    if (activeProfileId.value === id) {
      activeProfileId.value = null;
      _saveActive();
    }
    _saveProfiles();
  }

  return {
    profiles,
    activeProfileId,
    activeProfile,
    init,
    setActiveProfile,
    addProfile,
    updateProfile,
    deleteProfile,
  };
});
