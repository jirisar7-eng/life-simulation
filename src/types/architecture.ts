export type ActiveTab = 
  | 'overview'
  | 'hierarchy'
  | 'agent-model'
  | 'god-api'
  | 'tick-pipeline'
  | 'module-registry'
  | 'roadmap';

export interface ModuleDefinition {
  id: string;
  name: string;
  category: 'Core' | 'World & Hierarchy' | 'Agent & Behavior' | 'Systems' | 'Player & Divine';
  status: 'Phase 1 Core' | 'Phase 2' | 'Phase 3' | 'Phase 4' | 'Phase 5+';
  description: string;
  dependencies: string[];
  providedServices: string[];
  listensToEvents: string[];
  emitsEvents: string[];
}

export interface HierarchyLevel {
  id: string;
  level: string;
  title: string;
  description: string;
  scaleDescription: string;
  responsibilities: string[];
  simulatedAttributes: string[];
  godInfluenceLevel: number;
}

export interface GodLevelDefinition {
  level: number;
  title: string;
  subtitle: string;
  scope: string;
  observationCapabilities: string[];
  interventions: Array<{
    name: string;
    description: string;
    target: string;
    impact: string;
    energyCost: string;
  }>;
}

export interface AgentModelSection {
  title: string;
  key: string;
  description: string;
  fields: Array<{
    name: string;
    type: string;
    description: string;
    sampleValue: string;
  }>;
}
