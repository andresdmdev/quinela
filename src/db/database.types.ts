export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          external_id: string | null;
          stage: string | null;
          group_name: string | null;
          home_team: string | null;
          away_team: string | null;
          home_flag: string | null;
          away_flag: string | null;
          home_score: number | null;
          away_score: number | null;
          status: string | null;
          scheduled_at: string | null;
          utc_minus_5_at: string | null;
          last_synced_at: string | null;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          stage?: string | null;
          group_name?: string | null;
          home_team?: string | null;
          away_team?: string | null;
          home_flag?: string | null;
          away_flag?: string | null;
          home_score?: number | null;
          away_score?: number | null;
          status?: string | null;
          scheduled_at?: string | null;
          utc_minus_5_at?: string | null;
          last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          external_id?: string | null;
          stage?: string | null;
          group_name?: string | null;
          home_team?: string | null;
          away_team?: string | null;
          home_flag?: string | null;
          away_flag?: string | null;
          home_score?: number | null;
          away_score?: number | null;
          status?: string | null;
          scheduled_at?: string | null;
          utc_minus_5_at?: string | null;
          last_synced_at?: string | null;
        };
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          match_id: string;
          home_score: number | null;
          away_score: number | null;
          locked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id: string;
          home_score?: number | null;
          away_score?: number | null;
          locked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          match_id?: string;
          home_score?: number | null;
          away_score?: number | null;
          locked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      match_points: {
        Row: {
          id: string;
          user_id: string;
          match_id: string;
          points: number | null;
          exact_score: boolean | null;
          trend: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id: string;
          points?: number | null;
          exact_score?: boolean | null;
          trend?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          match_id?: string;
          points?: number | null;
          exact_score?: boolean | null;
          trend?: boolean | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
