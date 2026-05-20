const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Recipe = require('./Recipe');
const Ingredient = require('./Ingredient');
const RecipeIngredient = require('./RecipeIngredient');
const RecipeCategory = require('./RecipeCategory');
const { Category, Celebration, NationalKitchen, TypeCooking, Step, Unit } = require('./ExtraModels');
const Subscription = require('./Subscription');
const Like = require('./Like');
const Favorite = require('./Favorite');
const Comment = require('./Comment');
const RefreshToken = require('./RefreshToken');
const PersonalNote = require('./PersonalNote');
const CookedRecipe = require('./CookedRecipe');
const CommentLike = require('./CommentLike');
const Notification = require('./Notification');
const Report = require('./Report');
const MenuOfTheWeek = require('./MenuOfTheWeek');
const VerificationRequest = require('./VerificationRequest');
const AuditLog = require('./AuditLog');
const DeviceToken = require('./DeviceToken');
const Appeal = require('./Appeal');

// ── User & Role ──────────────────────────────────────────────
Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

// ── Device Tokens ────────────────────────────────────────────
User.hasMany(DeviceToken, { foreignKey: 'user_id' });
DeviceToken.belongsTo(User, { foreignKey: 'user_id' });

// ── Menu of the Week ─────────────────────────────────────────
MenuOfTheWeek.belongsTo(Recipe, { foreignKey: 'recipe_id' });
Recipe.hasMany(MenuOfTheWeek, { foreignKey: 'recipe_id' });

// ── Verification Requests ────────────────────────────────────
User.hasMany(VerificationRequest, { foreignKey: 'user_id' });
VerificationRequest.belongsTo(User, { foreignKey: 'user_id' });

// ── Appeals ──────────────────────────────────────────────────
User.hasMany(Appeal, { foreignKey: 'user_id' });
Appeal.belongsTo(User, { foreignKey: 'user_id' });

// ── Audit Logs ───────────────────────────────────────────────
User.hasMany(AuditLog, { foreignKey: 'admin_id' });
AuditLog.belongsTo(User, { foreignKey: 'admin_id' });

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
Comment.hasMany(CommentLike, { foreignKey: 'comment_id', as: 'Likes' });
CommentLike.belongsTo(Comment, { foreignKey: 'comment_id' });
CommentLike.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(CommentLike, { foreignKey: 'user_id' });

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

// ── Units & Ingredients ──────────────────────────────────────
Unit.hasMany(Ingredient, { foreignKey: 'unit_id' });
Ingredient.belongsTo(Unit, { foreignKey: 'unit_id', as: 'Unit' });

// ── Reports ──────────────────────────────────────────────────
User.hasMany(Report, { foreignKey: 'reporter_id', as: 'SentReports' });
User.hasMany(Report, { foreignKey: 'reported_user_id', as: 'ReceivedReports' });
Recipe.hasMany(Report, { foreignKey: 'recipe_id', as: 'Reports' });
Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'Reporter' });
Report.belongsTo(User, { foreignKey: 'reported_user_id', as: 'ReportedUser' });
Report.belongsTo(Recipe, { foreignKey: 'recipe_id', as: 'ReportedRecipe' });

// ── Notifications ────────────────────────────────────────────
User.hasMany(Notification, { foreignKey: 'user_id', as: 'Notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
Notification.belongsTo(User, { foreignKey: 'actor_id', as: 'Actor' });
Notification.belongsTo(Recipe, { foreignKey: 'recipe_id', as: 'Recipe' });
Notification.belongsTo(Comment, { foreignKey: 'comment_id', as: 'Comment' });

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
  Unit,
  Subscription,
  Like,
  Favorite,
  Comment,
  RefreshToken,
  PersonalNote,
  CookedRecipe,
  CommentLike,
  Report,
  Notification,
  MenuOfTheWeek,
  VerificationRequest,
  AuditLog,
  DeviceToken,
  Appeal,
};
