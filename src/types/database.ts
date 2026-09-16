// Tipos manuais correspondentes a supabase/migrations/0001_init.sql.
// Quando o projeto Supabase estiver conectado, prefira regenerar com:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type LeadStatus =
  | "novo"
  | "qualificado"
  | "contatar"
  | "contatado"
  | "respondeu"
  | "em_negociacao"
  | "cliente"
  | "sem_interesse"
  | "descartado";

export type CompetitorStatus = "confirmado" | "provavel" | "nao_identificado";

export type FingerprintSignalType =
  | "domain"
  | "script_src"
  | "meta"
  | "html_pattern"
  | "header";

export type ContactChannel =
  | "instagram"
  | "whatsapp"
  | "telefone"
  | "email"
  | "outro";

export type FollowupStatus = "pending" | "done" | "skipped";

export interface EvidenceItem {
  signal_type: FingerprintSignalType;
  pattern: string;
  matched: string;
  weight: number;
  description?: string | null;
}

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      competitors: {
        Row: {
          id: string;
          slug: string;
          name: string;
          active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["competitors"]["Row"]> & {
          slug: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["competitors"]["Row"]>;
        Relationships: [];
      };
      competitor_fingerprints: {
        Row: {
          id: string;
          competitor_id: string;
          signal_type: FingerprintSignalType;
          pattern: string;
          weight: number;
          description: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["competitor_fingerprints"]["Row"]
        > & {
          competitor_id: string;
          signal_type: FingerprintSignalType;
          pattern: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["competitor_fingerprints"]["Row"]
        >;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          category: string | null;
          city: string;
          state: string;
          address: string | null;
          phone: string | null;
          whatsapp: string | null;
          instagram_username: string | null;
          instagram_url: string | null;
          website: string | null;
          menu_url: string | null;
          competitor: string | null;
          competitor_status: CompetitorStatus;
          competitor_confidence: number;
          competitor_evidence: EvidenceItem[];
          source: string;
          source_url: string | null;
          status: LeadStatus;
          notes: string | null;
          dedup_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & {
          user_id: string;
          business_name: string;
          city: string;
          state: string;
          dedup_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
        Relationships: [];
      };
      competitor_detections: {
        Row: {
          id: string;
          lead_id: string;
          competitor_id: string;
          status: CompetitorStatus;
          confidence: number;
          evidence: EvidenceItem[];
          analyzed_url: string | null;
          reason: string | null;
          analyzed_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["competitor_detections"]["Row"]
        > & {
          lead_id: string;
          competitor_id: string;
          status: CompetitorStatus;
        };
        Update: Partial<
          Database["public"]["Tables"]["competitor_detections"]["Row"]
        >;
        Relationships: [];
      };
      message_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          content: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["message_templates"]["Row"]
        > & {
          user_id: string;
          name: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["message_templates"]["Row"]>;
        Relationships: [];
      };
      contact_history: {
        Row: {
          id: string;
          lead_id: string;
          user_id: string;
          template_id: string | null;
          channel: ContactChannel;
          message_sent: string | null;
          sent_at: string;
          response: string | null;
          responded_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["contact_history"]["Row"]
        > & {
          lead_id: string;
          user_id: string;
          channel: ContactChannel;
        };
        Update: Partial<Database["public"]["Tables"]["contact_history"]["Row"]>;
        Relationships: [];
      };
      follow_ups: {
        Row: {
          id: string;
          lead_id: string;
          user_id: string;
          step_number: number;
          due_date: string;
          status: FollowupStatus;
          notes: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["follow_ups"]["Row"]> & {
          lead_id: string;
          user_id: string;
          due_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["follow_ups"]["Row"]>;
        Relationships: [];
      };
      settings: {
        Row: {
          user_id: string;
          default_city: string | null;
          default_state: string | null;
          default_segments: string[];
          follow_up_intervals: number[];
          signature: string | null;
          contact_preferences: Record<string, unknown>;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["settings"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["settings"]["Row"]>;
        Relationships: [];
      };
      instagram_accounts: {
        Row: {
          id: string;
          user_id: string;
          ig_user_id: string;
          ig_username: string | null;
          access_token: string;
          token_expires_at: string | null;
          permissions: string[];
          connected_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["instagram_accounts"]["Row"]
        > & {
          user_id: string;
          ig_user_id: string;
          access_token: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["instagram_accounts"]["Row"]
        >;
        Relationships: [];
      };
    };
  };
}

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];
export type MessageTemplate =
  Database["public"]["Tables"]["message_templates"]["Row"];
export type ContactHistoryEntry =
  Database["public"]["Tables"]["contact_history"]["Row"];
export type FollowUp = Database["public"]["Tables"]["follow_ups"]["Row"];
export type Settings = Database["public"]["Tables"]["settings"]["Row"];
export type Competitor = Database["public"]["Tables"]["competitors"]["Row"];
export type CompetitorFingerprint =
  Database["public"]["Tables"]["competitor_fingerprints"]["Row"];
export type CompetitorDetection =
  Database["public"]["Tables"]["competitor_detections"]["Row"];
