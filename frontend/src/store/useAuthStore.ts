import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Actions
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    // Get existing session on mount
    const { data: { session } } = await supabase.auth.getSession();
    set({
      user: session?.user ?? null,
      session,
      isAuthenticated: !!session,
      isLoading: false,
    });

    // Listen for future auth changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session,
        isAuthenticated: !!session,
        isLoading: false,
      });
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false });
  },
}));
