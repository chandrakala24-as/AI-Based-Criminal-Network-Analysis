export type Role = 'ADMIN' | 'INVESTIGATOR' | 'ANALYST' | 'VIEWER';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  active: boolean;
  created_at: string;
}

export interface Case {
  id: number;
  case_number: string;
  title: string;
  description?: string;
  case_type: string;
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'PENDING_REVIEW' | 'CLOSED';
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: number;
  person_code: string;
  name: string;
  aliases?: string;
  date_of_birth?: string;
  notes?: string;
  created_at: string;
}

export interface Phone {
  id: number;
  phone_code: string;
  masked_number: string;
  owner_person_id?: number;
}

export interface Vehicle {
  id: number;
  vehicle_code: string;
  registration_number: string;
  vehicle_type: string;
  owner_person_id?: number;
}

export interface LocationItem {
  id: number;
  location_code: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface ExtractedEntity {
  id?: number;
  entity_type: string;
  entity_value: string;
  normalized_value: string;
  confidence: number;
  start_position: number;
  end_position: number;
  is_approved?: boolean;
}

export interface Relationship {
  id?: number;
  source_entity_type: string;
  source_entity_id: string;
  target_entity_type: string;
  target_entity_id: string;
  relationship_type: string;
  confidence: number;
  case_id?: number;
  source_document_id?: number;
  explanation?: string;
}

export interface DocumentItem {
  id: number;
  document_code: string;
  case_id: number;
  filename: string;
  document_type: string;
  sha256_hash: string;
  uploaded_by: number;
  uploaded_at: string;
  extracted_text?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  details?: Record<string, any>;
  degree?: number;
  centrality?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence?: number;
  case_id?: number;
  explanation?: string;
}

export interface NetworkGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
}

export interface CrossCaseLink {
  case_a_id: number;
  case_a_number: string;
  case_b_id: number;
  case_b_number: string;
  shared_entity_type: string;
  shared_entity_value: string;
  confidence: number;
  sources: string[];
  status: string;
}

export interface CaseSimilarity {
  case_id: number;
  case_number: string;
  title: string;
  similarity_score: number;
  reason: string;
}

export interface AnomalyAlert {
  id: number;
  case_id?: number;
  entity_id?: string;
  entity_type?: string;
  alert_type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  explanation: string;
  status: string;
  created_at: string;
  disclaimer: string;
}

export interface SystemStats {
  total_cases: number;
  total_entities: number;
  total_relationships: number;
  total_alerts: number;
  total_documents: number;
  verified_evidence_count: number;
}

export interface LedgerBlock {
  block_index: number;
  timestamp: string;
  evidence_id: string;
  case_id: number;
  sha256_hash: string;
  previous_hash: string;
  block_hash: string;
}

export interface EvidenceVerificationResult {
  document_id: number;
  filename: string;
  stored_hash: string;
  computed_hash: string;
  verified: boolean;
  status_message: string;
  ledger_reference?: string;
  timestamp: string;
}

export interface SourceReference {
  document_id?: number;
  document_code?: string;
  case_number?: string;
  filename?: string;
  date?: string;
  relevance_snippet?: string;
}

export interface AssistantResponse {
  query: string;
  answer: string;
  confidence: number;
  sources: SourceReference[];
  disclaimer: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  timestamp: string;
  ip_address: string;
}
