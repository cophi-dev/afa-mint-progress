import { computeGridMetrics } from './gridLayout';

describe('computeGridMetrics', () => {
  it('keeps grid width aligned with cells per row on mobile', () => {
    const metrics = computeGridMetrics({
      zoom: 32,
      screenWidth: 390,
      isMobile: true,
    });

    expect(metrics.gridWidth).toBe(metrics.cellsPerRow * 32);
    expect(metrics.cellsPerRow).toBe(Math.floor((390 - 10) / 32));
  });

  it('does not inflate columns beyond the viewport', () => {
    const metrics = computeGridMetrics({
      zoom: 32,
      screenWidth: 390,
      isMobile: true,
    });

    expect(metrics.cellsPerRow).toBeLessThanOrEqual(Math.floor((390 - 10) / 32));
  });
});
