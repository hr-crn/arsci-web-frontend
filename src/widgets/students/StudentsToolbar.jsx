import React from "react";
import PropTypes from "prop-types";
import { Input } from "@material-tailwind/react";

export default function StudentsToolbar({
  searchQuery,
  setSearchQuery,
  showArchived,
  setShowArchived,
}) {
  return (
    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
      <div className="w-full md:w-80">
        <Input
          label="Search students..."
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
    </div>
  );
}

StudentsToolbar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  showArchived: PropTypes.bool,
  setShowArchived: PropTypes.func,
};
