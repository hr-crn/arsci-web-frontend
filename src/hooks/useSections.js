import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchSections } from "@/api/sections";
import { useAuth } from "@/context/AuthContext";

export default function useSections(includeArchived = false) {
  const { user } = useAuth();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const sectionsPerPage = 10;

  const reloadSections = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const data = await fetchSections(user.email, includeArchived);
      setSections(data);
    } catch (e) {
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email, includeArchived]);

  useEffect(() => {
    reloadSections();
  }, [reloadSections]);

  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return sections.filter((s) => s.sectionName.toLowerCase().includes(q));
  }, [sections, searchQuery]);

  const totalPages = Math.ceil(filteredSections.length / sectionsPerPage) || 1;
  const paginatedSections = useMemo(() => {
    const start = (currentPage - 1) * sectionsPerPage;
    return filteredSections.slice(start, start + sectionsPerPage);
  }, [filteredSections, currentPage]);

  // When search query changes, reset to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return {
    sections,
    loading,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedSections,
    reloadSections,
    setSections, // expose setter for advanced cases
  };
}
