'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { SectionCard } from '../../shared/section-card';
import { REWORK_DATASETS } from '../../../constants/rework-data';
import { useDashboardStore } from '../../../hooks/use-dashboard-store';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  Normal:   'bg-emerald-50 text-emerald-700',
  Warning:  'bg-amber-50 text-amber-700',
  Critical: 'bg-rose-50 text-rose-700',
};

export function ReworkRawDataTab() {
  const { period } = useDashboardStore();
  const data = REWORK_DATASETS[period];
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const paginatedRows = data.rawData.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  return (
    <SectionCard title="Raw Data">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-outline-variant/30 hover:bg-transparent">
              <TableHead className="pl-6 text-[0.68rem] uppercase tracking-wider">Date</TableHead>
              <TableHead className="text-[0.68rem] uppercase tracking-wider">Branch</TableHead>
              <TableHead className="text-[0.68rem] uppercase tracking-wider">Category</TableHead>
              <TableHead className="text-right text-[0.68rem] uppercase tracking-wider">Units</TableHead>
              <TableHead className="text-right text-[0.68rem] uppercase tracking-wider">Rework Rate</TableHead>
              <TableHead className="pr-6 text-right text-[0.68rem] uppercase tracking-wider">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, i) => (
              <TableRow
                key={pageIndex * pageSize + i}
                className="border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors"
              >
                <TableCell className="pl-6 text-[0.78rem] tabular-nums text-muted-foreground">
                  {row.date}
                </TableCell>
                <TableCell className="text-[0.82rem] text-foreground">{row.branch}</TableCell>
                <TableCell className="text-[0.82rem] text-foreground">{row.category}</TableCell>
                <TableCell className="text-right text-[0.78rem] tabular-nums text-foreground">
                  {row.units.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-[0.78rem] tabular-nums font-semibold text-foreground">
                  {row.rate.toFixed(1)}%
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold',
                      STATUS_STYLES[row.status]
                    )}
                  >
                    {row.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalRows={data.rawData.length}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />
    </SectionCard>
  );
}
