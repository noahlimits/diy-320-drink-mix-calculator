import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Minus, Moon, Plus, Sun } from "lucide-react";
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
const ratioOptions: RatioChoice[] = ["0.8", "1", "0.5", "custom"];

function formatGrams(value: number) {
  return `${Number(value.toFixed(2)).toString()} g`;
}

function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step;
}

function roundCarbIngredient(value: number) {
  return roundToStep(value, 1);
}

function formatMl(value: number) {
  return `${Math.round(value)} ml`;
}

function formatFlaskCount(value: number) {
  return Number(value.toFixed(2)).toString();
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

function parseNonNegativeInteger(value: string, fallback: number) {
  if (!/^\d+$/.test(value)) {
    return fallback;
  }

  return Number(value);
}

function getRatioLabel(ratio: number) {
  return `${formatNumber(ratio)} : 1`;
}

function getRatioOptionLabel(option: RatioChoice) {
  if (option === "custom") {
    return "Custom";
  }

  return `${option} : 1`;
}

function buildCarbIngredients(carbSource: CarbSource, totalCarbs: number, ratio: number): Ingredient[] {
  const roundedTotalCarbs = roundToStep(totalCarbs, 1);
  const fructoseGrams = (totalCarbs * ratio) / (1 + ratio);
  const glucoseGrams = totalCarbs / (1 + ratio);

  if (carbSource === "fructose") {
    const fructose = roundCarbIngredient(fructoseGrams);
    return [
      { name: "Fructose", grams: fructose },
      { name: "Maltodextrin", grams: Math.max(0, roundedTotalCarbs - fructose) },
    ];
  }

  if (ratio <= 1) {
    const sucrose = roundCarbIngredient(fructoseGrams * 2);
    return [
      { name: "Sucrose", grams: sucrose },
      { name: "Maltodextrin", grams: Math.max(0, roundedTotalCarbs - sucrose) },
    ].filter((ingredient) => ingredient.grams > 0.005);
  }

  const sucrose = roundCarbIngredient(glucoseGrams * 2);
  return [
    { name: "Sucrose", grams: sucrose },
    { name: "Fructose", grams: Math.max(0, roundedTotalCarbs - sucrose) },
  ].filter((ingredient) => ingredient.grams > 0.005);
}

function App() {
  const [servings, setServings] = useState(1);
  const [servingInput, setServingInput] = useState("1");
  const [runHours, setRunHours] = useState(1);
  const [runMinutes, setRunMinutes] = useState(0);
  const [runHoursInput, setRunHoursInput] = useState("1");
  const [runMinutesInput, setRunMinutesInput] = useState("0");
  const [carbSource, setCarbSource] = useState<CarbSource>("sucrose");
  const [doseMode, setDoseMode] = useState<DoseMode>("servings");
  const [carbRateChoice, setCarbRateChoice] = useState<CarbRateChoice>("80");
  const [customCarbsPerHour, setCustomCarbsPerHour] = useState(80);
  const [customCarbsInput, setCustomCarbsInput] = useState("80");
  const [ratioChoice, setRatioChoice] = useState<RatioChoice>("0.8");
  const [customRatio, setCustomRatio] = useState(0.8);
  const [customRatioInput, setCustomRatioInput] = useState("0.8");
  const [hydrogelMode, setHydrogelMode] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const totalRunMinutes = runHours * 60 + runMinutes;
  const runTimeHours = totalRunMinutes / 60;
  const carbsPerHour = carbRateChoice === "custom" ? customCarbsPerHour : Number(carbRateChoice);
  const ratio = ratioChoice === "custom" ? customRatio : Number(ratioChoice);
  const totalCarbs = doseMode === "runTime" ? runTimeHours * carbsPerHour : servings * carbsPerHour;
  const doseUnits = doseMode === "runTime" ? runTimeHours : servings;
  const carbScale = totalCarbs / baselineCarbs;
  const hydrogelWeight = hydrogelMode ? hydrocolloidGramsPer80gCarbs * carbScale : 0;
  const totalDryMix = totalCarbs + hydrogelWeight;
  const finalVolumeMl = Math.round(doseUnits * baselineVolumeMl);
  const fullFlasks = Math.floor(finalVolumeMl / baselineVolumeMl);
  const partialFlaskMl = finalVolumeMl % baselineVolumeMl;
  const totalFlaskCount = finalVolumeMl / baselineVolumeMl;
  const dryMixPerFullFlask = totalDryMix * (baselineVolumeMl / finalVolumeMl);
  const dryMixForPartialFlask = totalDryMix * (partialFlaskMl / finalVolumeMl);
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
    const safeServings = Math.max(1, nextServings);
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

  const updateRunTime = (nextTotalMinutes: number) => {
    const safeTotalMinutes = Math.max(15, nextTotalMinutes);
    const nextHours = Math.floor(safeTotalMinutes / 60);
    const nextMinutes = safeTotalMinutes % 60;
    setRunHours(nextHours);
    setRunMinutes(nextMinutes);
    setRunHoursInput(String(nextHours));
    setRunMinutesInput(String(nextMinutes));
  };

  const handleRunHoursChange = (value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setRunHoursInput(value);
      const nextHours = Number(value);
      if (value !== "") {
        setRunHours(nextHours);
      }
    }
  };

  const handleRunMinutesChange = (value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setRunMinutesInput(value);
      const nextMinutes = Number(value);
      if (value !== "") {
        setRunMinutes(nextMinutes);
      }
    }
  };

  const commitRunTimeInput = () => {
    const nextHours = parseNonNegativeInteger(runHoursInput, 1);
    const rawMinutes = parseNonNegativeInteger(runMinutesInput, 0);
    updateRunTime(nextHours * 60 + rawMinutes);
  };

  const updateRunHours = (hourDelta: number) => {
    updateRunTime((runHours + hourDelta) * 60 + runMinutes);
  };

  const updateRunMinutes = (minuteDelta: number) => {
    updateRunTime(totalRunMinutes + minuteDelta);
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

  const updateCustomCarbs = (delta: number) => {
    const nextValue = Math.max(1, customCarbsPerHour + delta);
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
    <main className={`app-shell${isDarkMode ? " dark-mode" : ""}`}>
      <section className="calculator" aria-labelledby="calculator-title">
        <header className="hero">
          <div>
            <p className="eyebrow">Mix by dosing target</p>
            <h1 id="calculator-title">DIY Run Fuel Calculator</h1>
            <p className="subtitle">
              {doseMode === "runTime"
                ? `One hour = ${formatGrams(carbsPerHour)} carbs in one 500 ml flask.`
                : `One serving = ${formatGrams(carbsPerHour)} carbs in one 500 ml flask.`}
            </p>
            <p className="ratio-line">Fructose : Glucose = {getRatioLabel(ratio)}</p>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setIsDarkMode((currentMode) => !currentMode)}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun size={17} strokeWidth={2.4} /> : <Moon size={17} strokeWidth={2.4} />}
          </button>
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
                  {getRatioOptionLabel(option)}
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
              }}
            >
              <option value="servings">Servings</option>
              <option value="runTime">Run time</option>
            </select>
          </label>

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

          {carbRateChoice === "custom" && (
            <label className="field small-field">
              <span>Custom g/hr</span>
              <div className="number-stepper">
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
                <div className="stepper-actions" aria-label="Adjust custom carbs per hour">
                  <button
                    type="button"
                    className="stepper-button"
                    onClick={() => updateCustomCarbs(1)}
                    aria-label="Increase custom carbs per hour by 1"
                    title="Increase custom carbs per hour by 1"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                  <button
                    type="button"
                    className="stepper-button"
                    onClick={() => updateCustomCarbs(-1)}
                    disabled={customCarbsPerHour <= 1}
                    aria-label="Decrease custom carbs per hour by 1"
                    title="Decrease custom carbs per hour by 1"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </label>
          )}

          {doseMode === "servings" ? (
            <div className="field dose-field">
              <span>Servings</span>
              <div className="number-stepper" role="group" aria-label="Servings selector">
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
                  aria-label="Number of servings"
                />
                <div className="stepper-actions" aria-label="Adjust servings">
                  <button
                    type="button"
                    className="stepper-button"
                    onClick={() => updateServings(servings + 1)}
                    aria-label="Increase servings"
                    title="Increase servings"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                  <button
                    type="button"
                    className="stepper-button"
                    onClick={() => updateServings(servings - 1)}
                    disabled={servings <= 1}
                    aria-label="Decrease servings"
                    title="Decrease servings"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="field runtime-field">
              <span>Run time</span>
              <div className="runtime-control">
                <label className="number-stepper">
                  <input
                    inputMode="numeric"
                    value={runHoursInput}
                    onBlur={commitRunTimeInput}
                    onChange={(event) => handleRunHoursChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                      }
                    }}
                    aria-label="Run time hours"
                  />
                  <span>hr</span>
                  <div className="stepper-actions" aria-label="Adjust hours">
                    <button
                      type="button"
                      className="stepper-button"
                      onClick={() => updateRunHours(1)}
                      aria-label="Increase run time hours"
                      title="Increase run time hours"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      className="stepper-button"
                      onClick={() => updateRunHours(-1)}
                      disabled={totalRunMinutes <= 60}
                      aria-label="Decrease run time hours"
                      title="Decrease run time hours"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                  </div>
                </label>

                <label className="number-stepper">
                  <input
                    inputMode="numeric"
                    value={runMinutesInput}
                    onBlur={commitRunTimeInput}
                    onChange={(event) => handleRunMinutesChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                      }
                    }}
                    aria-label="Run time minutes"
                  />
                  <span>min</span>
                  <div className="stepper-actions" aria-label="Adjust minutes">
                    <button
                      type="button"
                      className="stepper-button"
                      onClick={() => updateRunMinutes(15)}
                      aria-label="Increase run time minutes by 15"
                      title="Increase run time minutes by 15"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      className="stepper-button"
                      onClick={() => updateRunMinutes(-15)}
                      disabled={totalRunMinutes <= 15}
                      aria-label="Decrease run time minutes by 15"
                      title="Decrease run time minutes by 15"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                  </div>
                </label>
              </div>
            </div>
          )}

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
          <div className="volume-note">
            <strong>{formatMl(finalVolumeMl)} total = {formatFlaskCount(totalFlaskCount)} x 500 ml flasks.</strong>
            <span>
              Fill {fullFlasks} full {fullFlasks === 1 ? "flask" : "flasks"} with about {formatGrams(dryMixPerFullFlask)} dry mix each
              {partialFlaskMl > 0
                ? `, then put the remaining ${formatGrams(dryMixForPartialFlask)} in a partial flask and top it to ${formatMl(partialFlaskMl)}.`
                : "."}
            </span>
          </div>
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
              <li>Top up each flask to 500 ml, or top the partial flask to its listed volume.</li>
            </ol>
          </div>
        </section>

        <section className="research-notes" aria-labelledby="research-title">
          <h2 id="research-title">Notes and research links</h2>
          <div className="pectin-note">
            <h3>Pectin type matters</h3>
            <p>
              Use dry, powdered regular fruit pectin, ideally standard high-methoxyl pectin if the label names the type. Do not use liquid pectin, and skip low-sugar or no-sugar pectins that are calcium-activated or labeled low-methoxyl. Those products are formulated for a different gelling system and may behave differently in this mix. Blend the powder thoroughly into the dry carb base before adding water.
            </p>
          </div>
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
