import {
  ISimulation,
  ISimulationConfig,
  ISimulationSnapshot,
  ISimulationTick,
  IWorldState,
  SimulationMode,
  SimulationStatus,
  SimulationTime,
  TickPhase,
} from './types';
import { EventBus, IEventBus } from './EventBus';
import { RandomSource, SeededRandom } from './random';
import { SimulationClock } from './SimulationClock';
import { IEngineContext, ModuleRegistry } from './ModuleRegistry';
import { EntityManager, IEntityManager } from '../models/entity';

export class SimulationEngine implements ISimulation {
  public readonly id: string;
  public readonly name: string;
  private _status: SimulationStatus = 'stopped';
  private _mode: SimulationMode = 'manual';
  private _clock: SimulationClock;
  private _random: RandomSource;
  private _eventBus: IEventBus;
  private _moduleRegistry: ModuleRegistry;
  private _entityManager: IEntityManager;
  private _world: IWorldState;
  private _context: IEngineContext;

  constructor(config: ISimulationConfig = {}) {
    this.id = config.id ?? `sim_${Math.floor(Math.random() * 1000000).toString(16)}`;
    this.name = config.name ?? 'Life Simulation World';
    this._mode = config.mode ?? 'manual';

    this._clock = new SimulationClock({
      secondsPerTick: config.secondsPerTick ?? 60,
      daysPerMonth: config.daysPerMonth ?? 30,
      monthsPerYear: config.monthsPerYear ?? 12,
    });

    this._random = new SeededRandom(config.seed ?? 1337);
    this._eventBus = new EventBus();
    this._moduleRegistry = new ModuleRegistry();
    this._entityManager = new EntityManager();

    this._world = {
      id: `world_${this.id}`,
      name: this.name,
      createdTick: 0,
      entitiesCount: 0,
      metadata: {},
    };

    this._context = {
      eventBus: this._eventBus,
      random: this._random,
      clock: this._clock,
      getModule: (moduleId) => this._moduleRegistry.get(moduleId),
    };
  }

  public get status(): SimulationStatus {
    return this._status;
  }

  public get mode(): SimulationMode {
    return this._mode;
  }

  public setMode(mode: SimulationMode): void {
    this._mode = mode;
  }

  public isManual(): boolean {
    return this._mode === 'manual';
  }

  public isAutomatic(): boolean {
    return this._mode === 'automatic';
  }

  public get currentTick(): number {
    return this._clock.getTick();
  }

  public get simulationTime(): Readonly<SimulationTime> {
    return this._clock.getTime();
  }

  public get world(): IWorldState {
    return {
      ...this._world,
      entitiesCount: this._entityManager.count(),
    };
  }

  public get eventBus(): IEventBus {
    return this._eventBus;
  }

  public get modules(): ModuleRegistry {
    return this._moduleRegistry;
  }

  public get random(): RandomSource {
    return this._random;
  }

  public get clock(): SimulationClock {
    return this._clock;
  }

  public get entities(): IEntityManager {
    return this._entityManager;
  }

  /**
   * Starts the simulation runtime from 'stopped' state.
   * Initializes all registered modules.
   * Rejects transition if not in 'stopped' status.
   */
  public async start(): Promise<boolean> {
    if (this._status !== 'stopped') {
      return false;
    }

    await this._moduleRegistry.initializeAll(this._context);

    this._status = 'running';
    this._eventBus.publish({
      type: 'simulation.started',
      tick: this.currentTick,
      payload: { id: this.id, name: this.name, tick: this.currentTick },
    });
    return true;
  }

  /**
   * Pauses the simulation runtime from 'running' state.
   * Rejects transition if not in 'running' status.
   */
  public pause(): boolean {
    if (this._status !== 'running') {
      return false;
    }

    this._status = 'paused';
    this._eventBus.publish({
      type: 'simulation.paused',
      tick: this.currentTick,
      payload: { id: this.id, tick: this.currentTick },
    });
    return true;
  }

  /**
   * Resumes the simulation runtime from 'paused' state.
   * Rejects transition if not in 'paused' status.
   */
  public resume(): boolean {
    if (this._status !== 'paused') {
      return false;
    }

    this._status = 'running';
    this._eventBus.publish({
      type: 'simulation.resumed',
      tick: this.currentTick,
      payload: { id: this.id, tick: this.currentTick },
    });
    return true;
  }

