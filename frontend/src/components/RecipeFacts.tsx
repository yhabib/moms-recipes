import type { Difficulty } from "../backend/api/backend";
import { formatMinutes } from "../formatMinutes";

/** "easy" becomes "Easy". */
function difficultyLabel(difficulty: Difficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

type Fact = { key: string; label: string; short: string | null; value: string };

/**
 * A compact row such as "Prep 10 min · Cook 40 min · Total 50 min · Easy".
 * Each item appears only when its value is given ("Total" needs both times);
 * renders nothing when none of the three is given.
 */
export function RecipeFacts({
  prepMinutes,
  cookMinutes,
  difficulty,
}: {
  prepMinutes?: bigint;
  cookMinutes?: bigint;
  difficulty?: Difficulty;
}) {
  const prep = prepMinutes === undefined ? null : Number(prepMinutes);
  const cook = cookMinutes === undefined ? null : Number(cookMinutes);

  const facts: Fact[] = [];
  if (prep !== null) {
    facts.push({ key: "prep", label: "Prep time", short: "Prep", value: formatMinutes(prep) });
  }
  if (cook !== null) {
    facts.push({ key: "cook", label: "Cook time", short: "Cook", value: formatMinutes(cook) });
  }
  if (prep !== null && cook !== null) {
    facts.push({ key: "total", label: "Total time", short: "Total", value: formatMinutes(prep + cook) });
  }
  if (difficulty !== undefined) {
    facts.push({ key: "difficulty", label: "Difficulty", short: null, value: difficultyLabel(difficulty) });
  }
  if (facts.length === 0) return null;

  return (
    <dl className="recipe-facts">
      {facts.map((fact) => (
        <div key={fact.key} className="recipe-fact">
          {/* Screen readers hear the full label; sighted users see the short one. */}
          <dt className={fact.short === null ? "visually-hidden" : "recipe-fact-label"}>
            {fact.short === null ? (
              fact.label
            ) : (
              <>
                <span aria-hidden="true">{fact.short}</span>
                <span className="visually-hidden">{fact.label}</span>
              </>
            )}
          </dt>
          <dd className="recipe-fact-value">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
