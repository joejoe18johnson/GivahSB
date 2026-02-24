import { CampaignUpdate } from "@/lib/data";
import { Calendar } from "lucide-react";

interface CampaignUpdatesProps {
  updates: CampaignUpdate[];
}

export default function CampaignUpdates({ updates }: CampaignUpdatesProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-medium mb-4">Updates</h2>
      <div className="space-y-6">
        {updates.map((update) => (
          <div key={update.id} className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(update.date).toLocaleDateString()}</span>
            </div>
            <h3 className="text-xl font-medium mb-2">{update.title}</h3>
            <p className="text-gray-700">{update.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
