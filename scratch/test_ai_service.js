const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const geminiService = require('../services/geminiService');

async function runTests() {
  console.log('🤖 Starting AI Service Integration Tests...\n');

  // Print current env configuration to help debug
  console.log('--- Environment Configuration ---');
  console.log('GIGACHAT_AUTH_DATA:', process.env.GIGACHAT_AUTH_DATA ? '***[SET]***' : '[NOT SET]');
  console.log('GIGACHAT_AUTH_KEY:', process.env.GIGACHAT_AUTH_KEY ? '***[SET]***' : '[NOT SET]');
  console.log('GIGACHAT_SCOPE:', process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS (default)');
  console.log('GIGACHAT_MODEL:', process.env.GIGACHAT_MODEL || 'GigaChat (default)');
  console.log('AI_BASE_URL:', process.env.AI_BASE_URL || '[NOT SET]');
  console.log('AI_MODEL:', process.env.AI_MODEL || 'deepseek-chat (default)');
  console.log('---------------------------------\n');

  try {
    // Test 1: Recipe Generation
    console.log('🍳 Test 1: Generating a recipe from ingredients ["курица", "сыр"]...');
    const startTime1 = Date.now();
    const recipe = await geminiService.generateRecipe(['курица', 'сыр']);
    const duration1 = Date.now() - startTime1;
    console.log(`✅ Test 1 Succeeded! (Duration: ${duration1}ms)`);
    console.log('Generated Recipe Output:', JSON.stringify(recipe, null, 2));
    console.log('\n---------------------------------\n');

    // Test 2: PFC Calculation
    console.log('📊 Test 2: Calculating PFC (calories/proteins/fats/carbs) for "Куриная грудка с сыром"...');
    const startTime2 = Date.now();
    const pfc = await geminiService.calculatePFC('Куриная грудка с сыром', ['куриная грудка 200г', 'сыр гауда 50г']);
    const duration2 = Date.now() - startTime2;
    console.log(`✅ Test 2 Succeeded! (Duration: ${duration2}ms)`);
    console.log('Calculated PFC Output:', JSON.stringify(pfc, null, 2));
    console.log('\n---------------------------------\n');

    console.log('🎉 All AI Service Integration Tests Passed Successfully!');
  } catch (error) {
    console.error('❌ Integration Test Failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
