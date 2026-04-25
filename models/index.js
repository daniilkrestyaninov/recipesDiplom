const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Recipe = require('./Recipe');
const Ingredient = require('./Ingredient');
const RecipeIngredient = require('./RecipeIngredient');
const { Category, Celebration, NationalKitchen, TypeCooking, Step } = require('./ExtraModels');

// Associations
Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

User.hasMany(Recipe, { foreignKey: 'user_id' });
Recipe.belongsTo(User, { foreignKey: 'user_id' });

NationalKitchen.hasMany(Recipe, { foreignKey: 'kitchen_id' });
Recipe.belongsTo(NationalKitchen, { foreignKey: 'kitchen_id' });

Celebration.hasMany(Recipe, { foreignKey: 'celebration_id' });
Recipe.belongsTo(Celebration, { foreignKey: 'celebration_id' });

TypeCooking.hasMany(Recipe, { foreignKey: 'cooking_id' });
Recipe.belongsTo(TypeCooking, { foreignKey: 'cooking_id' });

Recipe.hasMany(Step, { foreignKey: 'recipe_id' });
Step.belongsTo(Recipe, { foreignKey: 'recipe_id' });

Recipe.belongsToMany(Ingredient, { through: RecipeIngredient, foreignKey: 'recipe_id', otherKey: 'ingredient_id' });
Ingredient.belongsToMany(Recipe, { through: RecipeIngredient, foreignKey: 'ingredient_id', otherKey: 'recipe_id' });

module.exports = {
  sequelize,
  User,
  Role,
  Recipe,
  Ingredient,
  RecipeIngredient,
  Category,
  Celebration,
  NationalKitchen,
  TypeCooking,
  Step,
};
