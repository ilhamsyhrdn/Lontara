import React from "react";
import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Basic next/image mock for JSDOM tests
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    const { src, alt, ...rest } = props;
    return React.createElement("img", { src, alt: alt || "", ...rest });
  },
}));
