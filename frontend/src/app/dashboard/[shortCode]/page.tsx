"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import api from "@/lib/api";
import AnalyticsCharts from "@/components/AnalyticsCharts";

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const shortCode = params.shortCode as string;
  const [urlInfo, setUrlInfo] = useState<any>(null);

  useEffect(() => {
    fetchUrlDetails();
  }, [shortCode]);

  const fetchUrlDetails = async () => {
    try {
      const response = await api.get(`/urls/${shortCode}`);
      setUrlInfo(response.data);
    } catch (err) {
      console.error(err);
      router.push("/dashboard");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {urlInfo?.title || "Analytics"}
            </h1>
            <div className="flex items-center gap-2 text-text-muted">
              <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">/{shortCode}</span>
              <span>→</span>
              <span className="truncate max-w-md">{urlInfo?.original_url}</span>
            </div>
          </div>
          
          <a
            href={urlInfo?.original_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border rounded-lg transition-colors text-sm font-medium"
          >
            Visit Original
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <AnalyticsCharts shortCode={shortCode} />
    </div>
  );
}
