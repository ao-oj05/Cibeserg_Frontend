export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export type ScanStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED";

export type RiskLevel = "SAFE" | "WARNING" | "CRITICAL";
export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type FindingStatus = "PASSED" | "FAILED";

export interface Finding {
  id: string;
  category: string;
  checkKey: string;
  title: string;
  description: string;
  status: FindingStatus;
  severity: FindingSeverity;
  remediation: string | null;
  createdAt: string;
}

export interface ScanSummary {
  id: string;
  targetUrl: string;
  host: string;
  ipAddress: string | null;
  riskScore: number;
  riskLevel: RiskLevel;
  status: ScanStatus;
  responseTimeMs: number | null;
  httpsRedirect: boolean;
  sslValid: boolean;
  sslIssuer: string | null;
  sslDaysLeft: number | null;
  sslProtocol: string | null;
  confirmedOwnership: boolean;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  _count: {
    findings: number;
  };
}

export type ScanCreated = Omit<ScanSummary, "_count">;

export interface ScanDetail extends Omit<ScanSummary, "_count"> {
  findings: Finding[];
}

export interface ScanListResponse {
  data: ScanSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ReportType = "EXECUTIVE" | "TECHNICAL" | "COMPARATIVE";

export interface ReportRecord {
  id: string;
  scanId: string | null;
  type: ReportType;
  fileName: string;
  expiresAt: string;
  createdAt: string;
  scan?: {
    id: string;
    host: string;
    riskScore: number;
    targetUrl: string;
  } | null;
}
