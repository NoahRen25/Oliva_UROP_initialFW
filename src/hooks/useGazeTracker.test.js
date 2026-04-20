import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

let mockGazeValue = { x: null, y: null };
let mockTracking = true;

vi.mock('../utils/WebGazerContext', () => ({
  useWebGazer: () => ({ currentGaze: mockGazeValue, isTracking: mockTracking }),
}));

const useGazeTracker = (await import('./useGazeTracker')).default;

function makeImage(id, rect) {
  const el = document.createElement('div');
  el.id = `img-${id}`;
  el.getBoundingClientRect = () => ({
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.w,
    bottom: rect.y + rect.h,
    width: rect.w,
    height: rect.h,
    x: rect.x,
    y: rect.y,
    toJSON: () => ({}),
  });
  document.body.appendChild(el);
  return el;
}

function setup() {
  mockGazeValue = { x: null, y: null };
  mockTracking = true;
  const { result, rerender } = renderHook(
    ({ gaze }) => {
      mockGazeValue = gaze;
      return useGazeTracker();
    },
    { initialProps: { gaze: { x: null, y: null } } }
  );
  const sendGaze = (x, y) => act(() => rerender({ gaze: { x, y } }));
  return { result, sendGaze };
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useGazeTracker', () => {
  it('records entry and full dwell time for a single fixation', () => {
    const img = makeImage('A', { x: 0, y: 0, w: 100, h: 100 });
    const { result, sendGaze } = setup();

    act(() => { result.current.registerImage('A', img); });
    act(() => { result.current.startSession(); });

    sendGaze(50, 50);
    vi.advanceTimersByTime(500);
    sendGaze(55, 55);
    vi.advanceTimersByTime(300);
    sendGaze(500, 500);

    const data = result.current.getGazeData();
    expect(data.images.A.gazeEntries).toBe(1);
    expect(data.images.A.gazeExits).toBe(1);
    expect(data.images.A.totalGazeTime).toBeGreaterThanOrEqual(780);
    expect(data.images.A.totalGazeTime).toBeLessThanOrEqual(820);
  });

  it('counts exit when gaze leaves an image to empty space', () => {
    const img = makeImage('A', { x: 0, y: 0, w: 100, h: 100 });
    const { result, sendGaze } = setup();

    act(() => { result.current.registerImage('A', img); });
    act(() => { result.current.startSession(); });

    sendGaze(50, 50);
    vi.advanceTimersByTime(200);
    sendGaze(999, 999);

    const data = result.current.getGazeData();
    expect(data.images.A.gazeExits).toBe(1);
  });

  it('tracks separate entries/exits across two images', () => {
    const a = makeImage('A', { x: 0, y: 0, w: 100, h: 100 });
    const b = makeImage('B', { x: 200, y: 0, w: 100, h: 100 });
    const { result, sendGaze } = setup();

    act(() => {
      result.current.registerImage('A', a);
      result.current.registerImage('B', b);
    });
    act(() => { result.current.startSession(); });

    sendGaze(50, 50);
    vi.advanceTimersByTime(100);
    sendGaze(250, 50);
    vi.advanceTimersByTime(100);
    sendGaze(50, 50);
    vi.advanceTimersByTime(100);
    sendGaze(250, 50);

    const data = result.current.getGazeData();
    expect(data.images.A.gazeEntries).toBe(2);
    expect(data.images.A.gazeExits).toBe(2);
    expect(data.images.B.gazeEntries).toBe(2);
    expect(data.images.B.gazeExits).toBe(1);
  });

  it('ignores samples before startSession is called', () => {
    const img = makeImage('A', { x: 0, y: 0, w: 100, h: 100 });
    const { result, sendGaze } = setup();

    act(() => { result.current.registerImage('A', img); });
    sendGaze(50, 50);
    vi.advanceTimersByTime(500);
    sendGaze(50, 50);

    const data = result.current.getGazeData();
    // Registered image has a pre-seeded entry, but no gaze data should accrue
    expect(data.images.A?.gazeEntries ?? 0).toBe(0);
    expect(data.images.A?.totalGazeTime ?? 0).toBe(0);
    expect(data.images.A?.firstGazeTime ?? null).toBeNull();
  });
});
