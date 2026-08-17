import { EntityId } from '../core/types';

export type EntityType =
  | 'world'
  | 'region'
  | 'settlement'
  | 'community'
  | 'group'
  | 'household'
  | 'individual'
  | 'item'
  | 'landmark'
  | 'custom';

export interface IEntity {
  readonly id: EntityId;
  readonly type: EntityType;
  readonly createdAtTick: number;
  parentId?: EntityId;
  tags: Set<string> | string[];
  metadata: Record<string, unknown>;
}

export interface IEntityManager {
  add(entity: IEntity): void;
  get(id: EntityId): IEntity | undefined;
  getByType(type: EntityType): IEntity[];
  remove(id: EntityId): boolean;
  has(id: EntityId): boolean;
  count(): number;
  clear(): void;
}

export class EntityManager implements IEntityManager {
  private entities = new Map<EntityId, IEntity>();
  private typeIndex = new Map<EntityType, Set<EntityId>>();

  public add(entity: IEntity): void {
    this.entities.set(entity.id, entity);
    let set = this.typeIndex.get(entity.type);
    if (!set) {
      set = new Set();
      this.typeIndex.set(entity.type, set);
    }
    set.add(entity.id);
  }

  public get(id: EntityId): IEntity | undefined {
    return this.entities.get(id);
  }

  public getByType(type: EntityType): IEntity[] {
    const set = this.typeIndex.get(type);
    if (!set) return [];
    const result: IEntity[] = [];
    for (const id of set) {
      const e = this.entities.get(id);
      if (e) result.push(e);
    }
    return result;
  }

  public remove(id: EntityId): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    const set = this.typeIndex.get(entity.type);
    if (set) {
      set.delete(id);
    }
    return this.entities.delete(id);
  }

  public has(id: EntityId): boolean {
    return this.entities.has(id);
  }

  public count(): number {
    return this.entities.size;
  }

  public clear(): void {
    this.entities.clear();
    this.typeIndex.clear();
  }
}
