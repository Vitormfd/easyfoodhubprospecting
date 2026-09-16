import type { CompetitorStatus, EvidenceItem } from "@/types/database";

export interface DetectionResult {
  status: CompetitorStatus;
  confidence: number; // 0-100
  evidence: EvidenceItem[];
  analyzedUrl: string | null;
  reason: string;
}

export interface PageSignals {
  finalUrl: string;
  html: string;
  headers: Record<string, string>;
}
