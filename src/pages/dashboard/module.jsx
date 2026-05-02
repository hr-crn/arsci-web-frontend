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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {MODULE_IDS.map((moduleID, index) => (
              <div 
                key={moduleID} 
                className="group relative bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Decorative Background Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-[100px] opacity-10 transition-opacity duration-300 group-hover:opacity-20 ${index % 2 === 0 ? 'bg-arsci-cyan-dark' : 'bg-arsci-pink'}`} />
                
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${index % 2 === 0 ? 'bg-gradient-to-br from-arsci-cyan to-blue-500' : 'bg-gradient-to-br from-arsci-pink to-arsci-purple'}`}>
                    <span className="text-2xl text-white">📖</span>
                  </div>
                  <Typography variant="h5" color="blue-gray" className="font-bold mb-1 group-hover:text-arsci-purple transition-colors">
                    {MODULE_META[moduleID] || moduleTitles[moduleID] || moduleID}
                  </Typography>
                  <Typography variant="small" className="text-gray-500 font-medium mb-8">
                    Learning Module
                  </Typography>
                </div>

                <button
                  className="relative z-10 w-full flex items-center justify-center gap-2 py-3.5 bg-gray-50 hover:bg-white text-gray-800 hover:text-arsci-purple rounded-xl font-semibold transition-all duration-300 border border-gray-200 hover:border-arsci-purple shadow-sm hover:shadow-md"
                  onClick={() => handleViewProgressPanel(moduleID)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  View Progress
                </button>
              </div>
            ))}
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
        <div className="p-2 sm:p-4">
          {/* Section filter dropdown */}
          {selectedModule && (
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex flex-col w-full sm:w-auto">
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Section</span>
                 <select
                   id="section-select"
                   className="bg-white border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-64 p-2.5 shadow-sm outline-none transition-shadow"
                   value={selectedSection}
                   onChange={handleSectionChange}
                 >
                   {sections.map(section => (
                     <option key={section.section} value={section.sectionName}>
                       {section.sectionName}
                     </option>
                   ))}
                 </select>
              </div>
            </div>
          )}
          {/* Progress list */}
          {selectedModule ? (
            loadingResults ? (
              <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border border-gray-100">
                <span className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4"></span>
                <p className="text-gray-600 font-medium">Fetching progress...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1 sm:pr-2" style={{ scrollbarWidth: 'thin' }}>
                {quizResults.length > 0 ? (
                  quizResults.map((r, idx) => {
                    const fullName = formatStudentName(r);
                    const initial = fullName.charAt(0).toUpperCase();
                    
                    // Parse progress number safely
                    let pct = 0;
                    if (typeof r.progress === 'number') {
                        pct = r.progress;
                    } else if (typeof r.status === 'string') {
                        const parsed = parseInt(r.status.replace('%', ''), 10);
                        if (!isNaN(parsed)) pct = parsed;
                    }

                    const isCompleted = pct === 100;
                    const isStarted = pct > 0;
                    
                    // Formatting Date
                    let dateStr = "—";
                    if (r.completedAt && r.completedAt !== "Not Completed Yet") {
                         dateStr = r.completedAt;
                    }

                    return (
                      <div key={r.username || r.name || idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow gap-4 sm:gap-0">
                        
                        {/* Avatar & Name */}
                        <div className="flex items-center gap-4 w-full sm:w-[35%]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0 ${idx % 2 === 0 ? 'bg-gradient-to-br from-arsci-cyan-dark to-blue-500' : 'bg-gradient-to-br from-arsci-pink to-arsci-purple'}`}>
                            {initial}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <Typography variant="small" className="font-semibold text-gray-800 truncate">
                              {fullName}
                            </Typography>
                            <Typography variant="small" className="text-xs text-gray-400 truncate">
                              @{r.username || r.name || "student"}
                            </Typography>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="w-full sm:w-[25%] flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-center">
                          <span className="sm:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                          <div className="flex flex-col items-end sm:items-start">
                            {isCompleted ? (
                               <>
                                 <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 rounded-full mb-1 inline-block">
                                   Completed
                                 </span>
                                 <span className="text-xs text-gray-500 font-medium">{dateStr}</span>
                               </>
                            ) : isStarted ? (
                               <>
                                 <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 rounded-full mb-1 inline-block">
                                   In Progress
                                 </span>
                                 <span className="text-xs text-gray-400 font-medium">—</span>
                               </>
                            ) : (
                               <>
                                 <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 rounded-full mb-1 inline-block">
                                   Not Started
                                 </span>
                                 <span className="text-xs text-gray-400 font-medium">—</span>
                               </>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full sm:w-[35%] flex flex-col justify-center">
                           <div className="flex justify-between items-end mb-1.5">
                             <Typography variant="small" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Progress</Typography>
                             <Typography variant="small" className={`font-bold text-sm ${isStarted ? 'text-arsci-purple' : 'text-gray-400'}`}>
                               {pct}%
                             </Typography>
                           </div>
                           <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                             <div 
                               className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-gradient-to-r from-arsci-pink to-arsci-purple' : isStarted ? 'bg-gradient-to-r from-arsci-cyan to-blue-500' : 'bg-gray-200'}`}
                               style={{ width: `${pct}%` }}
                             />
                           </div>
                        </div>

                      </div>
                    );
                  })
                ) : (
                   <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                     <span className="text-4xl mb-3">📭</span>
                     <Typography className="text-gray-500 font-medium">No students found in this section.</Typography>
                   </div>
                )}
              </div>
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