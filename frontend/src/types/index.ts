export interface Application {
  id: number
  name: string
  description?: string
  status: 'active' | 'sunset' | 'planned'
  lifecycle?: string
  owner?: string
  tags?: string
  created_at?: string
  updated_at?: string
  capability_ids?: number[]
  domain_ids?: number[]
}

export interface BusinessCapability {
  id: number
  name: string
  description?: string
  level: number
  parent_id?: number
  owner?: string
  tags?: string
  created_at?: string
  updated_at?: string
  children?: BusinessCapability[]
}

export interface TechnologyComponent {
  id: number
  name: string
  component_type: 'database' | 'middleware' | 'platform' | 'service' | string
  vendor?: string
  version?: string
  status: 'adopt' | 'trial' | 'assess' | 'hold'
  description?: string
  tags?: string
  created_at?: string
  updated_at?: string
}

export interface Interface {
  id: number
  name: string
  source_id?: number
  target_id?: number
  source_name?: string
  target_name?: string
  protocol?: string
  frequency?: string
  data_classification?: string
  description?: string
  tags?: string
  created_at?: string
  updated_at?: string
}

export interface BusinessDomain {
  id: number
  name: string
  description?: string
  owner?: string
  tags?: string
  created_at?: string
  updated_at?: string
}

export interface CRCCard {
  id: number
  component_name: string
  component_type: 'application' | 'capability' | 'service' | string
  responsibilities?: string
  collaborators?: string
  notes?: string
  tags?: string
  created_at?: string
  updated_at?: string
  linked_application_ids?: number[]
  linked_tech_component_ids?: number[]
}

export interface DashboardStats {
  total_applications: number
  total_capabilities: number
  total_tech_components: number
  total_interfaces: number
  total_domains: number
  total_crc_cards: number
  applications_by_status: Record<string, number>
  tech_components_by_status: Record<string, number>
}

export interface SearchResult {
  type: string
  id: number
  name: string
  description?: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
}
