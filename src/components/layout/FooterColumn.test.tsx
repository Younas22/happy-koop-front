import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FooterColumn } from "@/components/layout/FooterColumn";

describe("FooterColumn", () => {
  it("keeps the heading a heading and collapses its content on a phone", () => {
    render(
      <FooterColumn heading="Help">
        <span>Shipping</span>
      </FooterColumn>,
    );

    // The column keeps a real heading at both sizes. Its accessible name is
    // not asserted here: the heading holds the phone toggle and the desktop
    // label, and which of the two is in the accessibility tree is decided by
    // the `sm:` classes, which jsdom does not apply.
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Help");

    const toggle = screen.getByRole("button", { name: "Help" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    // The content stays in the markup and carries `sm:block`, so it is visible
    // on a desktop without JavaScript having run; only the phone state is
    // toggled here.
    const region = document.getElementById(toggle.getAttribute("aria-controls")!);
    expect(region).not.toBeNull();
    expect(region?.className).toContain("hidden");
    expect(region?.className).toContain("sm:block");
  });

  it("reveals the content when the heading is pressed", async () => {
    const user = userEvent.setup();

    render(
      <FooterColumn heading="Help">
        <span>Shipping</span>
      </FooterColumn>,
    );

    const toggle = screen.getByRole("button", { name: "Help" });
    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const region = document.getElementById(toggle.getAttribute("aria-controls")!);
    expect(region?.className).toContain("block");
    expect(region?.className).not.toContain("hidden");
  });

  it("becomes a labelled landmark for link lists", () => {
    render(
      <FooterColumn heading="Company" landmark>
        <span>About</span>
      </FooterColumn>,
    );

    expect(screen.getByRole("navigation", { name: "Company" })).toBeInTheDocument();
  });
});
