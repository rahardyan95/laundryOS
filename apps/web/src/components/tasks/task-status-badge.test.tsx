import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  nextTaskLabel,
  nextTaskStatus,
  TaskStatusBadge,
} from "@/components/tasks/task-status-badge";

describe("TaskStatusBadge", () => {
  it("menampilkan label task", () => {
    render(<TaskStatusBadge status="in_progress" />);
    expect(screen.getByText("Dikerjakan")).toBeInTheDocument();
  });

  it("next label mengikuti alur task", () => {
    expect(nextTaskStatus("pending")).toBe("assigned");
    expect(nextTaskLabel("pending")).toBe("Tugaskan");
    expect(nextTaskStatus("in_progress")).toBe("done");
    expect(nextTaskLabel("in_progress")).toBe("Selesaikan");
    expect(nextTaskStatus("done")).toBeNull();
    expect(nextTaskLabel("done")).toBeNull();
  });
});