  /**
   * Stops the simulation runtime from 'running' or 'paused' state.
   * Shuts down all registered modules.
   * Rejects transition if already 'stopped'.
   */
  public async stop(): Promise<boolean> {
    if (this._status === 'stopped') {
      return false;
    }

    const finalTick = this.currentTick;
    this._status = 'stopped';

    await this._moduleRegistry.shutdownAll();

    this._eventBus.publish({
      type: 'simulation.stopped',
      tick: finalTick,
      payload: { id: this.id, finalTick },
    });
    return true;
  }

  /**
   * Executes a single discrete simulation tick through the pipeline.
   * Pipeline phases:
   * 1. BEGIN_TICK
   * 2. PROCESS_MODULES
   * 3. END_TICK
   */
  public advanceTick(deltaTicks: number = 1): ISimulationTick {
    const validDelta = Math.max(1, Math.floor(deltaTicks));
    const newTime = this._clock.advance(validDelta);
    const tickNumber = this._clock.getTick();
    const deltaSeconds = validDelta * this._clock.getSecondsPerTick();

    const tickInfo: ISimulationTick = {
      tickNumber,
      simulationTime: newTime,
      deltaSeconds,
      phase: TickPhase.BEGIN_TICK,
    };

    // 1. BEGIN_TICK
    this._eventBus.publish({
      type: 'simulation.tick.started',
      tick: tickNumber,
      payload: {
        tick: tickNumber,
        simulationTime: { ...newTime },
        deltaSeconds,
        phase: TickPhase.BEGIN_TICK,
      },
    });

    // 2. PROCESS_MODULES
    tickInfo.phase = TickPhase.PROCESS_MODULES;
    const modules = this._moduleRegistry.getExecutionOrder();
    for (const mod of modules) {
      if (mod.enabled !== false && mod.onTick) {
        try {
          mod.onTick(tickInfo, this._context);
        } catch (err) {
          console.error(`[SimulationEngine] Error in module "${mod.id}" during tick ${tickNumber}:`, err);
        }
      }
    }

    // 3. END_TICK
    tickInfo.phase = TickPhase.END_TICK;
    this._eventBus.publish({
      type: 'simulation.tick.completed',
      tick: tickNumber,
      payload: {
        tick: tickNumber,
        simulationTime: { ...newTime },
        deltaSeconds,
        phase: TickPhase.END_TICK,
      },
    });

    return tickInfo;
  }

  /**
   * Returns a deep-frozen, read-only runtime snapshot of the simulation.
   * Prevents external mutation of internal state.
   */
  public getSnapshot(): ISimulationSnapshot {
    const allModules = this._moduleRegistry.getAll();
    const moduleSnapshots = allModules.map((m) =>
      Object.freeze({
        id: m.id,
        name: m.name,
        version: m.version,
        enabled: m.enabled !== false,
        dependencies: Object.freeze([...(m.dependencies || [])]),
      })
    );

    const worldSnapshot: IWorldState = {
      id: this._world.id,
      name: this._world.name,
      createdTick: this._world.createdTick,
      entitiesCount: this._entityManager.count(),
      metadata: { ...this._world.metadata },
    };

    const snapshot: ISimulationSnapshot = {
      id: this.id,
      name: this.name,
      status: this._status,
      mode: this._mode,
      currentTick: this.currentTick,
      simulationTime: Object.freeze({ ...this._clock.getTime() }),
      activeModules: Object.freeze(moduleSnapshots),
      world: Object.freeze(worldSnapshot),
      timestampTick: this.currentTick,
    };

    return Object.freeze(snapshot);
  }
}

// Clean functional wrapper API
export function createSimulation(config?: ISimulationConfig): SimulationEngine {
  return new SimulationEngine(config);
}

export async function startSimulation(simulation: SimulationEngine): Promise<boolean> {
  return simulation.start();
}

export function pauseSimulation(simulation: SimulationEngine): boolean {
  return simulation.pause();
}

export function resumeSimulation(simulation: SimulationEngine): boolean {
  return simulation.resume();
}

export async function stopSimulation(simulation: SimulationEngine): Promise<boolean> {
  return simulation.stop();
}

export function advanceTick(simulation: SimulationEngine, deltaTicks?: number): ISimulationTick {
  return simulation.advanceTick(deltaTicks);
}

export function getSimulationSnapshot(simulation: SimulationEngine): ISimulationSnapshot {
  return simulation.getSnapshot();
}
