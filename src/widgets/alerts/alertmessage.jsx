import React, { useEffect, useState } from "react";
import { Alert } from "@material-tailwind/react";

export default function AlertMessage({ message, type = "blue", onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 500); // Wait for fade-out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <Alert
        color={type}
        variant="filled"
        className="shadow-lg rounded-lg px-6 py-3 text-base max-w-xs text-center"
        onClick={onClose}
      >
        {message}
      </Alert>
    </div>
  );
}
