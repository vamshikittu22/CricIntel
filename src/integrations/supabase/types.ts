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
      deliveries: {
        Row: {
          ball_length: Database["public"]["Enums"]["ball_length_type"] | null
          ball_line: Database["public"]["Enums"]["ball_line_type"] | null
          ball_number: number
          batter_id: string
          bowler_id: string
          bowler_type: Database["public"]["Enums"]["bowler_type"] | null
          created_at: string
          id: string
          innings: number
          is_boundary: boolean
          is_six: boolean
          is_wicket: boolean
          match_id: string
          over_number: number
          runs_batter: number
          runs_extras: number
          scoring_zone: number | null
          shot_type: Database["public"]["Enums"]["shot_type"] | null
          wicket_type: Database["public"]["Enums"]["dismissal_type"] | null
        }
        Insert: {
          ball_length?: Database["public"]["Enums"]["ball_length_type"] | null
          ball_line?: Database["public"]["Enums"]["ball_line_type"] | null
          ball_number: number
          batter_id: string
          bowler_id: string
          bowler_type?: Database["public"]["Enums"]["bowler_type"] | null
          created_at?: string
          id?: string
          innings: number
          is_boundary?: boolean
          is_six?: boolean
          is_wicket?: boolean
          match_id: string
          over_number: number
          runs_batter?: number
          runs_extras?: number
          scoring_zone?: number | null
          shot_type?: Database["public"]["Enums"]["shot_type"] | null
          wicket_type?: Database["public"]["Enums"]["dismissal_type"] | null
        }
        Update: {
          ball_length?: Database["public"]["Enums"]["ball_length_type"] | null
          ball_line?: Database["public"]["Enums"]["ball_line_type"] | null
          ball_number?: number
          batter_id?: string
          bowler_id?: string
          bowler_type?: Database["public"]["Enums"]["bowler_type"] | null
          created_at?: string
          id?: string
          innings?: number
          is_boundary?: boolean
          is_six?: boolean
          is_wicket?: boolean
          match_id?: string
          over_number?: number
          runs_batter?: number
          runs_extras?: number
          scoring_zone?: number | null
          shot_type?: Database["public"]["Enums"]["shot_type"] | null
          wicket_type?: Database["public"]["Enums"]["dismissal_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_batter_id_fkey"
            columns: ["batter_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_bowler_id_fkey"
            columns: ["bowler_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          format: Database["public"]["Enums"]["match_format"]
          id: string
          match_date: string
          result: string | null
          team1: string
          team2: string
          venue: string
        }
        Insert: {
          created_at?: string
          format: Database["public"]["Enums"]["match_format"]
          id?: string
          match_date: string
          result?: string | null
          team1: string
          team2: string
          venue: string
        }
        Update: {
          created_at?: string
          format?: Database["public"]["Enums"]["match_format"]
          id?: string
          match_date?: string
          result?: string | null
          team1?: string
          team2?: string
          venue?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          batting_style: Database["public"]["Enums"]["batting_style"]
          bowling_style: Database["public"]["Enums"]["bowling_style"]
          country: string
          created_at: string
          date_of_birth: string | null
          id: string
          name: string
          photo_url: string | null
          role: Database["public"]["Enums"]["player_role"]
        }
        Insert: {
          batting_style: Database["public"]["Enums"]["batting_style"]
          bowling_style?: Database["public"]["Enums"]["bowling_style"]
          country: string
          created_at?: string
          date_of_birth?: string | null
          id?: string
          name: string
          photo_url?: string | null
          role: Database["public"]["Enums"]["player_role"]
        }
        Update: {
          batting_style?: Database["public"]["Enums"]["batting_style"]
          bowling_style?: Database["public"]["Enums"]["bowling_style"]
          country?: string
          created_at?: string
          date_of_birth?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          role?: Database["public"]["Enums"]["player_role"]
        }
        Relationships: []
      }
    }
    Views: {
      batting_analytics: {
        Row: {
          average: number | null
          balls_faced: number | null
          bowled_out: number | null
          caught: number | null
          dismissals: number | null
          dots: number | null
          format: Database["public"]["Enums"]["match_format"] | null
          fours: number | null
          lbw: number | null
          matches: number | null
          player_id: string | null
          run_out: number | null
          sixes: number | null
          strike_rate: number | null
          stumped: number | null
          total_runs: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_batter_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      bowling_analytics: {
        Row: {
          average: number | null
          balls_bowled: number | null
          bowled_out: number | null
          caught: number | null
          caught_behind: number | null
          dots: number | null
          economy: number | null
          format: Database["public"]["Enums"]["match_format"] | null
          lbw: number | null
          matches: number | null
          player_id: string | null
          runs_conceded: number | null
          strike_rate: number | null
          stumped: number | null
          wickets: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_bowler_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      head_to_head: {
        Args: { p_batter_id: string; p_bowler_id: string; p_format?: string }
        Returns: {
          average: number
          balls_faced: number
          dismissals: number
          dots: number
          format: string
          fours: number
          runs_scored: number
          sixes: number
          strike_rate: number
        }[]
      }
    }
    Enums: {
      ball_length_type: "yorker" | "full" | "good" | "short" | "bouncer"
      ball_line_type:
        | "off-stump"
        | "middle"
        | "leg-stump"
        | "outside-off"
        | "outside-leg"
        | "wide"
      batting_style: "right-hand" | "left-hand"
      bowler_type: "pace" | "spin"
      bowling_style:
        | "right-arm-fast"
        | "right-arm-medium"
        | "left-arm-fast"
        | "left-arm-medium"
        | "right-arm-offspin"
        | "right-arm-legspin"
        | "left-arm-orthodox"
        | "left-arm-chinaman"
        | "none"
      dismissal_type:
        | "caught"
        | "bowled"
        | "lbw"
        | "run-out"
        | "stumped"
        | "hit-wicket"
        | "caught-behind"
        | "not-out"
      match_format: "Test" | "ODI" | "T20"
      player_role: "batter" | "bowler" | "all-rounder" | "wicket-keeper"
      shot_type:
        | "drive"
        | "cut"
        | "pull"
        | "hook"
        | "sweep"
        | "flick"
        | "glance"
        | "defense"
        | "edge"
        | "loft"
        | "scoop"
        | "reverse-sweep"
        | "late-cut"
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
    Enums: {
      ball_length_type: ["yorker", "full", "good", "short", "bouncer"],
      ball_line_type: [
        "off-stump",
        "middle",
        "leg-stump",
        "outside-off",
        "outside-leg",
        "wide",
      ],
      batting_style: ["right-hand", "left-hand"],
      bowler_type: ["pace", "spin"],
      bowling_style: [
        "right-arm-fast",
        "right-arm-medium",
        "left-arm-fast",
        "left-arm-medium",
        "right-arm-offspin",
        "right-arm-legspin",
        "left-arm-orthodox",
        "left-arm-chinaman",
        "none",
      ],
      dismissal_type: [
        "caught",
        "bowled",
        "lbw",
        "run-out",
        "stumped",
        "hit-wicket",
        "caught-behind",
        "not-out",
      ],
      match_format: ["Test", "ODI", "T20"],
      player_role: ["batter", "bowler", "all-rounder", "wicket-keeper"],
      shot_type: [
        "drive",
        "cut",
        "pull",
        "hook",
        "sweep",
        "flick",
        "glance",
        "defense",
        "edge",
        "loft",
        "scoop",
        "reverse-sweep",
        "late-cut",
      ],
    },
  },
} as const
