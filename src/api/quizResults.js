// src/api/quizResults.js
import apiRequest from "./apiClient";

export async function fetchQuizResults(sectionID, moduleID) {
  return apiRequest(
    `/modules/quiz-result?sectionID=${sectionID}&moduleID=${moduleID}`,
    { method: "GET" }
  );
}
