// Core Domain Types for Life Simulation Engine

export type EntityId = string;
export type WorldId = string;

export interface WorldIdentity {
  readonly id: WorldId;
  readonly name: string;
  readonly description: string;
  readonly createdAt: number;
}

export type SimulationStatus = 'stopped' | 'running' | 'paused';
export type SimulationMode = 'manual' | 'automatic';

export enum TickPhase {
  BEGIN_TICK = 'BEGIN_TICK',
  PROCESS_MODULES = 'PROCESS_MODULES',
  END_TICK = 'END_TICK',
}

export interface SimulationTime {
  tick: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  months: number;
  years: number;
}

export interface ISimulationTick {
  tickNumber: number;
  simulationTime: Readonly<SimulationTime>;
  deltaSeconds: number;
  phase: TickPhase;
}

export interface ISimulationConfig {
  id?: string;
  name?: string;
  seed?: number | string;
  secondsPerTick?: number;
  daysPerMonth?: number;
  monthsPerYear?: number;
  mode?: SimulationMode;
}

export interface IWorldState {
  id: WorldId;
  name: string;
  createdTick: number;
  entitiesCount: number;
  metadata: Record<string, unknown>;
}

export interface IModuleSnapshot {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly enabled: boolean;
  readonly dependencies: ReadonlyArray<string>;
}

export interface ISimulationSnapshot {
  readonly id: string;
  readonly name: string;
  readonly status: SimulationStatus;
  readonly mode: SimulationMode;
  readonly currentTick: number;
  readonly simulationTime: Readonly<SimulationTime>;
  readonly activeModules: ReadonlyArray<IModuleSnapshot>;
  readonly world: Readonly<IWorldState>;
  readonly timestampTick: number;
}

export interface ISimulation {
  readonly id: string;
  readonly name: string;
  readonly status: SimulationStatus;
  readonly mode: SimulationMode;
  readonly currentTick: number;
  readonly simulationTime: Readonly<SimulationTime>;
  readonly world: IWorldState;
  getSnapshot(): ISimulationSnapshot;
  start(): Promise<boolean>;
  pause(): boolean;
  resume(): boolean;
  stop(): Promise<boolean>;
  advanceTick(deltaTicks?: number): ISimulationTick;
}
