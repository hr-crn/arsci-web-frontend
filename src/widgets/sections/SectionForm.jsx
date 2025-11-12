import React from "react";
import PropTypes from "prop-types";

export default function SectionForm({ sectionForm, setSectionForm, panelMode, loading, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="font-medium text-gray-700">
        Section Name
        <input
          type="text"
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={sectionForm.sectionName}
          onChange={(e) => setSectionForm((prev) => ({ ...prev, sectionName: e.target.value }))}
          placeholder="Enter section name"
          required
          disabled={loading}
        />
      </label>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 self-end"
        disabled={loading}
      >
        {loading
          ? panelMode === "add"
            ? "Adding..."
            : "Saving..."
          : panelMode === "add"
          ? "Add Section"
          : "Save Changes"}
      </button>
    </form>
  );
}

SectionForm.propTypes = {
  sectionForm: PropTypes.shape({ sectionName: PropTypes.string.isRequired }).isRequired,
  setSectionForm: PropTypes.func.isRequired,
  panelMode: PropTypes.oneOf(["add", "edit"]).isRequired,
  loading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
};
