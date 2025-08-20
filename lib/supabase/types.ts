export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          user_id: string | null
          name: string
          location: string
          console: "PS5" | "XBOX" | "PC"
          preferred_club: string
          assigned_club: string | null
          role: "PLAYER" | "ADMIN"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          location: string
          console: "PS5" | "XBOX" | "PC"
          preferred_club: string
          assigned_club?: string | null
          role?: "PLAYER" | "ADMIN"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          location?: string
          console?: "PS5" | "XBOX" | "PC"
          preferred_club?: string
          assigned_club?: string | null
          role?: "PLAYER" | "ADMIN"
          created_at?: string
          updated_at?: string
        }
      }
      fixtures: {
        Row: {
          id: string
          home_player_id: string
          away_player_id: string
          home_club: string
          away_club: string
          matchday: number
          home_score: number | null
          away_score: number | null
          status: "SCHEDULED" | "PLAYED" | "CANCELLED"
          home_confirmed: boolean
          away_confirmed: boolean
          played_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          home_player_id: string
          away_player_id: string
          home_club: string
          away_club: string
          matchday: number
          home_score?: number | null
          away_score?: number | null
          status?: "SCHEDULED" | "PLAYED" | "CANCELLED"
          home_confirmed?: boolean
          away_confirmed?: boolean
          played_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          home_player_id?: string
          away_player_id?: string
          home_club?: string
          away_club?: string
          matchday?: number
          home_score?: number | null
          away_score?: number | null
          status?: "SCHEDULED" | "PLAYED" | "CANCELLED"
          home_confirmed?: boolean
          away_confirmed?: boolean
          played_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      league_settings: {
        Row: {
          id: string
          status: "DRAFT" | "ACTIVE" | "COMPLETE"
          start_date: string | null
          end_date: string | null
          teams_locked: boolean
          rounds: number
          matchdays_per_weekend: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          status?: "DRAFT" | "ACTIVE" | "COMPLETE"
          start_date?: string | null
          end_date?: string | null
          teams_locked?: boolean
          rounds?: number
          matchdays_per_weekend?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          status?: "DRAFT" | "ACTIVE" | "COMPLETE"
          start_date?: string | null
          end_date?: string | null
          teams_locked?: boolean
          rounds?: number
          matchdays_per_weekend?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      standings: {
        Row: {
          id: string
          name: string
          team: string
          console: "PS5" | "XBOX" | "PC"
          played: number
          won: number
          drawn: number
          lost: number
          goals_for: number
          goals_against: number
          goal_difference: number
          points: number
        }
      }
    }
    Functions: {
      assign_teams_automatically: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_fixtures: {
        Args: {
          rounds_param?: number
        }
        Returns: undefined
      }
    }
  }
}

export type Player = Database["public"]["Tables"]["players"]["Row"]
export type Fixture = Database["public"]["Tables"]["fixtures"]["Row"]
export type LeagueSettings = Database["public"]["Tables"]["league_settings"]["Row"]
export type Standing = Database["public"]["Views"]["standings"]["Row"]
