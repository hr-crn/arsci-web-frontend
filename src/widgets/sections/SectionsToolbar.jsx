import React from "react";
import PropTypes from "prop-types";
import { Input, Tooltip } from "@material-tailwind/react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

export default function SectionsToolbar({ searchQuery, setSearchQuery, onAdd, showArchived, setShowArchived }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
      <div className="w-full md:w-80">
        <Input
          label="Search sections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="rounded border-gray-300"
          checked={!!showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
        />
        Show archived
      </label>
      <Tooltip content="Add New Section">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors duration-200 hover:bg-blue-700"
        >
          <PlusCircleIcon className="h-5 w-5" />
          <span className="font-medium">Add Section</span>
        </button>
      </Tooltip>
    </div>
  );
}

SectionsToolbar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  showArchived: PropTypes.bool,
  setShowArchived: PropTypes.func,
};
