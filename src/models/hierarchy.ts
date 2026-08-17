import { EntityId } from '../core/types';

export type HierarchyTier =
  | 'L7_WORLD'
  | 'L6_REGION'
  | 'L5_SETTLEMENT'
  | 'L4_COMMUNITY'
  | 'L3_GROUP'
  | 'L2_HOUSEHOLD'
  | 'L1_INDIVIDUAL';

export const HIERARCHY_TIER_ORDER: ReadonlyArray<HierarchyTier> = Object.freeze([
  'L1_INDIVIDUAL',
  'L2_HOUSEHOLD',
  'L3_GROUP',
  'L4_COMMUNITY',
  'L5_SETTLEMENT',
  'L6_REGION',
  'L7_WORLD',
]);

export interface IHierarchyNode {
  readonly id: EntityId;
  readonly tier: HierarchyTier;
  readonly name: string;
  parentId?: EntityId;
  childrenIds: EntityId[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface IWorldNode extends IHierarchyNode {
  readonly tier: 'L7_WORLD';
  readonly parentId?: undefined;
}

export interface IRegionNode extends IHierarchyNode {
  readonly tier: 'L6_REGION';
  parentId: EntityId;
}

export interface ISettlementNode extends IHierarchyNode {
  readonly tier: 'L5_SETTLEMENT';
  parentId: EntityId;
}

export interface ICommunityNode extends IHierarchyNode {
  readonly tier: 'L4_COMMUNITY';
  parentId: EntityId;
}

export interface IGroupNode extends IHierarchyNode {
  readonly tier: 'L3_GROUP';
  parentId: EntityId;
}

export interface IHouseholdNode extends IHierarchyNode {
  readonly tier: 'L2_HOUSEHOLD';
  parentId: EntityId;
}

export interface IIndividualNode extends IHierarchyNode {
  readonly tier: 'L1_INDIVIDUAL';
  parentId: EntityId;
}

export function createHierarchyNode<T extends IHierarchyNode = IHierarchyNode>(
  id: EntityId,
  tier: HierarchyTier,
  name: string,
  parentId?: EntityId,
  metadata: Record<string, unknown> = {}
): T {
  return {
    id,
    tier,
    name,
    parentId,
    childrenIds: [],
    tags: [],
    metadata: { ...metadata },
  } as T;
}

export function createWorldNode(
  id: EntityId,
  name: string,
  metadata: Record<string, unknown> = {}
): IWorldNode {
  return createHierarchyNode<IWorldNode>(id, 'L7_WORLD', name, undefined, metadata);
}

export function createRegionNode(
  id: EntityId,
  name: string,
  parentWorldId: EntityId,
  metadata: Record<string, unknown> = {}
): IRegionNode {
  return createHierarchyNode<IRegionNode>(id, 'L6_REGION', name, parentWorldId, metadata);
}

export function createSettlementNode(
  id: EntityId,
  name: string,
  parentRegionId: EntityId,
  metadata: Record<string, unknown> = {}
): ISettlementNode {
  return createHierarchyNode<ISettlementNode>(id, 'L5_SETTLEMENT', name, parentRegionId, metadata);
}

export function createCommunityNode(
  id: EntityId,
  name: string,
  parentSettlementId: EntityId,
  metadata: Record<string, unknown> = {}
): ICommunityNode {
  return createHierarchyNode<ICommunityNode>(id, 'L4_COMMUNITY', name, parentSettlementId, metadata);
}

export function createGroupNode(
  id: EntityId,
  name: string,
  parentCommunityId: EntityId,
  metadata: Record<string, unknown> = {}
): IGroupNode {
  return createHierarchyNode<IGroupNode>(id, 'L3_GROUP', name, parentCommunityId, metadata);
}

export function createHouseholdNode(
  id: EntityId,
  name: string,
  parentGroupId: EntityId,
  metadata: Record<string, unknown> = {}
): IHouseholdNode {
  return createHierarchyNode<IHouseholdNode>(id, 'L2_HOUSEHOLD', name, parentGroupId, metadata);
}

export function createIndividualNode(
  id: EntityId,
  name: string,
  parentHouseholdId: EntityId,
  metadata: Record<string, unknown> = {}
): IIndividualNode {
  return createHierarchyNode<IIndividualNode>(id, 'L1_INDIVIDUAL', name, parentHouseholdId, metadata);
}

export function addChildNode(parent: IHierarchyNode, child: IHierarchyNode): void {
  if (!parent.childrenIds.includes(child.id)) {
    parent.childrenIds.push(child.id);
  }
  child.parentId = parent.id;
}

export function removeChildNode(parent: IHierarchyNode, childId: EntityId): boolean {
  const index = parent.childrenIds.indexOf(childId);
  if (index !== -1) {
    parent.childrenIds.splice(index, 1);
    return true;
  }
  return false;
}

export function reparentNode(
  child: IHierarchyNode,
  newParent: IHierarchyNode,
  oldParent?: IHierarchyNode
): void {
  if (oldParent) {
    removeChildNode(oldParent, child.id);
  }
  addChildNode(newParent, child);
}

export function getAncestryPath(
  startNodeId: EntityId,
  lookupNode: (id: EntityId) => IHierarchyNode | undefined
): EntityId[] {
  const path: EntityId[] = [];
  let currentId: EntityId | undefined = startNodeId;
  const visited = new Set<EntityId>();

  while (currentId && !visited.has(currentId)) {
    path.push(currentId);
    visited.add(currentId);
    const node = lookupNode(currentId);
    currentId = node?.parentId;
  }

  return path;
}

export function traverseTopDown(
  rootId: EntityId,
  lookupNode: (id: EntityId) => IHierarchyNode | undefined,
  visitor: (node: IHierarchyNode, depth: number) => void,
  depth: number = 0
): void {
  const node = lookupNode(rootId);
  if (!node) return;

  visitor(node, depth);
  for (const childId of node.childrenIds) {
    traverseTopDown(childId, lookupNode, visitor, depth + 1);
  }
}

export function traverseBottomUp<T>(
  rootId: EntityId,
  lookupNode: (id: EntityId) => IHierarchyNode | undefined,
  aggregator: (node: IHierarchyNode, childrenResults: T[]) => T
): T | undefined {
  const node = lookupNode(rootId);
  if (!node) return undefined;

  const childrenResults: T[] = [];
  for (const childId of node.childrenIds) {
    const res = traverseBottomUp(childId, lookupNode, aggregator);
    if (res !== undefined) {
      childrenResults.push(res);
    }
  }

  return aggregator(node, childrenResults);
}

