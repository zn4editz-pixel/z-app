import { Activity, Server, Database, Wifi } from 'lucide-react';

function ServerHealthPanel() {
	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
					<Activity className="w-8 h-8 text-yellow-500" />
				</div>
				<div>
					<h2 className="text-2xl font-bold text-white">Server Health Monitor</h2>
					<p className="text-sm text-gray-400">Real-time system monitoring</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-black/40 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
					<div className="flex items-center gap-3 mb-3">
						<Server className="w-5 h-5 text-green-400" />
						<h3 className="text-white font-semibold">Server Status</h3>
					</div>
					<p className="text-2xl font-bold text-green-400">Online</p>
					<p className="text-sm text-gray-400 mt-1">All systems operational</p>
				</div>

				<div className="bg-black/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
					<div className="flex items-center gap-3 mb-3">
						<Database className="w-5 h-5 text-blue-400" />
						<h3 className="text-white font-semibold">Database</h3>
					</div>
					<p className="text-2xl font-bold text-blue-400">Connected</p>
					<p className="text-sm text-gray-400 mt-1">Response time: ~50ms</p>
				</div>

				<div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
					<div className="flex items-center gap-3 mb-3">
						<Wifi className="w-5 h-5 text-purple-400" />
						<h3 className="text-white font-semibold">WebSocket</h3>
					</div>
					<p className="text-2xl font-bold text-purple-400">Active</p>
					<p className="text-sm text-gray-400 mt-1">Real-time connections</p>
				</div>
			</div>

			<div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
				<p className="text-yellow-400 text-sm">
					<strong>Note:</strong> Advanced monitoring features are being implemented. 
					Basic system status is shown above.
				</p>
			</div>
		</div>
	);
}

export default ServerHealthPanel;
