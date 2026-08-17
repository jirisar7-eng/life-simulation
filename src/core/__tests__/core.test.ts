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
  HIERARCHY_TIER_ORDER,
  createWorldNode,
  createRegionNode,
  createSettlementNode,
  createCommunityNode,
  createGroupNode,
  createHouseholdNode,
  createIndividualNode,
  addChildNode,
  removeChildNode,
  reparentNode,
  getAncestryPath,
  traverseTopDown,
  traverseBottomUp,
  IHierarchyNode,
  WorldContainer,
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

describe('World Hierarchy (L1–L7 Skeleton)', () => {
  test('creates nodes for all 7 hierarchy tiers with stable IDs and correct tiers', () => {
    const world = createWorldNode('world_0', 'Aethelgard World');
    const region = createRegionNode('region_0', 'Northern Reaches', world.id);
    const settlement = createSettlementNode('settlement_0', 'Oakhaven Town', region.id);
    const community = createCommunityNode('community_0', 'Guild Quarter', settlement.id);
    const group = createGroupNode('group_0', 'Blacksmiths Guild', community.id);
    const household = createHouseholdNode('household_0', 'Ironforge Homestead', group.id);
    const individual = createIndividualNode('individual_0', 'Torin Ironforge', household.id);

    assert.strictEqual(world.tier, 'L7_WORLD');
    assert.strictEqual(world.id, 'world_0');
    assert.strictEqual(world.parentId, undefined);

    assert.strictEqual(region.tier, 'L6_REGION');
    assert.strictEqual(region.id, 'region_0');
    assert.strictEqual(region.parentId, 'world_0');

    assert.strictEqual(settlement.tier, 'L5_SETTLEMENT');
    assert.strictEqual(settlement.id, 'settlement_0');
    assert.strictEqual(settlement.parentId, 'region_0');

    assert.strictEqual(community.tier, 'L4_COMMUNITY');
    assert.strictEqual(community.id, 'community_0');
    assert.strictEqual(community.parentId, 'settlement_0');

    assert.strictEqual(group.tier, 'L3_GROUP');
    assert.strictEqual(group.id, 'group_0');
    assert.strictEqual(group.parentId, 'community_0');

    assert.strictEqual(household.tier, 'L2_HOUSEHOLD');
    assert.strictEqual(household.id, 'household_0');
    assert.strictEqual(household.parentId, 'group_0');

    assert.strictEqual(individual.tier, 'L1_INDIVIDUAL');
    assert.strictEqual(individual.id, 'individual_0');
    assert.strictEqual(individual.parentId, 'household_0');

    assert.deepStrictEqual(HIERARCHY_TIER_ORDER, [
      'L1_INDIVIDUAL',
      'L2_HOUSEHOLD',
      'L3_GROUP',
      'L4_COMMUNITY',
      'L5_SETTLEMENT',
      'L6_REGION',
      'L7_WORLD',
    ]);
  });

  test('manages parent/child links: addChildNode, removeChildNode, reparentNode', () => {
    const parentA = createSettlementNode('settlement_A', 'City A', 'region_0');
    const parentB = createSettlementNode('settlement_B', 'City B', 'region_0');
    const childGroup = createCommunityNode('comm_1', 'Harbor Community', parentA.id);

    addChildNode(parentA, childGroup);
    assert.deepStrictEqual(parentA.childrenIds, ['comm_1']);
    assert.strictEqual(childGroup.parentId, 'settlement_A');

    // Adding same child again is idempotent
    addChildNode(parentA, childGroup);
    assert.strictEqual(parentA.childrenIds.length, 1);

    // Reparent child to parentB
    reparentNode(childGroup, parentB, parentA);
    assert.deepStrictEqual(parentA.childrenIds, []);
    assert.deepStrictEqual(parentB.childrenIds, ['comm_1']);
    assert.strictEqual(childGroup.parentId, 'settlement_B');

    // Remove child
    const removed = removeChildNode(parentB, 'comm_1');
    assert.strictEqual(removed, true);
    assert.deepStrictEqual(parentB.childrenIds, []);

    const removedAgain = removeChildNode(parentB, 'comm_1');
    assert.strictEqual(removedAgain, false);
  });

  test('traces ancestry path from leaf to root', () => {
    const nodes = new Map<string, IHierarchyNode>();

    const world = createWorldNode('w1', 'World');
    const region = createRegionNode('r1', 'Region', world.id);
    const settlement = createSettlementNode('s1', 'Settlement', region.id);
    const community = createCommunityNode('c1', 'Community', settlement.id);
    const group = createGroupNode('g1', 'Group', community.id);
    const household = createHouseholdNode('h1', 'Household', group.id);
    const ind = createIndividualNode('i1', 'Individual', household.id);

    [world, region, settlement, community, group, household, ind].forEach((n) =>
      nodes.set(n.id, n)
    );

    const lookup = (id: string) => nodes.get(id);
    const path = getAncestryPath('i1', lookup);

    assert.deepStrictEqual(path, ['i1', 'h1', 'g1', 'c1', 's1', 'r1', 'w1']);
  });

  test('supports bottom-up aggregation and top-down traversal', () => {
    const nodes = new Map<string, IHierarchyNode>();

    const world = createWorldNode('w', 'World');
    const r1 = createRegionNode('r1', 'North', world.id);
    const r2 = createRegionNode('r2', 'South', world.id);
    addChildNode(world, r1);
    addChildNode(world, r2);

    const s1 = createSettlementNode('s1', 'Town 1', r1.id);
    addChildNode(r1, s1);

    const ind1 = createIndividualNode('i1', 'Agent 1', s1.id);
    const ind2 = createIndividualNode('i2', 'Agent 2', s1.id);
    addChildNode(s1, ind1);
    addChildNode(s1, ind2);

    [world, r1, r2, s1, ind1, ind2].forEach((n) => nodes.set(n.id, n));
    const lookup = (id: string) => nodes.get(id);

    // Top-down traversal test
    const visitedIds: string[] = [];
    traverseTopDown('w', lookup, (node) => {
      visitedIds.push(node.id);
    });
    assert.deepStrictEqual(visitedIds, ['w', 'r1', 's1', 'i1', 'i2', 'r2']);

    // Bottom-up aggregation (e.g. population counting)
    const totalPopulation = traverseBottomUp<number>(
      'w',
      lookup,
      (node, childrenPopulations) => {
        if (node.tier === 'L1_INDIVIDUAL') {
          return 1;
        }
        return childrenPopulations.reduce((acc, count) => acc + count, 0);
      }
    );

    assert.strictEqual(totalPopulation, 2);
  });
});

