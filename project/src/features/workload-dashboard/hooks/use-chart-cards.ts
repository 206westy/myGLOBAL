'use client';

import { create } from 'zustand';
import { type ChartCardConfig, type DimensionKey, type FilterValue, type MetricKey } from '../lib/types';

interface ChartCardsState {
  cards: ChartCardConfig[];
  addCard:    () => void;
  removeCard: (id: string) => void;

  toggleMetric: (cardId: string, metric: MetricKey) => void;
  removeMetric: (cardId: string, metric: MetricKey) => void;

  addFilter:    (cardId: string, dimension: DimensionKey) => void;
  removeFilter: (cardId: string, dimension: DimensionKey) => void;
  setFilterValues: (cardId: string, dimension: DimensionKey, values: string[]) => void;

  setBrushRange: (cardId: string, range: [number, number]) => void;
}

let idCounter = 1;
const nextId = () => `card-${idCounter++}`;

const defaultCard = (): ChartCardConfig => ({
  id:         nextId(),
  metrics:    ['workload', 'volume'],
  filters:    [],
  brushRange: [0, 100],
});

export const useChartCards = create<ChartCardsState>((set) => ({
  cards: [defaultCard()],

  addCard: () =>
    set((s) => ({ cards: [...s.cards, defaultCard()] })),

  removeCard: (id) =>
    set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),

  toggleMetric: (cardId, metric) =>
    set((s) => ({
      cards: s.cards.map((c) =>
        c.id === cardId
          ? { ...c, metrics: c.metrics.includes(metric) ? c.metrics.filter((m) => m !== metric) : [...c.metrics, metric] }
          : c
      ),
    })),

  removeMetric: (cardId, metric) =>
    set((s) => ({
      cards: s.cards.map((c) =>
        c.id === cardId ? { ...c, metrics: c.metrics.filter((m) => m !== metric) } : c
      ),
    })),

  addFilter: (cardId, dimension) =>
    set((s) => ({
      cards: s.cards.map((c) => {
        if (c.id !== cardId) return c;
        if (c.filters.some((f) => f.dimension === dimension)) return c;
        const next: FilterValue = { dimension, values: [] };
        return { ...c, filters: [...c.filters, next] };
      }),
    })),

  removeFilter: (cardId, dimension) =>
    set((s) => ({
      cards: s.cards.map((c) =>
        c.id === cardId ? { ...c, filters: c.filters.filter((f) => f.dimension !== dimension) } : c
      ),
    })),

  setFilterValues: (cardId, dimension, values) =>
    set((s) => ({
      cards: s.cards.map((c) =>
        c.id === cardId
          ? { ...c, filters: c.filters.map((f) => (f.dimension === dimension ? { ...f, values } : f)) }
          : c
      ),
    })),

  setBrushRange: (cardId, range) =>
    set((s) => ({
      cards: s.cards.map((c) => (c.id === cardId ? { ...c, brushRange: range } : c)),
    })),
}));
