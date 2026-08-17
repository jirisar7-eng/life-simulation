import { EntityId } from '../core/types';

export type HierarchyTier = 'L7_WORLD' | 'L6_REGION' | 'L5_SETTLEMENT' | 'L4_COMMUNITY' | 'L3_GROUP' | 'L2_HOUSEHOLD' | 'L1_INDIVIDUAL';

export interface IHierarchyNode {
  readonly id: EntityId;
  readonly tier: HierarchyTier;
  readonly name: string;
  readonly parentId?: EntityId;
  readonly childrenIds: EntityId[];
  readonly tags: string[];
  readonly metadata: Record<string, unknown>;
}

export interface IWorldNode extends IHierarchyNode {
  readonly tier: 'L7_WORLD';
  readonly seed: number | string;
  readonly ageInTicks: number;
}

export interface IRegionNode extends IHierarchyNode {
  readonly tier: 'L6_REGION';
  readonly worldId: EntityId;
  readonly climateType?: string;
}

export interface ISettlementNode extends IHierarchyNode {
  readonly tier: 'L5_SETTLEMENT';
  readonly regionId: EntityId;
  readonly settlementType?: 'village' | 'town' | 'city' | 'camp' | 'fortress';
}

export interface ICommunityNode extends IHierarchyNode {
  readonly tier: 'L4_COMMUNITY';
  readonly settlementId: EntityId;
  readonly focus?: 'religious' | 'craft' | 'governance' | 'military' | 'residential';
}

export interface IGroupNode extends IHierarchyNode {
  readonly tier: 'L3_GROUP';
  readonly communityId: EntityId;
  readonly groupType?: 'guild' | 'faction' | 'circle' | 'patrol';
}

export interface IHouseholdNode extends IHierarchyNode {
  readonly tier: 'L2_HOUSEHOLD';
  readonly groupId?: EntityId;
  readonly dwellingId?: string;
}

export interface IIndividualNode extends IHierarchyNode {
  readonly tier: 'L1_INDIVIDUAL';
  readonly householdId?: EntityId;
  readonly isAlive: boolean;
}
