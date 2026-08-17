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
  World,
  createWorld,
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

  test('rejects invalid state transitions safely', async () => {
    const sim = createSimulation();
    assert.strictEqual(sim.status, 'stopped');

    // Cannot pause or resume when stopped
    assert.strictEqual(sim.pause(), false);
    assert.strictEqual(sim.status, 'stopped');
    assert.strictEqual(sim.resume(), false);
    assert.strictEqual(sim.status, 'stopped');
    assert.strictEqual(await sim.stop(), false);

    // Start -> running
    assert.strictEqual(await sim.start(), true);
    assert.strictEqual(sim.status, 'running');

    // Cannot start again while running
    assert.strictEqual(await sim.start(), false);
    assert.strictEqual(sim.resume(), false);

    // Pause -> paused
    assert.strictEqual(sim.pause(), true);
    assert.strictEqual(sim.status, 'paused');

    // Cannot pause again or start while paused
    assert.strictEqual(sim.pause(), false);
    assert.strictEqual(await sim.start(), false);

    // Resume -> running
    assert.strictEqual(sim.resume(), true);
    assert.strictEqual(sim.status, 'running');

    // Stop -> stopped
    assert.strictEqual(await sim.stop(), true);
    assert.strictEqual(sim.status, 'stopped');

    // Cannot stop again
    assert.strictEqual(await sim.stop(), false);
  });

  test('executes tick pipeline with strictly ordered phases', () => {
    const sim = createSimulation();
    const phaseOrder: string[] = [];

    const testModule: ISimulationModule = {
      id: 'pipelineSpy',
      name: 'Pipeline Spy',
      version: '1.0.0',
      onTick: (tick) => {
        phaseOrder.push(tick.phase);
      },
    };

    sim.modules.register(testModule);

    sim.eventBus.subscribe('simulation.tick.started', (e) => {
      phaseOrder.push((e.payload as { phase: string }).phase);
    });

    sim.eventBus.subscribe('simulation.tick.completed', (e) => {
      phaseOrder.push((e.payload as { phase: string }).phase);
    });

    const tick = advanceTick(sim, 1);
    assert.strictEqual(tick.tickNumber, 1);
    assert.deepStrictEqual(phaseOrder, [
      TickPhase.BEGIN_TICK,
      TickPhase.PROCESS_MODULES,
      TickPhase.END_TICK,
    ]);
  });

  test('generates read-only, deep immutable runtime snapshot', () => {
    const sim = createSimulation({ name: 'Snapshot World', mode: 'manual' });
    sim.modules.register({
      id: 'mod1',
      name: 'Module One',
      version: '1.0.0',
      enabled: true,
      dependencies: [],
    });

    sim.advanceTick(5);
    const snapshot = sim.getSnapshot();

    assert.strictEqual(snapshot.name, 'Snapshot World');
    assert.strictEqual(snapshot.status, 'stopped');
    assert.strictEqual(snapshot.mode, 'manual');
    assert.strictEqual(snapshot.currentTick, 5);
    assert.strictEqual(snapshot.simulationTime.tick, 5);
    assert.strictEqual(snapshot.activeModules.length, 1);
    assert.strictEqual(snapshot.activeModules[0].id, 'mod1');
    assert.strictEqual(snapshot.timestampTick, 5);

    // Verify snapshot immutability
    assert.ok(Object.isFrozen(snapshot));
    assert.ok(Object.isFrozen(snapshot.simulationTime));
    assert.ok(Object.isFrozen(snapshot.activeModules));
    assert.ok(Object.isFrozen(snapshot.world));

    // Modifying snapshot copy should not affect engine
    assert.throws(() => {
      // @ts-expect-error test immutability
      snapshot.status = 'running';
    });
  });

  test('supports manual mode and mode configuration', () => {
    const sim = createSimulation({ mode: 'manual' });
    assert.strictEqual(sim.mode, 'manual');
    assert.strictEqual(sim.isManual(), true);
    assert.strictEqual(sim.isAutomatic(), false);

    sim.setMode('automatic');
    assert.strictEqual(sim.mode, 'automatic');
    assert.strictEqual(sim.isManual(), false);
    assert.strictEqual(sim.isAutomatic(), true);
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

describe('World & WorldIdentity', () => {
  test('creates world with valid immutable identity', () => {
    const world = createWorld(
      'world_prime',
      'Terra Nova',
      'The primary cradle of civilization',
      0,
      undefined,
      {
        tier: 'L7_WORLD',
      }
    );

    assert.strictEqual(world.id, 'world_prime');
    assert.strictEqual(world.name, 'Terra Nova');
    assert.strictEqual(world.description, 'The primary cradle of civilization');
    assert.strictEqual(world.createdAt, 0);
    assert.strictEqual(world.metadata.tier, 'L7_WORLD');

    // Identity is frozen / immutable
    assert.ok(Object.isFrozen(world.identity));
    assert.throws(() => {
      // @ts-expect-error test immutability
      world.identity.name = 'New Name';
    });
  });

  test('constructs World class instance directly with custom identity', () => {
    const customWorld = new World({
      id: 'world_custom',
      name: 'Aethelgard',
      description: 'Ancient realm',
      createdAt: 100,
    });

    assert.strictEqual(customWorld.id, 'world_custom');
    assert.strictEqual(customWorld.name, 'Aethelgard');
    assert.strictEqual(customWorld.description, 'Ancient realm');
    assert.strictEqual(customWorld.createdAt, 100);
  });

  test('initializes default world state correctly (active, tick 0, time)', () => {
    const world = createWorld('world_1', 'Gaia');
    assert.strictEqual(world.status, 'active');
    assert.strictEqual(world.currentTick, 0);
    assert.deepStrictEqual(world.simulationTime, {
      tick: 0,
      seconds: 0,
      minutes: 0,
      hours: 0,
      days: 0,
      months: 0,
      years: 0,
    });
    assert.strictEqual(world.state.status, 'active');
  });

  test('updates world status safely and rejects invalid status values', () => {
    const world = createWorld('world_1', 'Gaia');
    assert.strictEqual(world.status, 'active');

    world.setStatus('paused');
    assert.strictEqual(world.status, 'paused');
    assert.strictEqual(world.state.status, 'paused');

    world.setStatus('active');
    assert.strictEqual(world.status, 'active');

    assert.throws(() => {
      // @ts-expect-error test invalid status value
      world.setStatus('invalid_status');
    }, /Invalid world status/);
  });

  test('updates tick counter and simulationTime correctly', () => {
    const world = createWorld('world_1', 'Gaia');

    const newTime = {
      tick: 42,
      seconds: 30,
      minutes: 15,
      hours: 8,
      days: 5,
      months: 2,
      years: 1,
    };

    world.updateTick(42, newTime);
    assert.strictEqual(world.currentTick, 42);
    assert.deepStrictEqual(world.simulationTime, newTime);

    assert.throws(() => {
      world.updateTick(-1, newTime);
    }, /Tick cannot be negative/);
  });
});

