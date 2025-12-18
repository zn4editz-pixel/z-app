import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import {
  Activity,
  Database,
  Server,
  Cpu,
  AlertTriangle,
  CheckCircle,
  Zap,
  Brain,
  RefreshCw,
} from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
const SystemHealthPanel = () => {
  const [data, setData] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const fetchSystemStats = async () => {
    try {
      const res = await axiosInstance.get("/admin/stats/system");
      const newData = res.data;
      // Add to history
      const now = new Date();
      const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
      const historyItem = {
        time,
        latency: newData.dbLatency || 0,
        memory: newData.memoryUsage || 0,
        uptime: newData.uptime || 0,
      };
      setData((prev) => {
        const updated = [...prev, historyItem];
        return updated.slice(-20); // Keep last 20 data points
      });
      setSystemStats(newData);
      analyzeSystem(newData);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);
  const analyzeSystem = (stats) => {
    if (!stats) return;
    const suggestions = [];
    if (stats.dbLatency > 100) {
      suggestions.push({
        type: "warning",
        message: `High DB latency: ${stats.dbLatency}ms`,
        action: "Consider optimizing database queries or indexes.",
      });
    }
    if (stats.memoryUsage > 80) {
      suggestions.push({
        type: "critical",
        message: `High memory usage: ${stats.memoryUsage}%`,
        action: "Consider scaling up or optimizing memory usage.",
      });
    }
    if (stats.memoryUsage < 50 && stats.dbLatency < 50) {
      suggestions.push({
        type: "info",
        message: "System running optimally.",
        action: "No action needed.",
      });
    }
    setAiSuggestions((prev) => {
      const combined = [...suggestions, ...prev];
      const unique = Array.from(
        new Map(combined.map((item) => [item.message, item])).values(),
      );
      return unique.slice(0, 3);
    });
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Latency Card */}
        <div className="bg-base-100/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/20 rounded-xl">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Server Latency</h3>
              <p className="text-xs opacity-60">Real-time response time</p>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d926a9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#d926a9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="#d926a9"
                  fillOpacity={1}
                  fill="url(#colorLatency)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-primary">
              {data[data.length - 1]?.latency}ms
            </span>
          </div>
        </div>
        {/* Memory Card */}
        <div className="bg-base-100/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-secondary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-secondary/20 rounded-xl">
              <Cpu className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Memory Usage</h3>
              <p className="text-xs opacity-60">RAM utilization</p>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                  }}
                />
                <Line
                  type="step"
                  dataKey="memory"
                  stroke="#1fb2a6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-secondary">
              {data[data.length - 1]?.memory}%
            </span>
          </div>
        </div>
        {/* DB Health Card */}
        <div className="bg-base-100/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-accent/20 rounded-xl">
              <Database className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Database Health</h3>
              <p className="text-xs opacity-60">Connection Status</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-32 space-y-2">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${systemStats?.dbStatus === "connected" || !loading ? "bg-success/20 text-success" : "bg-error/20 text-error"} animate-pulse`}
            >
              <Server className="w-8 h-8" />
            </div>
            <span className="font-bold uppercase tracking-wider text-sm">
              {systemStats?.dbStatus || (loading ? "checking..." : "connected")}
            </span>
            <div className="text-xs opacity-60">
              Latency: {systemStats?.dbLatency || 0}ms
            </div>
          </div>
        </div>
      </div>
      {/* Socket Timing & Request Load */}
      <div className="bg-base-100/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-info/20">
        <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-warning" />
          Socket Timing & Traffic Load
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  borderColor: "#374151",
                }}
              />
              <Bar dataKey="requests" fill="#3abff8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* AI Insights Panel */}
      <div className="bg-gradient-to-br from-base-200 to-base-300 p-6 rounded-2xl shadow-inner border border-base-content/5">
        <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-500" />
          AI Performance Insights
        </h3>
        <div className="space-y-3">
          {aiSuggestions.length === 0 && (
            <div className="text-center py-8 opacity-50">
              AI is analyzing system metrics...
            </div>
          )}
          {aiSuggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl flex items-start gap-4 ${
                suggestion.type === "critical"
                  ? "bg-error/10 border border-error/20"
                  : suggestion.type === "warning"
                    ? "bg-warning/10 border border-warning/20"
                    : "bg-info/10 border border-info/20"
              } animate-in slide-in-from-right duration-500`}
            >
              {suggestion.type === "critical" ? (
                <AlertTriangle className="w-6 h-6 text-error shrink-0" />
              ) : suggestion.type === "warning" ? (
                <AlertTriangle className="w-6 h-6 text-warning shrink-0" />
              ) : (
                <CheckCircle className="w-6 h-6 text-info shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-sm uppercase opacity-80">
                  {suggestion.type}
                </h4>
                <p className="font-medium mt-1">{suggestion.message}</p>
                <p className="text-xs mt-2 opacity-70 bg-base-100/50 p-2 rounded">
                  💡 Suggestion: {suggestion.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default SystemHealthPanel;
