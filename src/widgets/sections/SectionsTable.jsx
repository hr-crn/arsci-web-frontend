import React from "react";
import PropTypes from "prop-types";
import { Typography, Tooltip } from "@material-tailwind/react";
import { ArrowDownTrayIcon, PencilSquareIcon, LockClosedIcon, ArchiveBoxIcon, ArchiveBoxXMarkIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function SectionsTable({
  sections,
  loading,
  onExport,
  onEdit,
  onDelete,
  onManageModule,
  onAddNew,
  onArchive,
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full min-w-[640px] table-auto">
          <thead className="bg-gray-50">
            <tr>
              {[
                { key: "SECTIONS", icon: "" },
                { key: "STATUS", icon: "" },
                { key: "ACTIONS", icon: "" },
              ].map((col) => (
                <th key={col.key} className="border-b border-gray-200 py-3 px-6 text-center">
                  <Typography variant="small" className="text-xs font-bold uppercase text-gray-600 tracking-wider">
                    {col.key}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={3} className="py-6 px-6 text-center text-sm text-gray-500">
                  Loading sections...
                </td>
              </tr>
            )}
            {!loading && sections.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 px-6 text-center text-sm text-gray-500">
                  No sections found.
                </td>
              </tr>
            )}
            {!loading && sections.map(({ section, sectionName, archived }, index) => (
              <tr key={section} className={`hover:bg-blue-50/50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} ${archived ? 'opacity-60' : ''}`}>
                <td className="py-4 px-6 text-center">
                  <div>
                    <Typography variant="small" color="blue-gray" className="font-semibold text-base">
                      {sectionName}
                    </Typography>
                    {/* Section ID hidden intentionally */}
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  {archived ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">Archived</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">Active</span>
                  )}
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Tooltip content="Export PDF (class record)">
                      <button
                        className={`p-2 rounded-lg ${loading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                        onClick={() => onExport({ section, sectionName })}
                        disabled={loading}
                        aria-label="Export PDF"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Edit section">
                      <button
                        className={`p-2 rounded-lg ${archived ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => { if (!archived) onEdit({ section, sectionName }); }}
                        disabled={archived}
                        aria-label="Edit section"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                    </Tooltip>
                    <Tooltip content={archived ? "Unarchive" : "Archive"}>
                      <button
                        className="p-2 rounded-lg text-yellow-700 hover:bg-yellow-50"
                        onClick={() => onArchive({ section, sectionName, archived })}
                        aria-label="Archive/unarchive"
                      >
                        {archived ? (
                          <ArchiveBoxXMarkIcon className="h-5 w-5" />
                        ) : (
                          <ArchiveBoxIcon className="h-5 w-5" />
                        )}
                      </button>
                    </Tooltip>
                    <Tooltip content="Delete section">
                      <button
                        className={`p-2 rounded-lg ${archived ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                        onClick={() => { if (!archived) onDelete(section); }}
                        disabled={archived}
                        aria-label="Delete section"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
}

SectionsTable.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      section: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      sectionName: PropTypes.string,
      archived: PropTypes.bool,
    })
  ).isRequired,
  loading: PropTypes.bool,
  onExport: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onManageModule: PropTypes.func.isRequired,
  onAddNew: PropTypes.func,
  onArchive: PropTypes.func.isRequired,
};
