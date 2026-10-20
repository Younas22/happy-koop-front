import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { money } from "@/test/fixtures";

describe("PriceDisplay", () => {
  it("renders the server-formatted price", () => {
    render(<PriceDisplay price={money(2900, "$29.00")} />);
    expect(screen.getByText("$29.00")).toBeInTheDocument();
  });

  it("hides the compare-at price and the discount when compareAtPrice is null", () => {
    const { container } = render(<PriceDisplay price={money(2900, "$29.00")} compareAtPrice={null} />);

    expect(container.querySelector(".line-through")).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("hides the compare-at price when it is not strictly higher", () => {
    const { container } = render(
      <PriceDisplay price={money(2900, "$29.00")} compareAtPrice={money(2900, "$29.00")} />,
    );

    expect(container.querySelector(".line-through")).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("shows a struck-through compare-at price and a real percentage when the backend supplied one", () => {
    const { container } = render(
      <PriceDisplay price={money(2000, "$20.00")} compareAtPrice={money(4000, "$40.00")} />,
    );

    const struck = container.querySelector(".line-through");
    expect(struck).not.toBeNull();
    expect(struck).toHaveTextContent("$40.00");
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it("can show the compare-at price without the percentage badge", () => {
    render(
      <PriceDisplay
        price={money(2000, "$20.00")}
        compareAtPrice={money(4000, "$40.00")}
        showDiscount={false}
      />,
    );

    expect(screen.queryByText(/50%/)).toBeNull();
  });
});
