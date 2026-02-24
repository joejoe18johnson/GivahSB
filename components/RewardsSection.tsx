import { Reward } from "@/lib/data";
import { Users } from "lucide-react";

interface RewardsSectionProps {
  rewards: Reward[];
}

export default function RewardsSection({ rewards }: RewardsSectionProps) {
  return (
    <div className="mt-6">
      <h3 className="font-medium mb-4">Rewards</h3>
      <div className="space-y-4">
        {rewards.map((reward) => (
          <div
            key={reward.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-lg">${reward.amount}</h4>
                <p className="font-medium text-gray-900">{reward.title}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Users className="w-4 h-4" />
                {reward.backers} backers
              </span>
              <span className="text-gray-600">
                Est. delivery: {new Date(reward.estimatedDelivery).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
