import {
  Card,
  CardBody,
  Typography,
} from "@material-tailwind/react";
import { MODULE_IDS } from "@/api/modules";
import FloatingPanel from "@/widgets/layout/FloatingPanel";
import PageHeader from "@/widgets/layout/PageHeader";
import { fetchSections } from "@/api/sections";
import { fetchQuizResult } from "@/api/modules";
import { fetchQuizResults } from "@/api/quizResults";
import React, { useState } from "react";
import { MODULE_META } from "@/data/module-meta";

export function Module() {

  // FloatingPanel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null); // stores moduleID
  const [selectedSection, setSelectedSection] = useState("");
  const [sections, setSections] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [quizResults, setQuizResults] = useState([]);
  const [moduleTitles, setModuleTitles] = useState({});

  // Helper function to format student full name
  const formatStudentName = (student) => {
    const first = student?.firstName || "";
    const middle = student?.middleName || "";
    const last = student?.lastName || "";
    
    if (!first && !middle && !last) {
      return student?.name || student?.username || "Unknown";
    }
    
    return [first, middle, last].filter(Boolean).join(" ").trim() || "Unknown";
  };

  React.useEffect(() => {
    // Preload module titles using the first available section
    (async () => {
      try {
        const secs = await fetchSections();
        const sid = secs && secs.length > 0 ? secs[0].section : null;
        if (!sid) return;
        const map = {};
        for (const mid of MODULE_IDS) {
          try {
            const res = await fetchQuizResult(sid, mid);
            map[mid] = res?.title || mid;
          } catch (_) {
            map[mid] = mid;
          }
        }
        setModuleTitles(map);
      } catch (_) {
        // ignore
      }
    })();
  }, []);

  // Open FloatingPanel with selected module
  const handleViewProgressPanel = async (moduleID) => {
    setSelectedModule(moduleID);
    setPanelOpen(true);
    try {
      const fetched = await fetchSections();
      setSections(fetched);
      if (fetched && fetched.length > 0) {
        const first = fetched[0];
        setSelectedSection(first.sectionName || "");
        // fetch initial results for first section
        setLoadingResults(true);
        try {
          const res = await fetchQuizResults(first.section, moduleID);
          // Map roster to temporary module progress data (decoupled from quiz)
          const roster = Array.isArray(res?.results) ? res.results : [];
          const tempProgress = roster.map((r) => ({
            firstName: r?.firstName || "",
            middleName: r?.middleName || "",
            lastName: r?.lastName || "",
            name: r?.name || "",
            startedAt: r?.progressCompleted,
            status: `${r?.progress}%`,
            completedAt: r?.progressCompleted,
            username: r?.username || undefined,
          }));
          setQuizResults(tempProgress);
        } finally {
          setLoadingResults(false);
        }
      } else {
        setSelectedSection("");
        setQuizResults([]);
      }
    } catch (e) {
      setSections([]);
      setSelectedSection("");
      setQuizResults([]);
    }
  };

  const handleSectionChange = async (e) => {
    const sectionName = e.target.value;
    setSelectedSection(sectionName);
    const sectionObj = sections.find((s) => s.sectionName === sectionName);
    if (!sectionObj || !selectedModule) return;
    setLoadingResults(true);
    try {
      const res = await fetchQuizResults(sectionObj.section, selectedModule);
      // Map roster to temporary module progress data (decoupled from quiz)
      const roster = Array.isArray(res?.results) ? res.results : [];
      const tempProgress = roster.map((r) => ({
        firstName: r?.firstName || "",
        middleName: r?.middleName || "",
        lastName: r?.lastName || "",
        name: r?.name || "",
        startedAt: r?.progressCompleted,
        status: `${r?.progress}%`,
        completedAt: r?.progressCompleted,
        username: r?.username || undefined,
      }));
      setQuizResults(tempProgress);
    } finally {
      setLoadingResults(false);
    }
  };


  return (
    <div className="max-w-5xl mx-auto mt-10 mb-16 flex flex-col gap-10">
      <Card className="shadow-xl border-0 bg-white">
        <PageHeader
          title="Module Progress"
          subtitle="Track student progress across learning modules"
          icon={(
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          )}
        />
        <CardBody className="px-6 pt-0 pb-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: "MODULE NAME", icon: "📚" },
                      { key: "ACTIONS", icon: "⚙️" }
                    ].map((col) => (
                      <th
                        key={col.key}
                        className="border-b border-gray-200 py-4 px-6 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{col.icon}</span>
                          <Typography
                            variant="small"
                            className="text-xs font-bold uppercase text-gray-600 tracking-wider"
                          >
                            {col.key}
                          </Typography>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MODULE_IDS.map((moduleID, index) => (
                    <tr key={moduleID} className={`hover:bg-blue-50/50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">📖</span>
                          </div>
                          <div>
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-semibold text-base"
                            >
                              {MODULE_META[moduleID] || moduleTitles[moduleID] || moduleID}
                            </Typography>
                            <Typography variant="small" className="text-gray-500 text-sm">
                              Learning Module
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200 text-sm font-medium"
                          onClick={() => handleViewProgressPanel(moduleID)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          View Progress
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardBody>
      </Card>
      {/* FloatingPanel for viewing module progress by student, with section filter */}
      <FloatingPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={selectedModule ? `Progress for ${MODULE_META[selectedModule] || moduleTitles[selectedModule] || selectedModule}` : "Progress"}
        actions={
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => setPanelOpen(false)}
            type="button"
          >
            Close
          </button>
        }
      >
        <div className="p-4">
          {/* Section filter (no 'All Sections' option) */}
          {selectedModule && (
            <div className="mb-4">
              <label htmlFor="section-select" className="block mb-1 font-medium">Filter by Section:</label>
              <select
                id="section-select"
                className="border rounded px-2 py-1"
                value={selectedSection}
                onChange={handleSectionChange}
              >
                {sections.map(section => (
                  <option key={section.section} value={section.sectionName}>{section.sectionName}</option>
                ))}
              </select>
            </div>
          )}
          {/* Progress table (temporary module progress; decoupled from quiz) */}
          {selectedModule ? (
            loadingResults ? (
              <div className="text-center py-8">
                <span className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></span>
                <p className="mt-2 text-gray-600">Loading results...</p>
              </div>
            ) : (
              <table className="w-full table-auto border mt-2">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 text-left">Student Name</th>
                    <th className="border px-2 py-1 text-left">Progress (%)</th>
                    <th className="border px-2 py-1 text-left">Completed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {quizResults.length > 0 ? (
                    quizResults.map((r) => (
                      <tr key={r.username || r.name}>
                        <td className="border px-2 py-1">{formatStudentName(r)}</td>
                        <td className="border px-2 py-1">{r.status || "not-started"}</td>
                        <td className="border px-2 py-1">{r.completedAt}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-2">No results found for this selection.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )
          ) : (
            <Typography>No module selected.</Typography>
          )}
        </div>
      </FloatingPanel>
    </div>
  );
}

export default Module;