"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import LinkCard from "@/components/LinkCard";
import { Loader2, Plus, TrendingUp, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";

interface URLData {
  id: string;
  short_code: string;
  short_url: string;
  original_url: string;
  title: string | null;
  total_clicks: number;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export default function DashboardPage() {
  const [urls, setUrls] = useState<URLData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const response = await api.get("/urls/");
      setUrls(response.data);
    } catch (err) {
      console.error(err);
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (shortCode: string) => {
    setUrls((prev) => prev.filter((u) => u.short_code !== shortCode));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalClicks = urls.reduce((acc, url) => acc + url.total_clicks, 0);
  const activeLinks = urls.filter(u => u.is_active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Dashboard <Sparkles className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-text-muted mt-1">Manage and track your shortened links</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fetchUrls()}
            className="flex items-center gap-2 bg-surface hover:bg-surface-hover text-text-primary px-4 py-2 rounded-lg transition-all active:scale-95 border border-border"
            title="Refresh links"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link 
            href="/" 
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-all active:scale-95 hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Create New
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow hover:border-primary/30">
          <div className="text-text-muted text-sm font-medium mb-2">Total Links</div>
          <div className="text-3xl font-bold text-primary">{activeLinks}</div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow hover:border-primary/30">
          <div className="text-text-muted text-sm font-medium mb-2">Total Clicks</div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-primary">{totalClicks.toLocaleString()}</div>
            <TrendingUp className="h-5 w-5 text-success animate-pulse" />
          </div>
        </div>
      </div>

      {urls.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-xl">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
            <Plus className="h-8 w-8 text-text-muted" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No links yet</h3>
          <p className="text-text-muted mb-6">Create your first short link to start tracking.</p>
          <Link href="/" className="text-primary hover:underline">Shorten a URL now</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {urls.map((url) => (
            <LinkCard
              key={url.id}
              shortCode={url.short_code}
              shortUrl={url.short_url}
              originalUrl={url.original_url}
              title={url.title}
              totalClicks={url.total_clicks}
              createdAt={url.created_at}
              expiresAt={url.expires_at}
              isActive={url.is_active}
              onDelete={() => handleDelete(url.short_code)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
