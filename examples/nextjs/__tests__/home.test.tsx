import { expect, test, describe } from "bun:test";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HomePage from "../app/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href }: any) => (
    <a href={href}>{children}</a>
  );
});

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return <div {...props}>{children}</div>;
    }
    return <button {...props}>{children}</button>;
  },
}));

describe("HomePage", () => {
  test("renders homepage with title and description", () => {
    render(<HomePage />);

    expect(screen.getByText("Better Auth + Turso")).toBeInTheDocument();
    expect(
      screen.getByText(/A complete authentication example using Better Auth with Turso database adapter/)
    ).toBeInTheDocument();
  });

  test("displays feature cards", () => {
    render(<HomePage />);

    // Check all feature cards
    expect(screen.getByText("🚀 Fast & Secure")).toBeInTheDocument();
    expect(screen.getByText("🌍 Edge Ready")).toBeInTheDocument();
    expect(screen.getByText("🛡️ Type Safe")).toBeInTheDocument();
    expect(screen.getByText("⚡ Bun Powered")).toBeInTheDocument();

    // Check feature descriptions
    expect(
      screen.getByText(/Built with Better Auth for comprehensive authentication/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Deploy globally with Turso's edge database network/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Full TypeScript support with proper type inference/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Supercharged with Bun runtime for incredible performance/)
    ).toBeInTheDocument();
  });

  test("has navigation links to sign in and register", () => {
    render(<HomePage />);

    const signInLink = screen.getByRole("link", { name: /sign in/i });
    const signUpLink = screen.getByRole("link", { name: /create account/i });

    expect(signInLink).toHaveAttribute("href", "/login");
    expect(signUpLink).toHaveAttribute("href", "/register");
  });

  test("displays quick start information", () => {
    render(<HomePage />);

    expect(screen.getByText("Quick Start")).toBeInTheDocument();
    expect(
      screen.getByText(/Create an account or sign in to see the authentication flow/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The demo includes email\/password auth, session management/)
    ).toBeInTheDocument();
  });

  test("has proper semantic structure", () => {
    render(<HomePage />);

    // Check for main heading
    const mainHeading = screen.getByRole("heading", { level: 1 });
    expect(mainHeading).toHaveTextContent("Better Auth + Turso");

    // Check for feature headings
    const featureHeadings = screen.getAllByRole("heading", { level: 3 });
    expect(featureHeadings).toHaveLength(5); // 4 feature cards + 1 quick start
  });
});