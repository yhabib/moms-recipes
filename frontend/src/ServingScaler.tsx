const MIN_SERVINGS = 1;
const MAX_SERVINGS = 99;

interface ServingScalerProps {
  servings: number;
  onChange: (servings: number) => void;
}

function ServingScaler({ servings, onChange }: ServingScalerProps) {
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
        disabled={servings >= MAX_SERVINGS}
        onClick={() => onChange(Math.min(MAX_SERVINGS, servings + 1))}
      >
        +
      </button>
    </div>
  );
}

export default ServingScaler;
