import React, { useState } from "react";
import PropTypes from "prop-types";
import { Typography } from "@material-tailwind/react";
import FloatingPanel from "@/widgets/layout/FloatingPanel";
import { fetchQuizResult, MODULE_IDS } from "@/api/modules";

export default function ViewStudentsPanel({ open, onClose, title, students, loading, sectionID, sectionName }) {
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    if (!sectionID) return;
    setExporting(true);
    try {
      // Fetch results per module
      const perModule = {};
      const moduleTitles = {};
      for (const mid of MODULE_IDS) {
        try {
          const res = await fetchQuizResult(sectionID, mid);
          moduleTitles[mid] = res?.title || mid;
          const map = new Map();
          for (const r of res?.results || []) {
            map.set(r.username, r);
          }
          perModule[mid] = map;
        } catch (e) {
          moduleTitles[mid] = mid;
          perModule[mid] = new Map();
        }
      }

      // Build CSV
      const headers = ["Name", "Username", "Section", ...MODULE_IDS.map((m) => moduleTitles[m])];
      const rows = students.map((s) => {
        const base = [s.studentName || "", s.username || "", sectionName || ""];
        const moduleVals = MODULE_IDS.map((m) => {
          const rec = perModule[m].get(s.username);
          if (!rec) return "quiz:not-started";
          if (rec.score === undefined || rec.score === null) {
            const st = (rec.status || "not-started").toString();
            return st === "not-started" ? "quiz:not-started" : st;
          }
          return rec.score;
        });
        return base.concat(moduleVals);
      });

      const csv = [headers.join(",")]
        .concat(
          rows.map((r) => r.map((v) => JSON.stringify(v ?? "")).join(","))
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `section_${sectionName || sectionID}_students_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <FloatingPanel
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            onClick={handleExportCsv}
            type="button"
            disabled={loading || exporting || !sectionID}
            title={!sectionID ? "Section ID missing" : "Export CSV"}
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={onClose}
            type="button"
            disabled={loading}
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4" />
            <Typography variant="small" className="text-gray-600">Loading students...</Typography>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <Typography variant="h6" className="text-gray-600 font-medium mb-2">No students in this section</Typography>
            <Typography variant="small" className="text-gray-500">Students will appear here once they are assigned to this section</Typography>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: "STUDENT NAME", icon: "👤" },
                      { key: "USERNAME", icon: "🏷️" },
                    ].map((col) => (
                      <th key={col.key} className="border-b border-gray-200 py-3 px-4 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{col.icon}</span>
                          <Typography variant="small" className="text-xs font-bold uppercase text-gray-600 tracking-wider">
                            {col.key}
                          </Typography>
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(({ studentID, studentName, username }, index) => (
                  <tr key={studentID || username} className={`hover:bg-blue-50/50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {studentName?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          {studentName}
                        </Typography>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">@</span>
                        <Typography className="text-sm font-medium text-gray-700">
                          {username}
                        </Typography>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </FloatingPanel>
  );
}

ViewStudentsPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  students: PropTypes.arrayOf(
    PropTypes.shape({
      studentName: PropTypes.string,
      username: PropTypes.string,
    })
  ).isRequired,
  loading: PropTypes.bool,
  onRemoveStudent: PropTypes.func,
  sectionID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sectionName: PropTypes.string.isRequired,
};
