// Hand-written for now; regenerate from your live schema with:
//   npm run db:types   (requires the Supabase CLI linked to your project)
//
// Keeping this in sync gives end-to-end type safety from Postgres to the UI.

export type UserRole = 'coach' | 'parent' | 'admin';

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  push_token: string | null;
  created_at: string;
}

export type Team = {
  id: string;
  coach_id: string;
  name: string;
  age_group: string | null;
  created_at: string;
}

export type Player = {
  id: string;
  coach_id: string;
  team_id: string | null;
  full_name: string;
  date_of_birth: string | null;
  position: string | null;
  created_at: string;
}

export type Session = {
  id: string;
  coach_id: string;
  player_id: string;
  session_date: string;
  focus_areas: string[];
  notes: string | null;
  rating: number | null;
  next_focus: string | null;
  media_urls: string[];
  created_at: string;
}

export type ParentUpdate = {
  id: string;
  session_id: string;
  player_id: string;
  guardian_id: string;
  read_at: string | null;
  created_at: string;
}

export type PlayerGuardian = {
  player_id: string;
  guardian_id: string;
  relationship: string | null;
  consent_given_at: string | null;
  created_at: string;
}

export type Invite = {
  id: string;
  coach_id: string;
  player_id: string;
  code: string;
  email: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  expires_at: string;
  created_at: string;
}

// Minimal shape consumed by supabase-js generics. Each table needs
// Row/Insert/Update/Relationships; the schema needs Tables/Views/Functions/
// Enums/CompositeTypes — otherwise the generic resolves to `never`.
type Table<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile>;
      teams: Table<Team>;
      players: Table<Player>;
      sessions: Table<Session>;
      parent_updates: Table<ParentUpdate>;
      player_guardians: Table<PlayerGuardian>;
      invites: Table<Invite>;
    };
    Views: Record<string, never>;
    Functions: {
      claim_invite: {
        Args: { invite_code: string; consent: boolean };
        Returns: Player;
      };
    };
    Enums: { user_role: UserRole };
    CompositeTypes: Record<string, never>;
  };
}
