import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UploadDropzone } from "@/components/UploadDropzone";
import { ProgressBar } from "@/components/ProgressBar";
import { ErrorPanel } from "@/components/ErrorPanel";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

describe("ThemeToggle", () => {
  it("renders an accessible theme control", async () => {
    render(<ThemeToggle />);
    const button = await screen.findByRole("button", {
      name: /switch to dark mode/i,
    });
    expect(button).toBeInTheDocument();
  });
});

describe("UploadDropzone", () => {
  it("is keyboard accessible", async () => {
    const user = userEvent.setup();
    const onFileSelected = vi.fn();
    render(
      <UploadDropzone
        maxUploadLabel="250 MB"
        onFileSelected={onFileSelected}
      />,
    );
    const zone = screen.getByRole("button", {
      name: /upload a recording/i,
    });
    zone.focus();
    expect(zone).toHaveFocus();
    await user.keyboard("{Enter}");
  });
});

describe("ProgressBar", () => {
  it("exposes progress semantics", () => {
    render(<ProgressBar value={42} label="Transcribing" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "42",
    );
  });
});

describe("ErrorPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows user-friendly errors without technical jargon", () => {
    render(
      <ErrorPanel
        message="We could not find usable audio in this file."
        onRetry={() => undefined}
      />,
    );
    expect(
      screen.getByText(/we could not find usable audio/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/ffmpeg/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sharedarraybuffer/i)).not.toBeInTheDocument();
  });
});