describe('WorldContainer (Domain Hierarchy Service)', () => {
  test('adds and retrieves entities across hierarchy levels with automatic parent-child linking', () => {
    const container = new WorldContainer();

    const world = createWorldNode('world_main', 'Aethelgard');
    const region = createRegionNode('reg_north', 'Frostpeaks', world.id);
    const settlement = createSettlementNode('set_valen', 'Valen City', region.id);
    const community = createCommunityNode('com_market', 'Market Ward', settlement.id);
    const group = createGroupNode('grp_traders', 'Merchants Guild', community.id);
    const household = createHouseholdNode('house_1', 'Stone Manor', group.id);
    const individual = createIndividualNode('ind_1', 'Gareth Stone', household.id);

    container.addEntity(world);
    assert.strictEqual(container.root?.id, 'world_main');
    assert.strictEqual(container.getRoot()?.id, 'world_main');

    container.addEntity(region);
    container.addEntity(settlement);
    container.addEntity(community);
    container.addEntity(group);
    container.addEntity(household);
    container.addEntity(individual);

    assert.strictEqual(container.count(), 7);
    assert.strictEqual(container.hasEntity('ind_1'), true);
    assert.strictEqual(container.hasEntity('non_existent'), false);

    // Get entity
    const retrievedInd = container.getEntity('ind_1');
    assert.strictEqual(retrievedInd?.id, 'ind_1');
    assert.strictEqual(retrievedInd?.tier, 'L1_INDIVIDUAL');

    // Parent / child relationships
    const parentOfInd = container.getParent('ind_1');
    assert.strictEqual(parentOfInd?.id, 'house_1');

    const childrenOfHouse = container.getChildren('house_1');
    assert.strictEqual(childrenOfHouse.length, 1);
    assert.strictEqual(childrenOfHouse[0].id, 'ind_1');

    const childrenOfWorld = container.getChildren('world_main');
    assert.strictEqual(childrenOfWorld.length, 1);
    assert.strictEqual(childrenOfWorld[0].id, 'reg_north');
  });

  test('removes entities cleanly with cascade and updates parent child lists', () => {
    const container = new WorldContainer();
    const world = createWorldNode('w', 'World');
    const region = createRegionNode('r', 'Region', 'w');
    const s1 = createSettlementNode('s1', 'Settlement 1', 'r');
    const s2 = createSettlementNode('s2', 'Settlement 2', 'r');

    container.addEntity(world);
    container.addEntity(region);
    container.addEntity(s1);
    container.addEntity(s2);

    assert.strictEqual(container.count(), 4);
    assert.strictEqual(container.getChildren('r').length, 2);

    // Remove single settlement s1
    const removedS1 = container.removeEntity('s1');
    assert.strictEqual(removedS1, true);
    assert.strictEqual(container.hasEntity('s1'), false);
    assert.strictEqual(container.getChildren('r').length, 1);
    assert.strictEqual(container.getChildren('r')[0].id, 's2');
    assert.strictEqual(container.count(), 3);

    // Cascade removal of region 'r' removes 's2' as well
    const removedRegion = container.removeEntity('r', true);
    assert.strictEqual(removedRegion, true);
    assert.strictEqual(container.hasEntity('r'), false);
    assert.strictEqual(container.hasEntity('s2'), false);
    assert.strictEqual(container.count(), 1);
    assert.strictEqual(container.getChildren('w').length, 0);

    // Removing non-existent entity returns false
    assert.strictEqual(container.removeEntity('non_existent'), false);
  });

  test('rejects duplicate entity ID', () => {
    const container = new WorldContainer();
    const world = createWorldNode('w_unique', 'World 1');
    container.addEntity(world);

    const duplicateWorld = createWorldNode('w_unique', 'World Duplicate');
    assert.throws(() => {
      container.addEntity(duplicateWorld);
    }, /Duplicate EntityId/);
  });

  test('rejects adding non-root entity with non-existent parent', () => {
    const container = new WorldContainer();
    const region = createRegionNode('r_orphan', 'Orphan Region', 'missing_world');

    assert.throws(() => {
      container.addEntity(region);
    }, /Parent entity with id 'missing_world' does not exist/);
  });

  test('rejects cycles and invalid hierarchy relationships', () => {
    const container = new WorldContainer();
    const world = createWorldNode('w', 'World');
    const region = createRegionNode('r', 'Region', 'w');
    container.addEntity(world);
    container.addEntity(region);

    // Attempt to add node with parentId pointing to itself
    const selfParent = createSettlementNode('s_self', 'Self Parent', 's_self');
    assert.throws(() => {
      container.addEntity(selfParent);
    }, /Parent entity with id 's_self' does not exist/);

    // Attempt to add a child with wrong tier level (e.g. region under settlement)
    const settlement = createSettlementNode('s', 'Settlement', 'r');
    container.addEntity(settlement);

    const invalidRegion = createRegionNode('r_invalid', 'Invalid Region Under Settlement', 's');
    assert.throws(() => {
      container.addEntity(invalidRegion);
    }, /Invalid hierarchy tier relation/);
  });
});


