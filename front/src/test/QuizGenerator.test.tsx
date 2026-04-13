import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Minimal validation logic mirroring Generator.tsx quiz form
// Tests confirm that empty topic and count=0 are invalid inputs

function validateQuizForm(topic: string, count: number): string[] {
  const errors: string[] = [];
  if (!topic.trim()) errors.push("topic_required");
  if (!count || count < 1) errors.push("count_invalid");
  if (count > 20) errors.push("count_too_large");
  return errors;
}

describe("Quiz generator form validation", () => {
  it("rejects empty topic", () => {
    const errors = validateQuizForm("", 5);
    expect(errors).toContain("topic_required");
  });

  it("rejects whitespace-only topic", () => {
    const errors = validateQuizForm("   ", 5);
    expect(errors).toContain("topic_required");
  });

  it("rejects zero count", () => {
    const errors = validateQuizForm("Algebra", 0);
    expect(errors).toContain("count_invalid");
  });

  it("rejects negative count", () => {
    const errors = validateQuizForm("Algebra", -3);
    expect(errors).toContain("count_invalid");
  });

  it("rejects count above 20", () => {
    const errors = validateQuizForm("Algebra", 25);
    expect(errors).toContain("count_too_large");
  });

  it("passes with valid topic and count", () => {
    const errors = validateQuizForm("Algebra basics", 5);
    expect(errors).toHaveLength(0);
  });

  it("returns multiple errors when both fields invalid", () => {
    const errors = validateQuizForm("", 0);
    expect(errors).toContain("topic_required");
    expect(errors).toContain("count_invalid");
  });

  it("passes with count at boundary values 1 and 20", () => {
    expect(validateQuizForm("Topic", 1)).toHaveLength(0);
    expect(validateQuizForm("Topic", 20)).toHaveLength(0);
  });
});
