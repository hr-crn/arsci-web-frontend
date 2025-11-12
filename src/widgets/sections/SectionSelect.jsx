import React from "react";
import PropTypes from "prop-types";
// Refactored to a dependency-free custom dropdown to avoid stacking issues in modals

export default function SectionSelect({
  label,
  value,
  onChange,
  sections,
  loading,
  disabled,
  required,
  allowNone,
  noneLabel = "No section",
}) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef(null);
  const menuRef = React.useRef(null);

  const items = React.useMemo(() => {
    const base = sections || [];
    const normalized = base.map((s) => ({ section: String(s.section), sectionName: s.sectionName }));
    return allowNone ? [{ section: "", sectionName: noneLabel }, ...normalized] : normalized;
  }, [sections, allowNone, noneLabel]);

  const current = React.useMemo(() => {
    const v = String(value || "");
    return items.find((s) => String(s.section) === v) || null;
  }, [items, value]);

  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (btnRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const isDisabled = disabled || loading || (sections?.length ?? 0) === 0;

  return (
    <div className="relative z-[9999]">
      <button
        ref={btnRef}
        type="button"
        disabled={isDisabled}
        className={`relative w-full rounded-lg border bg-white py-2.5 pl-3 pr-9 text-left text-sm text-blue-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors ${
          isDisabled ? "border-blue-gray-100 text-blue-gray-300 cursor-not-allowed" : "border-blue-gray-200 hover:border-blue-400 focus:border-blue-500"
        }`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required || undefined}
      >
        <span className="block truncate">
          {loading ? (
            "Loading sections..."
          ) : current ? (
            current.sectionName
          ) : allowNone ? (
            noneLabel
          ) : (
            <>
              <span>Select section</span>
              {required && <span className="text-red-500">*</span>}
            </>
          )}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-blue-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
        </span>
      </button>
      {open && !isDisabled && (
        <ul
          ref={menuRef}
          role="listbox"
          className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-2xl ring-1 ring-black/5 border border-blue-gray-100 focus:outline-none z-[9999] list-none"
        >
          {items.length === 0 ? (
            <li className="px-3 py-2 text-blue-gray-400">No sections found. Please add a section first.</li>
          ) : (
            items.map((s) => {
              const isActive = String(s.section) === String(value || "");
              return (
                <li
                  key={String(s.section)}
                  role="option"
                  className={`cursor-pointer select-none py-2 pl-3 pr-3 ${isActive ? "bg-blue-50 text-blue-700" : "text-blue-gray-900 hover:bg-blue-50/60"}`}
                  onClick={() => {
                    onChange(String(s.section));
                    setOpen(false);
                  }}
                >
                  <span className={`block truncate ${isActive ? "font-semibold" : "font-normal"}`}>{s.sectionName}</span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

SectionSelect.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      section: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      sectionName: PropTypes.string.isRequired,
    })
  ),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  allowNone: PropTypes.bool,
  noneLabel: PropTypes.string,
};
