import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  range?: number; // Número de páginas visibles a la vez (por defecto 3)
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  range = 3,
}: PaginationProps) => {
  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - Math.floor(range / 2));
    const endPage = Math.min(totalPages, startPage + range - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <Button
        variant="secondary"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        {"<<"}
      </Button>
      <Button
        variant="secondary"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Anterior
      </Button>

      {pageNumbers.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "secondary"}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="secondary"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Siguiente
      </Button>
      <Button
        variant="secondary"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        {">>"}
      </Button>
    </div>
  );
};
