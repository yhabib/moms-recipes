/**
 * Pure helpers for scaling the ingredient amounts of a recipe written in
 * Markdown. No React or backend dependencies.
 */

/** Fractional parts that amounts under 10 are rounded to. */
const FRACTION_STEPS = [0, 0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1];

/** Prints a number with at most two decimals and no trailing zeros. */
function toShortString(value: number): string {
  return String(Number(value.toFixed(2)));
}

/**
 * Formats an amount so it is easy to read:
 * - 10 or more: a whole number.
 * - Under 10: the nearest quarter or third, with at most two decimals.
 * - A positive amount never prints as 0: amounts under 0.25 keep two decimals.
 */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (value < 0) return `-${formatAmount(-value)}`;
  if (value === 0) return "0";

  if (value >= 10) return String(Math.round(value));

  if (value < 0.25) return toShortString(Math.max(value, 0.01));

  const whole = Math.floor(value);
  const fraction = value - whole;
  let nearest = FRACTION_STEPS[0];
  for (const step of FRACTION_STEPS) {
    if (Math.abs(step - fraction) < Math.abs(nearest - fraction)) {
      nearest = step;
    }
  }
  return toShortString(whole + nearest);
}

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 1 / 2,
  "¼": 1 / 4,
  "¾": 3 / 4,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
};

const UNICODE_CLASS = `[${Object.keys(UNICODE_FRACTIONS).join("")}]`;

/**
 * Matches the first amount in a line. Alternatives are ordered so the longest
 * form wins: mixed numbers ("1 1/2", "1½"), fractions ("1/2"), decimals
 * ("1.5", "1,5"), integers ("3") and unicode fractions ("½").
 */
const AMOUNT_PATTERN = new RegExp(
  [
    String.raw`(?<mixedWhole>\d+)\s+(?<mixedNum>\d+)\/(?<mixedDen>\d+)`,
    String.raw`(?<uniWhole>\d+)\s*(?<uniFrac>${UNICODE_CLASS})`,
    String.raw`(?<fracNum>\d+)\/(?<fracDen>\d+)`,
    String.raw`(?<decimal>\d+(?:[.,]\d+)?)`,
    String.raw`(?<uni>${UNICODE_CLASS})`,
  ].join("|"),
  "u",
);

function parseAmount(groups: Record<string, string | undefined>): number | null {
  const ratio = (num: string, den: string): number | null =>
    Number(den) === 0 ? null : Number(num) / Number(den);

  if (groups.mixedWhole !== undefined) {
    const fraction = ratio(groups.mixedNum!, groups.mixedDen!);
    return fraction === null ? null : Number(groups.mixedWhole) + fraction;
  }
  if (groups.uniWhole !== undefined) {
    return Number(groups.uniWhole) + UNICODE_FRACTIONS[groups.uniFrac!];
  }
  if (groups.fracNum !== undefined) {
    return ratio(groups.fracNum, groups.fracDen!);
  }
  if (groups.decimal !== undefined) {
    return Number(groups.decimal.replace(",", "."));
  }
  if (groups.uni !== undefined) {
    return UNICODE_FRACTIONS[groups.uni];
  }
  return null;
}

/** Scales the first amount found in `text`; returns `text` as-is if none. */
function scaleFirstAmount(text: string, factor: number): string {
  const match = AMOUNT_PATTERN.exec(text);
  if (!match?.groups) return text;

  const amount = parseAmount(match.groups);
  if (amount === null) return text;

  let formatted = formatAmount(amount * factor);
  // Keep the writer's decimal separator ("1,5" stays comma-style).
  if (match.groups.decimal?.includes(",")) {
    formatted = formatted.replace(".", ",");
  }
  return (
    text.slice(0, match.index) +
    formatted +
    text.slice(match.index + match[0].length)
  );
}

const HEADING = /^ {0,3}#{1,6}(?:\s+(.*?))?(?:\s+#+)?\s*$/;
const LIST_ITEM = /^(\s*[-*]\s+)(.*)$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

function isIngredientsHeading(text: string | undefined): boolean {
  return (text ?? "").trim().replace(/:$/, "").trim().toLowerCase() ===
    "ingredients";
}

/**
 * Returns `markdown` with every ingredient amount multiplied by `factor`.
 *
 * Only list items (`-` or `*`) under an "Ingredients" heading (any level,
 * case-insensitive) are changed, up to the next heading. In each of those
 * lines the first amount is scaled and the rest of the line is kept.
 */
export function scaleRecipeMarkdown(markdown: string, factor: number): string {
  if (factor === 1) return markdown;

  let inIngredients = false;
  let fence: string | null = null;

  return markdown
    .split("\n")
    .map((line) => {
      const fenceMatch = FENCE.exec(line);
      if (fence !== null) {
        if (fenceMatch && fenceMatch[1][0] === fence[0] &&
          fenceMatch[1].length >= fence.length) {
          fence = null;
        }
        return line;
      }
      if (fenceMatch) {
        fence = fenceMatch[1];
        return line;
      }

      const heading = HEADING.exec(line);
      if (heading) {
        inIngredients = isIngredientsHeading(heading[1]);
        return line;
      }

      if (!inIngredients) return line;

      // Set a trailing "\r" (CRLF files) aside so "." in the pattern matches.
      const cr = line.endsWith("\r") ? "\r" : "";
      const item = LIST_ITEM.exec(cr ? line.slice(0, -1) : line);
      if (!item) return line;
      return item[1] + scaleFirstAmount(item[2], factor) + cr;
    })
    .join("\n");
}

const SERVINGS_LINE = /^\*\*Servings:\*\* \d+[ \t]*$/m;

/** Returns `markdown` with its first `**Servings:** N` line set to `servings`. */
export function withServings(markdown: string, servings: number): string {
  return markdown.replace(SERVINGS_LINE, `**Servings:** ${servings}`);
}
