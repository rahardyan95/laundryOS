import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskMachine } from "@/lib/task-machine";

describe("TaskStatusBadge", () => {
  it("menampilkan label task", () => {
    render(<TaskStatusBadge status="in_progress" />);
    expect(screen.getByText("Dikerjakan")).toBeInTheDocument();
  });

  it("next label mengikuti alur task", () => {
    expect(TaskMachine.next("pending")).toBe("assigned");
    expect(TaskMachine.nextLabel("pending")).toBe("Tugaskan");
    expect(TaskMachine.next("in_progress")).toBe("done");
    expect(TaskMachine.nextLabel("in_progress")).toBe("Selesaikan");
    expect(TaskMachine.next("done")).toBeNull();
    expect(TaskMachine.nextLabel("done")).toBeNull();
  });
});
