"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  fetchFrontendMetrics,
  fetchRecentPromptMetrics,
  getBackendBaseUrl,
  type FrontendMetricsSnapshot,
  type PromptAnalysis,
} from "@/lib/metrics";

type MetricsState = {
  snapshot: FrontendMetricsSnapshot | null;
  recentPrompts: PromptAnalysis[];
  error: string | null;
  loading: boolean;
};

const INITIAL_STATE: MetricsState = {
  snapshot: null,
  recentPrompts: [],
  error: null,
  loading: true,
};

export function MetricsDashboard() {
  const [state, setState] = useState<MetricsState>(INITIAL_STATE);

  useEffect(() => {
    let isActive = true;

    async function loadMetrics() {
      try {
        const [snapshot, recent] = await Promise.all([
          fetchFrontendMetrics(),
          fetchRecentPromptMetrics(8),
        ]);

        if (!isActive) {
          return;
        }

        setState({
          snapshot,
          recentPrompts: recent.prompts,
          error: null,
          loading: false,
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setState({
          snapshot: null,
          recentPrompts: [],
          error:
            error instanceof Error ? error.message : "Unable to load metrics.",
          loading: false,
        });
      }
    }

    loadMetrics();
    return () => {
      isActive = false;
    };
  }, []);

  const latestAnalysis = state.snapshot?.latest_prompt_analysis ?? null;

  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(173,194,151,0.44),transparent_60%)]" />
      <div className="absolute -left-16 top-16 h-44 w-44 rounded-full bg-[rgba(239,228,181,0.34)] blur-3xl" />
      <div className="absolute right-0 top-48 h-56 w-56 rounded-full bg-[rgba(159,178,143,0.22)] blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <section className="garden-card rounded-[2.2rem] p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-moss">
                User Metrics
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
                Garden health for your prompts, pulled directly from the backend.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-foreground/74">
                This view reads the stored metrics snapshot, the latest prompt
                analysis, and recent prompt history so we can see how the garden
                is responding over time.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full border border-border bg-surface-strong px-5 py-3 text-sm font-medium text-foreground hover:border-moss/60 hover:bg-white"
              >
                Back to Garden
              </Link>
              <a
                href={`${getBackendBaseUrl()}/api/frontend`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-moss px-5 py-3 text-sm font-medium text-white hover:bg-[#5e7855]"
              >
                View Raw Snapshot
              </a>
            </div>
          </div>
        </section>

        {state.loading ? (
          <section className="garden-card rounded-[2rem] p-8">
            <p className="text-sm uppercase tracking-[0.22em] text-moss">
              Loading metrics...
            </p>
          </section>
        ) : null}

        {state.error ? (
          <section className="garden-card rounded-[2rem] border border-clay/40 p-8">
            <h2 className="font-serif text-3xl text-foreground">
              Backend metrics unavailable
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-foreground/74">
              {state.error}. Make sure the backend server is running on{" "}
              <code>{getBackendBaseUrl()}</code>.
            </p>
          </section>
        ) : null}

        {!state.loading && !state.error && state.snapshot ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <StatCard
                label="Total Score"
                value={state.snapshot.total_score.toFixed(2)}
                description="Single-user running total from stored prompt results."
              />
              <StatCard
                label="Latest Score"
                value={latestAnalysis?.final_score?.toFixed(2) ?? "0.00"}
                description="The final score returned for the most recently processed prompt."
              />
              <StatCard
                label="Latest Tags"
                value={String(latestAnalysis?.tags.length ?? 0)}
                description="Auto-derived strengths and penalties from the latest stored metrics."
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <article className="garden-card rounded-[2rem] p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
                  Latest Prompt Analysis
                </p>
                <h2 className="mt-3 font-serif text-3xl text-foreground">
                  {latestAnalysis ? "Current signal snapshot" : "No prompt data yet"}
                </h2>
                {latestAnalysis ? (
                  <>
                    <p className="mt-4 rounded-[1.5rem] border border-border bg-surface-strong/80 p-5 text-sm leading-7 text-foreground/78">
                      {latestAnalysis.prompt}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {latestAnalysis.tags.length > 0 ? (
                        latestAnalysis.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border bg-white/80 px-3 py-2 text-xs uppercase tracking-[0.16em] text-foreground/74"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-border bg-white/80 px-3 py-2 text-xs uppercase tracking-[0.16em] text-foreground/74">
                          No tags yet
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-foreground/74">
                    Submit a prompt through the extension to start collecting
                    metrics.
                  </p>
                )}
              </article>

              <article className="garden-card rounded-[2rem] p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
                  Category Breakdown
                </p>
                <div className="mt-5 grid gap-4">
                  <MetricGroup
                    title="Scores"
                    metrics={latestAnalysis?.criteria_scores ?? {}}
                    accentClass="bg-moss"
                  />
                  <MetricGroup
                    title="Penalties"
                    metrics={latestAnalysis?.penalties ?? {}}
                    accentClass="bg-clay"
                  />
                </div>
              </article>
            </section>

            <section className="garden-card rounded-[2rem] p-6 sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
                    Recent Prompt History
                  </p>
                  <h2 className="mt-2 font-serif text-3xl text-foreground">
                    Latest stored analyses
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-7 text-foreground/72">
                  The backend currently supports up to 24 recent prompts per
                  query. This page is showing the latest {state.recentPrompts.length}.
                </p>
              </div>

              <div className="mt-6 grid gap-4">
                {state.recentPrompts.length > 0 ? (
                  state.recentPrompts.map((promptAnalysis) => (
                    <article
                      key={`${promptAnalysis.recorded_at}-${promptAnalysis.prompt_timestamp}`}
                      className="rounded-[1.6rem] border border-border bg-surface-strong/84 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-3xl">
                          <p className="text-sm leading-7 text-foreground/78">
                            {promptAnalysis.prompt}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {promptAnalysis.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-border bg-white/80 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-foreground/72"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="min-w-44 rounded-[1.2rem] border border-border bg-white/65 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-foreground/58">
                            Final Score
                          </p>
                          <p className="mt-2 font-serif text-3xl text-foreground">
                            {promptAnalysis.final_score.toFixed(2)}
                          </p>
                          <p className="mt-2 text-xs leading-6 text-foreground/62">
                            Source: {promptAnalysis.source}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-foreground/74">
                    No recent prompt history yet.
                  </p>
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="garden-card rounded-[1.6rem] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">
        {label}
      </p>
      <p className="mt-3 font-serif text-4xl text-foreground">{value}</p>
      <p className="mt-3 text-sm leading-7 text-foreground/72">{description}</p>
    </article>
  );
}

function MetricGroup({
  title,
  metrics,
  accentClass,
}: {
  title: string;
  metrics: Record<string, number>;
  accentClass: string;
}) {
  const entries = Object.entries(metrics);

  return (
    <section className="rounded-[1.6rem] border border-border bg-surface-strong/82 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">
        {title}
      </p>
      <div className="mt-4 grid gap-3">
        {entries.length > 0 ? (
          entries.map(([name, value]) => (
            <div
              key={name}
              className="rounded-[1.2rem] border border-border bg-white/70 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium capitalize text-foreground">
                  {name}
                </p>
                <span className="font-serif text-2xl text-foreground">
                  {value.toFixed(2)}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(108,138,98,0.12)]">
                <div
                  className={`h-full rounded-full ${accentClass}`}
                  style={{
                    width: `${Math.max(8, Math.min(100, Math.abs(value) * 20))}%`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm leading-7 text-foreground/72">
            No values stored yet.
          </p>
        )}
      </div>
    </section>
  );
}
