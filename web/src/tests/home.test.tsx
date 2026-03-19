import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "../routes/index";

describe("HomePage", () => {
  it("renders the ScholarHub heading", () => {
    render(<HomePage />);
    expect(screen.getByText("ScholarHub")).toBeInTheDocument();
  });

  it("renders the Coming Soon badge", () => {
    render(<HomePage />);
    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<HomePage />);
    expect(screen.getByText("Find your scholarship. Fund your future.")).toBeInTheDocument();
  });

  it("renders the body text", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/most comprehensive international scholarship directory/),
    ).toBeInTheDocument();
  });
});
