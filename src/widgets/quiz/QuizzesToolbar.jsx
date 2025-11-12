import React from "react";
import PropTypes from "prop-types";
import { Input } from "@material-tailwind/react";

export default function QuizzesToolbar({ searchQuery, setSearchQuery }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
      <div className="w-full md:w-80">
        <Input
          label="Search quizzes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
}

QuizzesToolbar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
};
