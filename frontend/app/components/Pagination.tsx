import { Box, Pagination as MuiPagination, Typography } from "@mui/material";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mt: 3,
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Showing {startItem} to {endItem} of {totalItems} posts
      </Typography>

      <MuiPagination
        count={totalPages}
        page={currentPage}
        onChange={(_, page) => onPageChange(page)}
        color="primary"
        showFirstButton
        showLastButton
      />
    </Box>
  );
}
