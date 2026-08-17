import { EntityId } from '../core/types';
import { IEntity } from '../models/entity';
import { IEntityRepository } from './entityRepository';
import { EntityMapper } from './entityMapper';

export interface IPrismaEntityDelegate {
  findUnique(args: { where: { id: string } }): Promise<unknown>;
  findMany(args?: unknown): Promise<unknown[]>;
  upsert(args: {
    where: { id: string };
    create: unknown;
    update: unknown;
  }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;
  count(args?: { where?: { id: string } }): Promise<number>;
}

export interface IPrismaClientLike {
  entity: IPrismaEntityDelegate;
}

export class PrismaEntityRepository implements IEntityRepository<IEntity> {
  private readonly _delegate: IPrismaEntityDelegate;

  constructor(client: IPrismaClientLike | IPrismaEntityDelegate) {
    if ('entity' in client && client.entity) {
      this._delegate = client.entity;
    } else {
      this._delegate = client as IPrismaEntityDelegate;
    }
  }

  public async getById(id: EntityId): Promise<IEntity | undefined> {
    const record = await this._delegate.findUnique({
      where: { id },
    });
    if (!record) return undefined;
    return EntityMapper.toDomain(record as any);
  }

  public async getAll(): Promise<IEntity[]> {
    const records = await this._delegate.findMany();
    return records.map((r) => EntityMapper.toDomain(r as any));
  }

  public async save(entity: IEntity): Promise<IEntity> {
    if (!entity || !entity.id) {
      throw new Error('Entity must have a valid non-empty id');
    }
    const prismaData = EntityMapper.toPrisma(entity);
    const saved = await this._delegate.upsert({
      where: { id: entity.id },
      create: {
        id: prismaData.id,
        type: prismaData.type,
        parentId: prismaData.parentId,
        createdAtTick: prismaData.createdAtTick,
        tags: prismaData.tags,
        metadata: prismaData.metadata,
      },
      update: {
        type: prismaData.type,
        parentId: prismaData.parentId,
        createdAtTick: prismaData.createdAtTick,
        tags: prismaData.tags,
        metadata: prismaData.metadata,
      },
    });
    return EntityMapper.toDomain(saved as any);
  }

  public async delete(id: EntityId): Promise<boolean> {
    try {
      await this._delegate.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this._delegate.count({
      where: { id },
    });
    return count > 0;
  }
}
