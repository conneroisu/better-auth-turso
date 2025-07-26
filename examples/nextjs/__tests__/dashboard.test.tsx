import { expect, test, describe } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DashboardPage from "../app/dashboard/page";

// Mock the auth client
const mockUseSession = jest.fn();
const mockSignOut = jest.fn();

jest.mock("@/lib/auth-client", () => ({
  useSession: mockUseSession,
  signOut: mockSignOut,
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows loading state when session is pending", () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument(); // spinner
  });

  test("redirects to login when no session", () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });

    render(<DashboardPage />);

    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  test("renders dashboard with user session", () => {
    const mockSession = {
      user: {
        name: "Test User",
        email: "test@example.com",
        role: "admin",
      },
      session: {
        id: "session-123",
        expiresAt: "2024-12-31T23:59:59.000Z",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      isPending: false,
    });

    render(<DashboardPage />);

    // Check user information
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();

    // Check session information
    expect(screen.getByText("session-123")).toBeInTheDocument();
    expect(screen.getByText(/12\/31\/2024/)).toBeInTheDocument(); // formatted date
    expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument(); // formatted date

    // Check dashboard content
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("🎉 Authentication Success!")).toBeInTheDocument();
    expect(screen.getByText("Turso (libSQL)")).toBeInTheDocument();
  });

  test("handles sign out", async () => {
    const mockSession = {
      user: {
        name: "Test User",
        email: "test@example.com",
      },
      session: {
        id: "session-123",
        expiresAt: "2024-12-31T23:59:59.000Z",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      isPending: false,
    });

    mockSignOut.mockResolvedValue(undefined);

    render(<DashboardPage />);

    const signOutButton = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  test("displays tech stack information", () => {
    const mockSession = {
      user: {
        name: "Test User",
        email: "test@example.com",
      },
      session: {
        id: "session-123",
        expiresAt: "2024-12-31T23:59:59.000Z",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      isPending: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Bun")).toBeInTheDocument();
    expect(screen.getByText("Next.js 15")).toBeInTheDocument();
    expect(screen.getByText(/Better Auth/)).toBeInTheDocument();
    expect(screen.getByText(/Turso \(libSQL\)/)).toBeInTheDocument();
    expect(screen.getByText(/Tailwind CSS/)).toBeInTheDocument();
  });
});