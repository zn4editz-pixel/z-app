import { useState, useEffect } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Gamepad2, Trophy, Clock, Users, RefreshCcw } from "lucide-react";
import { axiosInstance } from "../../lib/axios";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const GameAnalyticsPanel = () => {
        totalGames: 0,
        activePlayers: 0,
        avgDuration: "--",
        topGame: "SOS Classic"
    });

    const fetchGameStats = async () => {
        try {
            const res = await axiosInstance.get("/admin/stats/game");
            const data = res.data;
            setStats({
                totalGames: data.activeGames + data.waitingGames, // Using active games as total for now since we don't persist history
                activePlayers: data.totalPlayers,
                avgDuration: "3m 45s", // Placeholder until persisted
                topGame: "SOS Classic",
                activeDetails: data // Store raw data for advanced usage if needed
            });
        } catch (err) {
            console.error("Failed to fetch game stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGameStats();
        // Refresh every 30s
        const interval = setInterval(fetchGameStats, 30000);
        return () => clearInterval(interval);
    }, []);

    // Mock Data for Charts (since we don't have historical DB yet)
    const gameUsageData = [
        { name: 'Mon', games: 45 },
        { name: 'Tue', games: 52 },
        { name: 'Wed', games: 38 },
        { name: 'Thu', games: 65 },
        { name: 'Fri', games: 98 },
        { name: 'Sat', games: 120 },
        { name: 'Sun', games: 85 },
    ];

    const winRateData = [
        { name: 'Player 1 Wins', value: 45 },
        { name: 'Player 2 Wins', value: 35 },
        { name: 'Draws', value: 20 },
    ];

    return (
        <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-base-100 p-4 rounded-2xl shadow-lg border border-base-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary"><Gamepad2 size={24} /></div>
                        <div>
                            <div className="text-2xl font-black">{stats.totalGames}</div>
                            <div className="text-xs opacity-60">Total Games</div>
                        </div>
                    </div>
                </div>
                <div className="bg-base-100 p-4 rounded-2xl shadow-lg border border-base-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-secondary/10 rounded-xl text-secondary"><Users size={24} /></div>
                        <div>
                            <div className="text-2xl font-black">{stats.activePlayers}</div>
                            <div className="text-xs opacity-60">Active Now</div>
                        </div>
                    </div>
                </div>
                <div className="bg-base-100 p-4 rounded-2xl shadow-lg border border-base-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-accent/10 rounded-xl text-accent"><Clock size={24} /></div>
                        <div>
                            <div className="text-2xl font-black">{stats.avgDuration}</div>
                            <div className="text-xs opacity-60">Avg Duration</div>
                        </div>
                    </div>
                </div>
                <div className="bg-base-100 p-4 rounded-2xl shadow-lg border border-base-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-warning/10 rounded-xl text-warning"><Trophy size={24} /></div>
                        <div>
                            <div className="text-xl font-bold truncate">{stats.topGame}</div>
                            <div className="text-xs opacity-60">Most Popular</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Usage Chart */}
                <div className="bg-base-100/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-base-300">
                    <h3 className="font-bold text-lg mb-6">Weekly Game Activity</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gameUsageData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none' }} />
                                <Bar dataKey="games" fill="#8884d8" radius={[8, 8, 0, 0]}>
                                    {gameUsageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Win Rates Pie Chart */}
                <div className="bg-base-100/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-base-300">
                    <h3 className="font-bold text-lg mb-6">Game Outcomes</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={winRateData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label
                                >
                                    {winRateData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Games List */}
            <div className="bg-base-100/90 p-6 rounded-2xl shadow-xl">
                <h3 className="font-bold text-lg mb-4">Recent Completed Games</h3>
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Game ID</th>
                                <th>Players</th>
                                <th>Winner</th>
                                <th>Score</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="hover">
                                <td className="font-mono text-xs opacity-50">#G-8821</td>
                                <td>User1 vs User2</td>
                                <td className="text-success font-bold">User1</td>
                                <td>15 - 12</td>
                                <td className="opacity-60">2 mins ago</td>
                            </tr>
                            <tr className="hover">
                                <td className="font-mono text-xs opacity-50">#G-8822</td>
                                <td>Alex vs Sam</td>
                                <td className="text-warning font-bold">Draw</td>
                                <td>10 - 10</td>
                                <td className="opacity-60">5 mins ago</td>
                            </tr>
                            <tr className="hover">
                                <td className="font-mono text-xs opacity-50">#G-8823</td>
                                <td>ProGamer vs Noob</td>
                                <td className="text-success font-bold">ProGamer</td>
                                <td>20 - 2</td>
                                <td className="opacity-60">12 mins ago</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GameAnalyticsPanel;
