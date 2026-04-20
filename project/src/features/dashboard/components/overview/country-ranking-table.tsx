'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SectionCard } from '../shared/section-card';
import { COUNTRY_RANKING } from '../../constants/overview-data';
import { cn } from '@/lib/utils';

const MAX_RATE = 20;

export function CountryRankingTable() {
  return (
    <SectionCard title="Country Ranking">
      <div className="px-0 pb-6">
        <Table>
          <TableHeader>
            <TableRow className="border-outline-variant/30 hover:bg-transparent">
              <TableHead className="w-10 pl-6 text-[0.68rem] uppercase tracking-wider">#</TableHead>
              <TableHead className="text-[0.68rem] uppercase tracking-wider">Country</TableHead>
              <TableHead className="text-[0.68rem] uppercase tracking-wider">Rework Rate</TableHead>
              <TableHead className="pr-6 text-right text-[0.68rem] uppercase tracking-wider">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {COUNTRY_RANKING.map((row) => (
              <TableRow
                key={row.code}
                className="border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors duration-150"
              >
                <TableCell className="pl-6 text-[0.78rem] tabular-nums text-muted-foreground">
                  {row.rank}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-md bg-surface-container-low px-2 py-0.5 text-[0.68rem] font-bold text-foreground tabular-nums">
                      {row.code}
                    </span>
                    <span className="text-[0.82rem] text-foreground">{row.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-container-low">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all duration-700"
                        style={{ width: `${(row.rate / MAX_RATE) * 100}%` }}
                      />
                    </div>
                    <span className="text-[0.78rem] tabular-nums font-semibold text-foreground">
                      {row.rate.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <TrendIcon trend={row.trend} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up')
    return <TrendingUp className={cn('inline h-4 w-4 text-rose-500')} />;
  if (trend === 'down')
    return <TrendingDown className={cn('inline h-4 w-4 text-emerald-600')} />;
  return <Minus className={cn('inline h-4 w-4 text-muted-foreground')} />;
}
