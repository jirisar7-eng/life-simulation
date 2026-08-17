import { describe, test } from 'node:test';
import assert from 'node:assert';
import { IEntity } from '../../models/entity';
import { EntityMapper } from '../../repositories/entityMapper';
import { PrismaEntityRepository, IPrismaEntityDelegate } from '../../repositories/prismaEntityRepository';

describe('EntityMapper (Domain <-> Prisma)', () => {
  test('maps Prisma record to Domain Entity correctly', () => {
    const prismaRecord = {
      id: 'ent_123',
      type: 'settlement',
      parentId: 'reg_456',
      createdAtTick: 150,
      tags: ['capital', 'fortified'],
      metadata: { population: 12000, isCoastal: true },
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    };

    const domain = EntityMapper.toDomain(prismaRecord);

    assert.strictEqual(domain.id, 'ent_123');
    assert.strictEqual(domain.type, 'settlement');
    assert.strictEqual(domain.parentId, 'reg_456');
    assert.strictEqual(domain.createdAtTick, 150);
    assert.deepStrictEqual(domain.tags, ['capital', 'fortified']);
    assert.deepStrictEqual(domain.metadata, { population: 12000, isCoastal: true });
  });

  test('maps Prisma record with nullable fields to clean domain entity', () => {
    const nullableRecord = {
      id: 'ent_null',
      type: 'world',
      parentId: null,
      createdAtTick: null,
      tags: [],
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const domain = EntityMapper.toDomain(nullableRecord);

    assert.strictEqual(domain.id, 'ent_null');
    assert.strictEqual(domain.type, 'world');
    assert.strictEqual(domain.parentId, undefined);
    assert.strictEqual(domain.createdAtTick, 0);
    assert.deepStrictEqual(domain.tags, []);
    assert.deepStrictEqual(domain.metadata, {});
  });

  test('maps Domain Entity to Prisma data structure correctly (handles Set tags)', () => {
    const domainEntity: IEntity = {
      id: 'ent_dom_1',
      type: 'individual',
      parentId: 'house_8',
      createdAtTick: 42,
      tags: new Set(['miner', 'apprentice']),
      metadata: { stamina: 100 },
    };

    const prismaInput = EntityMapper.toPrisma(domainEntity);

    assert.strictEqual(prismaInput.id, 'ent_dom_1');
    assert.strictEqual(prismaInput.type, 'individual');
    assert.strictEqual(prismaInput.parentId, 'house_8');
    assert.strictEqual(prismaInput.createdAtTick, 42);
    assert.deepStrictEqual(prismaInput.tags.sort(), ['apprentice', 'miner']);
    assert.deepStrictEqual(prismaInput.metadata, { stamina: 100 });
  });
});

describe('PrismaEntityRepository (Persistence Adapter)', () => {
  function createMockDelegate(): {
    delegate: IPrismaEntityDelegate;
    store: Map<string, any>;
  } {
    const store = new Map<string, any>();

    const delegate: IPrismaEntityDelegate = {
      async findUnique({ where }: { where: { id: string } }) {
        return store.get(where.id) || null;
      },
      async findMany() {
        return Array.from(store.values());
      },
      async upsert({
        where,
        create,
        update,
      }: {
        where: { id: string };
        create: any;
        update: any;
      }) {
        const existing = store.get(where.id);
        const data = existing ? { ...existing, ...update } : { ...create };
        store.set(where.id, data);
        return data;
      },
      async delete({ where }: { where: { id: string } }) {
        if (!store.has(where.id)) {
          throw new Error('Record not found');
        }
        const record = store.get(where.id);
        store.delete(where.id);
        return record;
      },
      async count({ where }: { where?: { id: string } } = {}) {
        if (where?.id) {
          return store.has(where.id) ? 1 : 0;
        }
        return store.size;
      },
    };

    return { delegate, store };
  }

  test('saves and retrieves entity via Prisma delegate', async () => {
    const { delegate } = createMockDelegate();
    const repo = new PrismaEntityRepository(delegate);

    const entity: IEntity = {
      id: 'entity_prisma_1',
      type: 'individual',
      parentId: 'house_1',
      createdAtTick: 100,
      tags: ['guildmaster'],
      metadata: { charisma: 18 },
    };

    const saved = await repo.save(entity);
    assert.strictEqual(saved.id, 'entity_prisma_1');
    assert.strictEqual(saved.type, 'individual');

    const retrieved = await repo.getById('entity_prisma_1');
    assert.strictEqual(retrieved?.id, 'entity_prisma_1');
    assert.strictEqual(retrieved?.parentId, 'house_1');
    assert.deepStrictEqual(retrieved?.tags, ['guildmaster']);
    assert.deepStrictEqual(retrieved?.metadata, { charisma: 18 });
  });

  test('retrieves all entities via getAll()', async () => {
    const { delegate } = createMockDelegate();
    const repo = new PrismaEntityRepository(delegate);

    await repo.save({ id: 'p1', type: 'region', createdAtTick: 0, tags: [], metadata: {} });
    await repo.save({ id: 'p2', type: 'settlement', createdAtTick: 1, tags: [], metadata: {} });

    const all = await repo.getAll();
    assert.strictEqual(all.length, 2);
    assert.deepStrictEqual(
      all.map((e) => e.id).sort(),
      ['p1', 'p2']
    );
  });

  test('checks entity existence with exists()', async () => {
    const { delegate } = createMockDelegate();
    const repo = new PrismaEntityRepository(delegate);

    assert.strictEqual(await repo.exists('non_existent'), false);
    await repo.save({ id: 'existing_one', type: 'world', createdAtTick: 0, tags: [], metadata: {} });
    assert.strictEqual(await repo.exists('existing_one'), true);
  });

  test('deletes entity and returns boolean success', async () => {
    const { delegate } = createMockDelegate();
    const repo = new PrismaEntityRepository(delegate);

    await repo.save({ id: 'to_delete', type: 'group', createdAtTick: 0, tags: [], metadata: {} });
    assert.strictEqual(await repo.exists('to_delete'), true);

    const deleted = await repo.delete('to_delete');
    assert.strictEqual(deleted, true);
    assert.strictEqual(await repo.exists('to_delete'), false);

    // Deleting non-existent returns false
    const deleteAgain = await repo.delete('to_delete');
    assert.strictEqual(deleteAgain, false);
  });

  test('rejects saving invalid entity without ID', async () => {
    const { delegate } = createMockDelegate();
    const repo = new PrismaEntityRepository(delegate);

    await assert.rejects(
      async () => {
        await repo.save({ id: '', type: 'world', createdAtTick: 0, tags: [], metadata: {} });
      },
      /valid non-empty id/
    );
  });
});
