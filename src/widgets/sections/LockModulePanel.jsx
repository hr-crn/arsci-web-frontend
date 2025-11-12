import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { Typography, Switch, Chip } from "@material-tailwind/react";
import FloatingPanel from "@/widgets/layout/FloatingPanel";
import { MODULE_IDS, fetchQuizResult } from "@/api/modules";
import { fetchSections } from "@/api/sections";

export default function LockModulePanel({ open, onClose, sectionName, sectionID }) {
  const [moduleStates, setModuleStates] = useState(() => (
    MODULE_IDS.reduce((acc, id) => {
      acc[id] = false;
      return acc;
    }, {})
  ));

  const formatSectionName = (name) =>
    name ? name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Section";

  const prettyModuleName = (id) =>
    (id || "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const title = useMemo(() => (
    `Module Access Control${sectionName ? ` • ${formatSectionName(sectionName)}` : ""}`
  ), [sectionName]);

  const handleToggle = (tag) => {
    setModuleStates(prev => ({
      ...prev,
      [tag]: !prev[tag],
    }));
  };

  const [moduleTitles, setModuleTitles] = useState({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!open) return;
      let sid = sectionID;
      if (!sid) {
        try {
          const secs = await fetchSections();
          sid = secs && secs.length > 0 ? secs[0].section : null;
        } catch (_) {
          sid = null;
        }
      }
      const fetchTitle = async (mid) => {
        try {
          if (sid) {
            const res = await fetchQuizResult(sid, mid);
            return res?.title || mid;
          }
        } catch (_) {}
        return mid;
      };
      const entries = await Promise.all(
        MODULE_IDS.map(async (mid) => [mid, await fetchTitle(mid)])
      );
      if (!cancelled) setModuleTitles(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [open, sectionID]);

  return (
    <FloatingPanel
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      }
      size="lg"
    >
      <div className="space-y-6">
        <div>
          <Typography variant="h6" color="blue-gray" className="font-bold">
            Available Learning Modules
          </Typography>
          <Typography variant="small" className="text-gray-600">
            Toggle module access for students in this section
          </Typography>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {MODULE_IDS.map((tag) => {
            const isEnabled = moduleStates[tag];
            return (
              <div
                key={tag}
                className={`rounded-lg border-2 p-4 shadow-sm transition-all duration-300 ${
                  isEnabled ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">📦</div>
                    <div>
                      <Typography variant="h6" color="blue-gray" className="font-bold mb-1">{moduleTitles[tag] || prettyModuleName(tag)}</Typography>
                      <Typography variant="small" className="text-gray-600">Learning Module</Typography>
                    </div>
                  </div>
                  <Chip
                    value={isEnabled ? "Unlocked" : "Locked"}
                    color={isEnabled ? "green" : "red"}
                    className="text-xs font-semibold"
                    icon={
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isEnabled ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        )}
                      </svg>
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`switch-${tag}`}
                      checked={isEnabled}
                      onChange={() => handleToggle(tag)}
                      color={isEnabled ? "green" : "red"}
                      className="h-full w-full checked:bg-green-500"
                    />
                    <Typography
                      variant="small"
                      className={`font-semibold ${isEnabled ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {isEnabled ? 'Accessible' : 'Restricted'}
                    </Typography>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <Typography variant="small" className="font-semibold text-blue-800 mb-1">
                Module Access Information
              </Typography>
              <Typography variant="small" className="text-blue-700">
                Students in <span className="font-semibold">{formatSectionName(sectionName)}</span> can only access modules that are unlocked. Locked modules will not appear in their dashboard. Changes take effect immediately.
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </FloatingPanel>
  );
}

LockModulePanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sectionName: PropTypes.string,
  sectionID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
