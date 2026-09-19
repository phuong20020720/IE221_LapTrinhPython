import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  page: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
};

export function PaginationControls({
  page,
  totalCount,
  pageSize = 10,
  onPageChange,
}: PaginationControlsProps) {
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalCount <= pageSize) return null;

  return (
    <div className="list-pagination">
      <span>Trang {page} / {pageCount} · {totalCount} kết quả</span>
      <div>
        <Button size="icon" variant="outline" aria-label="Trang trước" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} /></Button>
        <Button size="icon" variant="outline" aria-label="Trang sau" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}><ChevronRight size={16} /></Button>
      </div>
    </div>
  );
}
