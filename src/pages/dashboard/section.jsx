import { Card, CardBody, Input } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import FloatingPanel from "@/widgets/layout/FloatingPanel";
import { fetchStudents, editStudent } from "@/api/students";
import { deleteSectionById, addSection, editSection } from "@/api/sections";
import { useAuth } from "@/context/AuthContext"; 
import { SectionForm, SectionsTable } from "@/widgets/sections";
import LockModulePanel from "@/widgets/sections/LockModulePanel";
import useSections from "@/hooks/useSections";
import { MODULE_IDS, fetchQuizResult } from "@/api/modules";
import { fetchQuizResults } from "@/api/quizResults";
import PageHeader from "@/widgets/layout/PageHeader";
import { ConfirmDialog, AlertMessage } from "@/widgets/alerts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function Sections() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showArchived, setShowArchived] = useState(false);
  const {
    sections,
    loading: sectionsLoading,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedSections,
    reloadSections,
  } = useSections(showArchived);

  // FloatingPanel state for Add/Edit
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState("add"); // "add" or "edit"
  const [sectionForm, setSectionForm] = useState({
    sectionName: "",
  });
  const [editingSectionID, setEditingSectionID] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, sectionID: null });
  const [alert, setAlert] = useState({ open: false, message: "", color: "blue" });

  // FloatingPanel for locking modules per section
  const [isLockPanelOpen, setIsLockPanelOpen] = useState(false);
  const [lockSectionName, setLockSectionName] = useState("");
  const [lockSectionID, setLockSectionID] = useState("");

  // Export PDF for a section: per-module quiz score and progress
  const handleExportPdf = async ({ section, sectionName }) => {
    setLoading(true);
    try {
      // Resolve module titles
      const titleMap = {};
      for (const mid of MODULE_IDS) {
        try {
          const meta = await fetchQuizResult(section, mid);
          titleMap[mid] = meta?.title || mid;
        } catch (_) {
          titleMap[mid] = mid;
        }
      }

      // Aggregate results per student
      const rowsByUser = new Map();
      for (const mid of MODULE_IDS) {
        try {
          const res = await fetchQuizResults(section, mid);
          const list = Array.isArray(res?.results) ? res.results : [];
          for (const r of list) {
            const username = r?.username || r?.userName || "";
            const name = r?.name || r?.studentName || username || "";
            if (!rowsByUser.has(username || name)) {
              rowsByUser.set(username || name, { Name: name, Username: username });
            }
            const keyProg = `${titleMap[mid]} Progress (%)`;
            const keyScore = `${titleMap[mid]} Score`;
            const row = rowsByUser.get(username || name);
            row[keyProg] = r?.progress ?? r?.progressPercent ?? r?.progress_percentage ?? "";
            row[keyScore] = r?.score ?? r?.points ?? r?.totalScore ?? r?.percentage ?? "";
          }
        } catch (_) {
          // continue
        }
      }

      // Build PDF using jsPDF + autoTable
      const headers = ["Name", "Username", ...MODULE_IDS.flatMap(mid => [`${titleMap[mid]} Progress (%)`, `${titleMap[mid]} Score`])];
      const rows = Array.from(rowsByUser.values()).sort((a,b) => String(a.Name).localeCompare(String(b.Name)));
      const body = rows.map(row => headers.map(h => row[h] ?? ""));

      const doc = new jsPDF({ orientation: headers.length > 8 ? "landscape" : "portrait", unit: "pt", format: "a4" });
      const title = `${sectionName} - Class Record`;
      const dateStr = new Date().toLocaleString();
      doc.setFontSize(14);
      doc.text(title, 40, 36);
      doc.setFontSize(10);
      doc.text(dateStr, 40, 52);

      // @ts-ignore - autoTable is injected by plugin
      autoTable(doc, {
        head: [headers],
        body,
        startY: 64,
        styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak", halign: "center", valign: "middle" },
        headStyles: { fillColor: [25, 118, 210], halign: "center", valign: "middle", textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          const pageSize = doc.internal.pageSize;
          const pageWidth = pageSize.getWidth();
          doc.setFontSize(9);
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth - 80, pageSize.getHeight() - 16);
        },
      });

      doc.save(`${sectionName.replace(/\s+/g, "_")}_class_record.pdf`);
    } finally {
      setLoading(false);
    }
  };

  // sections are loaded via useSections hook

  function handleDeleteSectionById(sectionID) {
    setConfirmDelete({ open: true, sectionID });
  }

  async function doDeleteSection() {
    const sectionID = confirmDelete.sectionID;
    setLoading(true);
    try {
      const success = await deleteSectionById(sectionID);
      if (success) {
        await reloadSections();
        // Best-effort: Nullify this section on any affected students so Students page shows them as unassigned
        try {
          const allStudents = await fetchStudents(user?.email);
          const affected = (allStudents || []).filter((s) => String(s.section) === String(sectionID));
          if (affected.length > 0) {
            await Promise.allSettled(
              affected.map((s) =>
                editStudent(s.studentID, {
                  name: s.studentName,
                  username: s.username,
                  userName: s.username,
                  sectionID: "",
                  email: user.email,
                })
              )
            );
          }
        } catch (e) {
          // Non-blocking; ignore
        }
        setAlert({ open: true, message: "Section deleted successfully.", color: "green" });
      } else {
        setAlert({ open: true, message: "Failed to delete section.", color: "red" });
      }
    } catch (e) {
      setAlert({ open: true, message: "An error occurred deleting the section.", color: "red" });
    } finally {
      setLoading(false);
      setConfirmDelete({ open: false, sectionID: null });
    }
  }

  const openAddSectionPanel = () => {
    setPanelMode("add");
    setSectionForm({
      sectionName: "",
    });
    setEditingSectionID(null);
    setIsPanelOpen(true);
  };

  const openEditSectionPanel = (section) => {
    setPanelMode("edit");
    setSectionForm({
      sectionName: section.sectionName,
    });
    setEditingSectionID(section.section);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setSectionForm({
      sectionName: "",
    });
    setEditingSectionID(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Convert sectionForm to API format
    const apiPayload = {
      ...sectionForm,
      email: user.email, // <-- Use teacher's email as partition key
      sectionName: sectionForm.sectionName, // API expects 'name'
    };

    if (panelMode === "add") {
      const success = await addSection(apiPayload);
      if (success) {
        await reloadSections();
        closePanel();
      }
    } else if (panelMode === "edit" && editingSectionID) {
      const success = await editSection(editingSectionID, apiPayload);
      if (success) {
        await reloadSections();
        closePanel();
      }
    }
    setLoading(false);
  };

  // Dummy handlers for menu actions
  const handleManageModule = ({ section, sectionName }) => {
    setLockSectionName(sectionName);
    setLockSectionID(section);
    setIsLockPanelOpen(true);
  };

  // Removed: per-section remove student actions

  // Archive / Unarchive section
  const handleArchiveSection = async ({ section, archived }) => {
    setLoading(true);
    try {
      const success = await editSection(section, { archived: !archived });
      if (success) {
        await reloadSections();
        setAlert({ open: true, message: archived ? 'Section unarchived.' : 'Section archived.', color: 'green' });
      } else {
        setAlert({ open: true, message: 'Failed to update archive state.', color: 'red' });
      }
    } catch (e) {
      setAlert({ open: true, message: 'An error occurred updating archive state.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-16 flex flex-col gap-10">
      <FloatingPanel
        open={isPanelOpen}
        onClose={closePanel}
        title={panelMode === "add" ? "Add Section" : "Edit Section"}
        actions={
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={closePanel}
            type="button"
            disabled={loading}
          >
            Close
          </button>
        }
      >
        <SectionForm
          sectionForm={sectionForm}
          setSectionForm={setSectionForm}
          panelMode={panelMode}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </FloatingPanel>
      <Card className="bg-white rounded-2xl border border-gray-100 shadow-lg">
        <PageHeader
          title="Sections"
          subtitle="Manage your class sections and view enrolled students"
          icon={(
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )}
        />
        <CardBody className="px-0 pt-4 pb-6">
          <div className="px-6 mb-4 flex flex-col md:flex-row items-start md:items-center gap-4 relative z-10">
            <div className="flex-1 w-full">
              <div className="relative">
                <input
                  className="w-full rounded-lg border bg-white py-2.5 pl-3 pr-3 text-sm text-blue-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-blue-gray-200 hover:border-blue-400 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder=""
                  aria-label="Search sections"
                />
                {(!searchQuery || searchQuery.length === 0) && (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-gray-500">
                    Search sections...
                  </span>
                )}
              </div>
            </div>
            <div className="w-full md:w-auto flex gap-3 items-center">
              <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={!!showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                Show archived
              </label>
              <button
                onClick={openAddSectionPanel}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors duration-200 hover:bg-blue-700"
                type="button"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Add Section</span>
              </button>
            </div>
          </div>
          <div className="px-6">
          <SectionsTable
            sections={paginatedSections}
            loading={loading || sectionsLoading}
            onExport={handleExportPdf}
            onEdit={openEditSectionPanel}
            onDelete={handleDeleteSectionById}
            onManageModule={handleManageModule}
            onArchive={handleArchiveSection}
          />
          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-2 w-full mt-4">
            <button
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="mx-2 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
          </div>
        </CardBody>
      </Card>

      {/* ViewStudentsPanel removed; replaced by CSV export action */}

      <LockModulePanel
        open={isLockPanelOpen}
        onClose={() => setIsLockPanelOpen(false)}
        sectionID={lockSectionID}
        sectionName={lockSectionName}
      />

      {/* Confirm delete section */}
      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete Section"
        message="Are you sure you want to delete this section? This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
        onConfirm={doDeleteSection}
        onCancel={() => setConfirmDelete({ open: false, sectionID: null })}
      />

      {/* Removed per-section remove student dialog */}

      {/* Toast Alerts */}
      {alert.open && (
        <AlertMessage
          message={alert.message}
          type={alert.color}
          onClose={() => setAlert({ ...alert, open: false })}
        />
      )}
    </div>
  );
}

export default Sections;