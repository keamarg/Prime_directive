#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Define file paths
const questionsPath = path.join(
  __dirname,
  "../assets/data/expanded_questions.json"
);
const outputPath = path.join(
  __dirname,
  "../assets/data/expanded_questions_balanced.json"
);

// Function to read JSON file
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

// Function to count aspect icons per question
function countAspectsPerQuestion(questions) {
  const questionCounts = [];

  // Process each eon
  for (const eon of questions.eons) {
    // Process each question
    for (const question of eon.questions) {
      const aspectIcons = {
        truth: 0,
        happiness: 0,
        autonomy: 0,
      };

      // Count icons for each choice
      for (const choice of question.choices) {
        const { truth, happiness, autonomy } = choice.effect;
        if (truth > 0) aspectIcons.truth++;
        if (happiness > 0) aspectIcons.happiness++;
        if (autonomy > 0) aspectIcons.autonomy++;
      }

      // Count how many aspects have at least one icon
      const uniqueAspects = Object.values(aspectIcons).filter(
        (count) => count > 0
      ).length;

      questionCounts.push({
        id: question.id,
        aspectIcons,
        uniqueAspectCount: uniqueAspects,
      });
    }
  }

  return questionCounts;
}

// Modified main function with more debugging
async function main() {
  // Read the questions file
  const questions = readJsonFile(questionsPath);
  if (!questions) {
    console.error("Failed to read questions file");
    return;
  }

  // Analyze current distribution per question
  const beforeCounts = countAspectsPerQuestion(questions);
  console.log("\nQuestion analysis before balancing:");

  const missingAspectsQuestions = beforeCounts.filter(
    (q) => q.uniqueAspectCount < 3
  );
  console.log(
    `${missingAspectsQuestions.length} questions missing at least one aspect type`
  );

  missingAspectsQuestions.forEach((q) => {
    const missing = [];
    if (q.aspectIcons.truth === 0) missing.push("truth");
    if (q.aspectIcons.happiness === 0) missing.push("happiness");
    if (q.aspectIcons.autonomy === 0) missing.push("autonomy");

    console.log(`Question ${q.id}: Missing aspects: ${missing.join(", ")}`);
  });

  // More aggressive balancing approach
  const balancedQuestions = forceAspectDistribution(questions);

  // Write the balanced questions to file
  try {
    fs.writeFileSync(
      outputPath,
      JSON.stringify(balancedQuestions, null, 2),
      "utf8"
    );
    console.log(
      `\nSuccessfully created balanced questions file at ${outputPath}`
    );

    // Analyze after distribution
    const afterCounts = countAspectsPerQuestion(balancedQuestions);
    console.log("\nQuestion analysis after balancing:");

    const stillMissingAspects = afterCounts.filter(
      (q) => q.uniqueAspectCount < 3
    );
    console.log(
      `${stillMissingAspects.length} questions still missing at least one aspect type`
    );

    // Count aspect distribution before and after
    countAspectDistribution(questions, "Before balancing");
    countAspectDistribution(balancedQuestions, "After balancing");
  } catch (error) {
    console.error("Error writing balanced questions file:", error);
  }
}

