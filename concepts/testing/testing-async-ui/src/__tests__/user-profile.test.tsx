import { describe, it, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitForElementToBeRemoved } from "@testing-library/react";
import { UserProfile } from "../UserProfile";
import { fetchUser } from "../api";

// Mock the network boundary — the api module itself — so fetchUser()
// resolves/rejects on our command instead of running the real 150ms
// setTimeout-wrapped implementation. Tests never wait out real latency.
vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return {
    ...actual,
    fetchUser: vi.fn(),
  };
});

const mockedFetchUser = vi.mocked(fetchUser);

beforeEach(() => {
  mockedFetchUser.mockReset();
});

function clickLoad() {
  fireEvent.click(screen.getByRole("button", { name: /load user/i }));
}

describe("UserProfile", () => {
  it("shows a loading state synchronously, right after the click", () => {
    // Never resolves within this test — we're only asserting the state the
    // instant after the click, before anything async has had a chance to
    // settle, so a plain sync query is correct and sufficient here.
    mockedFetchUser.mockReturnValue(new Promise(() => {}));

    render(<UserProfile />);
    clickLoad();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows the user's name once fetchUser resolves", async () => {
    mockedFetchUser.mockResolvedValue({ id: "u1", name: "Ada Lovelace" });

    render(<UserProfile />);
    clickLoad();

    // findByText = getByText + polling: it waits for the resolved promise's
    // continuation (a microtask outside this test's synchronous call
    // stack) to actually commit the "success" state, retrying until it
    // shows up instead of checking exactly once.
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("shows an error message once fetchUser rejects", async () => {
    mockedFetchUser.mockRejectedValue(new Error("user not found"));

    render(<UserProfile />);
    clickLoad();

    expect(await screen.findByText(/couldn't load/i)).toBeInTheDocument();
  });

  it("removes the loading indicator once the result lands", async () => {
    mockedFetchUser.mockResolvedValue({ id: "u1", name: "Ada Lovelace" });

    render(<UserProfile />);
    clickLoad();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // A distinct utility from findBy*: this one polls until the given
    // element is GONE, which is exactly the assertion "the loading state
    // ended" — findByText would only tell you the new content appeared,
    // not that the old content was cleaned up.
    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  // Vitest's inverse-assertion API: `test.fails` passes only if the body
  // throws. It does here — asserting loaded content with a plain, sync
  // getByText immediately after the click throws, because the component is
  // still in the "loading" state at that exact instant (fetchUser's
  // promise hasn't resolved yet, even though we've told it to). This is
  // the "forgot to await" flaky-test mistake this whole concept is about:
  // in a slower CI environment this might occasionally pass by accident
  // (if the microtask happened to flush first), which is worse than always
  // failing — see the "success path" test above for the fix.
  test.fails("the flaky mistake: asserting loaded content without awaiting anything", () => {
    mockedFetchUser.mockResolvedValue({ id: "u1", name: "Ada Lovelace" });

    render(<UserProfile />);
    clickLoad();

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });
});
