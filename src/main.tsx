import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Minus, Plus } from "lucide-react";
import "./styles.css";

type Ingredient = {
  name: string;
  gramsPerServing: number;
};

type CarbSource = "sucrose" | "fructose";
type DoseMode = "servings" | "runTime";

type Formula = {
  label: string;
  sourceName: string;
  primaryIngredient: Ingredient;
  maltodextrinGrams: number;
  ratioText: string;
  note: string;
};

const totalDryMixPerServing = 82.25;
const finalVolumeMlPerServing = 500;
const starterSugarPerServing = 25;
const carbohydrateGramsPerServing = 80;
const caloriesPerCarbGram = 4;
const hydrocolloids: Ingredient[] = [
  { name: "Pectin", gramsPerServing: 1.25 },
  { name: "Sodium alginate", gramsPerServing: 1 },
];
const formulas: Record<CarbSource, Formula> = {
  sucrose: {
    label: "Sucrose",
    sourceName: "sucrose",
    primaryIngredient: { name: "Sucrose", gramsPerServing: 71 },
    maltodextrinGrams: 9,
    ratioText: "0.8 fructose : 1 glucose",
    note: "Sucrose digests into fructose and glucose, so this version approximates the target ratio.",
  },
  fructose: {
    label: "Fructose",
    sourceName: "fructose",
    primaryIngredient: { name: "Fructose", gramsPerServing: 35.56 },
    maltodextrinGrams: 44.44,
    ratioText: "0.8 fructose : 1 glucose",
    note: "Fructose is counted directly, with maltodextrin providing the glucose side of the ratio.",
  },
};

function formatGrams(value: number) {
  return `${Number(value.toFixed(2)).toString()} g`;
}

function formatMl(value: number) {
  return `${Math.round(value)} ml`;
}

function formatNumber(value: number) {
  return Number(value.toFixed(2)).toString();
}

function parseDose(value: string, minimum: number) {
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(value)) {
    return 1;
  }

  const nextValue = Number(value);
  return nextValue > 0 ? Math.max(minimum, nextValue) : 1;
}