// New approach to maximize aspect icon coverage
function forceAspectDistribution(questions) {
  // Deep clone the questions to avoid modifying the original
  const balancedQuestions = JSON.parse(JSON.stringify(questions));
  let modificationsCount = 0;

  // Process each eon
  for (const eon of balancedQuestions.eons) {
    // Process each question
    for (const question of eon.questions) {
      const choices = question.choices;

      // Skip questions with fewer than 3 choices
      if (choices.length < 3) continue;

      // First count the current aspect distribution
      const aspectCounts = {
        truth: 0,
        happiness: 0,
        autonomy: 0,
      };

      // Count positive effects
      for (const choice of choices) {
        if (choice.effect.truth > 0) aspectCounts.truth++;
        if (choice.effect.happiness > 0) aspectCounts.happiness++;
        if (choice.effect.autonomy > 0) aspectCounts.autonomy++;
      }

      // Calculate target balance - aim for 75% of choices to have each aspect
      const totalChoices = choices.length - 1; // Exclude "do nothing" choice
      const targetPerAspect = Math.ceil(totalChoices * 0.75);

      // Always try to improve each aspect distribution
      let aspectsToBalance = ["truth", "happiness", "autonomy"];

      // Filter to just those that need improvement (below target)
      const underrepresentedAspects = aspectsToBalance.filter(
        (aspect) => aspectCounts[aspect] < targetPerAspect
      );

      // Skip if nothing needs improvement
      if (underrepresentedAspects.length === 0) continue;

      console.log(
        `\nBalancing question ${question.id} (${question.prompt.substring(
          0,
          40
        )}...)`
      );
      console.log(
        `Current distribution: Truth: ${aspectCounts.truth}, Happiness: ${aspectCounts.happiness}, Autonomy: ${aspectCounts.autonomy}`
      );
      console.log(`Target per aspect: ${targetPerAspect}`);
      console.log(`Aspects to improve: ${underrepresentedAspects.join(", ")}`);

      // For each aspect that needs improvement, find choices to modify
      for (const aspect of underrepresentedAspects) {
        // How many more of this aspect do we need to add?
        const needToAdd = targetPerAspect - aspectCounts[aspect];
        console.log(`Need to add ${needToAdd} more ${aspect} icons`);

        // Find candidates - choices without this aspect that aren't "do nothing"
        const candidates = [];
        for (let i = 0; i < choices.length - 1; i++) {
          const choice = choices[i];
          if (choice.effect[aspect] <= 0) {
            // Check if this choice already has multiple positive aspects
            const positiveCount = Object.values(choice.effect).filter(
              (v) => v > 0
            ).length;

            // Compute a suitability score - prefer choices with fewer positives and less negative aspect value
            // Higher score = better candidate
            const suitabilityScore =
              (3 - positiveCount) * 10 + (choice.effect[aspect] + 10);

            candidates.push({
              index: i,
              choice,
              suitabilityScore,
              positiveCount,
            });
          }
        }

        // Sort candidates by suitability (higher score first)
        candidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

        // Modify up to needToAdd choices
        const toModify = candidates.slice(0, needToAdd);

        for (const item of toModify) {
          const { index, choice } = item;
          const effects = choice.effect;

          // Store original value for logging
          const originalValue = effects[aspect];

          // Find other positive aspects in this choice
          const positiveAspects = [];
          if (effects.truth > 0) positiveAspects.push("truth");
          if (effects.happiness > 0) positiveAspects.push("happiness");
          if (effects.autonomy > 0) positiveAspects.push("autonomy");

          // Determine boost amount based on existing positive aspects
          if (positiveAspects.length > 0) {
            // Get the highest positive value plus a small adjustment
            const highestPositive = Math.max(
              effects.truth > 0 ? effects.truth : 0,
              effects.happiness > 0 ? effects.happiness : 0,
              effects.autonomy > 0 ? effects.autonomy : 0
            );

            // Make it positive but slightly less than the highest existing value
            effects[aspect] = Math.max(3, Math.min(highestPositive * 0.8, 6));
          } else {
            // No other positive aspects, make this moderately positive
            effects[aspect] = 4;
          }

          // If this would create a choice with all positive aspects, balance them
          if (positiveAspects.length === 2) {
            // Find the lowest positive aspect to make room for the new one
            const lowestAspect = positiveAspects.reduce(
              (lowest, a) => (effects[a] < effects[lowest] ? a : lowest),
              positiveAspects[0]
            );

            // Reduce it to make room for new aspect, but keep it positive
            effects[lowestAspect] = Math.max(2, effects[lowestAspect] * 0.7);
          }

          // Adjust tags if needed
          if (!choice.tags.includes(`${aspect}_up`)) {
            choice.tags.push(`${aspect}_up`);
          }

          console.log(
            `  Modified choice ${index + 1}: "${choice.label.substring(
              0,
              30
            )}..."`
          );
          console.log(
            `  Changed ${aspect} from ${originalValue} to ${effects[aspect]}`
          );

          // Update our counts
          aspectCounts[aspect]++;
          modificationsCount++;
        }
      }

      // Final aspect count for this question
      console.log(
        `Final distribution: Truth: ${aspectCounts.truth}, Happiness: ${aspectCounts.happiness}, Autonomy: ${aspectCounts.autonomy}`
      );
    }
  }

  console.log(`\nTotal modifications: ${modificationsCount}`);
  return balancedQuestions;
}

// Helper function to get the dominant aspect
function getDominantAspect(effects) {
  const { truth, happiness, autonomy } = effects;

  // Only consider positive effects
  const positiveEffects = {
    truth: truth > 0 ? truth : 0,
    happiness: happiness > 0 ? happiness : 0,
    autonomy: autonomy > 0 ? autonomy : 0,
  };

  // Find the aspect with the highest positive value
  const maxValue = Math.max(
    positiveEffects.truth,
    positiveEffects.happiness,
    positiveEffects.autonomy
  );

  // Return null if no positive effects
  if (maxValue <= 0) return null;

  // Return the dominant aspect
  if (positiveEffects.truth === maxValue) return "truth";
  if (positiveEffects.happiness === maxValue) return "happiness";
  return "autonomy";
}

// Function to count and display aspect distribution
function countAspectDistribution(questions, label) {
  const counts = {
    choices: 0,
    truth: 0,
    happiness: 0,
    autonomy: 0,
    multiple: 0,
    none: 0,
  };

  // Process each eon
  for (const eon of questions.eons) {
    // Process each question
    for (const question of eon.questions) {
      // Process each choice
      for (const choice of question.choices) {
        counts.choices++;

        const { truth, happiness, autonomy } = choice.effect;
        const positiveAspects = [];

        if (truth > 0) positiveAspects.push("truth");
        if (happiness > 0) positiveAspects.push("happiness");
        if (autonomy > 0) positiveAspects.push("autonomy");

        if (positiveAspects.length === 0) {
          counts.none++;
        } else if (positiveAspects.length > 1) {
          counts.multiple++;
        }

        // Count individual aspects
        if (truth > 0) counts.truth++;
        if (happiness > 0) counts.happiness++;
        if (autonomy > 0) counts.autonomy++;
      }
    }
  }

  console.log(`\n${label}:`);
  console.log(`Total choices: ${counts.choices}`);
  console.log(
    `Truth icons: ${counts.truth} (${Math.round(
      (counts.truth / counts.choices) * 100
    )}%)`
  );
  console.log(
    `Happiness icons: ${counts.happiness} (${Math.round(
      (counts.happiness / counts.choices) * 100
    )}%)`
  );
  console.log(
    `Autonomy icons: ${counts.autonomy} (${Math.round(
      (counts.autonomy / counts.choices) * 100
    )}%)`
  );
  console.log(
    `Multiple icons: ${counts.multiple} (${Math.round(
      (counts.multiple / counts.choices) * 100
    )}%)`
  );
  console.log(
    `No icons: ${counts.none} (${Math.round(
      (counts.none / counts.choices) * 100
    )}%)`
  );
}

// Run the main function
main();
