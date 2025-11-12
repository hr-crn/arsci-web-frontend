// src/api/studentsApi.js
import apiRequest from "./apiClient";

export async function fetchTeacherByEmail(email) {
  const teacher = await apiRequest(`/teachers/${email}`);
  return {
    email: teacher.email,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
  };
}

export async function editTeacher(email, teacherData) {
  return apiRequest(`/teachers/${email}`, {
    method: "PUT",
    body: JSON.stringify(teacherData),
  });
}
