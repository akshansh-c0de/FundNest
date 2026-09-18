import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import {
  Brain, TrendingUp, AlertTriangle, CheckCircle2, Target,
  ShieldAlert, Sparkles, Award, ShieldCheck, Zap, Activity,
} from 'lucide-react';

interface AIReportCardProps {
  type: 'pitch_analysis' | 'swot_analysis' | 'risk_score' | 'funding_readiness' | 'business_model' | 'summary' | 'recommendation';
  data: any;
  loading?: boolean;
}

export function AIReportCard({ type, data, loading }: AIReportCardProps) {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 text-center space-y-3">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Generating GenAI intelligence via OpenAI gpt-4o-mini...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-muted-foreground text-sm">
        No AI intelligence generated yet. Click above to run evaluation.
      </div>
    );
  }

  // Normalize nested wrappers (e.g. data.swot, data.risk, data.summary, data.recommendation)
  const payload = data[type] || data.swot || data.risk || data.summary || data.recommendation || data;

  switch (type) {
    case 'summary': {
      const summaryText = payload.executive_summary || payload.summary || payload.analysis || 'Comprehensive analysis generated.';
      const problem = payload.core_problem || payload.problem;
      const solution = payload.solution;
      const market = payload.target_market || payload.market;
      const moat = payload.competitive_moat || payload.moat;

      return (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
              <Brain className="h-5 w-5" />
              <span>Executive Briefing</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{summaryText}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {problem && (
              <div className="glass rounded-xl p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 block mb-1">Core Problem</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{problem}</p>
              </div>
            )}
            {solution && (
              <div className="glass rounded-xl p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-1">Proprietary Solution</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{solution}</p>
              </div>
            )}
            {market && (
              <div className="glass rounded-xl p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 block mb-1">Target Market</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{market}</p>
              </div>
            )}
            {moat && (
              <div className="glass rounded-xl p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-1">Competitive Moat</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{moat}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'swot_analysis': {
      const strengths = payload.strengths || [];
      const weaknesses = payload.weaknesses || [];
      const opportunities = payload.opportunities || [];
      const threats = payload.threats || [];

      return (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="glass rounded-2xl p-5 border-l-4 border-l-emerald-500 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>Strengths</span>
              </div>
              <ul className="text-xs space-y-1.5 text-muted-foreground">
                {strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="glass rounded-2xl p-5 border-l-4 border-l-amber-500 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Weaknesses</span>
              </div>
              <ul className="text-xs space-y-1.5 text-muted-foreground">
                {weaknesses.map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="glass rounded-2xl p-5 border-l-4 border-l-sky-500 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                <Target className="h-4 w-4" />
                <span>Opportunities</span>
              </div>
              <ul className="text-xs space-y-1.5 text-muted-foreground">
                {opportunities.map((o: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-sky-400 font-bold">•</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Threats */}
            <div className="glass rounded-2xl p-5 border-l-4 border-l-rose-500 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <ShieldAlert className="h-4 w-4" />
                <span>Threats</span>
              </div>
              <ul className="text-xs space-y-1.5 text-muted-foreground">
                {threats.map((t: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {payload.analysis && (
            <div className="glass rounded-xl p-4 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground block mb-1">Synthesized VC Analysis:</span>
              <p>{payload.analysis}</p>
            </div>
          )}
        </div>
      );
    }

    case 'risk_score': {
      const overallScore = payload.overall_risk_score ?? payload.overallRiskScore ?? 50;
      const riskCat = payload.risk_category || payload.riskCategory || 'Moderate';
      const narrative = payload.risk_narrative || payload.riskNarrative || 'Standard risk assessment.';
      const breakdown = payload.metrics_breakdown || payload.metricsBreakdown;
      const riskFactors = payload.risk_factors || payload.riskFactors || [];
      const mitigation = payload.mitigation_strategies || payload.mitigationStrategies || [];

      const badgeColor =
        overallScore < 40
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          : overallScore < 70
          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

      return (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Deterministic Hybrid Risk Model
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black">{overallScore}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
                <Badge className={`ml-2 ${badgeColor}`}>{riskCat} Risk</Badge>
              </div>
            </div>

            <div className="text-xs text-muted-foreground max-w-xs text-right">
              Empirically evaluated using stage (25%), traction (30%), team (25%), and financial runway (20%).
            </div>
          </div>

          {/* Qualitative OpenAI Narrative */}
          <div className="glass rounded-xl p-4 border-l-4 border-l-primary space-y-1">
            <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> OpenAI Qualitative Narrative
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">{narrative}</p>
          </div>

          {/* 4 Empirical Pillars */}
          {breakdown && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.entries(breakdown).map(([key, item]: [string, any]) => (
                <div key={key} className="glass rounded-xl p-3 text-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block truncate">
                    {key.replace('Risk', '')}
                  </span>
                  <span className="text-lg font-bold block my-0.5">{item.score || 0}</span>
                  <span className="text-[10px] text-muted-foreground truncate block">{item.factor || 'Risk'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Risk Factors */}
          {riskFactors.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground block">Key Risk Factors</span>
              <div className="grid gap-2">
                {riskFactors.map((rf: any, i: number) => (
                  <div key={i} className="glass rounded-xl p-3 text-xs flex justify-between items-start gap-2">
                    <div>
                      <span className="font-semibold text-foreground block">{rf.factor || rf.title}</span>
                      <span className="text-muted-foreground">{rf.description}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {rf.impact} Impact
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mitigation */}
          {mitigation.length > 0 && (
            <div className="glass rounded-xl p-4 space-y-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Escrow & Mitigation Recommendations
              </span>
              <ul className="text-xs space-y-1 text-muted-foreground">
                {mitigation.map((m: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    case 'recommendation': {
      const verdict = payload.verdict || 'Hold';
      const conviction = payload.conviction_score ?? payload.convictionScore ?? 80;
      const rationale = payload.rationale || 'Analysis complete.';

      const verdictBadge =
        verdict.includes('Buy')
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          : verdict.includes('Hold')
          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

      return (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                Algorithmic VC Recommendation
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-bold">{verdict}</span>
                <Badge className={verdictBadge}>{conviction}% Conviction</Badge>
              </div>
            </div>
            <Award className="h-8 w-8 text-primary opacity-80" />
          </div>

          <Separator className="bg-border/40" />

          <div>
            <span className="text-xs font-semibold text-foreground block mb-1">Investment Committee Rationale</span>
            <p className="text-xs text-muted-foreground leading-relaxed">{rationale}</p>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="glass rounded-2xl p-4 text-xs text-muted-foreground">
          <pre className="overflow-x-auto">{JSON.stringify(payload, null, 2)}</pre>
        </div>
      );
  }
}
