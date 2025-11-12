// src/api/studentsApi.js
import apiRequest from "./apiClient";

export async function fetchStudents(email, includeArchived = false) {
  // Robust fetching: try multiple query keys then fall back to all
  const suffix = includeArchived ? `&includeArchived=true` : ``;
  const candidates = email
    ? [
        `/students?email=${encodeURIComponent(email)}${suffix}`,
        `/students?userEmail=${encodeURIComponent(email)}${suffix}`,
        `/students?teacherEmail=${encodeURIComponent(email)}${suffix}`,
      ]
    : [];
  let data = [];
  for (const ep of candidates) {
    try {
      const res = await apiRequest(ep);
      if (Array.isArray(res) && res.length > 0) {
        data = res;
        break;
      }
    } catch (e) {
      // continue to next candidate
    }
  }
  if (!Array.isArray(data) || data.length === 0) {
    try {
      const qs = includeArchived ? `?includeArchived=true` : ``;
      data = await apiRequest(`/students${qs}`);
    } catch (e) {
      data = [];
    }
  }

  return data.map((student) => ({
    firstName: student.firstName || "",
    lastName: student.lastName || "",
    middleName: student.middleName || "",
    username: student.username || student.userName,
    password: student.password,
    // If the section was deleted server-side without cascading, this may be missing.
    // Default to empty string so the UI can render as "No section" instead of the raw deleted ID.
    section: student.sectionID ?? "",
    // Ensure we always have a stable identifier for React keys and operations
    studentID: student.studentID || student.id || student._id || student.username || student.userName,
    // Preserve original backend id (if any) for write operations
    apiId: student.studentID || student.id || student._id || null,
    // Archived status (support common backend field names)
    archived: Boolean(student.archived ?? student.isArchived ?? student.status === "archived"),
  }));
}

export async function deleteStudentById(studentID) {
  return apiRequest(`/students/${studentID}`, { method: "DELETE" });
}

// Prefer deletion by username (DynamoDB partition key), but try multiple patterns
export async function deleteStudent({ username, studentID }) {
  const attempts = [];
  if (username) {
    attempts.push(`/students/${encodeURIComponent(username)}`); // DELETE /students/{username}
    attempts.push(`/students?username=${encodeURIComponent(username)}`); // DELETE /students?username=...
    attempts.push(`/students/username/${encodeURIComponent(username)}`); // DELETE /students/username/{username}
  }
  if (studentID) {
    attempts.push(`/students/${encodeURIComponent(studentID)}`); // Fallback: DELETE /students/{studentID}
  }

  let lastError;
  for (const ep of attempts) {
    try {
      const res = await apiRequest(ep, { method: "DELETE" });
      return res; // truthy on success
    } catch (e) {
      lastError = e;
      // try next endpoint pattern
    }
  }
  // If all attempts failed, rethrow last error for caller to handle
  throw lastError || new Error("Delete student failed: no valid endpoint succeeded");
}

export async function addStudent(studentData) {
  return apiRequest("/students", {
    method: "POST",
    body: JSON.stringify(studentData),
  });
}

export async function editStudent(studentID, studentData) {
  // Some backends use username as the partition key. Try multiple endpoint patterns.
  const attempts = [];
  if (studentID) {
    attempts.push(`/students/${encodeURIComponent(studentID)}`); // PUT /students/{studentID}
  }
  if (studentData?.username) {
    attempts.push(`/students/${encodeURIComponent(studentData.username)}`); // PUT /students/{username}
    attempts.push(`/students/username/${encodeURIComponent(studentData.username)}`); // PUT /students/username/{username}
    attempts.push(`/students?username=${encodeURIComponent(studentData.username)}`); // PUT /students?username=...
  }

  let lastError;
  for (const ep of attempts) {
    try {
      const res = await apiRequest(ep, {
        method: "PUT",
        body: JSON.stringify(studentData),
      });
      return res;
    } catch (e) {
      lastError = e;
      // try next
    }
  }
  // As a final fallback, try base endpoint if none attempted
  try {
    return await apiRequest(`/students/${encodeURIComponent(studentID)}`, {
      method: "PUT",
      body: JSON.stringify(studentData),
    });
  } catch (e) {
    throw lastError || e;
  }
}
