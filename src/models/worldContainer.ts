import { EntityId } from '../core/types';
import {
  HierarchyTier,
  HIERARCHY_TIER_ORDER,
  IHierarchyNode,
  IWorldNode,
  addChildNode,
  removeChildNode,
} from './hierarchy';

export interface IWorldContainer {
  readonly root: IWorldNode | undefined;
  addEntity<T extends IHierarchyNode = IHierarchyNode>(node: T): T;
  removeEntity(entityId: EntityId, cascade?: boolean): boolean;
  getEntity<T extends IHierarchyNode = IHierarchyNode>(entityId: EntityId): T | undefined;
  hasEntity(entityId: EntityId): boolean;
  getChildren(entityId: EntityId): IHierarchyNode[];
  getParent(entityId: EntityId): IHierarchyNode | undefined;
  getRoot(): IWorldNode | undefined;
  getAllEntities(): IHierarchyNode[];
  getEntitiesByTier(tier: HierarchyTier): IHierarchyNode[];
  count(): number;
  clear(): void;
}

export class WorldContainer implements IWorldContainer {
  private _nodes: Map<EntityId, IHierarchyNode> = new Map();
  private _root: IWorldNode | undefined = undefined;

  public get root(): IWorldNode | undefined {
    return this._root;
  }

  public getRoot(): IWorldNode | undefined {
    return this._root;
  }

  public addEntity<T extends IHierarchyNode = IHierarchyNode>(node: T): T {
    if (!node || !node.id) {
      throw new Error('Entity must have a valid non-empty id');
    }

    if (this._nodes.has(node.id)) {
      throw new Error(`Duplicate EntityId: Entity with id '${node.id}' already exists in WorldContainer`);
    }

    if (!HIERARCHY_TIER_ORDER.includes(node.tier)) {
      throw new Error(`Invalid hierarchy tier: '${node.tier}'`);
    }

    // Root World Tier validation
    if (node.tier === 'L7_WORLD') {
      if (node.parentId !== undefined) {
        throw new Error(`Root L7_WORLD entity '${node.id}' cannot have a parentId`);
      }
      if (this._root !== undefined) {
        throw new Error(
          `Root L7_WORLD entity already exists with id '${this._root.id}'. Only one root world is allowed.`
        );
      }
      this._root = node as unknown as IWorldNode;
    } else {
      // Non-world entities require a parentId
      if (!node.parentId) {
        throw new Error(`Entity '${node.id}' of tier '${node.tier}' requires a valid parentId`);
      }

      const parent = this._nodes.get(node.parentId);
      if (!parent) {
        throw new Error(
          `Parent entity with id '${node.parentId}' does not exist for entity '${node.id}'`
        );
      }

      // Check tier hierarchy order: parent tier must be strictly higher than child tier
      const parentTierIndex = HIERARCHY_TIER_ORDER.indexOf(parent.tier);
      const childTierIndex = HIERARCHY_TIER_ORDER.indexOf(node.tier);
      if (parentTierIndex <= childTierIndex) {
        throw new Error(
          `Invalid hierarchy tier relation: parent tier '${parent.tier}' must be higher than child tier '${node.tier}'`
        );
      }

      // Cycle check: verify that node.id is not anywhere in parent's ancestry chain
      let currentCheck: IHierarchyNode | undefined = parent;
      const visited = new Set<EntityId>();

      while (currentCheck) {
        if (currentCheck.id === node.id) {
          throw new Error(
            `Cyclic hierarchy detected: adding entity '${node.id}' under parent '${node.parentId}' creates a cycle`
          );
        }
        if (visited.has(currentCheck.id)) {
          break;
        }
        visited.add(currentCheck.id);
        currentCheck = currentCheck.parentId ? this._nodes.get(currentCheck.parentId) : undefined;
      }

      // Link child to parent
      addChildNode(parent, node);
    }

    this._nodes.set(node.id, node);
    return node;
  }

  public removeEntity(entityId: EntityId, cascade: boolean = true): boolean {
    const node = this._nodes.get(entityId);
    if (!node) {
      return false;
    }

    if (cascade) {
      // Recursively remove all children first
      const childrenIds = [...node.childrenIds];
      for (const childId of childrenIds) {
        this.removeEntity(childId, true);
      }
    } else {
      // Detach children
      for (const childId of node.childrenIds) {
        const child = this._nodes.get(childId);
        if (child) {
          child.parentId = node.parentId;
        }
      }
    }

    // Detach from parent
    if (node.parentId) {
      const parent = this._nodes.get(node.parentId);
      if (parent) {
        removeChildNode(parent, node.id);
      }
    }

    // If root is removed
    if (this._root?.id === node.id) {
      this._root = undefined;
    }

    this._nodes.delete(entityId);
    return true;
  }

  public getEntity<T extends IHierarchyNode = IHierarchyNode>(entityId: EntityId): T | undefined {
    return this._nodes.get(entityId) as T | undefined;
  }

  public hasEntity(entityId: EntityId): boolean {
    return this._nodes.has(entityId);
  }

  public getChildren(entityId: EntityId): IHierarchyNode[] {
    const node = this._nodes.get(entityId);
    if (!node) return [];
    const children: IHierarchyNode[] = [];
    for (const childId of node.childrenIds) {
      const child = this._nodes.get(childId);
      if (child) {
        children.push(child);
      }
    }
    return children;
  }

  public getParent(entityId: EntityId): IHierarchyNode | undefined {
    const node = this._nodes.get(entityId);
    if (!node || !node.parentId) return undefined;
    return this._nodes.get(node.parentId);
  }

  public getAllEntities(): IHierarchyNode[] {
    return Array.from(this._nodes.values());
  }

  public getEntitiesByTier(tier: HierarchyTier): IHierarchyNode[] {
    const results: IHierarchyNode[] = [];
    for (const node of this._nodes.values()) {
      if (node.tier === tier) {
        results.push(node);
      }
    }
    return results;
  }

  public count(): number {
    return this._nodes.size;
  }

  public clear(): void {
    this._nodes.clear();
    this._root = undefined;
  }
}
