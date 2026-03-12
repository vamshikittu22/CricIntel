export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      match_player_stats: {
        Row: {
          bat_balls: number
          bat_dismissal_kind: string | null
          bat_fours: number
          bat_not_out: boolean
          bat_runs: number
          bat_sixes: number
          bowl_econ: number
          bowl_maidens: number
          bowl_overs: number
          bowl_runs: number
          bowl_wickets: number
          created_at: string
          is_batter: boolean
          is_bowler: boolean
          match_id: string
          player_id: string
          team: string
        }
        Insert: {
          bat_balls?: number
          bat_dismissal_kind?: string | null
          bat_fours?: number
          bat_not_out?: boolean
          bat_runs?: number
          bat_sixes?: number
          bowl_econ?: number
          bowl_maidens?: number
          bowl_overs?: number
          bowl_runs?: number
          bowl_wickets?: number
          created_at?: string
          is_batter?: boolean
          is_bowler?: boolean
          match_id: string
          player_id: string
          team?: string
        }
        Update: {
          bat_balls?: number
          bat_dismissal_kind?: string | null
          bat_fours?: number
          bat_not_out?: boolean
          bat_runs?: number
          bat_sixes?: number
          bowl_econ?: number
          bowl_maidens?: number
          bowl_overs?: number
          bowl_runs?: number
          bowl_wickets?: number
          created_at?: string
          is_batter?: boolean
          is_bowler?: boolean
          match_id?: string
          player_id?: string
          team?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_player_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          balls_per_over: number
          city: string | null
          created_at: string
          event_name: string | null
          format: string
          gender: string
          id: string
          match_date: string
          match_number: number | null
          match_type_number: number | null
          overs: number | null
          result: string | null
          season: string | null
          team_type: string | null
          team1: string
          team2: string
          toss_decision: string | null
          toss_winner: string | null
          venue: string
          winner: string | null
          winner_margin_runs: number | null
          winner_margin_wickets: number | null
        }
        Insert: {
          balls_per_over?: number
          city?: string | null
          created_at?: string
          event_name?: string | null
          format: string
          gender?: string
          id: string
          match_date: string
          match_number?: number | null
          match_type_number?: number | null
          overs?: number | null
          result?: string | null
          season?: string | null
          team_type?: string | null
          team1: string
          team2: string
          toss_decision?: string | null
          toss_winner?: string | null
          venue?: string
          winner?: string | null
          winner_margin_runs?: number | null
          winner_margin_wickets?: number | null
        }
        Update: {
          balls_per_over?: number
          city?: string | null
          created_at?: string
          event_name?: string | null
          format?: string
          gender?: string
          id?: string
          match_date?: string
          match_number?: number | null
          match_type_number?: number | null
          overs?: number | null
          result?: string | null
          season?: string | null
          team_type?: string | null
          team1?: string
          team2?: string
          toss_decision?: string | null
          toss_winner?: string | null
          venue?: string
          winner?: string | null
          winner_margin_runs?: number | null
          winner_margin_wickets?: number | null
        }
        Relationships: []
      }
      player_phase_stats: {
        Row: {
          bat_balls: number
          bat_dismissals: number
          bat_fours: number
          bat_runs: number
          bat_sixes: number
          bat_sr: number | null
          bowl_balls: number
          bowl_econ: number | null
          bowl_runs: number
          bowl_wickets: number
          created_at: string
          format: string
          phase: string
          player_id: string
        }
        Insert: {
          bat_balls?: number
          bat_dismissals?: number
          bat_fours?: number
          bat_runs?: number
          bat_sixes?: number
          bat_sr?: number | null
          bowl_balls?: number
          bowl_econ?: number | null
          bowl_runs?: number
          bowl_wickets?: number
          created_at?: string
          format: string
          phase: string
          player_id: string
        }
        Update: {
          bat_balls?: number
          bat_dismissals?: number
          bat_fours?: number
          bat_runs?: number
          bat_sixes?: number
          bat_sr?: number | null
          bowl_balls?: number
          bowl_econ?: number | null
          bowl_runs?: number
          bowl_wickets?: number
          created_at?: string
          format?: string
          phase?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_phase_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats_summary: {
        Row: {
          average: number | null
          balls: number
          best_score: number
          bowl_average: number | null
          bowl_best_figures: string | null
          bowl_five_wickets: number
          bowl_runs: number
          bowl_strike_rate: number | null
          created_at: string
          dismissals_breakdown: Json
          econ: number | null
          fifties: number
          format: string
          fours: number
          hundreds: number
          innings_bat: number
          innings_bowl: number
          matches: number
          not_outs: number
          overs: number
          player_id: string
          runs: number
          sixes: number
          strike_rate: number | null
          wickets: number
        }
        Insert: {
          average?: number | null
          balls?: number
          best_score?: number
          bowl_average?: number | null
          bowl_best_figures?: string | null
          bowl_five_wickets?: number
          bowl_runs?: number
          bowl_strike_rate?: number | null
          created_at?: string
          dismissals_breakdown?: Json
          econ?: number | null
          fifties?: number
          format: string
          fours?: number
          hundreds?: number
          innings_bat?: number
          innings_bowl?: number
          matches?: number
          not_outs?: number
          overs?: number
          player_id: string
          runs?: number
          sixes?: number
          strike_rate?: number | null
          wickets?: number
        }
        Update: {
          average?: number | null
          balls?: number
          best_score?: number
          bowl_average?: number | null
          bowl_best_figures?: string | null
          bowl_five_wickets?: number
          bowl_runs?: number
          bowl_strike_rate?: number | null
          created_at?: string
          dismissals_breakdown?: Json
          econ?: number | null
          fifties?: number
          format?: string
          fours?: number
          hundreds?: number
          innings_bat?: number
          innings_bowl?: number
          matches?: number
          not_outs?: number
          overs?: number
          player_id?: string
          runs?: number
          sixes?: number
          strike_rate?: number | null
          wickets?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_summary_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_vs_bowling_type: {
        Row: {
          bat_avg: number | null
          bat_balls: number
          bat_dismissals: number
          bat_fours: number
          bat_runs: number
          bat_sixes: number
          bat_sr: number | null
          bowling_type: string
          created_at: string
          format: string
          player_id: string
        }
        Insert: {
          bat_avg?: number | null
          bat_balls?: number
          bat_dismissals?: number
          bat_fours?: number
          bat_runs?: number
          bat_sixes?: number
          bat_sr?: number | null
          bowling_type: string
          created_at?: string
          format: string
          player_id: string
        }
        Update: {
          bat_avg?: number | null
          bat_balls?: number
          bat_dismissals?: number
          bat_fours?: number
          bat_runs?: number
          bat_sixes?: number
          bat_sr?: number | null
          bowling_type?: string
          created_at?: string
          format?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_vs_bowling_type_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          country: string
          created_at: string
          debut_year: number | null
          formats_played: string[] | null
          gender: string
          id: string
          last_played_year: number | null
          name: string
          role: string | null
        }
        Insert: {
          country?: string
          created_at?: string
          debut_year?: number | null
          formats_played?: string[] | null
          gender?: string
          id: string
          last_played_year?: number | null
          name: string
          role?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          debut_year?: number | null
          formats_played?: string[] | null
          gender?: string
          id?: string
          last_played_year?: number | null
          name?: string
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      player_recent_matches_view: {
        Row: {
          bat_balls: number | null
          bat_dismissal_kind: string | null
          bat_fours: number | null
          bat_not_out: boolean | null
          bat_runs: number | null
          bat_sixes: number | null
          bowl_econ: number | null
          bowl_maidens: number | null
          bowl_overs: number | null
          bowl_runs: number | null
          bowl_wickets: number | null
          event_name: string | null
          format: string | null
          is_batter: boolean | null
          is_bowler: boolean | null
          match_date: string | null
          match_id: string | null
          player_id: string | null
          result: string | null
          team: string | null
          team1: string | null
          team2: string | null
          venue: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_player_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
