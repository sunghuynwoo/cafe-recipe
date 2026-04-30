const STORAGE_KEY = "paikdabang-recipes";

const seedRecipes = [
  {
    id: createId(),
    name: "아이스 아메리카노",
    category: "커피",
    level: "쉬움",
    ingredients: ["에스프레소", "물", "얼음"],
    steps: ["컵에 얼음을 담기", "물을 넣기", "에스프레소를 부어 마무리"],
    memo: "샘플 레시피입니다. 실제 매장 레시피는 직접 입력해 주세요.",
    favorite: true,
    updatedAt: Date.now()
  },
  {
    id: createId(),
    name: "딸기 라떼 메모",
    category: "라떼",
    level: "보통",
    ingredients: ["딸기 베이스", "우유", "얼음"],
    steps: ["베이스를 컵 바닥에 담기", "얼음과 우유를 천천히 넣기", "층이 보이게 마무리"],
    memo: "개인 연습용 샘플입니다.",
    favorite: false,
    updatedAt: Date.now()
  }
];

const categories = ["전체", "즐겨찾기"];

const state = {
  recipes: loadRecipes(),
  query: "",
  category: "전체"
};

const recipeList = document.querySelector("#recipeList");
const searchInput = document.querySelector("#searchInput");
const categoryTabs = document.querySelector("#categoryTabs");
const recipeCount = document.querySelector("#recipeCount");
const favoriteCount = document.querySelector("#favoriteCount");
const recipeDialog = document.querySelector("#recipeDialog");
const recipeForm = document.querySelector("#recipeForm");
const dialogTitle = document.querySelector("#dialogTitle");
const deleteButton = document.querySelector("#deleteButton");

const fields = {
  id: document.querySelector("#recipeId"),
  name: document.querySelector("#nameInput"),
  category: document.querySelector("#categoryInput"),
  level: document.querySelector("#levelInput"),
  ingredients: document.querySelector("#ingredientsInput"),
  steps: document.querySelector("#stepsInput"),
  memo: document.querySelector("#memoInput"),
  favorite: document.querySelector("#favoriteInput")
};

document.querySelector("#openFormButton").addEventListener("click", () => openForm());
document.querySelector("#closeFormButton").addEventListener("click", () => recipeDialog.close());
searchInput.addEventListener("input", (event) => {
  state.query = event.target.value.trim().toLowerCase();
  render();
});

recipeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveRecipe();
});

deleteButton.addEventListener("click", deleteCurrentRecipe);

renderTabs();
render();

function loadRecipes() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return seedRecipes;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : seedRecipes;
  } catch {
    return seedRecipes;
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.recipes));
}

function renderTabs() {
  categoryTabs.innerHTML = categories
    .map(
      (category) => `
        <button class="tab-button${state.category === category ? " is-active" : ""}" type="button" data-category="${category}">
          ${category}
        </button>
      `
    )
    .join("");

  categoryTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      renderTabs();
      render();
    });
  });
}

function render() {
  const recipes = getFilteredRecipes();
  recipeCount.textContent = state.recipes.length;
  favoriteCount.textContent = state.recipes.filter((recipe) => recipe.favorite).length;

  if (!recipes.length) {
    recipeList.innerHTML = `
      <div class="empty-state">
        <strong>찾는 레시피가 없어요</strong>
        <p>검색어를 바꾸거나 + 버튼으로 새 레시피를 추가해 보세요.</p>
      </div>
    `;
    return;
  }

  recipeList.innerHTML = recipes.map(createRecipeCard).join("");
  recipeList.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const recipe = state.recipes.find((item) => item.id === button.dataset.editId);
      openForm(recipe);
    });
  });
}

function getFilteredRecipes() {
  return state.recipes
    .filter((recipe) => {
      if (state.category === "즐겨찾기") {
        return recipe.favorite;
      }
      return true;
    })
    .filter((recipe) => {
      const haystack = [
        recipe.name,
        recipe.category,
        recipe.level,
        recipe.memo,
        ...recipe.ingredients,
        ...recipe.steps
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(state.query);
    })
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt);
}

function createRecipeCard(recipe) {
  return `
    <article class="recipe-card">
      <div class="card-head">
        <div>
          <h3>${escapeHtml(recipe.name)}</h3>
          <div class="card-meta">
            <div class="badge-row">
              <span class="badge">${escapeHtml(recipe.category)}</span>
              <span class="badge">${escapeHtml(recipe.level)}</span>
              ${recipe.favorite ? '<span class="badge favorite">즐겨찾기</span>' : ""}
            </div>
          </div>
        </div>
        <button class="edit-button" type="button" data-edit-id="${recipe.id}">수정</button>
      </div>

      <div class="recipe-section">
        <strong>재료</strong>
        <div class="ingredient-list">
          ${recipe.ingredients.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>
      </div>

      <div class="recipe-section">
        <strong>제조 순서</strong>
        <div class="step-list">
          ${recipe.steps.map((step, index) => `<span>${index + 1}. ${escapeHtml(step)}</span>`).join("")}
        </div>
      </div>

      ${
        recipe.memo
          ? `<div class="recipe-section"><p class="memo">${escapeHtml(recipe.memo)}</p></div>`
          : ""
      }
    </article>
  `;
}

function openForm(recipe) {
  const isEdit = Boolean(recipe);
  dialogTitle.textContent = isEdit ? "레시피 수정" : "레시피 추가";
  deleteButton.hidden = !isEdit;

  fields.id.value = recipe?.id ?? "";
  fields.name.value = recipe?.name ?? "";
  fields.category.value = recipe?.category ?? "커피";
  fields.level.value = recipe?.level ?? "쉬움";
  fields.ingredients.value = recipe?.ingredients.join("\n") ?? "";
  fields.steps.value = recipe?.steps.join("\n") ?? "";
  fields.memo.value = recipe?.memo ?? "";
  fields.favorite.checked = recipe?.favorite ?? false;

  recipeDialog.showModal();
  fields.name.focus();
}

function saveRecipe() {
  const recipe = {
    id: fields.id.value || createId(),
    name: fields.name.value.trim(),
    category: fields.category.value,
    level: fields.level.value,
    ingredients: splitLines(fields.ingredients.value),
    steps: splitLines(fields.steps.value),
    memo: fields.memo.value.trim(),
    favorite: fields.favorite.checked,
    updatedAt: Date.now()
  };

  if (!recipe.name || !recipe.ingredients.length || !recipe.steps.length) {
    return;
  }

  const existingIndex = state.recipes.findIndex((item) => item.id === recipe.id);
  if (existingIndex >= 0) {
    state.recipes[existingIndex] = recipe;
  } else {
    state.recipes.unshift(recipe);
  }

  persist();
  recipeDialog.close();
  recipeForm.reset();
  renderTabs();
  render();
}

function deleteCurrentRecipe() {
  const id = fields.id.value;
  if (!id) {
    return;
  }

  const confirmed = window.confirm("이 레시피를 삭제할까요?");
  if (!confirmed) {
    return;
  }

  state.recipes = state.recipes.filter((recipe) => recipe.id !== id);
  persist();
  recipeDialog.close();
  render();
}

function splitLines(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[char];
  });
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `recipe-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
