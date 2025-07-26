import { expect, test, describe, beforeEach } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginPage from "../app/login/page";
import RegisterPage from "../app/register/page";

// Mock the auth client
const mockSignIn = {
  email: jest.fn(),
  social: jest.fn(),
};

const mockSignUp = {
  email: jest.fn(),
};

jest.mock("@/lib/auth-client", () => ({
  signIn: mockSignIn,
  signUp: mockSignUp,
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
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock("next/link", () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe("Authentication Pages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("LoginPage", () => {
    test("renders login form", () => {
      render(<LoginPage />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    test("handles form submission", async () => {
      mockSignIn.email.mockResolvedValue({ error: null });
      
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockSignIn.email).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    test("displays error message on failed login", async () => {
      mockSignIn.email.mockResolvedValue({ 
        error: { message: "Invalid credentials" } 
      });
      
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });
  });

  describe("RegisterPage", () => {
    test("renders register form", () => {
      render(<RegisterPage />);
      
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    });

    test("validates password match", async () => {
      render(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /create account/i });
      
      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "password456" } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      });
    });

    test("validates password length", async () => {
      render(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /create account/i });
      
      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "123" } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText("Password must be at least 6 characters")).toBeInTheDocument();
      });
    });

    test("handles successful registration", async () => {
      mockSignUp.email.mockResolvedValue({ error: null });
      
      render(<RegisterPage />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /create account/i });
      
      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockSignUp.email).toHaveBeenCalledWith({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        });
      });
    });
  });
});