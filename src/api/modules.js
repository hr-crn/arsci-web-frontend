// src/api/modules.js
import apiRequest from "./apiClient";

// Valid module IDs known by backend
export const MODULE_IDS = ["mod1", "mod2", "mod3", "mod4"];

export async function fetchQuizResult(sectionID, moduleID) {
  if (!sectionID || !moduleID) throw new Error("sectionID and moduleID are required");
  const qs = `?sectionID=${encodeURIComponent(sectionID)}&moduleID=${encodeURIComponent(moduleID)}`;
  return apiRequest(`/modules/quiz-result${qs}`);
}
