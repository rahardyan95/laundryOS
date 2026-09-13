import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/orders/status-badge";

describe("StatusBadge", () => {
  it("menampilkan label Indonesia per status", () => {
    const { rerender } = render(<StatusBadge status="washing" />);
    expect(screen.getByText("Dicuci")).toBeInTheDocument();
    rerender(<StatusBadge status="ready" />);
    expect(screen.getByText("Siap Diambil")).toBeInTheDocument();
  });
});
