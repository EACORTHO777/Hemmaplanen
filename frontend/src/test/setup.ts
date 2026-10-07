import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
// Adds matchers like toBeInTheDocument() and toBeChecked() to expect()
import "@testing-library/jest-dom/vitest";

// Remove what each test rendered, so tests don't see each other's elements
afterEach(() => cleanup());
