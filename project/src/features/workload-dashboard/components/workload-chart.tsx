'use client';

import { useMemo, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption, ECharts } from 'echarts';
import { aggregate, granularityForRange } from '../lib/aggregation';
import { MOCK_MONTHS } from '../constants/mock-data';
import { METRIC_COLORS } from '../constants/indices';
import { type ChartCardConfig, type MetricKey } from '../lib/types';

interface WorkloadChartProps {
  config: ChartCardConfig;
  onBrushChange: (range: [number, number]) => void;
}

const METRIC_LABEL: Record<MetricKey, string> = {
  workload: 'Workload',
  pr:       'PR%',
  wpi:      'WPI',
  volume:   'Volume',
};

export function WorkloadChart({ config, onBrushChange }: WorkloadChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef  = useRef<ECharts | null>(null);
  const optionRef    = useRef<EChartsOption | null>(null);
  const handlerRef   = useRef<((p: { batch?: { start: number; end: number }[]; start?: number; end?: number }) => void) | null>(null);

  const [startPct, endPct] = config.brushRange;

  const { points, granularity } = useMemo(() => {
    const monthsInView = Math.max(1, ((endPct - startPct) / 100) * MOCK_MONTHS.length);
    const g = granularityForRange(monthsInView);
    const pts = aggregate(config.filters, g);
    return { points: pts, granularity: g };
  }, [config.filters, startPct, endPct]);

  const showWorkload = config.metrics.includes('workload');
  const showPr       = config.metrics.includes('pr');
  const showWpi      = config.metrics.includes('wpi');
  const showVolume   = config.metrics.includes('volume');

  const option: EChartsOption = useMemo(() => {
    const periods = points.map((p) => p.period);
    const series: EChartsOption['series'] = [];

    if (showWorkload) {
      series.push({
        name: METRIC_LABEL.workload,
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2, color: METRIC_COLORS.workload },
        itemStyle: { color: METRIC_COLORS.workload },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(95, 58, 221, 0.18)' },
              { offset: 1, color: 'rgba(95, 58, 221, 0)'    },
            ],
          },
        },
        data: points.map((p) => p.workload),
      });
    }
    if (showPr) {
      series.push({
        name: METRIC_LABEL.pr,
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 1.5, color: METRIC_COLORS.pr, type: 'dashed' },
        itemStyle: { color: METRIC_COLORS.pr },
        data: points.map((p) => p.pr),
      });
    }
    if (showWpi) {
      series.push({
        name: METRIC_LABEL.wpi,
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 1.5, color: METRIC_COLORS.wpi, type: 'dotted' },
        itemStyle: { color: METRIC_COLORS.wpi },
        data: points.map((p) => p.wpi),
      });
    }
    if (showVolume) {
      series.push({
        name: METRIC_LABEL.volume,
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 2,
        itemStyle: { color: METRIC_COLORS.volume, borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 18,
        data: points.map((p) => p.volume),
      });
    }

    const grid = showVolume
      ? [
          { left: 56, right: 56, top: 36, height: '52%' },
          { left: 56, right: 56, top: '70%', height: '20%' },
        ]
      : [
          { left: 56, right: 56, top: 36, bottom: 56 },
        ];

    const xAxis = showVolume
      ? [
          { type: 'category' as const, gridIndex: 0, data: periods, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: 'hsl(251 10% 30%)', fontSize: 10 }, splitLine: { show: false } },
          { type: 'category' as const, gridIndex: 1, data: periods, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: 'hsl(251 10% 30%)', fontSize: 10 }, splitLine: { show: false } },
        ]
      : [
          { type: 'category' as const, gridIndex: 0, data: periods, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: 'hsl(251 10% 30%)', fontSize: 10 }, splitLine: { show: false } },
        ];

    const yAxis: EChartsOption['yAxis'] = [
      { gridIndex: 0, name: 'Workload', nameTextStyle: { color: 'hsl(251 10% 30%)', fontSize: 10, padding: [0, 0, 0, -32] }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: 'hsl(251 10% 30%)', fontSize: 10 }, splitLine: { lineStyle: { color: 'hsl(255 20% 81% / 0.4)', type: 'dashed' } } },
      { gridIndex: 0, position: 'right', name: 'PR / WPI', nameTextStyle: { color: 'hsl(251 10% 30%)', fontSize: 10, padding: [0, -32, 0, 0] }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: 'hsl(251 10% 30%)', fontSize: 10 }, splitLine: { show: false }, show: showPr || showWpi },
    ];
    if (showVolume) {
      yAxis.push({ gridIndex: 1, name: 'Volume', nameTextStyle: { color: 'hsl(251 10% 30%)', fontSize: 10, padding: [0, 0, 0, -28] }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: 'hsl(251 10% 30%)', fontSize: 10 }, splitLine: { lineStyle: { color: 'hsl(255 20% 81% / 0.4)', type: 'dashed' } } });
    }

    const zoomXAxisIndex = showVolume ? [0, 1] : [0];

    return {
      animation: true,
      grid,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: 'hsl(251 10% 30%)' } },
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: 'hsl(255 20% 81% / 0.4)',
        borderWidth: 1,
        textStyle: { color: 'hsl(251 10% 30%)', fontSize: 11 },
        extraCssText: 'box-shadow: 0px 8px 20px rgba(25,28,30,0.08); border-radius: 0.75rem;',
      },
      axisPointer: { link: [{ xAxisIndex: 'all' }], label: { show: true } },
      legend: { show: false },
      xAxis,
      yAxis,
      dataZoom: [
        { type: 'inside', xAxisIndex: zoomXAxisIndex, zoomLock: false, start: startPct, end: endPct },
        { type: 'slider', xAxisIndex: zoomXAxisIndex, height: 18, bottom: 6, borderColor: 'transparent', backgroundColor: 'hsl(255 20% 81% / 0.15)', fillerColor: 'rgba(95,58,221,0.15)', handleStyle: { color: '#5F3ADD' }, textStyle: { color: 'hsl(251 10% 30%)', fontSize: 9 }, start: startPct, end: endPct },
      ],
      series,
    };
  }, [points, showWorkload, showPr, showWpi, showVolume, startPct, endPct]);

  // Keep latest option in a ref for init to apply after mount
  optionRef.current = option;

  // Init / dispose — synchronous because echarts is a static import
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Reuse any existing instance attached to this DOM (e.g. strict-mode double mount)
    const existing = echarts.getInstanceByDom(el);
    if (existing) {
      try { existing.dispose(); } catch { /* ignore */ }
    }

    const instance = echarts.init(el, undefined, { renderer: 'canvas' });
    instanceRef.current = instance;

    if (optionRef.current) {
      instance.setOption(optionRef.current, true);
    }

    instance.on('dataZoom', (params) => {
      handlerRef.current?.(params as { batch?: { start: number; end: number }[]; start?: number; end?: number });
    });

    const resizeObs = new ResizeObserver(() => {
      if (!instance.isDisposed()) instance.resize();
    });
    resizeObs.observe(el);

    return () => {
      resizeObs.disconnect();
      instanceRef.current = null;
      try {
        if (!instance.isDisposed()) instance.dispose();
      } catch { /* DOM already gone */ }
    };
  }, []);

  // Push option on every change
  useEffect(() => {
    const inst = instanceRef.current;
    if (!inst || inst.isDisposed()) return;
    inst.setOption(option, true);
  }, [option]);

  // Keep latest brush handler in a ref so the listener never goes stale
  useEffect(() => {
    handlerRef.current = (params) => {
      const e = params.batch?.[0] ?? params;
      if (e.start === undefined || e.end === undefined) return;
      const nextStart = Math.max(0, Math.min(100, e.start));
      const nextEnd   = Math.max(0, Math.min(100, e.end));
      if (Math.abs(nextStart - startPct) < 0.01 && Math.abs(nextEnd - endPct) < 0.01) return;
      onBrushChange([nextStart, nextEnd]);
    };
  }, [onBrushChange, startPct, endPct]);

  return (
    <div className="relative">
      <div className="absolute right-4 top-2 z-10 rounded-full bg-surface-container-low px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {granularity}
      </div>
      <div ref={containerRef} style={{ height: 420, width: '100%' }} />
    </div>
  );
}
