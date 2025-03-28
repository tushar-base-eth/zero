"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";

interface VolumeChartProps {
  data: { date: string; volume: number }[];
  timeRange: "7days" | "8weeks" | "12months";
  onTimeRangeChange: (value: "7days" | "8weeks" | "12months") => void;
}

export function VolumeChart({ data, timeRange, onTimeRangeChange }: VolumeChartProps) {
  const { formatWeight } = useUnitPreference();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={timeRange} onValueChange={(value) => onTimeRangeChange(value as "7days" | "8weeks" | "12months")}>
          <TabsList className="w-full bg-muted/50 p-1">
            <TabsTrigger value="7days" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Days
            </TabsTrigger>
            <TabsTrigger value="8weeks" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Weeks
            </TabsTrigger>
            <TabsTrigger value="12months" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Months
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
              >
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval={timeRange === "12months" ? 1 : 0}
                  angle={-60}
                  textAnchor="end"
                  height={60}
                  tickFormatter={(value) => {
                    if (timeRange === "12months") {
                      const [month, year] = value.split(" ");
                      return `${month} ${year.slice(-2)}`;
                    }
                    return value;
                  }}
                />
                <YAxis
                  stroke="hsl(var(--foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatWeight(value, 0)}
                  width={45}
                  padding={{ top: 20 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">Volume</span>
                              <span className="font-bold text-primary">
                                {formatWeight(Number(payload[0].value) || 0)}
                              </span>
                              <span className="text-[0.70rem] text-muted-foreground">
                                {payload[0].payload.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="volume"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}