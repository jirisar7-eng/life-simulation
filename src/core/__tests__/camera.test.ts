import { describe, test } from 'node:test';
import assert from 'node:assert';
import { Camera } from '../../rendering/camera/Camera';

describe('Camera & Coordinate Transformations', () => {
  test('initializes with default options and clamped zoom', () => {
    const cam = new Camera({ viewportWidth: 800, viewportHeight: 600 });
    assert.strictEqual(cam.x, 0);
    assert.strictEqual(cam.y, 0);
    assert.strictEqual(cam.zoom, 1.0);
    assert.strictEqual(cam.minZoom, 0.1);
    assert.strictEqual(cam.maxZoom, 10.0);
    assert.strictEqual(cam.viewportWidth, 800);
    assert.strictEqual(cam.viewportHeight, 600);
  });

  test('transforms world position to screen position deterministically (zoom = 1)', () => {
    const cam = new Camera({ x: 0, y: 0, zoom: 1.0, viewportWidth: 800, viewportHeight: 600 });

    // World origin (0,0) should project to center of viewport (400, 300)
    const centerScreen = cam.worldToScreen({ x: 0, y: 0 });
    assert.strictEqual(centerScreen.x, 400);
    assert.strictEqual(centerScreen.y, 300);

    // World point (100, -50)
    const screenPos = cam.worldToScreen({ x: 100, y: -50 });
    assert.strictEqual(screenPos.x, 500);
    assert.strictEqual(screenPos.y, 250);
  });

  test('transforms screen position to world position deterministically (zoom = 1)', () => {
    const cam = new Camera({ x: 0, y: 0, zoom: 1.0, viewportWidth: 800, viewportHeight: 600 });

    // Screen center (400, 300) should unproject to world origin (0,0)
    const worldCenter = cam.screenToWorld({ x: 400, y: 300 });
    assert.strictEqual(worldCenter.x, 0);
    assert.strictEqual(worldCenter.y, 0);

    // Screen point (500, 250)
    const worldPos = cam.screenToWorld({ x: 500, y: 250 });
    assert.strictEqual(worldPos.x, 100);
    assert.strictEqual(worldPos.y, -50);
  });

  test('converts back and forth bidirectionally with precision (worldToScreen <-> screenToWorld)', () => {
    const cam = new Camera({ x: 125.5, y: -80.25, zoom: 2.5, viewportWidth: 1024, viewportHeight: 768 });

    const originalWorld = { x: 340.2, y: -12.8 };
    const screen = cam.worldToScreen(originalWorld);
    const roundtripWorld = cam.screenToWorld(screen);

    assert.ok(Math.abs(roundtripWorld.x - originalWorld.x) < 1e-6);
    assert.ok(Math.abs(roundtripWorld.y - originalWorld.y) < 1e-6);
  });

  test('enforces minZoom and maxZoom bounds', () => {
    const cam = new Camera({ minZoom: 0.5, maxZoom: 4.0 });

    // Set zoom below minZoom
    cam.zoom = 0.1;
    assert.strictEqual(cam.zoom, 0.5);

    // Set zoom above maxZoom
    cam.zoom = 10.0;
    assert.strictEqual(cam.zoom, 4.0);

    // Valid zoom
    cam.zoom = 2.0;
    assert.strictEqual(cam.zoom, 2.0);
  });

  test('updates camera position via pan() and setState()', () => {
    const cam = new Camera({ x: 10, y: 20 });

    cam.pan(5, -10);
    assert.strictEqual(cam.x, 15);
    assert.strictEqual(cam.y, 10);

    cam.setState({ x: 100, y: 200, zoom: 1.5 });
    assert.strictEqual(cam.x, 100);
    assert.strictEqual(cam.y, 200);
    assert.strictEqual(cam.zoom, 1.5);
  });

  test('handles viewport resizing correctly', () => {
    const cam = new Camera({ x: 0, y: 0, zoom: 1.0, viewportWidth: 800, viewportHeight: 600 });
    cam.setViewport(1920, 1080);

    assert.strictEqual(cam.viewportWidth, 1920);
    assert.strictEqual(cam.viewportHeight, 1080);

    const center = cam.worldToScreen({ x: 0, y: 0 });
    assert.strictEqual(center.x, 960);
    assert.strictEqual(center.y, 540);
  });
});
