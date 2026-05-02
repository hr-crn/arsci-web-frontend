import React, { useEffect, useState } from "react";
import { StatisticsCard } from "@/widgets/cards";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import PageHeader from "@/widgets/layout/PageHeader";
import { UsersIcon, SwatchIcon, ArrowDownOnSquareStackIcon } from "@heroicons/react/24/solid";
import { fetchStudents } from "@/api/students";
import { fetchSections } from "@/api/sections";
import { useAuth } from "@/context/AuthContext";
import { MODULE_IDS } from "@/api/modules";
import { fetchQuizResults } from "@/api/quizResults";
import { useNavigate } from "react-router-dom";

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studentCount, setStudentCount] = useState(null);
  const [sectionCount, setSectionCount] = useState(null);
  const [avgQuizScore, setAvgQuizScore] = useState(null);
  const [avgProgress, setAvgProgress] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [students, sections] = await Promise.all([
          fetchStudents(),
          fetchSections(),
        ]);
        setStudentCount(Array.isArray(students) ? students.length : 0);
        setSectionCount(Array.isArray(sections) ? sections.length : 0);

        // Defaults: last 7 days, aggregate across all sections/modules
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Aggregates
        let progressSum = 0;
        let progressN = 0;
        let scoreSum = 0;
        let scoreN = 0;

        // Fetch per section/module results (best-effort; ignore failures)
        for (const sec of sections || []) {
          for (const mid of MODULE_IDS) {
            try {
              const res = await fetchQuizResults(sec.section, mid);
              const list = Array.isArray(res?.results) ? res.results : [];
              for (const r of list) {
                const dt = new Date(r?.submittedAt || r?.completedAt || r?.progressCompleted || 0);
                const inWindow = dt instanceof Date && !isNaN(dt) && dt >= sevenDaysAgo;
                if (typeof r?.progress === "number") {
                  progressSum += r.progress;
                  progressN += 1;
                } else if (typeof r?.progressPercent === "number") {
                  progressSum += r.progressPercent;
                  progressN += 1;
                }
                if (inWindow) {
                  // Prefer percentage-like fields
                  let scoreVal = null;
                  if (typeof r?.percentage === "number") scoreVal = r.percentage;
                  else if (typeof r?.score === "number") scoreVal = r.score;
                  else if (typeof r?.points === "number" && r?.totalPoints) {
                    const pct = (r.points / r.totalPoints) * 100;
                    if (isFinite(pct)) scoreVal = pct;
                  }
                  if (typeof scoreVal === "number") {
                    // Clamp to [0,100] to avoid outliers
                    const clamped = Math.max(0, Math.min(100, scoreVal));
                    scoreSum += clamped;
                    scoreN += 1;
                  }
                }
              }
            } catch (_) {
              // ignore
            }
          }
        }

        setAvgQuizScore(scoreN > 0 ? Math.round((scoreSum / scoreN) * 10) / 10 : 0);
        setAvgProgress(progressN > 0 ? Math.round((progressSum / progressN) * 10) / 10 : 0);
      } catch (e) {
        console.error("Failed to fetch dashboard:", e);
        setAvgQuizScore(0);
        setAvgProgress(0);
      }
    }
    loadDashboard();
  }, []);

  // Build cards inline (no src/data dependency)
  const cards = [
    {
      color: "gray",
      icon: SwatchIcon,
      title: "Total Section",
      value: sectionCount !== null ? String(sectionCount) : "...",
      footer: {
        color: "text-green-500",
        value: "View Sections",
        label: "",
        path: "/dashboard/section",
      },
    },
    {
      color: "gray",
      icon: UsersIcon,
      title: "Total Student",
      value: studentCount !== null ? String(studentCount) : "...",
      footer: {
        color: "text-green-500",
        value: "View Students",
        label: "",
        path: "/dashboard/students",
      },
    },
    {
      color: "gray",
      icon: ArrowDownOnSquareStackIcon,
      title: "Avg Quiz Score (7d)",
      value: avgQuizScore !== null ? `${avgQuizScore}%` : "...",
      footer: {
        color: "text-green-500",
        value: "View Quizzes",
        label: "",
        path: "/dashboard/quiz",
      },
    },
    {
      color: "gray",
      icon: ArrowDownOnSquareStackIcon,
      title: "Avg Module Progress",
      value: avgProgress !== null ? `${avgProgress}%` : "...",
      footer: {
        color: "text-green-500",
        value: "View Module Progress",
        label: "",
        path: "/dashboard/module",
      },
    },
  ];

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-16 flex flex-col gap-10"> 
      <Card className="shadow-xl border-0 bg-white">
        <PageHeader
          title="Welcome to Dashboard!"
          subtitle={`Hello ${user?.firstName || 'Teacher'}, manage your students and track their progress`}
          icon={(
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
            </svg>
          )}
        />
        <CardBody className="px-6 pt-0 pb-6">
          <div className="grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ icon, title, footer, ...rest }) => (
              <StatisticsCard
                key={title}
                {...rest}
                title={title}
                icon={icon ? React.createElement(icon, {
                  className: "w-6 h-6 text-white",
                }) : null}
                footer={footer}
              />
            ))}
          </div>
          {/* Quick Actions */}
          <div className="mt-8 rounded-xl p-5" style={{ background: 'rgba(15, 15, 61, 0.04)', border: '1px solid rgba(155, 142, 200, 0.15)' }}>
            <Typography variant="small" className="font-medium mb-3" style={{ color: '#1a1a5e' }}>Quick Actions</Typography>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="px-4 py-2.5 text-white rounded-xl hover:opacity-90 text-sm font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #e054c0, #9b8ec8)', boxShadow: '0 4px 12px rgba(224, 84, 192, 0.25)' }}
                onClick={() => navigate("/dashboard/students?action=add-batch")}
              >
                Add Student
              </button>
              <button
                type="button"
                className="px-4 py-2.5 text-white rounded-xl hover:opacity-90 text-sm font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #1a1a5e, #9b8ec8)', boxShadow: '0 4px 12px rgba(26, 26, 94, 0.25)' }}
                onClick={() => navigate("/dashboard/section")}
              >
                Add Section
              </button>
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'white', border: '1px solid rgba(155, 142, 200, 0.3)', color: '#1a1a5e' }}
                onClick={() => navigate("/dashboard/section")}
              >
                Export Class Record (CSV)
              </button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Home;