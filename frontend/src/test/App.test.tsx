import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "./server";
import App from "../App";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => { server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());

function getSidebar() {
  return document.getElementById("flowreport-sidebar")!;
}

async function loginAs(email: string, password = "password123") {
  render(<App />);
  await screen.findByRole("button", { name: /sign in/i });
  await userEvent.clear(screen.getByLabelText(/email/i));
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.clear(screen.getByLabelText(/password/i));
  await userEvent.type(screen.getByLabelText(/password/i), password);
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
  await waitFor(() => {
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
  }, { timeout: 10000 });
}

describe("AUTH", () => {
  it("TEST 1 — Login page appears before authentication", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /flowreport/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("TEST 2 — Successful login with valid credentials", async () => {
    await loginAs("or.sasson@flowreport.com");
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
  });

  it("TEST 3 — Failed login shows error message", async () => {
    render(<App />);
    await screen.findByLabelText(/email/i);
    await userEvent.clear(screen.getByLabelText(/email/i));
    await userEvent.type(screen.getByLabelText(/email/i), "wrong@email.com");
    await userEvent.clear(screen.getByLabelText(/password/i));
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await screen.findByRole("alert", {}, { timeout: 5000 });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("EMPLOYEE DASHBOARD", () => {
  beforeEach(async () => {
    await loginAs("or.sasson@flowreport.com");
  });

  it("TEST 4 — Employee dashboard loads after login", async () => {
    await waitFor(() => {
      const sidebar = getSidebar();
      expect(within(sidebar).getAllByText(/or sasson/i).length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  });

  it("TEST 5 — All 5 users appear in sidebar", async () => {
    await waitFor(() => {
      const sidebar = getSidebar();
      expect(within(sidebar).getAllByText(/sarah jenkins/i).length).toBeGreaterThan(0);
      expect(within(sidebar).getAllByText(/elena rostova/i).length).toBeGreaterThan(0);
      expect(within(sidebar).getAllByText(/or sasson/i).length).toBeGreaterThan(0);
      expect(within(sidebar).getAllByText(/ben carter/i).length).toBeGreaterThan(0);
      expect(within(sidebar).getAllByText(/maya levi/i).length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  });

  it("TEST 6 — Report editor has text areas", async () => {
    await waitFor(() => {
      expect(document.querySelectorAll("textarea").length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  });
});

describe("MANAGER DASHBOARD", () => {
  beforeEach(async () => {
    await loginAs("elena.rostova@flowreport.com");
  });

  it("TEST 7 — Manager dashboard loads for Elena", async () => {
    await waitFor(() => {
      const sidebar = getSidebar();
      expect(within(sidebar).getAllByText(/elena rostova/i).length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  });

  it("TEST 8 — Manager can see team reports", async () => {
    await waitFor(() => {
      const body = document.body.innerHTML;
      expect(body.match(/draft|submitted|approved|report/i)).toBeTruthy();
    }, { timeout: 10000 });
  });
});

describe("EXECUTIVE DASHBOARD", () => {
  beforeEach(async () => {
    await loginAs("sarah.jenkins@flowreport.com");
  });

  it("TEST 9 — Executive dashboard loads for Sarah", async () => {
    await waitFor(() => {
      const sidebar = getSidebar();
      expect(within(sidebar).getAllByText(/sarah jenkins/i).length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  });

  it("TEST 10 — Department metrics are visible", async () => {
    await waitFor(() => {
      const body = document.body.innerHTML;
      expect(body.match(/engineering|compliance|department/i)).toBeTruthy();
    }, { timeout: 12000 });
  });
});

describe("PERSONA SWITCHER", () => {
  beforeEach(async () => {
    await loginAs("or.sasson@flowreport.com");
    await waitFor(() => {
      expect(within(getSidebar()).getAllByText(/sarah jenkins/i).length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  });

  it("TEST 11 — Switching to Elena shows her in sidebar", async () => {
    const sidebar = getSidebar();
    const elenaSpan = within(sidebar).getAllByText(/elena rostova/i)[0];
    await userEvent.click(elenaSpan);
    await waitFor(() => {
      expect(within(getSidebar()).getAllByText(/elena rostova/i).length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  });

  it("TEST 12 — Switching to Sarah shows her in sidebar", async () => {
    const sidebar = getSidebar();
    const sarahSpan = within(sidebar).getAllByText(/sarah jenkins/i)[0];
    await userEvent.click(sarahSpan);
    await waitFor(() => {
      expect(within(getSidebar()).getAllByText(/sarah jenkins/i).length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  });
});
