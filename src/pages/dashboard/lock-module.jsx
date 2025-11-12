import {
  Card,
  CardBody,
  CardFooter,
  Typography,
  Switch,
  Chip,
} from "@material-tailwind/react";
import { MODULE_IDS } from "@/api/modules";
import PageHeader from "@/widgets/layout/PageHeader";
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
const LockModule = () => {
  const { sectionName } = useParams();
  const navigate = useNavigate();
  const [moduleStates, setModuleStates] = useState(
    MODULE_IDS.reduce((acc, id) => {
      acc[id] = false;
      return acc;
    }, {})
  );

  const formatSectionName = (name) =>
    name ? name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Section";

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-16 flex flex-col gap-10">
      <Card className="shadow-xl border-0 bg-white">
        <PageHeader
          title="Module Access Control"
          subtitle={`Manage module availability for ${formatSectionName(sectionName)}`}
          icon={(
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM18 7a4 4 0 00-8 0v4h8V7z" />
            </svg>
          )}
        />
        <CardBody className="px-6 pt-0 pb-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => navigate('/dashboard/section')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Sections
            </button>
          </div>
          <div className="mb-6">
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
                <Card 
                  key={tag} 
                  className={`shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                    isEnabled 
                      ? 'border-green-200 bg-green-50/30' 
                      : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  <CardBody className="py-4 px-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">📦</div>
                        <div>
                          <Typography variant="h6" color="blue-gray" className="font-bold mb-1">{tag}</Typography>
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
                  </CardBody>
                  
                  <CardFooter className="pt-0 px-4 pb-4">
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
                          className={`font-semibold ${
                            isEnabled ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isEnabled ? 'Accessible' : 'Restricted'}
                        </Typography>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        isEnabled ? 'bg-green-500' : 'bg-red-500'
                      } animate-pulse`}></div>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <Typography variant="small" className="font-semibold text-blue-800 mb-1">
                  Module Access Information
                </Typography>
                <Typography variant="small" className="text-blue-700">
                  Students in <span className="font-semibold">{formatSectionName(sectionName)}</span> can only access modules that are unlocked. 
                  Locked modules will not appear in their dashboard. Changes take effect immediately.
                </Typography>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export { LockModule };
export default LockModule;