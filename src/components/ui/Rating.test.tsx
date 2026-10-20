import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Rating, RatingDistribution } from "@/components/ui/Rating";

describe("Rating", () => {
  it("renders nothing when the rating is null (zero approved reviews)", () => {
    const { container } = render(<Rating rating={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the count is 0, rather than an empty star row", () => {
    const { container } = render(<Rating rating={{ average: 0, count: 0 }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a non-null rating with a zero count even if the average is set", () => {
    const { container } = render(<Rating rating={{ average: 4.6, count: 0 }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the average and count when real reviews exist", () => {
    render(<Rating rating={{ average: 4.6, count: 23 }} />);

    expect(screen.getByText("4.6 (23)")).toBeInTheDocument();
    expect(
      screen.getByText("Rated 4.6 out of 5 from 23 reviews"),
    ).toBeInTheDocument();
  });

  it("uses the singular for a single review", () => {
    render(<Rating rating={{ average: 5, count: 1 }} />);
    expect(screen.getByText("Rated 5.0 out of 5 from 1 review")).toBeInTheDocument();
  });
});

describe("RatingDistribution", () => {
  it("renders nothing when the total is 0", () => {
    const { container } = render(
      <RatingDistribution
        distribution={{ "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }}
        total={0}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one labelled bar per bucket from the real counts", () => {
    render(
      <RatingDistribution
        distribution={{ "1": 1, "2": 0, "3": 1, "4": 6, "5": 15 }}
        total={23}
      />,
    );

    expect(screen.getByLabelText("5 stars: 15 of 23 reviews")).toBeInTheDocument();
    expect(screen.getByLabelText("2 stars: 0 of 23 reviews")).toBeInTheDocument();
  });
});
