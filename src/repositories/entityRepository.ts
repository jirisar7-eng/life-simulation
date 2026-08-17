import { EntityId } from '../core/types';
import { IEntity } from '../models/entity';

export interface IEntityRepository<T extends IEntity = IEntity> {
  getById(id: EntityId): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: EntityId): Promise<boolean>;
  exists(id: EntityId): Promise<boolean>;
}

export class InMemoryEntityRepository<T extends IEntity = IEntity>
  implements IEntityRepository<T>
{
  private _storage = new Map<EntityId, T>();

  public async getById(id: EntityId): Promise<T | undefined> {
    const entity = this._storage.get(id);
    return entity ? this._clone(entity) : undefined;
  }

  public async getAll(): Promise<T[]> {
    return Array.from(this._storage.values()).map((e) => this._clone(e));
  }

  public async save(entity: T): Promise<T> {
    if (!entity || !entity.id) {
      throw new Error('Entity must have a valid non-empty id');
    }
    const cloned = this._clone(entity);
    this._storage.set(entity.id, cloned);
    return this._clone(cloned);
  }

  public async delete(id: EntityId): Promise<boolean> {
    return this._storage.delete(id);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return this._storage.has(id);
  }

  public async count(): Promise<number> {
    return this._storage.size;
  }

  public async clear(): Promise<void> {
    this._storage.clear();
  }

  private _clone(entity: T): T {
    return {
      ...entity,
      tags: Array.isArray(entity.tags)
        ? [...entity.tags]
        : entity.tags instanceof Set
        ? new Set(entity.tags)
        : entity.tags,
      metadata: { ...entity.metadata },
    };
  }
}
