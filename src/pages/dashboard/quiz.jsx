import {
  Card,
  CardBody,
  Typography,
} from "@material-tailwind/react";
import { MODULE_IDS, fetchQuizResult } from "@/api/modules";
// import sectionData from "@/data/section-data";
import { fetchSections } from "@/api/sections";
import FloatingPanel from "@/widgets/layout/FloatingPanel";
import React from "react";
import { fetchQuizResults } from "@/api/quizResults";
import { useToast } from "@/context/ToastContext";
import PageHeader from "@/widgets/layout/PageHeader";
import { MODULE_META } from "@/data/module-meta";

export function Quiz() {
  const { showToast } = useToast();
  // State for FloatingPanel
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [selectedQuiz, setSelectedQuiz] = React.useState(null);

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

  // State for section filter and fetched sections
  const [selectedSection, setSelectedSection] = React.useState("");
  const [sections, setSections] = React.useState([]);

  // Helper function to create a URL-friendly slug from the quiz name
  const getQuizSlug = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-');
  };

  const [loadingResults, setLoadingResults] = React.useState(false);

  const [quizResults, setQuizResults] = React.useState([]);
  const quizList = React.useMemo(() => MODULE_IDS.map((id) => ({ quizName: id, moduleID: id })), []);
  const [moduleTitles, setModuleTitles] = React.useState({});

  React.useEffect(() => {
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

  // Helper: format timestamps
  const formatUpdated = (r) => {
    const raw = r?.updatedAt || r?.updated_at || r?.lastUpdated || r?.completedAt || r?.syntheticUpdatedAt || r?.timestamp || null;
    if (!raw) return "—";
    let dt;
    // Handle Firestore-like {seconds}, numeric (seconds/ms), and ISO strings
    if (typeof raw === "object" && raw !== null && typeof raw.seconds === "number") {
      dt = new Date(raw.seconds * 1000);
    } else if (typeof raw === "number") {
      dt = new Date(raw > 1e12 ? raw : raw * 1000);
    } else if (typeof raw === "string" && /^\d+(\.\d+)?$/.test(raw)) {
      const n = parseFloat(raw);
      dt = new Date(n > 1e12 ? n : n * 1000);
    } else {
      dt = new Date(raw);
    }
    if (isNaN(dt.getTime())) return String(raw);
    return dt.toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(',', '');
  };

  // Helper: synthesize local timestamps for completed scores when API has none
  const applySyntheticTimestamps = (list, sectionID, moduleID) => {
    if (!Array.isArray(list)) return [];
    const nowMs = Date.now();
    const hasAnyTimestamp = (r) => (
      r?.updatedAt || r?.updated_at || r?.lastUpdated || r?.completedAt || r?.progressCompleted || r?.timestamp
    );
    const safeGet = (k) => {
      try { return localStorage.getItem(k); } catch (_) { return null; }
    };
    const safeSet = (k, v) => {
      try { localStorage.setItem(k, v); } catch (_) {}
    };
    return list.map((r) => {
      let synthetic = null;
      if (r?.status === "completed" && !hasAnyTimestamp(r)) {
        const key = `scoreSeenAt:${sectionID}:${moduleID}:${r?.username || r?.name || "unknown"}`;
        const existing = safeGet(key);
        if (existing) {
          synthetic = Number(existing);
        } else {
          synthetic = nowMs;
          safeSet(key, String(nowMs));
        }
      }
      return synthetic ? { ...r, syntheticUpdatedAt: synthetic } : r;
    });
  };


  // Open FloatingPanel with selected quiz
  const handleViewScores = async (quizName, moduleID) => {
    setSelectedQuiz(quizName);
    setPanelOpen(true);

    try {
      const fetchedSections = await fetchSections();
      setSections(fetchedSections);

      if (fetchedSections.length > 0) {
        const firstSection = fetchedSections[0];
        setSelectedSection(firstSection.sectionName);
      
      // fetch results with apiClient
      setLoadingResults(true);
      try{
      const resultData = await fetchQuizResults(firstSection.section, moduleID);
      if (resultData && resultData.results) {
        setQuizResults(applySyntheticTimestamps(resultData.results, firstSection.section, moduleID));
      } else {
        setQuizResults([]);
      }
      }finally {
  setLoadingResults(false);
}
      
    }
  } catch (err) {
    console.error(err);
    showToast("Failed to load sections for quiz.", "red");
    setSections([]);
    setQuizResults([]);
  }
};

  const handleSectionChange = async (e, moduleID) => {
    const sectionName = e.target.value;
    setSelectedSection(sectionName);

    const sectionObj = sections.find(s => s.sectionName === sectionName);
    if (sectionObj) {
      try {
        const resultData = await fetchQuizResults(sectionObj.section, moduleID);
        if (resultData && resultData.results) {
          setQuizResults(applySyntheticTimestamps(resultData.results, sectionObj.section, moduleID));
        } else {
          setQuizResults([]);
        }
      } catch (e) {
        showToast("Failed to load quiz results for the selected section.", "red");
        setQuizResults([]);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-16 flex flex-col gap-10">
      {/* Search bar removed per request */}
      <Card className="shadow-xl border-0 bg-white">
        <PageHeader
          title="Quiz Progress"
          subtitle="Monitor student quiz performance and progress"
          icon={(
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                      { key: "QUIZ NAME", icon: "📝" },
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
                  {quizList.map(({ quizName, moduleID }, index) => (
                    <tr key={quizName} className={`hover:bg-blue-50/50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">📝</span>
                          </div>
                          <div>
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-semibold text-base"
                            >
                              {MODULE_META[moduleID] || moduleTitles[moduleID] || quizName}
                            </Typography>
                            <Typography variant="small" className="text-gray-500 text-sm">
                              Quiz Assessment
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200 text-sm font-medium"
                          onClick={() => handleViewScores(quizName, moduleID)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          View Scores
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
      {/* FloatingPanel for viewing scores */}
      <FloatingPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={selectedQuiz ? `Scores for ${MODULE_META[selectedQuiz] || moduleTitles[selectedQuiz] || selectedQuiz}` : "Scores"}
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
          {/* Section filter dropdown */}
          {selectedQuiz && (
            <div className="mb-4">
              <label htmlFor="section-select" className="block mb-1 font-medium">Filter by Section:</label>
              <select
                id="section-select"
                className="border rounded px-2 py-1"
                value={selectedSection}
                onChange={e => handleSectionChange(e, quizList.find(q => q.quizName === selectedQuiz)?.moduleID)}
              >
                {sections.map(section => (
                  <option key={section.section} value={section.sectionName}>
                    {section.sectionName}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Scores table */}
          {selectedQuiz ? (
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
                    <th className="border px-2 py-1 text-left">Updated At</th>
                    <th className="border px-2 py-1 text-left">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {quizResults.length > 0 ? (
                    quizResults.map(r => (
                      <tr key={r.username}>
                        <td className="border px-2 py-1">{formatStudentName(r)}</td>
                        <td className="border px-2 py-1">{formatUpdated(r)}</td>
                        <td className="border px-2 py-1">
                          {r.status === "completed" ? r.score : "Not Started"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-2">
                        No scores found for this selection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )
          ) : (
            <Typography>No quiz selected.</Typography>
          )}
        </div>
      </FloatingPanel>
    </div>
  );
}

export default Quiz;