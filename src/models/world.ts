import { WorldId } from '../core/types';

export interface IWorldIdentity {
  readonly id: WorldId;
  readonly name: string;
  readonly description: string;
  readonly createdAt: number;
}

export interface IWorld {
  readonly identity: IWorldIdentity;
  metadata: Record<string, unknown>;
}

export class World implements IWorld {
  public readonly identity: IWorldIdentity;
  public metadata: Record<string, unknown>;

  constructor(identity: IWorldIdentity, metadata: Record<string, unknown> = {}) {
    this.identity = Object.freeze({
      id: identity.id,
      name: identity.name,
      description: identity.description ?? '',
      createdAt: identity.createdAt ?? 0,
    });
    this.metadata = { ...metadata };
  }

  public get id(): WorldId {
    return this.identity.id;
  }

  public get name(): string {
    return this.identity.name;
  }

  public get description(): string {
    return this.identity.description;
  }

  public get createdAt(): number {
    return this.identity.createdAt;
  }
}

export function createWorld(
  id: WorldId,
  name: string,
  description: string = '',
  createdAt: number = 0,
  metadata: Record<string, unknown> = {}
): World {
  return new World(
    {
      id,
      name,
      description,
      createdAt,
    },
    metadata
  );
}
