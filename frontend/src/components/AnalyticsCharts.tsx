"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

interface AnalyticsProps {
  shortCode: string;
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function AnalyticsCharts({ shortCode }: AnalyticsProps) {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("7d");
  const [overview, setOverview] = useState<any>(null);
  const [timeseries, setTimeseries] = useState([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [devices, setDevices] = useState([]);
  const [browsers, setBrowsers] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [shortCode, period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ov, ts, co, dv, br, rf] = await Promise.all([
        api.get(`/analytics/${shortCode}/overview`),
        api.get(`/analytics/${shortCode}/timeseries?period=${period}`),
        api.get(`/analytics/${shortCode}/countries`),
        api.get(`/analytics/${shortCode}/devices`),
        api.get(`/analytics/${shortCode}/browsers`),
        api.get(`/analytics/${shortCode}/referrers`),
      ]);
      setOverview(ov.data);
      setTimeseries(ts.data.data);
      setCountries(co.data.data);
      setDevices(dv.data.data);
      setBrowsers(br.data.data);
      setReferrers(rf.data.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
  
  const maxClicks = Math.max(...countries.map(c => c.clicks), 1);
  const colorScale = scaleLinear<string>().domain([0, maxClicks]).range(["#2e2e38", "var(--primary)"]);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border p-4 rounded-xl">
          <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Clicks</div>
          <div className="text-2xl font-bold">{overview?.total_clicks.toLocaleString()}</div>
        </div>
        <div className="bg-surface border border-border p-4 rounded-xl">
          <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Unique Countries</div>
          <div className="text-2xl font-bold">{overview?.unique_countries}</div>
        </div>
        <div className="bg-surface border border-border p-4 rounded-xl">
          <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Created</div>
          <div className="text-xl font-bold">{new Date(overview?.created_at).toLocaleDateString()}</div>
        </div>
        <div className="bg-surface border border-border p-4 rounded-xl">
          <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Last Click</div>
          <div className="text-xl font-bold">{overview?.last_click_at ? new Date(overview?.last_click_at).toLocaleDateString() : 'Never'}</div>
        </div>
      </div>

      {/* Timeseries */}
      <div className="bg-surface border border-border p-6 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-lg">Clicks Over Time</h3>
          <select 
            className="bg-background border border-border rounded-md px-3 py-1.5 text-sm outline-none"
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div className="h-72">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Line type="monotone" dataKey="clicks" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--background)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-surface border border-border p-6 rounded-xl">
          <h3 className="font-semibold text-lg mb-6">Device Types</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={devices}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="clicks"
                  nameKey="device_type"
                >
                  {devices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Browser Breakdown */}
        <div className="bg-surface border border-border p-6 rounded-xl">
          <h3 className="font-semibold text-lg mb-6">Top Browsers</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={browsers} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis dataKey="browser" type="category" stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: 'var(--surface-hover)'}} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} />
                <Bar dataKey="clicks" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Countries Map */}
        <div className="bg-surface border border-border p-6 rounded-xl">
          <h3 className="font-semibold text-lg mb-4">Locations</h3>
          <div className="h-64 bg-background rounded-lg border border-border flex items-center justify-center overflow-hidden">
             <ComposableMap projectionConfig={{ scale: 120 }}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const d = countries.find((s) => s.country_code === geo.properties.ISO_A2);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={d ? colorScale(d.clicks) : "#1a1a1f"}
                          stroke="var(--border)"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: "var(--primary-dark)", outline: "none" },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>
          </div>
        </div>

        {/* Top Referrers */}
        <div className="bg-surface border border-border p-6 rounded-xl">
          <h3 className="font-semibold text-lg mb-4">Top Referrers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-text-muted border-b border-border">
                <tr>
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium text-right">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {referrers.map((ref: any, idx) => (
                  <tr key={idx} className="hover:bg-surface-hover transition-colors">
                    <td className="py-3 text-text-primary truncate max-w-[200px]" title={ref.referrer}>
                      {ref.referrer}
                    </td>
                    <td className="py-3 text-right font-medium">{ref.clicks}</td>
                  </tr>
                ))}
                {referrers.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-text-muted">No referrer data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
