export type Console = "PS5" | "XBOX" | "PC"
export type PlayerRole = "PLAYER" | "ADMIN"
export type PlayerStatus = "pending" | "approved" | "rejected"
export type FixtureStatus = "SCHEDULED" | "PLAYED" | "FORFEIT" | "CANCELLED"
export type LeagueStatus = "DRAFT" | "ACTIVE" | "COMPLETE"
export type MatchEventType = "goal" | "assist" | "yellow" | "red" | "own_goal"

export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          username: string | null
          name: string
          psn_id: string | null
          location: string | null
          console: Console | null
          preferred_club: string | null
          assigned_club: string | null
          role: PlayerRole
          status: PlayerStatus
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          name: string
          psn_id?: string | null
          location?: string | null
          console?: Console | null
          preferred_club?: string | null
          assigned_club?: string | null
          role?: PlayerRole
          status?: PlayerStatus
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["players"]["Insert"]>
      }
      fixtures: {
        Row: {
          id: string
          tournament_id: string | null
          matchday: number
          home_player_id: string
          away_player_id: string
          home_club: string | null
          away_club: string | null
          home_score: number | null
          away_score: number | null
          home_goals: number
          away_goals: number
          home_assists: number
          away_assists: number
          home_cards: number
          away_cards: number
          status: FixtureStatus
          home_confirmed: boolean
          away_confirmed: boolean
          scheduled_date: string | null
          played_at: string | null
          reported_home_score: number | null
          reported_away_score: number | null
          reported_by_player_id: string | null
          report_evidence_url: string | null
          report_notes: string | null
          report_status: string | null
          forfeit_winner_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id?: string | null
          matchday: number
          home_player_id: string
          away_player_id: string
          home_club?: string | null
          away_club?: string | null
          home_score?: number | null
          away_score?: number | null
          status?: FixtureStatus
          scheduled_date?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["fixtures"]["Row"]>
      }
      tournaments: {
        Row: {
          id: string
          name: string
          status: LeagueStatus
          config: Record<string, unknown>
          is_active: boolean
          season: string | null
          start_at: string | null
          end_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string
          status?: LeagueStatus
          config?: Record<string, unknown>
          is_active?: boolean
          season?: string | null
          start_at?: string | null
          end_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["tournaments"]["Insert"]>
      }
      league_settings: {
        Row: {
          id: string
          season_name: string
          status: LeagueStatus
          start_date: string | null
          end_date: string | null
          registration_open: boolean
          teams_locked: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["league_settings"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["league_settings"]["Row"]>
      }
      match_events: {
        Row: {
          id: string
          fixture_id: string
          player_id: string
          type: MatchEventType
          minute: number | null
          created_at: string
        }
        Insert: {
          id?: string
          fixture_id: string
          player_id: string
          type: MatchEventType
          minute?: number | null
        }
        Update: Partial<Database["public"]["Tables"]["match_events"]["Insert"]>
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          title: string
          body: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          body?: string | null
          read_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>
      }
      messages: {
        Row: {
          id: string
          sender_id: string | null
          recipient_id: string | null
          subject: string | null
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          sender_id?: string | null
          recipient_id?: string | null
          subject?: string | null
          body: string
        }
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>
      }
    }
    Views: {
      v_standings: {
        Row: {
          id: string
          username: string | null
          name: string
          team: string | null
          console: Console | null
          played: number
          wins: number
          draws: number
          losses: number
          goals_for: number
          goals_against: number
          goal_difference: number
          points: number
          goals: number
          assists: number
          cards: number
        }
      }
    }
    Functions: {
      assign_teams_automatically: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_fixtures: {
        Args: { tournament_id_param?: string; rounds_param?: number }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
  }
}

export type Player = Database["public"]["Tables"]["players"]["Row"]
export type Fixture = Database["public"]["Tables"]["fixtures"]["Row"]
export type Tournament = Database["public"]["Tables"]["tournaments"]["Row"]
export type LeagueSettings = Database["public"]["Tables"]["league_settings"]["Row"]
export type MatchEvent = Database["public"]["Tables"]["match_events"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
export type Standing = Database["public"]["Views"]["v_standings"]["Row"]
