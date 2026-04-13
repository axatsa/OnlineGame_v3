import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useClass, ClassProvider } from "@/context/ClassContext";

// Mock the API module
vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: [
        {
          id: 42,
          name: "Math 5A",
          grade: "5",
          student_count: 25,
          description: "Fifth grade math",
          created_at: "2026-01-01T00:00:00",
        },
      ],
    }),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Provide a working localStorage stub (the jsdom instance is broken in this env)
function makeLocalStorageMock(initial: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initial };
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

function makeWrapper(lsMock: ReturnType<typeof makeLocalStorageMock>) {
  vi.stubGlobal("localStorage", lsMock);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ClassProvider>{children}</ClassProvider>
    </QueryClientProvider>
  );
}

describe("ClassContext", () => {
  it("restores activeClassId from localStorage on mount", async () => {
    const ls = makeLocalStorageMock({
      token: "fake-jwt-token",
      classplay_active_class_id: "42",
    });
    const { result } = renderHook(() => useClass(), { wrapper: makeWrapper(ls) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.activeClassId).toBe(42);
  });

  it("falls back to first class when no saved activeClassId", async () => {
    const ls = makeLocalStorageMock({ token: "fake-jwt-token" });
    const { result } = renderHook(() => useClass(), { wrapper: makeWrapper(ls) });

    await waitFor(() => expect(result.current.classes.length).toBeGreaterThan(0));
    await waitFor(() => expect(result.current.activeClassId).toBe(42));
  });

  it("sets activeClass based on activeClassId", async () => {
    const ls = makeLocalStorageMock({
      token: "fake-jwt-token",
      classplay_active_class_id: "42",
    });
    const { result } = renderHook(() => useClass(), { wrapper: makeWrapper(ls) });

    await waitFor(() => expect(result.current.activeClass).not.toBeNull());
    expect(result.current.activeClass?.name).toBe("Math 5A");
  });

  it("persists new activeClassId to localStorage", async () => {
    const ls = makeLocalStorageMock({ token: "fake-jwt-token" });
    const { result } = renderHook(() => useClass(), { wrapper: makeWrapper(ls) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    result.current.setActiveClassId(99);
    expect(ls.getItem("classplay_active_class_id")).toBe("99");
  });
});
