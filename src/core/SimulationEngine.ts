import {
  ISimulation,
  ISimulationConfig,
  ISimulationTick,
  IWorldState,
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

  public async start(): Promise<void> {
    if (this._status === 'running') return;

    if (this._status === 'stopped') {
      await this._moduleRegistry.initializeAll(this._context);
    }

    this._status = 'running';
    this._eventBus.publish({
      type: 'simulation.started',
      tick: this.currentTick,
      payload: { id: this.id, name: this.name },
    });
  }

  public pause(): void {
    if (this._status !== 'running') return;
    this._status = 'paused';
    this._eventBus.publish({
      type: 'simulation.paused',
      tick: this.currentTick,
      payload: { tick: this.currentTick },
    });
  }

  public resume(): void {
    if (this._status !== 'paused') return;
    this._status = 'running';
    this._eventBus.publish({
      type: 'simulation.resumed',
      tick: this.currentTick,
      payload: { tick: this.currentTick },
    });
  }

  public async stop(): Promise<void> {
    if (this._status === 'stopped') return;
    const finalTick = this.currentTick;
    this._status = 'stopped';

    await this._moduleRegistry.shutdownAll();

    this._eventBus.publish({
      type: 'simulation.stopped',
      tick: finalTick,
      payload: { finalTick },
    });
  }

  /**
   * Executes a single discrete simulation tick through the pipeline.
   * Pipeline phases:
   * 1. BEGIN_TICK
   * 2. PROCESS_MODULES
   * 3. END_TICK
   */
  public advanceTick(deltaTicks: number = 1): ISimulationTick {
    const timeBefore = this._clock.advance(deltaTicks);
    const tickNumber = this._clock.getTick();
    const deltaSeconds = deltaTicks * this._clock.getSecondsPerTick();

    const tickInfo: ISimulationTick = {
      tickNumber,
      simulationTime: timeBefore,
      deltaSeconds,
      phase: TickPhase.BEGIN_TICK,
    };

    // 1. BEGIN_TICK
    this._eventBus.publish({
      type: 'simulation.tick.started',
      tick: tickNumber,
      payload: { tick: tickInfo },
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
      payload: { tick: tickInfo },
    });

    return tickInfo;
  }
}

// Clean functional wrapper API
export function createSimulation(config?: ISimulationConfig): SimulationEngine {
  return new SimulationEngine(config);
}

export async function startSimulation(simulation: SimulationEngine): Promise<void> {
  await simulation.start();
}

export function pauseSimulation(simulation: SimulationEngine): void {
  simulation.pause();
}

export function resumeSimulation(simulation: SimulationEngine): void {
  simulation.resume();
}

export async function stopSimulation(simulation: SimulationEngine): Promise<void> {
  await simulation.stop();
}

export function advanceTick(simulation: SimulationEngine, deltaTicks?: number): ISimulationTick {
  return simulation.advanceTick(deltaTicks);
}
