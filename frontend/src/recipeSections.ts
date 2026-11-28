/**
 * Pulls the ingredient list and the step list out of a recipe's Markdown body,
 * as written by the backend's `Recipes.toMarkdown` and the seed recipes.
 */
export interface RecipeSections {
  ingredients: string[];
  steps: string[];
}

type SectionName = keyof RecipeSections;

const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/;
const BULLET = /^\s*[-*][ \t]+(.*)$/;
const ORDERED = /^\s*\d+[.)][ \t]+(.*)$/;

function sectionFor(level: number, text: string): SectionName | null {
  if (level < 2 || level > 3) return null;
  // Drop an optional closing sequence of #s ("## Steps ##").
  const title = text.replace(/[ \t]+#+$/, "").trim().toLowerCase();
  if (title === "ingredients") return "ingredients";
  if (title === "steps") return "steps";
  return null;
}

export function parseRecipeSections(markdown: string): RecipeSections {
  const result: RecipeSections = { ingredients: [], steps: [] };
  let section: SectionName | null = null;
  let sectionLevel = 0;
  // True while the previous line was part of a step, so an indented line can continue it.
  let inStep = false;

  for (const line of markdown.split(/\r\n|\r|\n/)) {
    const heading = HEADING.exec(line);
    if (heading) {
      const level = heading[1].length;
      if (section && level <= sectionLevel) section = null;
      const next = sectionFor(level, heading[2] ?? "");
      if (next) {
        section = next;
        sectionLevel = level;
      }
      inStep = false;
      continue;
    }

    if (section === "ingredients") {
      const bullet = BULLET.exec(line);
      if (bullet) {
        const text = bullet[1].trim();
        if (text) result.ingredients.push(text);
      }
    } else if (section === "steps") {
      const item = ORDERED.exec(line);
      if (item) {
        const text = item[1].trim();
        inStep = text.length > 0;
        if (inStep) result.steps.push(text);
      } else if (inStep && /^[ \t]+\S/.test(line) && !/^\s*>/.test(line)) {
        const last = result.steps.length - 1;
        result.steps[last] = `${result.steps[last]} ${line.trim()}`;
      } else {
        inStep = false;
      }
    }
  }

  return result;
}
