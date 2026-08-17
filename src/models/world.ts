import { WorldId, WorldIdentity, WorldState, WorldStatus, SimulationTime } from '../core/types';

export type { WorldStatus, WorldState };

export interface IWorldIdentity extends WorldIdentity {}

export interface IWorldState extends WorldState {}

export interface IWorld {
  readonly identity: IWorldIdentity;
  readonly state: IWorldState;
  metadata: Record<string, unknown>;
}

export class World implements IWorld {
  public readonly identity: IWorldIdentity;
  public readonly state: IWorldState;
  public metadata: Record<string, unknown>;

  constructor(
    identity: IWorldIdentity,
    state?: Partial<IWorldState>,
    metadata: Record<string, unknown> = {}
  ) {
    this.identity = Object.freeze({
      id: identity.id,
      name: identity.name,
      description: identity.description ?? '',
      createdAt: identity.createdAt ?? 0,
    });

    this.state = {
      status: state?.status ?? 'active',
      currentTick: state?.currentTick ?? 0,
      simulationTime: state?.simulationTime
        ? { ...state.simulationTime }
        : {
            tick: state?.currentTick ?? 0,
            seconds: 0,
            minutes: 0,
            hours: 0,
            days: 0,
            months: 0,
            years: 0,
          },
    };

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

  public get status(): WorldStatus {
    return this.state.status;
  }

  public setStatus(status: WorldStatus): void {
    if (status !== 'active' && status !== 'paused') {
      throw new Error(`Invalid world status: ${status}`);
    }
    this.state.status = status;
  }

  public get currentTick(): number {
    return this.state.currentTick;
  }

  public get simulationTime(): SimulationTime {
    return this.state.simulationTime;
  }

  public updateTick(tick: number, time: SimulationTime): void {
    if (tick < 0) {
      throw new Error('Tick cannot be negative');
    }
    this.state.currentTick = tick;
    this.state.simulationTime = { ...time };
  }
}

export function createWorld(
  id: WorldId,
  name: string,
  description: string = '',
  createdAt: number = 0,
  initialState?: Partial<IWorldState>,
  metadata: Record<string, unknown> = {}
): World {
  return new World(
    {
      id,
      name,
      description,
      createdAt,
    },
    initialState,
    metadata
  );
}

