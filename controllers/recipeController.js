const { Recipe, User, Ingredient, RecipeIngredient, Step, NationalKitchen, Category, Celebration, TypeCooking } = require('../models');

const recipeController = {
  // Получить все рецепты
  getAllRecipes: async (req, res) => {
    try {
      const recipes = await Recipe.findAll({
        include: [
          { model: User, attributes: ['id', 'username', 'name'] },
          { model: NationalKitchen, attributes: ['name'] }
        ]
      });
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ message: 'Ошибка при получении рецептов', error: error.message });
    }
  },

  // Получить один рецепт по ID
  getRecipeById: async (req, res) => {
    try {
      const recipe = await Recipe.findByPk(req.params.id, {
        include: [
          { model: User, attributes: ['id', 'username', 'name'] },
          { model: Ingredient, through: { attributes: ['quantity', 'note'] } },
          { model: Step },
          { model: NationalKitchen },
          { model: Celebration },
          { model: TypeCooking }
        ]
      });

      if (!recipe) {
        return res.status(404).json({ message: 'Рецепт не найден' });
      }

      res.json(recipe);
    } catch (error) {
      res.status(500).json({ message: 'Ошибка при получении рецепта', error: error.message });
    }
  },

  // Создать новый рецепт
  createRecipe: async (req, res) => {
    try {
      const { 
        title, description, difficulty, image_url, is_private, 
        kitchen_id, celebration_id, cooking_id, portion, calorific, 
        cooking_time, ingredients, steps 
      } = req.body;

      // Получаем id из JWT токена (req.user заполняется в authMiddleware)
      const user_id = req.user.id;

      const recipe = await Recipe.create({
        user_id, title, description, difficulty, image_url, is_private,
        kitchen_id, celebration_id, cooking_id, portion, calorific, cooking_time
      });

      // Добавление ингредиентов
      if (ingredients && ingredients.length > 0) {
        for (const ing of ingredients) {
          await RecipeIngredient.create({
            recipe_id: recipe.id,
            ingredient_id: ing.id,
            quantity: ing.quantity,
            note: ing.note
          });
        }
      }

      // Добавление шагов
      if (steps && steps.length > 0) {
        const stepsData = steps.map((step, index) => ({
          recipe_id: recipe.id,
          step_number: index + 1,
          description: step.description,
          image_url: step.image_url
        }));
        await Step.bulkCreate(stepsData);
      }

      res.status(201).json(recipe);
    } catch (error) {
      res.status(500).json({ message: 'Ошибка при создании рецепта', error: error.message });
    }
  },

  // Обновить рецепт
  updateRecipe: async (req, res) => {
    try {
      const recipe = await Recipe.findByPk(req.params.id);
      if (!recipe) {
        return res.status(404).json({ message: 'Рецепт не найден' });
      }

      await recipe.update(req.body);
      res.json({ message: 'Рецепт обновлен', recipe });
    } catch (error) {
      res.status(500).json({ message: 'Ошибка при обновлении рецепта', error: error.message });
    }
  },

  // Удалить рецепт
  deleteRecipe: async (req, res) => {
    try {
      const recipe = await Recipe.findByPk(req.params.id);
      if (!recipe) {
        return res.status(404).json({ message: 'Рецепт не найден' });
      }

      await recipe.destroy();
      res.json({ message: 'Рецепт удален' });
    } catch (error) {
      res.status(500).json({ message: 'Ошибка при удалении рецепта', error: error.message });
    }
  }
};

module.exports = recipeController;
