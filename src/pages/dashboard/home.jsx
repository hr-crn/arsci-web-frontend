import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { StatisticsCard } from "@/widgets/cards";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import PageHeader from "@/widgets/layout/PageHeader";
import { UsersIcon, SwatchIcon, ArrowDownOnSquareStackIcon, ChartBarIcon, DocumentTextIcon } from "@heroicons/react/24/solid";
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
      color: "deep-purple",
      icon: SwatchIcon,
      title: "Total Section",
      value: sectionCount !== null ? String(sectionCount) : "...",
      footer: {
        color: "text-arsci-purple",
        value: "View Sections",
        label: " | New sections added",
        path: "/dashboard/section",
      },
    },
    {
      color: "pink",
      icon: UsersIcon,
      title: "Total Student",
      value: studentCount !== null ? String(studentCount) : "...",
      footer: {
        color: "text-arsci-pink",
        value: "View Students",
        label: " | ↑ 5% from last month",
        path: "/dashboard/students",
      },
    },
    {
      color: "cyan",
      icon: ChartBarIcon,
      title: "Avg Quiz Score (7d)",
      value: avgQuizScore !== null ? `${avgQuizScore}%` : "...",
      footer: {
        color: "text-arsci-cyan-dark",
        value: "View Quizzes",
        label: " | ↑ 2% from last week",
        path: "/dashboard/quiz",
      },
    },
    {
      color: "indigo",
      icon: DocumentTextIcon,
      title: "Avg Module Progress",
      value: avgProgress !== null ? `${avgProgress}%` : "...",
      footer: {
        color: "text-indigo-500",
        value: "View Module Progress",
        label: " | Steady engagement",
        path: "/dashboard/module",
      },
    },
  ];

  // Chart Configuration
  const chartConfig = {
    type: "area",
    height: 280,
    series: [
      {
        name: "Avg Quiz Score",
        data: [75, 82, 78, 88, 92, 85, 95],
      },
    ],
    options: {
      chart: { toolbar: { show: false } },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3, colors: ["#e054c0"] },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 100],
          colorStops: [
            { offset: 0, color: "#e054c0", opacity: 0.4 },
            { offset: 100, color: "#9b8ec8", opacity: 0.05 },
          ]
        },
      },
      xaxis: {
        categories: ["Quiz 1", "Quiz 2", "Quiz 3", "Quiz 4", "Quiz 5", "Quiz 6", "Quiz 7"],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: "#9ca3af", fontSize: "12px", fontFamily: "Inter" } },
      },
      yaxis: {
        labels: { style: { colors: "#9ca3af", fontSize: "12px", fontFamily: "Inter" } },
      },
      grid: { show: true, borderColor: "#f3f4f6", strokeDashArray: 4 },
      tooltip: { theme: "dark" },
    },
  };

  // Recent Activity Data
  const recentActivities = [
    { id: 1, user: "Juan Dela Cruz", action: "completed Module 1: Intro to AR", time: "2 hours ago", color: "bg-arsci-pink" },
    { id: 2, user: "Maria Santos", action: "scored 95% on Quiz: Solar System", time: "5 hours ago", color: "bg-arsci-cyan-dark" },
    { id: 3, user: "Grade 6 - Archimedes", action: "was added by Teacher", time: "1 day ago", color: "bg-arsci-purple" },
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

          {/* Main Dashboard Content Grid */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-2 rounded-xl p-5 border shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(155, 142, 200, 0.15)' }}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Typography variant="h6" className="font-semibold" style={{ color: '#1a1a5e' }}>Recent Quiz Performance</Typography>
                  <Typography variant="small" className="text-gray-500 font-normal">Average scores across all sections</Typography>
                </div>
              </div>
              <Chart {...chartConfig} />
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl p-5 border shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(155, 142, 200, 0.15)' }}>
              <Typography variant="h6" className="font-semibold mb-6" style={{ color: '#1a1a5e' }}>Recent Activity</Typography>
              <div className="flex flex-col gap-5">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-4">
                    <div className={`w-2.5 h-2.5 mt-1.5 rounded-full ${act.color} shadow-sm shrink-0`} />
                    <div>
                      <Typography variant="small" className="font-medium text-gray-800">{act.user}</Typography>
                      <Typography variant="small" className="text-gray-600 text-xs">{act.action}</Typography>
                      <Typography variant="small" className="text-gray-400 text-xs mt-0.5">{act.time}</Typography>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Home;