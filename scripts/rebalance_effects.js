#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Define file paths
const inputPath = path.join(
  __dirname,
  "../assets/data/expanded_questions_balanced.json"
);
const outputPath = path.join(
  __dirname,
  "../assets/data/rebalanced_questions.json"
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

// Function to analyze effect distribution
function analyzeEffects(questions) {
  const stats = {
    totalChoices: 0,
    totalPositive: { truth: 0, happiness: 0, autonomy: 0 },
    totalNegative: { truth: 0, happiness: 0, autonomy: 0 },
    totalNeutral: { truth: 0, happiness: 0, autonomy: 0 },
    averageEffect: { truth: 0, happiness: 0, autonomy: 0 },
    maxPositive: { truth: 0, happiness: 0, autonomy: 0 },
    maxNegative: { truth: 0, happiness: 0, autonomy: 0 },
    choicesWithAllPositive: 0,
    choicesWithAllNegative: 0,
    choicesWithMixed: 0,
  };

  for (const eon of questions.eons) {
    for (const question of eon.questions) {
      for (const choice of question.choices) {
        stats.totalChoices++;
        const { truth, happiness, autonomy } = choice.effect;

        // Count positives, negatives, neutrals
        if (truth > 0) stats.totalPositive.truth++;
        else if (truth < 0) stats.totalNegative.truth++;
        else stats.totalNeutral.truth++;

        if (happiness > 0) stats.totalPositive.happiness++;
        else if (happiness < 0) stats.totalNegative.happiness++;
        else stats.totalNeutral.happiness++;

        if (autonomy > 0) stats.totalPositive.autonomy++;
        else if (autonomy < 0) stats.totalNegative.autonomy++;
        else stats.totalNeutral.autonomy++;

        // Add to averages
        stats.averageEffect.truth += truth;
        stats.averageEffect.happiness += happiness;
        stats.averageEffect.autonomy += autonomy;

        // Track max values
        stats.maxPositive.truth = Math.max(stats.maxPositive.truth, truth);
        stats.maxPositive.happiness = Math.max(
          stats.maxPositive.happiness,
          happiness
        );
        stats.maxPositive.autonomy = Math.max(
          stats.maxPositive.autonomy,
          autonomy
        );

        stats.maxNegative.truth = Math.min(stats.maxNegative.truth, truth);
        stats.maxNegative.happiness = Math.min(
          stats.maxNegative.happiness,
          happiness
        );
        stats.maxNegative.autonomy = Math.min(
          stats.maxNegative.autonomy,
          autonomy
        );

        // Count patterns
        const positiveCount =
          (truth > 0 ? 1 : 0) +
          (happiness > 0 ? 1 : 0) +
          (autonomy > 0 ? 1 : 0);
        const negativeCount =
          (truth < 0 ? 1 : 0) +
          (happiness < 0 ? 1 : 0) +
          (autonomy < 0 ? 1 : 0);

        if (positiveCount === 3) stats.choicesWithAllPositive++;
        else if (negativeCount === 3) stats.choicesWithAllNegative++;
        else if (positiveCount > 0 && negativeCount > 0)
          stats.choicesWithMixed++;
      }
    }
  }

  // Calculate averages
  stats.averageEffect.truth /= stats.totalChoices;
  stats.averageEffect.happiness /= stats.totalChoices;
  stats.averageEffect.autonomy /= stats.totalChoices;

  return stats;
}

// Function to rebalance effects to have more negative consequences
function rebalanceEffects(questions) {
  // Deep clone questions
  const rebalanced = JSON.parse(JSON.stringify(questions));
  let modifications = 0;

  // First analyze to get a baseline
  const beforeStats = analyzeEffects(questions);
  console.log("Before rebalancing:");
  console.log(
    `Positive effects: Truth: ${beforeStats.totalPositive.truth}, Happiness: ${beforeStats.totalPositive.happiness}, Autonomy: ${beforeStats.totalPositive.autonomy}`
  );
  console.log(
    `Negative effects: Truth: ${beforeStats.totalNegative.truth}, Happiness: ${beforeStats.totalNegative.happiness}, Autonomy: ${beforeStats.totalNegative.autonomy}`
  );
  console.log(
    `Average effect: Truth: ${beforeStats.averageEffect.truth.toFixed(
      2
    )}, Happiness: ${beforeStats.averageEffect.happiness.toFixed(
      2
    )}, Autonomy: ${beforeStats.averageEffect.autonomy.toFixed(2)}`
  );
  console.log(
    `All positive choices: ${beforeStats.choicesWithAllPositive}, All negative: ${beforeStats.choicesWithAllNegative}, Mixed: ${beforeStats.choicesWithMixed}`
  );

  // Target ratios - we want a more balanced distribution with more negative outcomes
  const targetRatios = {
    positive: 0.5, // 50% positive effects (down from current)
    negative: 0.4, // 40% negative effects (up from current)
    neutral: 0.1, // 10% neutral effects

    // Target at least 30% of choices to be mixed (some positive, some negative effects)
    mixedChoices: 0.5,
  };

  // For each question, rebalance effects
  for (const eon of rebalanced.eons) {
    for (const question of eon.questions) {
      // Count current effects distribution for this question
      const questionPositive = { truth: 0, happiness: 0, autonomy: 0 };
      const questionNegative = { truth: 0, happiness: 0, autonomy: 0 };

      for (const choice of question.choices) {
        const { truth, happiness, autonomy } = choice.effect;
        if (truth > 0) questionPositive.truth++;
        else if (truth < 0) questionNegative.truth++;

        if (happiness > 0) questionPositive.happiness++;
        else if (happiness < 0) questionNegative.happiness++;

        if (autonomy > 0) questionPositive.autonomy++;
        else if (autonomy < 0) questionNegative.autonomy++;
      }

      // Calculate target number of effects to flip from positive to negative
      const totalChoices = question.choices.length;
      const targetNegative = {
        truth:
          Math.ceil(totalChoices * targetRatios.negative) -
          questionNegative.truth,
        happiness:
          Math.ceil(totalChoices * targetRatios.negative) -
          questionNegative.happiness,
        autonomy:
          Math.ceil(totalChoices * targetRatios.negative) -
          questionNegative.autonomy,
      };

      console.log(
        `\nQuestion ${question.id} - Current negatives: Truth ${questionNegative.truth}, Happiness ${questionNegative.happiness}, Autonomy ${questionNegative.autonomy}`
      );
      console.log(
        `Target additional negatives: Truth ${targetNegative.truth}, Happiness ${targetNegative.happiness}, Autonomy ${targetNegative.autonomy}`
      );

      // Find choices with all positive effects to modify
      const candidatesForNegative = [];
      for (let i = 0; i < question.choices.length; i++) {
        const choice = question.choices[i];
        const { truth, happiness, autonomy } = choice.effect;

        // If this choice has all positive or 2 positives, it's a candidate for adding negative effects
        const positiveCount =
          (truth > 0 ? 1 : 0) +
          (happiness > 0 ? 1 : 0) +
          (autonomy > 0 ? 1 : 0);
        if (positiveCount >= 2) {
          candidatesForNegative.push({
            index: i,
            choice,
            positiveCount,
          });
        }
      }

      // Sort candidates by number of positive effects (most positive first)
      candidatesForNegative.sort((a, b) => b.positiveCount - a.positiveCount);

      // Process candidates
      for (const candidate of candidatesForNegative) {
        const choice = candidate.choice;
        const effects = choice.effect;

        // Make sure we maintain at least one positive effect per choice
        const maintainPositive = Object.entries(effects)
          .filter(([aspect, value]) => value > 0)
          .sort((a, b) => b[1] - a[1])[0]; // Get highest positive effect

        const aspectToKeepPositive = maintainPositive[0];

        // For other aspects, consider making them negative
        for (const aspect of ["truth", "happiness", "autonomy"]) {
          // Skip the aspect we want to keep positive
          if (aspect === aspectToKeepPositive) continue;

          // If we still need more negative effects of this type
          if (targetNegative[aspect] > 0 && effects[aspect] > 0) {
            const originalValue = effects[aspect];

            // Calculate a negative value proportional to the positive one
            effects[aspect] = -Math.ceil(originalValue * 0.8);

            // Update target count
            targetNegative[aspect]--;

            // Update tags if needed
            const positiveTag = `${aspect}_up`;
            const negativeTag = `${aspect}_down`;

            // Remove positive tag if present
            const posTagIndex = choice.tags.indexOf(positiveTag);
            if (posTagIndex > -1) {
              choice.tags.splice(posTagIndex, 1);
            }

            // Add negative tag if not present
            if (!choice.tags.includes(negativeTag)) {
              choice.tags.push(negativeTag);
            }

            console.log(
              `  Modified choice ${
                candidate.index + 1
              }: ${choice.label.substring(0, 30)}...`
            );
            console.log(
              `    Changed ${aspect} from ${originalValue} to ${effects[aspect]}`
            );

            modifications++;

            // Break after making one change per choice to avoid excessive negative effects
            break;
          }
        }
      }
    }
  }

  // Analyze after rebalancing
  const afterStats = analyzeEffects(rebalanced);
  console.log("\nAfter rebalancing:");
  console.log(
    `Positive effects: Truth: ${afterStats.totalPositive.truth}, Happiness: ${afterStats.totalPositive.happiness}, Autonomy: ${afterStats.totalPositive.autonomy}`
  );
  console.log(
    `Negative effects: Truth: ${afterStats.totalNegative.truth}, Happiness: ${afterStats.totalNegative.happiness}, Autonomy: ${afterStats.totalNegative.autonomy}`
  );
  console.log(
    `Average effect: Truth: ${afterStats.averageEffect.truth.toFixed(
      2
    )}, Happiness: ${afterStats.averageEffect.happiness.toFixed(
      2
    )}, Autonomy: ${afterStats.averageEffect.autonomy.toFixed(2)}`
  );
  console.log(
    `All positive choices: ${afterStats.choicesWithAllPositive}, All negative: ${afterStats.choicesWithAllNegative}, Mixed: ${afterStats.choicesWithMixed}`
  );
  console.log(`\nTotal modifications: ${modifications}`);

  return rebalanced;
}

// Main function
async function main() {
  // Read questions
  const questions = readJsonFile(inputPath);
  if (!questions) {
    console.error("Failed to read questions file");
    return;
  }

  // Rebalance effects
  const rebalanced = rebalanceEffects(questions);

  // Write rebalanced questions to file
  try {
    fs.writeFileSync(outputPath, JSON.stringify(rebalanced, null, 2), "utf8");
    console.log(
      `\nSuccessfully created rebalanced questions file at ${outputPath}`
    );
  } catch (error) {
    console.error("Error writing rebalanced questions file:", error);
  }
}

// Run main function
main();
