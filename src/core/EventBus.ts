import { ISimulationTick, SimulationStatus } from './types';

export type EventType =
  | 'simulation.started'
  | 'simulation.paused'
  | 'simulation.resumed'
  | 'simulation.stopped'
  | 'simulation.tick.started'
  | 'simulation.tick.completed'
  | (string & {});

export interface BaseEvent<TType extends string = string, TPayload = unknown> {
  type: TType;
  tick: number;
  payload: TPayload;
  timestamp?: number;
}

export interface SimulationStartedEvent extends BaseEvent<'simulation.started', { id: string; name: string }> {}
export interface SimulationPausedEvent extends BaseEvent<'simulation.paused', { tick: number }> {}
export interface SimulationResumedEvent extends BaseEvent<'simulation.resumed', { tick: number }> {}
export interface SimulationStoppedEvent extends BaseEvent<'simulation.stopped', { finalTick: number }> {}
export interface SimulationTickStartedEvent extends BaseEvent<'simulation.tick.started', { tick: ISimulationTick }> {}
export interface SimulationTickCompletedEvent extends BaseEvent<'simulation.tick.completed', { tick: ISimulationTick; durationMs?: number }> {}

export type SystemEvent =
  | SimulationStartedEvent
  | SimulationPausedEvent
  | SimulationResumedEvent
  | SimulationStoppedEvent
  | SimulationTickStartedEvent
  | SimulationTickCompletedEvent;

export type EventHandler<T extends BaseEvent = BaseEvent> = (event: T) => void;
export type Unsubscribe = () => void;

export interface IEventBus {
  subscribe<T extends BaseEvent = BaseEvent>(eventType: T['type'] | '*', handler: EventHandler<T>): Unsubscribe;
  unsubscribe<T extends BaseEvent = BaseEvent>(eventType: T['type'] | '*', handler: EventHandler<T>): void;
  publish<T extends BaseEvent = BaseEvent>(event: T): void;
  clear(): void;
  listenerCount(eventType?: string): number;
}

export class EventBus implements IEventBus {
  private handlers = new Map<string, Set<EventHandler<any>>>();
  private wildcardHandlers = new Set<EventHandler<any>>();

  public subscribe<T extends BaseEvent = BaseEvent>(eventType: T['type'] | '*', handler: EventHandler<T>): Unsubscribe {
    if (eventType === '*') {
      this.wildcardHandlers.add(handler);
      return () => this.unsubscribe('*', handler);
    }

    let set = this.handlers.get(eventType);
    if (!set) {
      set = new Set();
      this.handlers.set(eventType, set);
    }
    set.add(handler);

    return () => this.unsubscribe(eventType, handler);
  }

  public unsubscribe<T extends BaseEvent = BaseEvent>(eventType: T['type'] | '*', handler: EventHandler<T>): void {
    if (eventType === '*') {
      this.wildcardHandlers.delete(handler);
      return;
    }

    const set = this.handlers.get(eventType);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  public publish<T extends BaseEvent = BaseEvent>(event: T): void {
    const specific = this.handlers.get(event.type);
    if (specific) {
      for (const handler of specific) {
        try {
          handler(event);
        } catch (error) {
          console.error(`[EventBus] Error in handler for event "${event.type}":`, error);
        }
      }
    }

    if (this.wildcardHandlers.size > 0) {
      for (const handler of this.wildcardHandlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`[EventBus] Error in wildcard handler for event "${event.type}":`, error);
        }
      }
    }
  }

  public clear(): void {
    this.handlers.clear();
    this.wildcardHandlers.clear();
  }

  public listenerCount(eventType?: string): number {
    if (!eventType) {
      let count = this.wildcardHandlers.size;
      for (const set of this.handlers.values()) {
        count += set.size;
      }
      return count;
    }
    if (eventType === '*') {
      return this.wildcardHandlers.size;
    }
    return (this.handlers.get(eventType)?.size ?? 0) + this.wildcardHandlers.size;
  }
}
