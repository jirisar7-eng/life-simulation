// Core Domain Types for Life Simulation Engine

export type EntityId = string;
export type WorldId = string;

export type SimulationStatus = 'stopped' | 'running' | 'paused';

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
}

export interface IWorldState {
  id: WorldId;
  name: string;
  createdTick: number;
  entitiesCount: number;
  metadata: Record<string, unknown>;
}

export interface ISimulation {
  readonly id: string;
  readonly name: string;
  readonly status: SimulationStatus;
  readonly currentTick: number;
  readonly simulationTime: Readonly<SimulationTime>;
  readonly world: IWorldState;
}
