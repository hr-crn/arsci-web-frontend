// src/api/studentsApi.js
import apiRequest from "./apiClient";

// Optional email filtering with robust fallback
export async function fetchSections(email, includeArchived = false) {
  let data = [];
  if (email) {
    const suffix = includeArchived ? `&includeArchived=true` : ``;
    const candidates = [
      `/sections?email=${encodeURIComponent(email)}${suffix}`,
      `/sections?userEmail=${encodeURIComponent(email)}${suffix}`,
      `/sections?teacherEmail=${encodeURIComponent(email)}${suffix}`,
    ];
    for (const ep of candidates) {
      try {
        const res = await apiRequest(ep);
        if (Array.isArray(res) && res.length > 0) {
          data = res;
          break;
        }
      } catch (e) {
        // try next
      }
    }
  }
  if (!Array.isArray(data) || data.length === 0) {
    const qs = includeArchived ? `?includeArchived=true` : ``;
    data = await apiRequest(`/sections${qs}`);
  }

  return data.map((section) => ({
    sectionName: section.sectionName,
    section: section.sectionID,
    archived: section.archived === true,
  }));
}

export async function deleteSectionById(sectionID) {
  return apiRequest(`/sections/${sectionID}`, { method: "DELETE" });
}

export async function addSection(sectionData) {
  return apiRequest("/sections", {
    method: "POST",
    body: JSON.stringify(sectionData),
  });
}

export async function editSection(sectionID, sectionData) {
  return apiRequest(`/sections/${sectionID}`, {
    method: "PUT",
    body: JSON.stringify(sectionData),
  });
}
