"use client";
"use no memo";

import { useMemo } from "react";

import { flexRender, type Table as TableType } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { Role } from "./data";

const pageSizeItems = [12, 24, 48].map((size) => ({
  value: `${size}`,
  label: `${size}`,
}));

type RoleTableRow = ReturnType<TableType<Role>["getRowModel"]>["rows"][number];

function groupRowsByRoleGroup(rows: RoleTableRow[]) {
  return rows.reduce(
    (groups, row) => {
      const label = row.original.group;
      const group = groups.find((item) => item.label === label);

      if (group) {
        group.rows.push(row);
      } else {
        groups.push({ label, rows: [row] });
      }

      return groups;
    },
    [] as Array<{ label: string; rows: RoleTableRow[] }>,
  );
}

export function RolesTable({ table }: { table: TableType<Role> }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageRows = table.getRowModel().rows;
  const filteredRows = table.getFilteredRowModel().rows;

  const groupedRows = useMemo(() => groupRowsByRoleGroup(pageRows), [pageRows]);
  const filteredGroups = useMemo(() => groupRowsByRoleGroup(filteredRows), [filteredRows]);
  const totalGroupCounts = useMemo(
    () => new Map(filteredGroups.map((group) => [group.label, group.rows.length])),
    [filteredGroups],
  );

  const start = filteredRows.length === 0 ? 0 : pageIndex * pageSize + 1;
  const end = filteredRows.length === 0 ? 0 : start + pageRows.length - 1;
  const colCount = table.getVisibleLeafColumns().length;

  return (
    <>
      <Table className="w-full table-fixed border-collapse" style={{ minWidth: table.getTotalSize() }}>
        <TableHeader className="bg-muted/15">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-y hover:bg-transparent [&>:not(:last-child)]:border-r">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className="h-11 px-4 text-center font-medium text-foreground text-sm first:text-left"
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {groupedRows.length ? (
            groupedRows.map((group) => (
              <TableBodyGroup
                key={group.label}
                group={group}
                totalCount={totalGroupCounts.get(group.label) ?? 0}
                colCount={colCount}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-border/70 border-t p-4">
        <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
          Showing {start} to {end} of {filteredRows.length} roles
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="roles-rows-per-page" className="font-medium text-sm">
              Rows per page
            </Label>
            <Select
              value={`${pageSize}`}
              onValueChange={(v) => {
                if (v) table.setPageSize(Number(v));
              }}
              items={pageSizeItems}
            >
              <SelectTrigger size="sm" className="w-20" id="roles-rows-per-page">
                <SelectValue placeholder={`${pageSize}`} />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {pageSizeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center font-medium text-sm">
            Page {pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function TableBodyGroup({
  group,
  totalCount,
  colCount,
}: {
  group: { label: string; rows: RoleTableRow[] };
  totalCount: number;
  colCount: number;
}) {
  return (
    <>
      <TableRow className="h-10 bg-muted">
        <TableCell className="px-4 text-foreground/60 text-sm" colSpan={colCount}>
          {group.label}{" "}
          <Badge variant="outline" className="ml-2 rounded-sm bg-transparent text-muted-foreground text-xs">
            {group.rows.length} of {totalCount}
          </Badge>
        </TableCell>
      </TableRow>
      {group.rows.map((row) => (
        <TableRow key={row.id} className="h-12 hover:bg-muted/20">
          {row.getVisibleCells().map((cell, index) => (
            <TableCell
              key={cell.id}
              style={{ width: cell.column.getSize() }}
              className={cn(
                "border-r px-4 align-middle",
                index === row.getVisibleCells().length - 1 && "border-r-0",
                index === 0 ? "text-left" : "text-center",
              )}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
