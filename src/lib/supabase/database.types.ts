export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      contributors: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          normalized_name: string | null;
          owner_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          normalized_name?: string | null;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          normalized_name?: string | null;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contributors_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      external_metadata_cache: {
        Row: {
          created_at: string;
          expires_at: string;
          normalized_response: Json;
          provider: Database["public"]["Enums"]["external_provider"];
          query_hash: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          normalized_response: Json;
          provider: Database["public"]["Enums"]["external_provider"];
          query_hash: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          normalized_response?: Json;
          provider?: Database["public"]["Enums"]["external_provider"];
          query_hash?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          created_at: string;
          id: string;
          metric: Database["public"]["Enums"]["goal_metric"];
          owner_id: string;
          period_end: string;
          period_start: string;
          target_value: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          metric: Database["public"]["Enums"]["goal_metric"];
          owner_id: string;
          period_end: string;
          period_start: string;
          target_value: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          metric?: Database["public"]["Enums"]["goal_metric"];
          owner_id?: string;
          period_end?: string;
          period_start?: string;
          target_value?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goals_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["note_kind"];
          location_label: string | null;
          owner_id: string;
          session_id: string | null;
          updated_at: string;
          work_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["note_kind"];
          location_label?: string | null;
          owner_id: string;
          session_id?: string | null;
          updated_at?: string;
          work_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["note_kind"];
          location_label?: string | null;
          owner_id?: string;
          session_id?: string | null;
          updated_at?: string;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_session_work_owner_fk";
            columns: ["session_id", "work_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "reading_sessions";
            referencedColumns: ["id", "work_id", "owner_id"];
          },
          {
            foreignKeyName: "notes_work_owner_fk";
            columns: ["work_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          display_name: string;
          id: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          avatar_path?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      progress_events: {
        Row: {
          created_at: string;
          event_type: Database["public"]["Enums"]["progress_event_type"];
          id: string;
          new_value: number;
          owner_id: string;
          previous_value: number;
          recorded_at: string;
          session_id: string | null;
          work_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: Database["public"]["Enums"]["progress_event_type"];
          id?: string;
          new_value: number;
          owner_id: string;
          previous_value: number;
          recorded_at?: string;
          session_id?: string | null;
          work_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: Database["public"]["Enums"]["progress_event_type"];
          id?: string;
          new_value?: number;
          owner_id?: string;
          previous_value?: number;
          recorded_at?: string;
          session_id?: string | null;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "progress_events_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "progress_events_session_work_owner_fk";
            columns: ["session_id", "work_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "reading_sessions";
            referencedColumns: ["id", "work_id", "owner_id"];
          },
          {
            foreignKeyName: "progress_events_work_owner_fk";
            columns: ["work_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      reading_list_items: {
        Row: {
          added_at: string;
          list_id: string;
          owner_id: string;
          work_id: string;
        };
        Insert: {
          added_at?: string;
          list_id: string;
          owner_id: string;
          work_id: string;
        };
        Update: {
          added_at?: string;
          list_id?: string;
          owner_id?: string;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reading_list_items_list_owner_fk";
            columns: ["list_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "reading_lists";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "reading_list_items_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_list_items_work_owner_fk";
            columns: ["work_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      reading_lists: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          owner_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reading_lists_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reading_sessions: {
        Row: {
          created_at: string;
          duration_seconds: number;
          end_position: number | null;
          id: string;
          notes: string | null;
          occurred_on: string;
          owner_id: string;
          progress_unit: Database["public"]["Enums"]["progress_unit"];
          start_position: number | null;
          updated_at: string;
          work_id: string;
        };
        Insert: {
          created_at?: string;
          duration_seconds: number;
          end_position?: number | null;
          id?: string;
          notes?: string | null;
          occurred_on?: string;
          owner_id: string;
          progress_unit: Database["public"]["Enums"]["progress_unit"];
          start_position?: number | null;
          updated_at?: string;
          work_id: string;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number;
          end_position?: number | null;
          id?: string;
          notes?: string | null;
          occurred_on?: string;
          owner_id?: string;
          progress_unit?: Database["public"]["Enums"]["progress_unit"];
          start_position?: number | null;
          updated_at?: string;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reading_sessions_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_sessions_work_owner_fk";
            columns: ["work_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      reviews: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          owner_id: string;
          rating: number;
          updated_at: string;
          work_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          owner_id: string;
          rating: number;
          updated_at?: string;
          work_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          owner_id?: string;
          rating?: number;
          updated_at?: string;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_work_owner_fk";
            columns: ["work_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      work_contributors: {
        Row: {
          contributor_id: string;
          created_at: string;
          owner_id: string;
          position: number;
          role: string;
          work_id: string;
        };
        Insert: {
          contributor_id: string;
          created_at?: string;
          owner_id: string;
          position?: number;
          role?: string;
          work_id: string;
        };
        Update: {
          contributor_id?: string;
          created_at?: string;
          owner_id?: string;
          position?: number;
          role?: string;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_contributors_contributor_owner_fk";
            columns: ["contributor_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "contributors";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "work_contributors_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_contributors_work_owner_fk";
            columns: ["work_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      work_external_sources: {
        Row: {
          created_at: string;
          external_id: string;
          id: string;
          imported_at: string;
          normalized_snapshot: Json;
          owner_id: string;
          provider: Database["public"]["Enums"]["external_provider"];
          work_id: string;
        };
        Insert: {
          created_at?: string;
          external_id: string;
          id?: string;
          imported_at?: string;
          normalized_snapshot?: Json;
          owner_id: string;
          provider: Database["public"]["Enums"]["external_provider"];
          work_id: string;
        };
        Update: {
          created_at?: string;
          external_id?: string;
          id?: string;
          imported_at?: string;
          normalized_snapshot?: Json;
          owner_id?: string;
          provider?: Database["public"]["Enums"]["external_provider"];
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_external_sources_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_external_sources_work_owner_fk";
            columns: ["work_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      work_genres: {
        Row: {
          created_at: string;
          genre: string;
          owner_id: string;
          work_id: string;
        };
        Insert: {
          created_at?: string;
          genre: string;
          owner_id: string;
          work_id: string;
        };
        Update: {
          created_at?: string;
          genre?: string;
          owner_id?: string;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_genres_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_genres_work_owner_fk";
            columns: ["work_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      works: {
        Row: {
          chapter_count: number | null;
          cover_external_url: string | null;
          cover_path: string | null;
          created_at: string;
          current_progress: number;
          description: string | null;
          doi: string | null;
          finished_at: string | null;
          id: string;
          isbn_10: string | null;
          isbn_13: string | null;
          language: string | null;
          owner_id: string;
          page_count: number | null;
          progress_unit: Database["public"]["Enums"]["progress_unit"];
          published_year: number | null;
          publisher: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["reading_status"];
          subtitle: string | null;
          title: string;
          type: Database["public"]["Enums"]["work_type"];
          updated_at: string;
        };
        Insert: {
          chapter_count?: number | null;
          cover_external_url?: string | null;
          cover_path?: string | null;
          created_at?: string;
          current_progress?: number;
          description?: string | null;
          doi?: string | null;
          finished_at?: string | null;
          id?: string;
          isbn_10?: string | null;
          isbn_13?: string | null;
          language?: string | null;
          owner_id: string;
          page_count?: number | null;
          progress_unit: Database["public"]["Enums"]["progress_unit"];
          published_year?: number | null;
          publisher?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["reading_status"];
          subtitle?: string | null;
          title: string;
          type: Database["public"]["Enums"]["work_type"];
          updated_at?: string;
        };
        Update: {
          chapter_count?: number | null;
          cover_external_url?: string | null;
          cover_path?: string | null;
          created_at?: string;
          current_progress?: number;
          description?: string | null;
          doi?: string | null;
          finished_at?: string | null;
          id?: string;
          isbn_10?: string | null;
          isbn_13?: string | null;
          language?: string | null;
          owner_id?: string;
          page_count?: number | null;
          progress_unit?: Database["public"]["Enums"]["progress_unit"];
          published_year?: number | null;
          publisher?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["reading_status"];
          subtitle?: string | null;
          title?: string;
          type?: Database["public"]["Enums"]["work_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "works_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_catalog_work: {
        Args: {
          p_authors: string[];
          p_chapter_count?: number;
          p_cover_external_url?: string;
          p_cover_path?: string;
          p_description?: string;
          p_external_id: string;
          p_genres?: string[];
          p_isbn_10?: string;
          p_isbn_13?: string;
          p_language?: string;
          p_page_count?: number;
          p_progress_unit: Database["public"]["Enums"]["progress_unit"];
          p_provider: Database["public"]["Enums"]["external_provider"];
          p_published_year?: number;
          p_publisher?: string;
          p_started_at?: string;
          p_status: Database["public"]["Enums"]["reading_status"];
          p_subtitle?: string;
          p_title: string;
          p_type: Database["public"]["Enums"]["work_type"];
        };
        Returns: string;
      };
      create_manual_work: {
        Args: {
          p_authors: string[];
          p_chapter_count?: number;
          p_cover_path?: string;
          p_description?: string;
          p_genres?: string[];
          p_isbn_13?: string;
          p_language?: string;
          p_page_count?: number;
          p_progress_unit: Database["public"]["Enums"]["progress_unit"];
          p_published_year?: number;
          p_publisher?: string;
          p_started_at?: string;
          p_status: Database["public"]["Enums"]["reading_status"];
          p_subtitle?: string;
          p_title: string;
          p_type: Database["public"]["Enums"]["work_type"];
        };
        Returns: string;
      };
    };
    Enums: {
      external_provider: "GOOGLE_BOOKS" | "OPEN_LIBRARY";
      goal_metric:
        "WORKS_FINISHED" | "PAGES_READ" | "CHAPTERS_READ" | "MINUTES_READ";
      note_kind: "NOTE" | "QUOTE";
      progress_event_type: "UPDATE" | "CORRECTION";
      progress_unit: "PAGE" | "CHAPTER" | "PERCENT";
      reading_status: "WANT_TO_READ" | "READING" | "FINISHED" | "ABANDONED";
      work_type: "BOOK" | "MANGA" | "ARTICLE" | "EBOOK";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      external_provider: ["GOOGLE_BOOKS", "OPEN_LIBRARY"],
      goal_metric: [
        "WORKS_FINISHED",
        "PAGES_READ",
        "CHAPTERS_READ",
        "MINUTES_READ",
      ],
      note_kind: ["NOTE", "QUOTE"],
      progress_event_type: ["UPDATE", "CORRECTION"],
      progress_unit: ["PAGE", "CHAPTER", "PERCENT"],
      reading_status: ["WANT_TO_READ", "READING", "FINISHED", "ABANDONED"],
      work_type: ["BOOK", "MANGA", "ARTICLE", "EBOOK"],
    },
  },
} as const;
