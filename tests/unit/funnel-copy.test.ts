import { describe, expect, it } from "vitest";
import { ANSWER_KEYS } from "@/lib/funnel/contract.generated";
import { COPY, COPY_KEYS, g } from "@/lib/funnel/copy";

const values = (o: readonly { value: string }[]) => o.map((x) => x.value);

describe("copy", () => {
  it("g returns feminine only for female", () => {
    expect(g("female", "f", "m")).toBe("f");
    expect(g("male", "f", "m")).toBe("m");
    expect(g(undefined, "f", "m")).toBe("m");
  });
  it("frequency options match the contract", () => {
    expect(values(COPY.frequency.options)).toEqual(["almost_daily", "three_week", "one_two_week", "none"]);
  });
  it("gender options", () => expect(values(COPY.gender.options)).toEqual(["male", "female"]));
  it("goals options (training_goals)", () =>
    expect(values(COPY.goals.options)).toEqual(["strength", "weight_loss", "cognition", "flexibility_balance"]));
  it("age group options (age_group)", () =>
    expect(values(COPY.ageGroup.options)).toEqual(["40_49", "50_59", "60_69", "70_79", "80_plus"]));
  it("desiredFeeling options", () =>
    expect(values(COPY.desiredFeeling.options)).toEqual(["body_confidence", "daily_energy", "sense_of_progress", "healthy_habit"]));
  it("memoryForgetfulness options", () =>
    expect(values(COPY.memoryForgetfulness.options)).toEqual(["almost_never", "sometimes", "often", "less_sharp"]));
  it("sedentaryLifestyle options", () => expect(values(COPY.sedentaryLifestyle.options)).toEqual(["yes", "no"]));
  it("a goal reinforcement for every goal", () =>
    expect(Object.keys(COPY.goalReinforcement).sort()).toEqual(values(COPY.goals.options).sort()));
  it("the memory question is gendered in its title (owner, 2026-10-22)", () => {
    expect(COPY.memoryForgetfulness.title.fem).toBe("האם במהלך היום קורה שאת שוכחת דברים?");
    expect(COPY.memoryForgetfulness.title.masc).toBe("האם במהלך היום קורה שאתה שוכח דברים?");
  });
  it("chairRise options", () => expect(values(COPY.chairRise.options)).toEqual(["alone", "with_support", "with_handles"]));
  it("challengeArea options", () => expect(values(COPY.challengeArea.options)).toEqual(["stairs", "walking", "floor_rise", "none"]));
  it("standingComfort options", () => expect(values(COPY.standingComfort.options)).toEqual(["stable", "holds_support", "seated"]));
  it("bodyAreas options", () => expect(values(COPY.bodyAreas.options)).toEqual(["neck", "shoulders_neck", "elbows", "lower_back", "hips", "knees", "ankle", "none"]));
  it("time presets", () => {
    expect(COPY.time.presets.morning).toEqual(["08:00", "09:00", "10:00"]);
    expect(COPY.time.presets.midday).toEqual(["11:00", "12:00", "13:00"]);
    expect(COPY.time.presets.afternoon).toEqual(["16:00", "17:00", "18:00"]);
  });
  it("keeps the maqaf and en dash verbatim", () => {
    expect((COPY.frequency.options[1] as { label: string }).label).toBe("כ־3 פעמים בשבוע");
    expect((COPY.frequency.options[2] as { label: string }).label).toBe("1–2 פעמים בשבוע");
  });
  it("every COPY_KEYS entry is a contract answer key", () => {
    for (const key of COPY_KEYS) expect(ANSWER_KEYS).toContain(key);
  });
  it("custom-time button and picker label are gendered (user decision, 2026-10-04)", () => {
    expect(g("female", COPY.time.otherHour.fem, COPY.time.otherHour.masc)).toBe("בחרי שעה אחרת שמתאימה לי");
    expect(g("male", COPY.time.otherHour.fem, COPY.time.otherHour.masc)).toBe("בחר שעה אחרת שמתאימה לי");
    expect(g("female", COPY.time.pickerTitle.fem, COPY.time.pickerTitle.masc)).toBe("בחרי שעה");
    expect(g(undefined, COPY.time.pickerTitle.fem, COPY.time.pickerTitle.masc)).toBe("בחר שעה");
  });
});
