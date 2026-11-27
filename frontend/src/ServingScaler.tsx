const MIN_SERVINGS = 1;
const MAX_SERVINGS = 99;

interface ServingScalerProps {
  servings: number;
  onChange: (servings: number) => void;
  /** The base servings of the recipe, so the upper limit never sits below it. */
  baseServings: number;
}

function ServingScaler({ servings, onChange, baseServings }: ServingScalerProps) {
  const max = Math.max(MAX_SERVINGS, baseServings);
  return (
    <div className="serving-scaler">
      <button
        type="button"
        className="serving-scaler-button"
        aria-label="Fewer servings"
        disabled={servings <= MIN_SERVINGS}
        onClick={() => onChange(Math.max(MIN_SERVINGS, servings - 1))}
      >
        −
      </button>
      <span className="serving-scaler-count" aria-live="polite">
        {servings} {servings === 1 ? "serving" : "servings"}
      </span>
      <button
        type="button"
        className="serving-scaler-button"
        aria-label="More servings"
        disabled={servings >= max}
        onClick={() => onChange(Math.min(max, servings + 1))}
      >
        +
      </button>
    </div>
  );
}

export default ServingScaler;
