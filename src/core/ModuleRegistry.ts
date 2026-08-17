import { ISimulationTick } from './types';
import { IEventBus } from './EventBus';
import { RandomSource } from './random';
import { SimulationClock } from './SimulationClock';

export interface IEngineContext {
  eventBus: IEventBus;
  random: RandomSource;
  clock: SimulationClock;
  getModule<T extends ISimulationModule>(moduleId: string): T | undefined;
}

export interface ISimulationModule {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly dependencies?: string[];
  enabled?: boolean;

  initialize?(context: IEngineContext): Promise<void> | void;
  onTick?(tick: ISimulationTick, context: IEngineContext): void;
  shutdown?(): Promise<void> | void;
}

export class ModuleRegistry {
  private modules = new Map<string, ISimulationModule>();
  private executionOrderCache: ISimulationModule[] | null = null;

  public register(module: ISimulationModule): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module with id "${module.id}" is already registered`);
    }
    const mod = {
      ...module,
      enabled: module.enabled ?? true,
      dependencies: module.dependencies ?? [],
    };
    this.modules.set(module.id, mod);
    this.executionOrderCache = null;
  }

  public unregister(moduleId: string): boolean {
    const deleted = this.modules.delete(moduleId);
    if (deleted) {
      this.executionOrderCache = null;
    }
    return deleted;
  }

  public enable(moduleId: string): void {
    const mod = this.modules.get(moduleId);
    if (mod) {
      mod.enabled = true;
      this.executionOrderCache = null;
    }
  }

  public disable(moduleId: string): void {
    const mod = this.modules.get(moduleId);
    if (mod) {
      mod.enabled = false;
      this.executionOrderCache = null;
    }
  }

  public isEnabled(moduleId: string): boolean {
    return this.modules.get(moduleId)?.enabled === true;
  }

  public get<T extends ISimulationModule>(moduleId: string): T | undefined {
    return this.modules.get(moduleId) as T | undefined;
  }

  public getAll(): ReadonlyArray<ISimulationModule> {
    return Array.from(this.modules.values());
  }

  /**
   * Resolves execution order based on module dependencies using topological sort.
   */
  public getExecutionOrder(): ReadonlyArray<ISimulationModule> {
    if (this.executionOrderCache) {
      return this.executionOrderCache;
    }

    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: ISimulationModule[] = [];

    const visit = (mod: ISimulationModule) => {
      if (visiting.has(mod.id)) {
        throw new Error(`Circular dependency detected involving module "${mod.id}"`);
      }
      if (!visited.has(mod.id)) {
        visiting.add(mod.id);
        const deps = mod.dependencies || [];
        for (const depId of deps) {
          const depModule = this.modules.get(depId);
          if (!depModule) {
            console.warn(`[ModuleRegistry] Module "${mod.id}" depends on unregistered module "${depId}"`);
            continue;
          }
          visit(depModule);
        }
        visiting.delete(mod.id);
        visited.add(mod.id);
        order.push(mod);
      }
    };

    for (const mod of this.modules.values()) {
      if (!visited.has(mod.id)) {
        visit(mod);
      }
    }

    this.executionOrderCache = order;
    return this.executionOrderCache;
  }

  public async initializeAll(context: IEngineContext): Promise<void> {
    const order = this.getExecutionOrder();
    for (const mod of order) {
      if (mod.enabled !== false && mod.initialize) {
        await mod.initialize(context);
      }
    }
  }

  public async shutdownAll(): Promise<void> {
    const order = [...this.getExecutionOrder()].reverse();
    for (const mod of order) {
      if (mod.shutdown) {
        await mod.shutdown();
      }
    }
  }

  public clear(): void {
    this.modules.clear();
    this.executionOrderCache = null;
  }
}
