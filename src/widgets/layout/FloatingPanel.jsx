import React from "react";
import PropTypes from "prop-types";

/**
 * FloatingPanel - A reusable floating popup panel.
 * Props:
 *   open (bool): Whether the panel is visible.
 *   onClose (func): Function to call when closing the panel.
 *   title (string): Optional title for the panel.
 *   children (node): Content to display inside the panel.
 *   actions (node): Optional actions (e.g., buttons) at the bottom.
 */
export default function FloatingPanel({ open, onClose, title, children, actions, size = "md" }) {
  if (!open) return null;

  const sizeClass = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  }[size] || "max-w-xl";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className={`w-full ${sizeClass} mx-4 relative rounded-xl bg-white shadow-2xl animate-[fadeIn_150ms_ease-out] text-blue-gray-900`}
        style={{
          WebkitAnimationName: 'fadeIn',
        }}
      >
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        {title && (
          <div className="px-6 pt-6 pb-3 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-blue-gray-800">{title}</h2>
          </div>
        )}
        <div className="px-6 py-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>{children}</div>
        {actions && <div className="px-6 pb-5 border-t border-gray-100">{actions}</div>}
      </div>
    </div>
  );
}

FloatingPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
};
