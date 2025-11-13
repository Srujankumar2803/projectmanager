import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  details?: Array<{ label: string; value: number; color?: string }>;
}

export function StatCard({ title, value, subtitle, icon, gradient, details }: StatCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-gray-900 mb-3">{value}</div>
        {details && details.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center gap-2">
                {detail.color && <div className={`w-2 h-2 rounded-full ${detail.color}`} />}
                <span className="text-xs text-gray-600">
                  {detail.label}: <span className="font-semibold text-gray-900">{detail.value}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StatCard;
