import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchStudents } from "@/api/students";
import { fetchSections } from "@/api/sections";
import { useAuth } from "@/context/AuthContext";

export default function useStudents(includeArchived = false) {
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const reload = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const [studentsData, sectionsData] = await Promise.all([
        fetchStudents(user.email, includeArchived),
        fetchSections(user.email, includeArchived),
      ]);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setSections(Array.isArray(sectionsData) ? sectionsData : []);
    } catch (e) {
      setStudents([]);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email, includeArchived]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return students.filter((s) => {
      const sectionObj = sections.find((sec) => sec.section === s.section);
      const sectionName = sectionObj?.sectionName || s.section || "";
      
      // Apply section filter if selected
      if (selectedSection && s.section !== selectedSection) {
        return false;
      }
      
      return (
        (s.studentName || "").toLowerCase().includes(q) ||
        (s.username || "").toLowerCase().includes(q) ||
        sectionName.toLowerCase().includes(q)
      );
    });
  }, [students, sections, searchQuery, selectedSection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSection]);

  return {
    students,
    sections,
    loading,
    searchQuery,
    setSearchQuery,
    selectedSection,
    setSelectedSection,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedStudents: paginated,
    reload,
    setStudents,
    setSections,
  };
}