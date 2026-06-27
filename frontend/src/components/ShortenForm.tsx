"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Copy, Check, Link as LinkIcon, Loader2, ExternalLink } from "lucide-react";

interface ShortenResult {
  short_url: string;
  short_code: string;
  original_url: string;
  title: string | null;
}

interface ShortenFormProps {
  onSuccess?: () => void;
}

export default function ShortenForm({ onSuccess }: ShortenFormProps = {}) {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post("/urls/shorten", {
        original_url: url,
        custom_alias: alias || undefined,
      });
      setResult(response.data);
      setUrl("");
      setAlias("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to shorten URL");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.short_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-surface border border-border shadow-lg">
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="url" className="sr-only">URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-text-muted" />
              </div>
              <input
                type="url"
                id="url"
                required
                placeholder="Enter a long URL to shorten..."
                className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg bg-background text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="alias" className="sr-only">Custom Alias</label>
              <input
                type="text"
                id="alias"
                placeholder="Custom alias (optional)"
                className="block w-full px-3 py-3 border border-border rounded-lg bg-background text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url}
              className="px-6 py-3 bg-primary hover:bg-primary-dark hover:scale-[1.02] active:scale-95 text-white font-medium rounded-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center min-w-[120px] transition-all shadow-md hover:shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Shorten URL"}
            </button>
          </div>
          
          {error && <p className="text-danger text-sm">{error}</p>}
        </div>
      </form>

      {result && (
        <div className="p-6 rounded-xl bg-surface border border-border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-lg font-medium text-text-primary mb-4">Your short URL is ready!</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 min-w-0 w-full bg-background p-4 rounded-lg font-mono text-primary flex items-center justify-between border border-border">
              <span className="truncate block">{result.short_url}</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <a
                href={result.short_url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none px-6 py-4 bg-primary/10 hover:bg-primary/20 hover:scale-[1.02] active:scale-95 text-primary font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <ExternalLink className="h-5 w-5" />
                Test
              </a>
              <button
                onClick={handleCopy}
                className="flex-1 sm:flex-none px-6 py-4 bg-primary hover:bg-primary-dark hover:scale-[1.02] active:scale-95 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-text-muted break-all">
            <span className="font-medium">Original:</span> {result.original_url}
          </div>
        </div>
      )}
    </div>
  );
}
