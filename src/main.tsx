import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Minus, Plus } from "lucide-react";
import "./styles.css";

type Ingredient = {
  name: string;
  grams: number;
};

type CarbSource = "sucrose" | "fructose";
type DoseMode = "servings" | "runTime";
type RatioChoice = "0.5" | "0.8" | "1" | "custom";
type CarbRateChoice = "60" | "80" | "90" | "120" | "custom";

const baselineCarbs = 80;
const baselineVolumeMl = 500;
const caloriesPerCarbGram = 4;
const hydrocolloidGramsPer80gCarbs = 2.25;
const starterCarbShare = 25 / baselineCarbs;
const hydrocolloids = [
  { name: "Pectin", gramsPer80gCarbs: 1.25 },
  { name: "Sodium alginate", gramsPer80gCarbs: 1 },
];
const carbRateOptions: CarbRateChoice[] = ["60", "80", "90", "120", "custom"];
const ratioOptions: RatioChoice[] = ["0.5", "0.8", "1", "custom"];

function formatGrams(value: number) {
  return `${Number(value.toFixed(2)).toString()} g`;
}

function formatMl(value: number) {
  return `${Math.round(value)} ml`;
}

function formatNumber(value: number) {
  return Number(value.toFixed(2)).toString();
}

function parsePositiveDecimal(value: string, fallback: number, minimum = 0) {
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(value)) {
    return fallback;
  }

  const nextValue = Number(value);
  return nextValue > minimum ? nextValue : fallback;
}

function getRatioLabel(ratio: number) {
  return `${formatNumber(ratio)} : 1`;
}

function buildCarbIngredients(carbSource: CarbSource, totalCarbs: number, ratio: number): Ingredient[] {
  const fructoseGrams = (totalCarbs * ratio) / (1 + ratio);
  const glucoseGrams = totalCarbs / (1 + ratio);

  if (carbSource === "fructose") {
    return [
      { name: "Fructose", grams: fructoseGrams },
      { name: "Maltodextrin", grams: glucoseGrams },
    ];
  }

  if (ratio <= 1) {
    return [
      { name: "Sucrose", grams: fructoseGrams * 2 },
      { name: "Maltodextrin", grams: Math.max(0, glucoseGrams - fructoseGrams) },
    ].filter((ingredient) => ingredient.grams > 0.005);
  }

  return [
    { name: "Sucrose", grams: glucoseGrams * 2 },
    { name: "Fructose", grams: Math.max(0, fructoseGrams - glucoseGrams) },
  ].filter((ingredient) => ingredient.grams > 0.005);
}

