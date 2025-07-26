// Main export for the Turso adapter
export { createTursoAdapter as tursoAdapter } from "./adapter.js";

// Export types for consumers
export type { TursoAdapterConfig, TursoDatabase } from "./types.js";

// Default export for backward compatibility
export { createTursoAdapter as default } from "./adapter.js";
