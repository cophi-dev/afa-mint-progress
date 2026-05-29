import { computeGridMetrics, GRID_WRAPPER_PADDING } from './gridLayout';

describe('computeGridMetrics', () => {
  it('keeps grid width aligned with cells per row on mobile', () => {
    const metrics = computeGridMetrics({
      zoom: 32,
      screenWidth: 390,
      isMobile: true,
    });

    const inset = GRID_WRAPPER_PADDING.mobile * 2;

    expect(metrics.gridWidth).toBe(metrics.cellsPerRow * 32);
    expect(metrics.cellsPerRow).toBe(Math.floor((390 - inset) / 32));
  });

  it('does not inflate columns beyond the viewport', () => {
    const metrics = computeGridMetrics({
      zoom: 32,
      screenWidth: 390,
      isMobile: true,
    });

    const inset = GRID_WRAPPER_PADDING.mobile * 2;

    expect(metrics.cellsPerRow).toBeLessThanOrEqual(Math.floor((390 - inset) / 32));
  });
});
