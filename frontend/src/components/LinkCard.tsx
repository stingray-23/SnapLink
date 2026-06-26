"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Copy, Check, BarChart3, Trash2, Globe, Calendar, ExternalLink } from "lucide-react";
import api from "@/lib/api";

interface LinkCardProps {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  totalClicks: number;
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
  onDelete: () => void;
}

export default function LinkCard({
  shortCode,
  shortUrl,
  originalUrl,
  title,
  totalClicks,
  createdAt,
  isActive,
  onDelete,
}: LinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this link?")) {
      setIsDeleting(true);
      try {
        await api.delete(`/urls/${shortCode}`);
        onDelete();
      } catch (err) {
        console.error("Failed to delete link", err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (!isActive) return null;

  return (
    <div className="flex flex-col bg-surface border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-text-primary truncate" title={title || originalUrl}>
            {title || "Untitled Link"}
          </h3>
          <a href={originalUrl} target="_blank" rel="noreferrer" className="text-sm text-text-muted hover:text-primary truncate block mt-1">
            {originalUrl}
          </a>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 bg-primary/10 text-primary hover:bg-primary/20 active:scale-90 rounded-md transition-all shrink-0"
          title="Copy short URL"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Globe className="h-4 w-4 text-primary" />
        <a href={shortUrl} target="_blank" rel="noreferrer" className="font-mono text-primary font-medium hover:underline truncate">
          {shortUrl.replace(/^https?:\/\//, '')}
        </a>
      </div>

      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-text-muted">
          <div className="flex items-center gap-1.5" title="Total Clicks">
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium text-text-primary">{totalClicks.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Created At">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link
            href={`/dashboard/${shortCode}`}
            className="px-3 py-1.5 text-sm bg-background border border-border hover:bg-primary hover:text-white hover:border-primary active:scale-95 text-text-primary rounded-md transition-all"
          >
            Analytics
          </Link>
          <a
            href={shortUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary text-primary hover:text-white border border-transparent hover:border-primary active:scale-95 rounded-md transition-all font-medium"
            title="Test this short link"
          >
            <ExternalLink className="h-4 w-4" />
            Test
          </a>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 active:scale-90 rounded-md transition-all ml-1"
            title="Delete link"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
