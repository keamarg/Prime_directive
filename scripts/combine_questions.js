#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Define file paths
const originalQuestionsPath = path.join(
  __dirname,
  "../assets/data/questions.json"
);
const eon1QuestionsPath = path.join(
  __dirname,
  "../assets/data/expanded_questions_eon1.json"
);
const eon2QuestionsPath = path.join(
  __dirname,
  "../assets/data/expanded_questions_eon2.json"
);
const eon3QuestionsPath = path.join(
  __dirname,
  "../assets/data/expanded_questions_eon3.json"
);
const outputPath = path.join(
  __dirname,
  "../assets/data/expanded_questions.json"
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

// Main function to combine question files
async function combineQuestionFiles() {
  // Read the original questions file
  const originalQuestions = readJsonFile(originalQuestionsPath);
  if (!originalQuestions) return;

  // Read the expanded question files
  const eon1Questions = readJsonFile(eon1QuestionsPath);
  const eon2Questions = readJsonFile(eon2QuestionsPath);
  const eon3Questions = readJsonFile(eon3QuestionsPath);

  // Create the expanded questions structure
  const expandedQuestions = {
    eons: [
      {
        id: "eon1",
        questions: [
          // Start with original questions
          ...originalQuestions.eons[0].questions,
          // Add new questions
          ...(eon1Questions?.newEon1Questions || []),
        ],
      },
      {
        id: "eon2",
        questions: [
          // Start with original questions
          ...originalQuestions.eons[1].questions,
          // Add new questions
          ...(eon2Questions?.newEon2Questions || []),
        ],
      },
      {
        id: "eon3",
        questions: [
          // Start with original questions
          ...originalQuestions.eons[2].questions,
          // Add new questions
          ...(eon3Questions?.newEon3Questions || []),
        ],
      },
    ],
  };

  // Write the combined file
  try {
    fs.writeFileSync(
      outputPath,
      JSON.stringify(expandedQuestions, null, 2),
      "utf8"
    );
    console.log(
      `Successfully created expanded questions file at ${outputPath}`
    );
    console.log(
      `Eon 1: ${expandedQuestions.eons[0].questions.length} questions`
    );
    console.log(
      `Eon 2: ${expandedQuestions.eons[1].questions.length} questions`
    );
    console.log(
      `Eon 3: ${expandedQuestions.eons[2].questions.length} questions`
    );
  } catch (error) {
    console.error("Error writing expanded questions file:", error);
  }
}

// Run the main function
combineQuestionFiles();
