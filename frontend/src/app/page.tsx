import ShortenForm from "@/components/ShortenForm";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Shorten URLs. <span className="text-primary">Track Clicks.</span>
        </h1>
        <p className="text-xl text-text-muted mb-8">
          The open-source, self-hosted URL shortener with a powerful analytics dashboard. 
          Get detailed insights into your link traffic instantly.
        </p>
      </div>

      <ShortenForm />
    </div>
  );
}