function App() {
  const [servings, setServings] = useState(1);
  const [servingInput, setServingInput] = useState("1");
  const [carbSource, setCarbSource] = useState<CarbSource>("sucrose");
  const [doseMode, setDoseMode] = useState<DoseMode>("servings");
  const formula = formulas[carbSource];
  const minimumDose = doseMode === "runTime" ? 0.1 : 1;
  const doseStep = doseMode === "runTime" ? 0.25 : 1;
  const doseLabel = doseMode === "runTime" ? "Run time" : "Servings";
  const doseAriaLabel = doseMode === "runTime" ? "Run time in hours" : "Number of servings";
  const dryIngredients: Ingredient[] = [
    formula.primaryIngredient,
    { name: "Maltodextrin", gramsPerServing: formula.maltodextrinGrams },
    ...hydrocolloids,
  ];

  const updateServings = (nextServings: number) => {
    const safeServings = Math.max(minimumDose, nextServings);
    setServings(safeServings);
    setServingInput(formatNumber(safeServings));
  };

  const handleInputChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setServingInput(value);

      const nextValue = Number(value);
      if (nextValue > 0) {
        setServings(nextValue);
      }
    }
  };

  const commitInput = () => {
    updateServings(parseDose(servingInput, minimumDose));
  };

  return (
    <main className="app-shell">
      <section className="calculator" aria-labelledby="calculator-title">
        <header className="hero">
          <p className="eyebrow">Mix by dosing target</p>
          <h1 id="calculator-title">DIY 320 Drink Mix Calculator</h1>
          <p className="subtitle">One serving = 80 g carbs in a 500 ml finished drink. One hour run time = 80 g carbs.</p>
          <div className="ratio-callout" aria-label="Fructose to glucose ratio">
            <span>Fructose-to-glucose ratio</span>
            <strong>{formula.ratioText}</strong>
          </div>
        </header>

        <div className="source-panel">
          <label htmlFor="carb-source">Carb source</label>
          <select
            id="carb-source"
            value={carbSource}
            onChange={(event) => setCarbSource(event.target.value as CarbSource)}
          >
            <option value="sucrose">Sucrose</option>
            <option value="fructose">Fructose</option>
          </select>
        </div>

        <div className="dose-panel">
          <label htmlFor="dose-mode">Dose by</label>
          <select
            id="dose-mode"
            value={doseMode}
            onChange={(event) => {
              const nextMode = event.target.value as DoseMode;
              setDoseMode(nextMode);
              const nextMinimum = nextMode === "runTime" ? 0.1 : 1;
              const nextServings = Math.max(nextMinimum, servings);
              setServings(nextServings);
              setServingInput(formatNumber(nextServings));
            }}
          >
            <option value="servings">Servings</option>
            <option value="runTime">Run time</option>
          </select>
        </div>

        <div className="serving-panel">
          <label htmlFor="servings">{doseLabel}{doseMode === "runTime" ? " (hours)" : ""}</label>
          <div className="stepper" role="group" aria-label={`${doseLabel} selector`}>
            <button
              type="button"
              className="icon-button"
              onClick={() => updateServings(servings - doseStep)}
              disabled={servings <= minimumDose}
              aria-label={`Decrease ${doseLabel.toLowerCase()}`}
              title={`Decrease ${doseLabel.toLowerCase()}`}
            >
              <Minus size={20} strokeWidth={2.5} />
            </button>

            <input
              id="servings"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              value={servingInput}
              onBlur={commitInput}
              onChange={(event) => handleInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              aria-label={doseAriaLabel}
            />

            <button
              type="button"
              className="icon-button"
              onClick={() => updateServings(servings + doseStep)}
              aria-label={`Increase ${doseLabel.toLowerCase()}`}
              title={`Increase ${doseLabel.toLowerCase()}`}
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
          <p className="dose-helper">
            {doseMode === "runTime"
              ? "Enter run length in hours. Example: 1.5 hours = 120 g carbs."
              : "Enter servings directly. Example: 1.5 servings = 120 g carbs."}
          </p>
        </div>

        <section className="dose-summary" aria-label="Dose summary">
          <div className="summary-card">
            <span>Total carbs</span>
            <strong>{formatGrams(carbohydrateGramsPerServing * servings)}</strong>
          </div>
          <div className="summary-card">
            <span>Total calories</span>
            <strong>{Math.round(carbohydrateGramsPerServing * caloriesPerCarbGram * servings)} kcal</strong>
          </div>
        </section>

        <section className="ingredients" aria-labelledby="dry-ingredients-title">
          <div className="section-heading">
            <h2 id="dry-ingredients-title">Dry ingredients</h2>
            <span>{formatGrams(totalDryMixPerServing * servings)} total</span>
          </div>

          <div className="ingredient-list">
            {dryIngredients.map((ingredient) => (
              <div className="ingredient-row" key={ingredient.name}>
                <span>{ingredient.name}</span>
                <strong>{formatGrams(ingredient.gramsPerServing * servings)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="water" aria-label="Water and final volume">
          <div>
            <span className="water-label">Finished drink volume</span>
            <strong>{formatMl(finalVolumeMlPerServing * servings)}</strong>
          </div>
          <p>Use 500 ml per serving. Add water so the dry mix plus water reaches {formatMl(finalVolumeMlPerServing * servings)} total.</p>
        </section>

        <section className="mixing" aria-labelledby="mixing-title">
          <h2 id="mixing-title">Mixing basics</h2>
          <div className="instruction-group">
            <h3>Best dry-mix order</h3>
            <ol>
              <li>Put about {formatGrams(starterSugarPerServing * servings)} of the {formula.sourceName} in a dry container.</li>
              <li>Add the pectin and sodium alginate, then shake or whisk very thoroughly.</li>
              <li>Add the maltodextrin and mix again.</li>
              <li>Add the remaining {formula.sourceName} and mix until the powder looks uniform.</li>
            </ol>
            <p className="instruction-note">
              This disperses the pectin and sodium alginate into the main carb powder first, which helps prevent gummy clumps when the powder hits water.
            </p>
          </div>
          <div className="instruction-group">
            <h3>Into the flask</h3>
            <ol>
              <li>Add 250-350 ml water per serving to the flask first.</li>
              <li>Add the dry mix, cap, and shake hard.</li>
              <li>Let it sit briefly if needed, then shake again.</li>
              <li>Top up with water until the dry mix plus water reaches 500 ml per serving.</li>
            </ol>
          </div>
        </section>

        <p className="note">
          {formula.note}
        </p>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
