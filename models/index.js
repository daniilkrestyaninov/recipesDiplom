const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Recipe = require('./Recipe');
const Ingredient = require('./Ingredient');
const RecipeIngredient = require('./RecipeIngredient');
const RecipeCategory = require('./RecipeCategory');
const { Category, Celebration, NationalKitchen, TypeCooking, Step } = require('./ExtraModels');
const Subscription = require('./Subscription');
const Like = require('./Like');
const Favorite = require('./Favorite');
const Comment = require('./Comment');
const RefreshToken = require('./RefreshToken');
const PersonalNote = require('./PersonalNote');
const CookedRecipe = require('./CookedRecipe');

// ── User & Role ──────────────────────────────────────────────
Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

// ── Refresh Tokens ───────────────────────────────────────────
User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

// ── Subscriptions (self-referential) ─────────────────────────
User.belongsToMany(User, {
  as: 'Followers',
  through: Subscription,
  foreignKey: 'following_id',
  otherKey: 'follower_id',
});
User.belongsToMany(User, {
  as: 'Following',
  through: Subscription,
  foreignKey: 'follower_id',
  otherKey: 'following_id',
});

// ── Recipe ──────────────────────────────────────────────────
User.hasMany(Recipe, { foreignKey: 'user_id' });
Recipe.belongsTo(User, { foreignKey: 'user_id' });

NationalKitchen.hasMany(Recipe, { foreignKey: 'kitchen_id' });
Recipe.belongsTo(NationalKitchen, { foreignKey: 'kitchen_id', as: 'Kitchen' });

Celebration.hasMany(Recipe, { foreignKey: 'celebration_id' });
Recipe.belongsTo(Celebration, { foreignKey: 'celebration_id', as: 'Celebration' });

TypeCooking.hasMany(Recipe, { foreignKey: 'cooking_id' });
Recipe.belongsTo(TypeCooking, { foreignKey: 'cooking_id', as: 'TypeCooking' });

// ── Steps ────────────────────────────────────────────────────
Recipe.hasMany(Step, { foreignKey: 'recipe_id', as: 'Steps' });
Step.belongsTo(Recipe, { foreignKey: 'recipe_id' });

// ── Ingredients (M2M) ────────────────────────────────────────
Recipe.belongsToMany(Ingredient, {
  through: RecipeIngredient,
  foreignKey: 'recipe_id',
  otherKey: 'ingredient_id',
  as: 'Ingredients',
});
Ingredient.belongsToMany(Recipe, {
  through: RecipeIngredient,
  foreignKey: 'ingredient_id',
  otherKey: 'recipe_id',
});

// ── Categories (M2M) ─────────────────────────────────────────
Recipe.belongsToMany(Category, {
  through: RecipeCategory,
  foreignKey: 'recipe_id',
  otherKey: 'category_id',
  as: 'Categories',
});
Category.belongsToMany(Recipe, {
  through: RecipeCategory,
  foreignKey: 'category_id',
  otherKey: 'recipe_id',
});

// ── Likes ────────────────────────────────────────────────────
User.hasMany(Like, { foreignKey: 'user_id' });
Recipe.hasMany(Like, { foreignKey: 'recipe_id', as: 'Likes' });
Like.belongsTo(User, { foreignKey: 'user_id' });
Like.belongsTo(Recipe, { foreignKey: 'recipe_id' });

// ── Favorites ────────────────────────────────────────────────
User.hasMany(Favorite, { foreignKey: 'user_id' });
Recipe.hasMany(Favorite, { foreignKey: 'recipe_id' });
Favorite.belongsTo(User, { foreignKey: 'user_id' });
Favorite.belongsTo(Recipe, { foreignKey: 'recipe_id' });

// ── Comments ─────────────────────────────────────────────────
Recipe.hasMany(Comment, { foreignKey: 'recipe_id', as: 'Comments' });
User.hasMany(Comment, { foreignKey: 'user_id' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'Author' });
Comment.belongsTo(Recipe, { foreignKey: 'recipe_id' });
Comment.hasMany(Comment, { foreignKey: 'parent_comment_id', as: 'Replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_comment_id', as: 'Parent' });

// ── Personal Notes ───────────────────────────────────────────
User.hasMany(PersonalNote, { foreignKey: 'user_id' });
Recipe.hasMany(PersonalNote, { foreignKey: 'recipe_id' });
PersonalNote.belongsTo(User, { foreignKey: 'user_id' });
PersonalNote.belongsTo(Recipe, { foreignKey: 'recipe_id' });

// ── Cooked Recipes ───────────────────────────────────────────
User.hasMany(CookedRecipe, { foreignKey: 'user_id' });
Recipe.hasMany(CookedRecipe, { foreignKey: 'recipe_id' });
CookedRecipe.belongsTo(User, { foreignKey: 'user_id' });
CookedRecipe.belongsTo(Recipe, { foreignKey: 'recipe_id' });

module.exports = {
  sequelize,
  User,
  Role,
  Recipe,
  Ingredient,
  RecipeIngredient,
  RecipeCategory,
  Category,
  Celebration,
  NationalKitchen,
  TypeCooking,
  Step,
  Subscription,
  Like,
  Favorite,
  Comment,
  RefreshToken,
  PersonalNote,
  CookedRecipe,
};
