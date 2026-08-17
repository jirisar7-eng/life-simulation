import { EntityId } from '../core/types';
import { IHierarchyNode, IWorldNode } from './hierarchy';
import { IWorldContainer } from './worldContainer';

export interface IWorldQueryService {
  getWorld(): IWorldNode | undefined;
  getEntity<T extends IHierarchyNode = IHierarchyNode>(id: EntityId): T | undefined;
  getChildren(id: EntityId): IHierarchyNode[];
  getParent(id: EntityId): IHierarchyNode | undefined;
  getDescendants(id: EntityId): IHierarchyNode[];
}

export class WorldQueryService implements IWorldQueryService {
  constructor(private readonly _container: IWorldContainer) {}

  public getWorld(): IWorldNode | undefined {
    return this._container.getRoot();
  }

  public getEntity<T extends IHierarchyNode = IHierarchyNode>(id: EntityId): T | undefined {
    return this._container.getEntity<T>(id);
  }

  public getChildren(id: EntityId): IHierarchyNode[] {
    return this._container.getChildren(id);
  }

  public getParent(id: EntityId): IHierarchyNode | undefined {
    return this._container.getParent(id);
  }

  public getDescendants(id: EntityId): IHierarchyNode[] {
    const target = this._container.getEntity(id);
    if (!target) {
      return [];
    }

    const descendants: IHierarchyNode[] = [];
    const queue: EntityId[] = [...target.childrenIds];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = this._container.getEntity(currentId);
      if (node) {
        descendants.push(node);
        queue.push(...node.childrenIds);
      }
    }

    return descendants;
  }
}
