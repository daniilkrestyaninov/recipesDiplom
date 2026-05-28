// scratch/test_custom_verification.js
const rc = require('../controllers/recipeController');
const { sequelize, User, Recipe, Comment, CommentLike, Favorite, Like, Role, Notification } = require('../models');
const { Op } = require('sequelize');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[Assertion Failed] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runTests() {
  console.log('=== STARTING BACKEND CUSTOM VERIFICATION ===');
  let tempUserA = null;
  let tempUserB = null;
  let tempAdmin = null;
  let tempRecipe = null;
  let privateRecipe = null;
  let publicRecipe = null;

  try {
    // 0. Setup Temporary Users and Recipes
    console.log('\n--- Setup Temporary Data ---');
    tempUserA = await User.create({
      username: 'temp_user_a',
      name: 'Temp User A',
      email: 'temp_a@example.com',
      password: 'password123',
      role_id: 3 // assuming role 3 is normal user
    });
    tempUserB = await User.create({
      username: 'temp_user_b',
      name: 'Temp User B',
      email: 'temp_b@example.com',
      password: 'password123',
      role_id: 3
    });

    // Public and Private recipes for User A
    publicRecipe = await Recipe.create({
      user_id: tempUserA.id,
      title: 'Temp Public Recipe',
      description: 'Tasty and public recipe description.',
      difficulty: '3',
      portion: 4,
      cooking_time: 30,
      is_private: false
    });

    privateRecipe = await Recipe.create({
      user_id: tempUserA.id,
      title: 'Temp Private Recipe',
      description: 'Secret and private recipe description.',
      difficulty: '5',
      portion: 2,
      cooking_time: 60,
      is_private: true
    });

    // 1. Verification of GET /menu-of-week controller action
    console.log('\n--- Task 1: GET /menu-of-week ---');
    let getMenuOfWeekResult = null;
    const reqMenu = { user: null };
    const resMenu = {
      json: (data) => { getMenuOfWeekResult = data; },
      status: () => resMenu
    };
    await rc.getMenuOfWeek(reqMenu, resMenu);
    assert(Array.isArray(getMenuOfWeekResult), 'getMenuOfWeek returns an array for guest users');
    console.log(`getMenuOfWeek returned ${getMenuOfWeekResult.length} weekly menu entries.`);

    // 2. Verification of Private Recipe Privacy
    console.log('\n--- Task 2: Private Recipe Privacy ---');
    
    // Test getById for Owner (User A)
    let getByIdResult = null;
    let getByIdStatus = 200;
    const reqGetOwner = { user: { id: tempUserA.id }, params: { id: privateRecipe.id } };
    const resGetOwner = {
      json: (data) => { getByIdResult = data; },
      status: (code) => { getByIdStatus = code; return resGetOwner; }
    };
    await rc.getById(reqGetOwner, resGetOwner);
    assert(getByIdStatus === 200 && getByIdResult && String(getByIdResult.id) === String(privateRecipe.id), 'Owner can fetch their own private recipe by ID');

    // Test getById for Non-Owner (User B)
    let getByIdStatusNonOwner = 200;
    const reqGetNonOwner = { user: { id: tempUserB.id }, params: { id: privateRecipe.id } };
    const resGetNonOwner = {
      json: () => {},
      status: (code) => { getByIdStatusNonOwner = code; return resGetNonOwner; }
    };
    await rc.getById(reqGetNonOwner, resGetNonOwner);
    assert(getByIdStatusNonOwner === 403, 'Non-owner gets 403 Forbidden when fetching private recipe by ID');

    // Test getById for Guest (No auth)
    let getByIdStatusGuest = 200;
    const reqGetGuest = { user: null, params: { id: privateRecipe.id } };
    const resGetGuest = {
      json: () => {},
      status: (code) => { getByIdStatusGuest = code; return resGetGuest; }
    };
    await rc.getById(reqGetGuest, resGetGuest);
    assert(getByIdStatusGuest === 403, 'Guest user gets 403 Forbidden when fetching private recipe by ID');

    // Test getAll for Owner (listing their own)
    let getAllResult = null;
    const reqAllOwner = { user: { id: tempUserA.id }, query: { user_id: tempUserA.id } };
    const resAllOwner = {
      json: (data) => { getAllResult = data; },
      status: () => resAllOwner
    };
    await rc.getAll(reqAllOwner, resAllOwner);
    const hasPrivateOwner = getAllResult.some(r => String(r.id) === String(privateRecipe.id));
    assert(hasPrivateOwner, 'Owner can see their own private recipe in search/lists');

    // Test getAll for Non-Owner listing User A's recipes
    let getAllResultNonOwner = null;
    const reqAllNonOwner = { user: { id: tempUserB.id }, query: { user_id: tempUserA.id } };
    const resAllNonOwner = {
      json: (data) => { getAllResultNonOwner = data; },
      status: () => resAllNonOwner
    };
    await rc.getAll(reqAllNonOwner, resAllNonOwner);
    const hasPrivateNonOwner = getAllResultNonOwner.some(r => String(r.id) === String(privateRecipe.id));
    assert(!hasPrivateNonOwner, 'Non-owner does not see private recipes of another user in search/lists');

    // 3. Verification of Cascading Comment Deletions
    console.log('\n--- Task 3 & 4: Cascading Comments Deletion ---');
    
    // Create comment, reply, and like
    const parentComment = await Comment.create({
      user_id: tempUserB.id,
      recipe_id: publicRecipe.id,
      content: 'This is a parent comment!',
      rating: 5
    });

    const replyComment = await Comment.create({
      user_id: tempUserA.id,
      recipe_id: publicRecipe.id,
      content: 'Thank you for your rating!',
      parent_comment_id: parentComment.id
    });

    const commentLike = await CommentLike.create({
      user_id: tempUserA.id,
      comment_id: parentComment.id
    });

    console.log('Created parent comment, reply comment, and comment like.');

    // Destroy the recipe (triggers hooks)
    console.log('Destroying public recipe...');
    await publicRecipe.destroy();

    // Verify cleanup
    const commentCount = await Comment.count({ where: { recipe_id: publicRecipe.id } });
    const replyCount = await Comment.count({ where: { id: replyComment.id } });
    const likeCount = await CommentLike.count({ where: { comment_id: parentComment.id } });

    assert(commentCount === 0, 'All comments of the deleted recipe are cascade-deleted');
    assert(replyCount === 0, 'Subsequent child comment replies are cascade-deleted');
    assert(likeCount === 0, 'Comment likes are cascade-deleted');

    // 4. Verification of Recommendation Favorite Exclusion
    console.log('\n--- Task 5: Recommendation Favorites Exclusion ---');

    // Create a new public recipe to recommend
    const recommendRecipe = await Recipe.create({
      user_id: tempUserA.id,
      title: 'Recommend Me',
      description: 'This is a public recipe to be recommended.',
      difficulty: '1',
      portion: 4,
      cooking_time: 15,
      is_private: false
    });

    // Test recommendations before favoriting
    let recsBefore = null;
    const reqRecBefore = { user: { id: tempUserB.id }, query: { limit: 10 } };
    const resRecBefore = {
      json: (data) => { recsBefore = data; },
      status: () => resRecBefore
    };
    await rc.getRecommendations(reqRecBefore, resRecBefore);
    const isRecommendedBefore = recsBefore.some(r => String(r.id) === String(recommendRecipe.id));
    console.log('Recipe in recommendations before favoriting:', isRecommendedBefore);

    // Favorite the recipe
    await Favorite.create({
      user_id: tempUserB.id,
      recipe_id: recommendRecipe.id
    });
    console.log('User B added recipe to favorites.');

    // Test recommendations after favoriting
    let recsAfter = null;
    const reqRecAfter = { user: { id: tempUserB.id }, query: { limit: 10 } };
    const resRecAfter = {
      json: (data) => { recsAfter = data; },
      status: () => resRecAfter
    };
    await rc.getRecommendations(reqRecAfter, resRecAfter);
    const isRecommendedAfter = recsAfter.some(r => String(r.id) === String(recommendRecipe.id));
    assert(!isRecommendedAfter, 'Favorited recipe is excluded from recommendations');

    // 5. Verification of Notification Masking for Admin/Moderator actions
    console.log('\n--- Task 7: Notification Masking ---');
    const notificationController = require('../controllers/notificationController');

    // Create temp admin user
    const adminRole = await Role.findOne({ where: { name: 'Admin' } });
    const tempAdmin = await User.create({
      username: 'temp_admin_user',
      name: 'Temp Admin User',
      email: 'temp_admin@example.com',
      password: 'password123',
      role_id: adminRole.id
    });

    // 5.1 Admin performs a User-like action (e.g. COMMENT type)
    const userActionNotif = await Notification.create({
      user_id: tempUserB.id,
      actor_id: tempAdmin.id,
      type: 'COMMENT',
      message: 'Admin commented on your recipe'
    });

    // 5.2 Admin performs a System action (e.g. SYSTEM type)
    const adminActionNotif = await Notification.create({
      user_id: tempUserB.id,
      actor_id: tempAdmin.id,
      type: 'SYSTEM',
      message: 'Admin updated your role'
    });

    // Fetch notifications using notificationController
    let notifsResult = null;
    const reqNotifs = { user: { id: tempUserB.id }, query: { limit: 10 } };
    const resNotifs = {
      json: (data) => { notifsResult = data.notifications; },
      status: () => resNotifs
    };
    await notificationController.getAll(reqNotifs, resNotifs);

    const userNotifInResult = notifsResult.find(n => n.id === userActionNotif.id);
    const adminNotifInResult = notifsResult.find(n => n.id === adminActionNotif.id);

    assert(userNotifInResult && userNotifInResult.Actor && userNotifInResult.Actor.name === 'Temp Admin User', 'Admin performing user-like action has their real profile displayed');
    assert(adminNotifInResult && adminNotifInResult.Actor && adminNotifInResult.Actor.name === 'Администратор' && adminNotifInResult.Actor.id === null, 'Admin performing system action is masked as "Администратор" and has their ID hidden');

    // Cleanup final temp data
    await Notification.destroy({ where: { user_id: tempUserB.id } });
    if (tempAdmin) await User.destroy({ where: { id: tempAdmin.id }, force: true });
    await Favorite.destroy({ where: { recipe_id: recommendRecipe.id } });
    await recommendRecipe.destroy();
    console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
    console.error(err.stack);
  } finally {
    console.log('\nCleaning up remaining temporary DB records...');
    try {
      if (publicRecipe) await Recipe.destroy({ where: { id: publicRecipe.id }, force: true });
      if (privateRecipe) await Recipe.destroy({ where: { id: privateRecipe.id }, force: true });
      if (tempUserA) await User.destroy({ where: { id: tempUserA.id }, force: true });
      if (tempUserB) await User.destroy({ where: { id: tempUserB.id }, force: true });
      if (tempAdmin) await User.destroy({ where: { id: tempAdmin.id }, force: true });
    } catch (cleanupError) {
      console.error('Cleanup warning:', cleanupError.message);
    }
    await sequelize.close();
  }
}

runTests();
