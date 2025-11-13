import React from 'react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ title, desc, icon }: { title: string; desc: string; icon?: React.ReactNode }) => (
  <div className="bg-card/70 dark:bg-card p-6 rounded-xl shadow-md border border-border">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
        {icon || <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4"/></svg>}
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  </div>
);

const LandingPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container py-20">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">NutriMap — Better child nutrition, connected teams</h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              NutriMap helps community health workers and nutritionists record, track and act on child anthropometry and follow-ups — with simple offline-friendly workflows and powerful analytics for program managers.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground shadow hover:opacity-95">
                Get started
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border text-foreground bg-card/50 hover:bg-card">
                Learn more
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 max-w-md text-sm text-muted-foreground">
              <div>
                <strong className="text-foreground">Trusted</strong>
                <div>by CHWs & Nutrition teams</div>
              </div>
              <div>
                <strong className="text-foreground">Secure</strong>
                <div>GDPR-like data privacy practices</div>
              </div>
            </div>
          </div>

          <div className="order-first lg:order-last">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-border bg-gradient-to-br from-[#0f172a] to-[#0b1220] p-6">
              <img src="/hero-screenshot.png" alt="App preview" className="w-full rounded-md shadow-md" />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-card/40 dark:bg-card py-20">
        <div className="container">
          <h2 className="text-2xl font-bold">Core features</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">Everything your nutrition program needs: simple child registration, follow-up workflows, secure conversations, and reports.</p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <FeatureCard title="Register & track children" desc="Quickly capture anthropometry, location and family data in a compact form that's mobile friendly." />
            <FeatureCard title="Follow-ups & trends" desc="Record repeat visits, visualize growth charts, and flag malnutrition cases for action." />
            <FeatureCard title="Team conversations" desc="Secure, role-scoped conversations for CHWs and nutritionists to triage children collaboratively." />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <h2 className="text-2xl font-bold">Why NutriMap</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold">Built for low-connectivity</h3>
              <p className="mt-2 text-muted-foreground">Works on low-end devices and is forgiving of flaky networks — designed around real CHW workflows.</p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold">Evidence-driven insights</h3>
              <p className="mt-2 text-muted-foreground">Exportable reports and visual analytics help program managers target resources effectively.</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground shadow">
              Try NutriMap — Log in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} NutriMap — Built for community health</div>
          <div className="flex gap-4">
            <a className="hover:underline" href="#">Privacy</a>
            <a className="hover:underline" href="#">Docs</a>
            <a className="hover:underline" href="#">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
