import { describe, expect, it } from "vitest";
import { stepImages, upcomingImages } from "@/lib/funnel/images";

const srcs = (list: { src: string }[]) => list.map((i) => i.src);

describe("stepImages", () => {
  it("shows the two gender portraits on gender", () => {
    expect(srcs(stepImages("gender", {}))).toEqual(["/img/funnel/app/gender-male.webp", "/img/funnel/app/gender-female.webp"]);
  });

  it("shows the chosen gender's five age photos on dob", () => {
    const list = srcs(stepImages("dob", { gender: "male" }));
    expect(list).toHaveLength(5);
    expect(list.every((s) => s.includes("/age-male-"))).toBe(true);
  });

  it("echoes the goal photo for a woman, and the one men's photo", () => {
    expect(srcs(stepImages("goalReinforcement", { gender: "female", training_goals: ["cognition"] }))).toEqual([
      "/img/funnel/app/goal-female-chess.webp",
    ]);
    expect(srcs(stepImages("goalReinforcement", { gender: "male", training_goals: ["cognition"] }))).toEqual([
      "/img/funnel/app/goal-male.webp",
    ]);
  });

  it("has no images on a plain question", () => {
    expect(stepImages("frequency", { gender: "female" })).toEqual([]);
  });
});

describe("upcomingImages", () => {
  it("warms the gender portraits from the first question", () => {
    expect(srcs(upcomingImages("goals", {}))).toContain("/img/funnel/app/gender-male.webp");
  });

  it("warms the goal photo while the age question is open", () => {
    expect(srcs(upcomingImages("dob", { gender: "female", training_goals: ["strength"] }))).toContain(
      "/img/funnel/app/goal-female-walk.webp",
    );
  });

  it("skips the large photos while the gender is unknown, so nothing is fetched for the wrong one", () => {
    expect(srcs(upcomingImages("gender", {})).some((s) => s.includes("goal-") || s.includes("reinforcement2"))).toBe(false);
  });

  it("warms reinforcement2 two screens ahead, whichever branch chairRise takes", () => {
    expect(srcs(upcomingImages("chairRise", { gender: "male" }))).toContain("/img/funnel/app/reinforcement2-male.webp");
  });

  it("never lists the current step's own images", () => {
    expect(srcs(upcomingImages("gender", {}))).not.toContain("/img/funnel/app/gender-male.webp");
  });
});
