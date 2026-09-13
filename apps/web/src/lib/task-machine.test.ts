import { describe, expect, it } from "vitest";
import { TaskMachine } from "@/lib/task-machine";

describe("TaskMachine", () => {
  it("transisi maju satu tahap", () => {
    expect(TaskMachine.next("pending")).toBe("assigned");
    expect(TaskMachine.next("assigned")).toBe("in_progress");
    expect(TaskMachine.next("in_progress")).toBe("done");
    expect(TaskMachine.next("done")).toBeNull();
    expect(TaskMachine.next("cancelled")).toBeNull();
  });

  it("label aksi berikutnya", () => {
    expect(TaskMachine.nextLabel("pending")).toBe("Tugaskan");
    expect(TaskMachine.nextLabel("assigned")).toBe("Mulai Kerjakan");
    expect(TaskMachine.nextLabel("in_progress")).toBe("Selesaikan");
    expect(TaskMachine.nextLabel("done")).toBeNull();
  });

  it("label status bahasa Indonesia", () => {
    expect(TaskMachine.label("pending")).toBe("Menunggu");
    expect(TaskMachine.label("done")).toBe("Selesai");
    expect(TaskMachine.label("cancelled")).toBe("Dibatalkan");
  });
});
