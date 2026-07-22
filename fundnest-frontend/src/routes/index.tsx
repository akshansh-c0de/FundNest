import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import {
  Rocket, TrendingUp, Shield, Sparkles, ChevronDown, Star, Zap, Globe,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { mockStartups } from "@/lib/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FundNest — Invest in the next generation of startups" },
      { name: "description", content: "Modern fintech crowdfunding. Discover vetted startups, build a diversified portfolio, raise capital with ease." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div>
      <PublicNav />

      {/* Hero */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-28 text-center">
          <div className="inline-flex items-center gap-2 text-xs rounded-full border border-border px-3 py-1 mb-6 text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Now welcoming investors & founders for 2026 batch
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Invest in the next <br className="hidden md:block" />
            <span className="text-gradient">generation of startups</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            FundNest connects ambitious founders with global investors. Diversify into vetted, high-growth startups — or raise capital with a transparent, modern fundraising platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register"><Button size="lg" className="btn-gradient">Start investing</Button></Link>
            <Link to="/register"><Button size="lg" variant="outline">Raise capital</Button></Link>
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { k: "$240M+", v: "Invested" },
              { k: "1,200+", v: "Startups funded" },
              { k: "85K+", v: "Investors" },
              { k: "32", v: "Countries" },
            ].map((s) => (
              <div key={s.v} className="glass rounded-xl p-4">
                <div className="text-2xl font-bold text-gradient">{s.k}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Featured startups</h2>
            <p className="text-muted-foreground mt-1">Curated deals raising right now.</p>
          </div>
          <Link to="/register" className="text-sm text-muted-foreground hover:text-foreground">Browse all →</Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mockStartups.slice(0, 6).map((s) => {
            const pct = Math.round((s.raised / s.target) * 100);
            return (
              <div key={s.id} className="glass rounded-2xl p-6 hover:translate-y-[-2px] transition-transform">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl grid place-items-center text-2xl bg-accent">{s.logo}</div>
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.sector} · {s.stage}</p>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                  <div className="h-full btn-gradient" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${(s.raised / 1000).toFixed(0)}K raised</span>
                  <span>{pct}% of ${(s.target / 1000).toFixed(0)}K</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="features" className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-semibold tracking-tight text-center">How FundNest works</h2>
        <p className="text-muted-foreground mt-2 text-center">Three simple steps to get started.</p>
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {[
            { i: Rocket, t: "Create your account", d: "Sign up as investor or founder in under 2 minutes." },
            { i: Shield, t: "Verify identity", d: "Quick KYC keeps the platform secure and compliant." },
            { i: TrendingUp, t: "Invest or raise", d: "Browse vetted startups or launch your campaign." },
          ].map((x, i) => (
            <div key={x.t} className="glass rounded-2xl p-6">
              <div className="h-10 w-10 rounded-lg btn-gradient grid place-items-center mb-4">
                <x.i className="h-5 w-5 text-white" />
              </div>
              <div className="text-xs text-muted-foreground mb-1">Step {i + 1}</div>
              <h3 className="font-semibold mb-1">{x.t}</h3>
              <p className="text-sm text-muted-foreground">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section id="investors" className="max-w-7xl mx-auto px-6 pb-24 grid md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-8">
          <Zap className="h-6 w-6 text-gradient mb-4" />
          <h3 className="text-2xl font-semibold mb-3">For investors</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ Access to pre-vetted, high-growth startups</li>
            <li>✓ Diversify across sectors and stages</li>
            <li>✓ Real-time portfolio analytics</li>
            <li>✓ Low minimums, transparent fees</li>
          </ul>
        </div>
        <div id="founders" className="glass rounded-2xl p-8">
          <Globe className="h-6 w-6 text-gradient mb-4" />
          <h3 className="text-2xl font-semibold mb-3">For founders</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ Reach 85,000+ global investors</li>
            <li>✓ Manage campaigns from one dashboard</li>
            <li>✓ Built-in compliance, KYC, and reporting</li>
            <li>✓ Keep equity — flexible structures</li>
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-semibold tracking-tight text-center mb-10">Loved by investors & founders</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: "Maya R.", r: "Angel investor", q: "FundNest's dashboard is the cleanest I've used. Diversifying has never been easier." },
            { n: "Daniel K.", r: "Founder, GreenGrid", q: "We raised $1.4M in 6 weeks. The investor reporting tools alone are worth it." },
            { n: "Priya S.", r: "Investor", q: "Vetting quality is exceptional. I trust the deal flow." },
          ].map((t) => (
            <div key={t.n} className="glass rounded-2xl p-6">
              <div className="flex mb-3">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}</div>
              <p className="text-sm mb-4">"{t.q}"</p>
              <div className="text-sm font-medium">{t.n}</div>
              <div className="text-xs text-muted-foreground">{t.r}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-semibold tracking-tight text-center mb-10">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="glass rounded-2xl px-6">
          {[
            { q: "Who can invest on FundNest?", a: "Anyone 18+ that passes KYC. Some deals may be restricted to accredited investors based on jurisdiction." },
            { q: "What's the minimum investment?", a: "Most campaigns start at $100, allowing meaningful diversification across many startups." },
            { q: "How are startups vetted?", a: "Our team reviews team, traction, market and financials. Less than 5% of applicants are listed." },
            { q: "How do founders apply?", a: "Sign up as a founder, complete your startup profile, and submit for review. Typical decision in 5–10 days." },
            { q: "Is FundNest regulated?", a: "Yes — we operate under crowdfunding exemptions and partner with regulated broker-dealers where required." },
          ].map((f, i) => (
            <AccordionItem key={i} value={`q${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="glass rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Ready to join FundNest?</h2>
          <p className="text-muted-foreground mt-2">Create your free account in 2 minutes.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/register"><Button size="lg" className="btn-gradient">Create account</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">Sign in</Button></Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-wrap justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} FundNest. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
