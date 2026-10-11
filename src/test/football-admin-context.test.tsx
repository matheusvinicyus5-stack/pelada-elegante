import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminContext, useFootballAdmin, type AdminActions } from "@/components/football-admin-context";

describe("Shared admin context", () => {
  it("keeps consumers connected when their parent rerenders", () => {
    const actions: AdminActions = {
      editPlayer: vi.fn(), addPlayer: vi.fn(), deletePlayer: vi.fn(),
      editMatch: vi.fn(), addMatch: vi.fn(), deleteMatch: vi.fn(),
      openLogin: vi.fn(), openPassword: vi.fn(), logout: vi.fn(async () => {}),
    };
    function Consumer() {
      const admin = useFootballAdmin();
      return <button onClick={admin.openLogin}>Login</button>;
    }
    const view = render(<AdminContext.Provider value={actions}><Consumer /></AdminContext.Provider>);
    view.rerender(<AdminContext.Provider value={{ ...actions }}><Consumer /></AdminContext.Provider>);
    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(actions.openLogin).toHaveBeenCalledOnce();
  });
});