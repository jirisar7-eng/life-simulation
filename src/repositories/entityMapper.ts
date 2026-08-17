import { EntityType, IEntity } from '../models/entity';
import type { Entity as PrismaEntity } from '@prisma/client';

export interface PrismaEntityInput {
  id: string;
  type: string;
  parentId: string | null;
  createdAtTick: number | null;
  tags: string[];
  metadata: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EntityMapper {
  public static toDomain(record: PrismaEntity | PrismaEntityInput): IEntity {
    return {
      id: record.id,
      type: record.type as EntityType,
      parentId: record.parentId ?? undefined,
      createdAtTick: record.createdAtTick ?? 0,
      tags: Array.isArray(record.tags) ? [...record.tags] : [],
      metadata:
        record.metadata &&
        typeof record.metadata === 'object' &&
        !Array.isArray(record.metadata)
          ? { ...(record.metadata as Record<string, unknown>) }
          : {},
    };
  }

  public static toPrisma(domain: IEntity): PrismaEntityInput {
    let tagsArray: string[] = [];
    if (domain.tags) {
      tagsArray = Array.isArray(domain.tags)
        ? [...domain.tags]
        : Array.from(domain.tags);
    }

    return {
      id: domain.id,
      type: domain.type,
      parentId: domain.parentId ?? null,
      createdAtTick: domain.createdAtTick ?? null,
      tags: tagsArray,
      metadata: domain.metadata ? { ...domain.metadata } : null,
    };
  }
}
