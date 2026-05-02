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
  const [chartData, setChartData] = useState([]);
  const [activitiesData, setActivitiesData] = useState([]);

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
        
        // Chart & Activity Aggregates
        const modScores = {};
        MODULE_IDS.forEach(mid => modScores[mid] = { sum: 0, count: 0 });
        const allActivities = [];

        // Collect student additions for activity feed
        if (Array.isArray(students)) {
          students.forEach(s => {
            const rawDt = s.createdAt || s.created_at;
            if (rawDt) {
              const dt = new Date(rawDt);
              if (!isNaN(dt)) {
                allActivities.push({
                  id: `student-${s.username}`,
                  user: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.username,
                  action: "was added to the system",
                  timeDate: dt,
                  color: "bg-arsci-pink"
                });
              }
            }
          });
        }

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
                
                // Add to chart module averages regardless of window
                let mScoreVal = null;
                if (typeof r?.percentage === "number") mScoreVal = r.percentage;
                else if (typeof r?.score === "number") mScoreVal = r.score;
                else if (typeof r?.points === "number" && r?.totalPoints) {
                  const pct = (r.points / r.totalPoints) * 100;
                  if (isFinite(pct)) mScoreVal = pct;
                }
                if (typeof mScoreVal === "number") {
                  const clamped = Math.max(0, Math.min(100, mScoreVal));
                  modScores[mid].sum += clamped;
                  modScores[mid].count += 1;
                }

                // Add to activity feed
                if (dt instanceof Date && !isNaN(dt) && r.username) {
                  let scoreText = "";
                  if (typeof mScoreVal === "number") {
                     scoreText = ` scored ${Math.round(mScoreVal)}% on`;
                  } else {
                     scoreText = ` completed`;
                  }
                  allActivities.push({
                    id: `quiz-${r.username}-${mid}-${dt.getTime()}`,
                    user: r.username,
                    action: `${scoreText} Module ${mid}`,
                    timeDate: dt,
                    color: "bg-arsci-cyan-dark"
                  });
                }
              }
            } catch (_) {
              // ignore
            }
          }
        }

        setAvgQuizScore(scoreN > 0 ? Math.round((scoreSum / scoreN) * 10) / 10 : 0);
        setAvgProgress(progressN > 0 ? Math.round((progressSum / progressN) * 10) / 10 : 0);

        // Process Chart Data
        const finalChartData = MODULE_IDS.map(mid => {
           if (modScores[mid].count === 0) return 0;
           return Math.round(modScores[mid].sum / modScores[mid].count);
        });
        setChartData(finalChartData);

        // Process Activity Feed
        allActivities.sort((a, b) => b.timeDate - a.timeDate);
        const topActivities = allActivities.slice(0, 5).map(act => {
           const diffMs = new Date() - act.timeDate;
           const diffMins = Math.floor(diffMs / 60000);
           const diffHours = Math.floor(diffMins / 60);
           const diffDays = Math.floor(diffHours / 24);
           let timeStr = "just now";
           if (diffDays > 0) timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
           else if (diffHours > 0) timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
           else if (diffMins > 0) timeStr = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
           
           return { ...act, time: timeStr };
        });
        setActivitiesData(topActivities);

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
        data: chartData.length > 0 ? chartData : [0, 0, 0, 0],
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
        categories: MODULE_IDS.map(m => `Module ${m}`),
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
                {activitiesData.length > 0 ? activitiesData.map((act) => (
                  <div key={act.id} className="flex items-start gap-4">
                    <div className={`w-2.5 h-2.5 mt-1.5 rounded-full ${act.color} shadow-sm shrink-0`} />
                    <div>
                      <Typography variant="small" className="font-medium text-gray-800">{act.user}</Typography>
                      <Typography variant="small" className="text-gray-600 text-xs">{act.action}</Typography>
                      <Typography variant="small" className="text-gray-400 text-xs mt-0.5">{act.time}</Typography>
                    </div>
                  </div>
                )) : (
                  <Typography variant="small" className="text-gray-500 italic text-center py-4">No recent activity found.</Typography>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Home;