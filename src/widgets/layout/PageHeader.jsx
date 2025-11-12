import React from "react";
import PropTypes from "prop-types";
import { CardHeader, Typography } from "@material-tailwind/react";

export default function PageHeader({ title, subtitle, icon }) {
  return (
    <CardHeader variant="gradient" className="mb-6 p-8 bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          {icon}
        </div>
        <div>
          <Typography variant="h4" color="white" className="font-bold">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="small" color="white" className="opacity-80 font-normal">
              {subtitle}
            </Typography>
          )}
        </div>
      </div>
    </CardHeader>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.node,
  icon: PropTypes.node,
};