function App() {
  const [servings, setServings] = useState(1);
  const [servingInput, setServingInput] = useState("1");
  const [carbSource, setCarbSource] = useState<CarbSource>("sucrose");
  const [doseMode, setDoseMode] = useState<DoseMode>("servings");
  const [carbRateChoice, setCarbRateChoice] = useState<CarbRateChoice>("80");
  const [customCarbsPerHour, setCustomCarbsPerHour] = useState(80);
  const [customCarbsInput, setCustomCarbsInput] = useState("80");
  const [ratioChoice, setRatioChoice] = useState<RatioChoice>("0.8");
  const [customRatio, setCustomRatio] = useState(0.8);
  const [customRatioInput, setCustomRatioInput] = useState("0.8");
  const [hydrogelMode, setHydrogelMode] = useState(true);

  const minimumDose = doseMode === "runTime" ? 0.1 : 1;
  const doseStep = doseMode === "runTime" ? 0.25 : 1;
  const doseLabel = doseMode === "runTime" ? "Run time" : "Servings";
  const doseAriaLabel = doseMode === "runTime" ? "Run time in hours" : "Number of servings";
  const carbsPerHour = carbRateChoice === "custom" ? customCarbsPerHour : Number(carbRateChoice);
  const ratio = ratioChoice === "custom" ? customRatio : Number(ratioChoice);
  const totalCarbs = doseMode === "runTime" ? servings * carbsPerHour : servings * baselineCarbs;
  const carbScale = totalCarbs / baselineCarbs;
  const hydrogelWeight = hydrogelMode ? hydrocolloidGramsPer80gCarbs * carbScale : 0;
  const totalDryMix = totalCarbs + hydrogelWeight;
  const finalVolumeMl = Math.round((totalCarbs / baselineCarbs) * baselineVolumeMl);
  const starterCarbs = Math.min(totalCarbs * starterCarbShare, totalCarbs);
  const dryIngredients: Ingredient[] = [
    ...buildCarbIngredients(carbSource, totalCarbs, ratio),
    ...(hydrogelMode
      ? hydrocolloids.map((ingredient) => ({
          name: ingredient.name,
          grams: ingredient.gramsPer80gCarbs * carbScale,
        }))
      : []),
  ];

  const updateServings = (nextServings: number) => {
    const safeServings = Math.max(minimumDose, nextServings);
    setServings(safeServings);
    setServingInput(formatNumber(safeServings));
  };

  const handleDoseInputChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setServingInput(value);

      const nextValue = Number(value);
      if (nextValue > 0) {
        setServings(nextValue);
      }
    }
  };

  const commitDoseInput = () => {
    updateServings(parsePositiveDecimal(servingInput, 1, 0));
  };

  const handleCustomCarbsChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setCustomCarbsInput(value);

      const nextValue = Number(value);
      if (nextValue > 0) {
        setCustomCarbsPerHour(nextValue);
      }
    }
  };

  const commitCustomCarbs = () => {
    const nextValue = parsePositiveDecimal(customCarbsInput, 80, 0);
    setCustomCarbsPerHour(nextValue);
    setCustomCarbsInput(formatNumber(nextValue));
  };

  const handleCustomRatioChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setCustomRatioInput(value);

      const nextValue = Number(value);
      if (nextValue > 0) {
        setCustomRatio(nextValue);
      }
    }
  };

  const commitCustomRatio = () => {
    const nextValue = parsePositiveDecimal(customRatioInput, 0.8, 0);
    setCustomRatio(nextValue);
    setCustomRatioInput(formatNumber(nextValue));
  };

  return (
    <main className="app-shell">
      <section className="calculator" aria-labelledby="calculator-title">
        <header className="hero">
          <p className="eyebrow">Mix by dosing target</p>
          <h1 id="calculator-title">DIY 320 Drink Mix Calculator</h1>
          <p className="subtitle">One serving = 80 g carbs in a 500 ml finished drink.</p>
          <p className="ratio-line">Fructose : Glucose = {getRatioLabel(ratio)}</p>
        </header>

        <section className="control-surface" aria-label="Calculator controls">
          <label className="field">
            <span>Carb source</span>
            <select value={carbSource} onChange={(event) => setCarbSource(event.target.value as CarbSource)}>
              <option value="sucrose">Sucrose</option>
              <option value="fructose">Fructose</option>
            </select>
          </label>

          <label className="field">
            <span>Fructose : Glucose</span>
            <select value={ratioChoice} onChange={(event) => setRatioChoice(event.target.value as RatioChoice)}>
              {ratioOptions.map((option) => (
                <option value={option} key={option}>
                  {option === "custom" ? "Custom" : `${option} : 1`}
                </option>
              ))}
            </select>
          </label>

          {ratioChoice === "custom" && (
            <label className="field small-field">
              <span>Custom F:G</span>
              <input
                inputMode="decimal"
                value={customRatioInput}
                onBlur={commitCustomRatio}
                onChange={(event) => handleCustomRatioChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                aria-label="Custom fructose to glucose ratio"
              />
            </label>
          )}

          <label className="field">
            <span>Dose by</span>
            <select
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
          </label>

          {doseMode === "runTime" && (
            <label className="field">
              <span>Carbs/hour</span>
              <select value={carbRateChoice} onChange={(event) => setCarbRateChoice(event.target.value as CarbRateChoice)}>
                {carbRateOptions.map((option) => (
                  <option value={option} key={option}>
                    {option === "custom" ? "Custom" : `${option} g/hour`}
                  </option>
                ))}
              </select>
            </label>
          )}

          {doseMode === "runTime" && carbRateChoice === "custom" && (
            <label className="field small-field">
              <span>Custom g/hr</span>
              <input
                inputMode="decimal"
                value={customCarbsInput}
                onBlur={commitCustomCarbs}
                onChange={(event) => handleCustomCarbsChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                aria-label="Custom carbs per hour"
              />
            </label>
          )}

          <div className="field dose-field">
            <span>{doseLabel}{doseMode === "runTime" ? " (hours)" : ""}</span>
            <div className="stepper" role="group" aria-label={`${doseLabel} selector`}>
              <button
                type="button"
                className="icon-button"
                onClick={() => updateServings(servings - doseStep)}
                disabled={servings <= minimumDose}
                aria-label={`Decrease ${doseLabel.toLowerCase()}`}
                title={`Decrease ${doseLabel.toLowerCase()}`}
              >
                <Minus size={18} strokeWidth={2.5} />
              </button>

              <input
                inputMode="decimal"
                pattern="[0-9]*[.]?[0-9]*"
                value={servingInput}
                onBlur={commitDoseInput}
                onChange={(event) => handleDoseInputChange(event.target.value)}
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
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <label className="toggle-field">
            <span>Hydrogel</span>
            <input
              type="checkbox"
              checked={hydrogelMode}
              onChange={(event) => setHydrogelMode(event.target.checked)}
            />
            <span className="switch-track" aria-hidden="true" />
          </label>
        </section>

        <section className="result-strip" aria-label="Dose summary">
          <div>
            <span>Total carbs</span>
            <strong>{formatGrams(totalCarbs)}</strong>
          </div>
          <div>
            <span>Calories</span>
            <strong>{Math.round(totalCarbs * caloriesPerCarbGram)} kcal</strong>
          </div>
          <div>
            <span>Finished volume</span>
            <strong>{formatMl(finalVolumeMl)}</strong>
          </div>
          <div>
            <span>Dry mix</span>
            <strong>{formatGrams(totalDryMix)}</strong>
          </div>
        </section>

        {finalVolumeMl > baselineVolumeMl && (
          <p className="volume-note">More than one 500 ml flask. Split across flasks or carry extra water to keep the same concentration.</p>
        )}

        <section className="ingredients" aria-labelledby="dry-ingredients-title">
          <div className="section-heading">
            <h2 id="dry-ingredients-title">Dry ingredients</h2>
            <span>{hydrogelMode ? "Hydrogel on" : "Straight carbs"}</span>
          </div>

          <div className="ingredient-list">
            {dryIngredients.map((ingredient) => (
              <div className="ingredient-row" key={ingredient.name}>
                <span>{ingredient.name}</span>
                <strong>{formatGrams(ingredient.grams)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="mixing" aria-labelledby="mixing-title">
          <h2 id="mixing-title">Mixing basics</h2>
          <div className="instruction-group">
            <h3>Dry mix</h3>
            {hydrogelMode ? (
              <>
                <ol>
                  <li>Put about {formatGrams(starterCarbs)} of the main carb powder in a dry container.</li>
                  <li>Add pectin and sodium alginate, then shake or whisk very thoroughly.</li>
                  <li>Add the remaining carb powders and mix until uniform.</li>
                </ol>
                <p className="instruction-note">
                  Dispersing pectin and sodium alginate into carb powder first helps prevent gummy clumps when the powder hits water.
                </p>
              </>
            ) : (
              <ol>
                <li>Weigh the carb powders.</li>
                <li>Combine in a dry container with a lid.</li>
                <li>Shake or stir until uniform.</li>
              </ol>
            )}
          </div>
          <div className="instruction-group">
            <h3>Into the flask</h3>
            <ol>
              <li>Add part of the water first.</li>
              <li>Add dry mix, cap, and shake hard.</li>
              <li>Top up until dry mix plus water reaches {formatMl(finalVolumeMl)} total.</li>
            </ol>
          </div>
        </section>

        <section className="research-notes" aria-labelledby="research-title">
          <h2 id="research-title">Notes and research links</h2>
          <p>
            Hydrogel mode may feel smoother for some users at high carb intakes, but evidence is mixed. Multiple transportable carb ratios use both glucose and fructose transport pathways; classic 2:1 glucose:fructose equals 0.5:1 Fructose:Glucose, while newer high-carb approaches often sit closer to 0.8:1 or 1:1.
          </p>
          <ul>
            <li>
              <a href="https://pubmed.ncbi.nlm.nih.gov/18202575/" target="_blank" rel="noreferrer">
                2:1 glucose-fructose performance study
              </a>
            </li>
            <li>
              <a href="https://research.birmingham.ac.uk/en/publications/multiple-transportable-carbohydrates-enhance-gastric-emptying-and/" target="_blank" rel="noreferrer">
                Multiple transportable carbs and fluid delivery
              </a>
            </li>
            <li>
              <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7400827/" target="_blank" rel="noreferrer">
                120 vs. 90 vs. 60 g/hour trail-marathon study
              </a>
            </li>
            <li>
              <a href="https://pubmed.ncbi.nlm.nih.gov/32707564/" target="_blank" rel="noreferrer">
                Hydrogel review with mixed findings
              </a>
            </li>
          </ul>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
