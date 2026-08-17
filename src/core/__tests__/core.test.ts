import test, { describe } from 'node:test';
import assert from 'node:assert';
import {
  createSimulation,
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stopSimulation,
  advanceTick,
  SimulationEngine,
  EventBus,
  SimulationClock,
  SeededRandom,
  ISimulationModule,
  EntityManager,
  TickPhase,
} from '../index';

describe('Simulation Clock & Determinism', () => {
  test('advances ticks deterministically without Date.now()', () => {
    const clock = new SimulationClock({ secondsPerTick: 60 });
    assert.strictEqual(clock.getTick(), 0);

    const time0 = clock.getTime();
    assert.strictEqual(time0.tick, 0);
    assert.strictEqual(time0.minutes, 0);
    assert.strictEqual(time0.hours, 0);
    assert.strictEqual(time0.days, 0);

    // Advance 60 ticks (60 minutes = 1 hour)
    const time60 = clock.advance(60);
    assert.strictEqual(clock.getTick(), 60);
    assert.strictEqual(time60.hours, 1);
    assert.strictEqual(time60.minutes, 0);

    // Advance 1440 ticks (24 hours = 1 day)
    const time1500 = clock.advance(1440 - 60);
    assert.strictEqual(time1500.days, 1);
    assert.strictEqual(time1500.hours, 0);
  });

  test('seeded random generates identical sequences with same seed', () => {
    const rng1 = new SeededRandom(42);
    const rng2 = new SeededRandom(42);

    const seq1 = [rng1.next(), rng1.nextInt(1, 100), rng1.nextBoolean()];
    const seq2 = [rng2.next(), rng2.nextInt(1, 100), rng2.nextBoolean()];

    assert.deepStrictEqual(seq1, seq2);

    const rngDifferent = new SeededRandom(999);
    assert.notStrictEqual(rng1.next(), rngDifferent.next());
  });
});

describe('Event Bus', () => {
  test('subscribes, receives events and unsubscribes properly', () => {
    const bus = new EventBus();
    const received: string[] = [];

    const unsubscribe = bus.subscribe('custom.event', (event) => {
      received.push((event.payload as { msg: string }).msg);
    });

    bus.publish({ type: 'custom.event', tick: 1, payload: { msg: 'hello' } });
    bus.publish({ type: 'custom.event', tick: 2, payload: { msg: 'world' } });

    assert.strictEqual(received.length, 2);
    assert.deepStrictEqual(received, ['hello', 'world']);

    // Unsubscribe
    unsubscribe();
    bus.publish({ type: 'custom.event', tick: 3, payload: { msg: 'ignored' } });
    assert.strictEqual(received.length, 2);
  });

  test('wildcard subscriber receives all events', () => {
    const bus = new EventBus();
    const receivedTypes: string[] = [];

    bus.subscribe('*', (event) => {
      receivedTypes.push(event.type);
    });

    bus.publish({ type: 'event.a', tick: 1, payload: {} });
    bus.publish({ type: 'event.b', tick: 2, payload: {} });

    assert.deepStrictEqual(receivedTypes, ['event.a', 'event.b']);
  });
});

describe('Module Registry & Dependency Sorting', () => {
  test('registers and sorts modules topologically by dependency', async () => {
    const sim = new SimulationEngine();
    const executionOrder: string[] = [];

    const modA: ISimulationModule = {
      id: 'moduleA',
      name: 'Module A',
      version: '1.0.0',
      dependencies: ['moduleB'],
      onTick: () => executionOrder.push('A'),
    };

    const modB: ISimulationModule = {
      id: 'moduleB',
      name: 'Module B',
      version: '1.0.0',
      dependencies: [],
      onTick: () => executionOrder.push('B'),
    };

    sim.modules.register(modA);
    sim.modules.register(modB);

    sim.advanceTick(1);

    // Module B must execute before Module A because A depends on B
    assert.deepStrictEqual(executionOrder, ['B', 'A']);
  });

  test('handles enabled/disabled modules correctly', () => {
    const sim = new SimulationEngine();
    let tickCount = 0;

    const mod: ISimulationModule = {
      id: 'testMod',
      name: 'Test',
      version: '1.0.0',
      onTick: () => tickCount++,
    };

    sim.modules.register(mod);
    sim.advanceTick(1);
    assert.strictEqual(tickCount, 1);

    sim.modules.disable('testMod');
    sim.advanceTick(1);
    assert.strictEqual(tickCount, 1);

    sim.modules.enable('testMod');
    sim.advanceTick(1);
    assert.strictEqual(tickCount, 2);
  });
});

describe('Simulation Engine Lifecycle & Public API', () => {
  test('creates simulation with initial stopped status and 0 tick', () => {
    const sim = createSimulation({ name: 'Genesis World' });
    assert.strictEqual(sim.name, 'Genesis World');
    assert.strictEqual(sim.status, 'stopped');
    assert.strictEqual(sim.currentTick, 0);
  });

  test('lifecycle state transitions: start -> pause -> resume -> stop', async () => {
    const sim = createSimulation();
    const events: string[] = [];

    sim.eventBus.subscribe('*', (e) => events.push(e.type));

    await startSimulation(sim);
    assert.strictEqual(sim.status, 'running');
    assert.ok(events.includes('simulation.started'));

    pauseSimulation(sim);
    assert.strictEqual(sim.status, 'paused');
    assert.ok(events.includes('simulation.paused'));

    resumeSimulation(sim);
    assert.strictEqual(sim.status, 'running');
    assert.ok(events.includes('simulation.resumed'));

    await stopSimulation(sim);
    assert.strictEqual(sim.status, 'stopped');
    assert.ok(events.includes('simulation.stopped'));
  });

  test('advancing ticks emits tick started and completed events and increments tick', () => {
    const sim = createSimulation();
    const tickEvents: string[] = [];

    sim.eventBus.subscribe('simulation.tick.started', () => tickEvents.push('started'));
    sim.eventBus.subscribe('simulation.tick.completed', () => tickEvents.push('completed'));

    const tickResult = advanceTick(sim, 1);
    assert.strictEqual(sim.currentTick, 1);
    assert.strictEqual(tickResult.tickNumber, 1);
    assert.strictEqual(tickResult.phase, TickPhase.END_TICK);
    assert.deepStrictEqual(tickEvents, ['started', 'completed']);
  });
});

describe('Entity System', () => {
  test('manages entities by ID and Type', () => {
    const manager = new EntityManager();
    assert.strictEqual(manager.count(), 0);

    manager.add({
      id: 'ent_1',
      type: 'individual',
      createdAtTick: 0,
      tags: ['citizen'],
      metadata: { name: 'Alden' },
    });

    manager.add({
      id: 'ent_2',
      type: 'settlement',
      createdAtTick: 0,
      tags: ['capital'],
      metadata: { name: 'Eldoria' },
    });

    assert.strictEqual(manager.count(), 2);
    assert.strictEqual(manager.get('ent_1')?.type, 'individual');
    assert.strictEqual(manager.getByType('individual').length, 1);
    assert.strictEqual(manager.getByType('settlement').length, 1);

    manager.remove('ent_1');
    assert.strictEqual(manager.count(), 1);
    assert.strictEqual(manager.has('ent_1'), false);
  });
});
