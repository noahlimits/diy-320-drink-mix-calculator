import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Minus, Plus } from "lucide-react";
import "./styles.css";

type Ingredient = {
  name: string;
  gramsPerServing: number;
};

const dryIngredients: Ingredient[] = [
  { name: "Sucrose / table sugar", gramsPerServing: 71 },
  { name: "Maltodextrin", gramsPerServing: 9 },
  { name: "Pectin", gramsPerServing: 1.25 },
  { name: "Sodium alginate", gramsPerServing: 1 },
];

const totalDryMixPerServing = 82.25;
const finalVolumeMlPerServing = 500;

function formatGrams(value: number) {
  return `${Number(value.toFixed(2)).toString()} g`;
}

function parseServings(value: string) {
  if (!/^\d+$/.test(value)) {
    return 1;
  }

  const nextValue = Number(value);
  return nextValue > 0 ? nextValue : 1;
}

function App() {
  const [servings, setServings] = useState(1);
  const [servingInput, setServingInput] = useState("1");

  const updateServings = (nextServings: number) => {
    const safeServings = Math.max(1, Math.floor(nextServings));
    setServings(safeServings);
    setServingInput(String(safeServings));
  };

  const handleInputChange = (value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setServingInput(value);
    }
  };

  const commitInput = () => {
    updateServings(parseServings(servingInput));
  };

  return (
    <main className="app-shell">
      <section className="calculator" aria-labelledby="calculator-title">
        <header className="hero">
          <p className="eyebrow">Mix by serving count</p>
          <h1 id="calculator-title">DIY 320 Drink Mix Calculator</h1>
          <p className="subtitle">One serving = 80 g carbs in a 500 ml finished drink.</p>
        </header>

        <div className="serving-panel">
          <label htmlFor="servings">Servings</label>
          <div className="stepper" role="group" aria-label="Serving selector">
            <button
              type="button"
              className="icon-button"
              onClick={() => updateServings(servings - 1)}
              disabled={servings <= 1}
              aria-label="Decrease servings"
              title="Decrease servings"
            >
              <Minus size={20} strokeWidth={2.5} />
            </button>

            <input
              id="servings"
              inputMode="numeric"
              pattern="[0-9]*"
              value={servingInput}
              onBlur={commitInput}
              onChange={(event) => handleInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              aria-label="Number of servings"
            />

            <button
              type="button"
              className="icon-button"
              onClick={() => updateServings(servings + 1)}
              aria-label="Increase servings"
              title="Increase servings"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

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
            <strong>{finalVolumeMlPerServing * servings} ml</strong>
          </div>
          <p>Use 500 ml per serving. Add water so the dry mix plus water reaches {finalVolumeMlPerServing * servings} ml total.</p>
        </section>

        <section className="mixing" aria-labelledby="mixing-title">
          <h2 id="mixing-title">Mixing basics</h2>
          <div className="instruction-group">
            <h3>Dry mix</h3>
            <ol>
              <li>Weigh each dry ingredient accurately.</li>
              <li>Combine in a dry container with a lid.</li>
              <li>Shake or stir until the powders look evenly blended.</li>
            </ol>
          </div>
          <div className="instruction-group">
            <h3>Into the flask</h3>
            <ol>
              <li>Add part of the water to the flask first.</li>
              <li>Add the dry mix, cap, and shake hard.</li>
              <li>Top up with water until the dry mix plus water reaches 500 ml per serving.</li>
              <li>Shake again until smooth.</li>
            </ol>
          </div>
        </section>

        <p className="note">
          This sucrose + maltodextrin version approximates a 0.8 fructose-to-1 glucose ratio after sucrose digestion.
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
