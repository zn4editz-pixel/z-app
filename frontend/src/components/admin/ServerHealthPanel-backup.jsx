// Temporary simple version for testing
import { Activity } from 'lucide-react';

function ServerHealthPanel() {
	return (
		<div className="p-6">
			<div className="flex items-center gap-3 mb-6">
				<Activity className="w-8 h-8 text-yellow-500" />
				<h2 className="text-2xl font-bold text-white">Server Health Monitor</h2>
			</div>
			<p className="text-gray-400">Loading monitoring system...</p>
		</div>
	);
}

export default ServerHealthPanel;
