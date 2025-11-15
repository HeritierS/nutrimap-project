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
  const email = 'nutrimap@nutrimap.rw';
  const phone = '+250780065114';

  const openMail = (subject = '') => {
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    window.location.href = mailto;
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Public header */}
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-4">
            {/* Use existing app logo if present in public/ */}
            <img src="/logo.png" alt="NutriMap" className="h-10 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:underline">Home</Link>
            <a href="#what-we-do" className="text-sm font-medium hover:underline">What we do</a>
            <a href="#where" className="text-sm font-medium hover:underline">Where we work</a>
            <a href="#contact" className="text-sm font-medium hover:underline">Contact</a>
            <Link to="/login" className="ml-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground">Log in</Link>
          </nav>

          <div className="md:hidden">
            <Link to="/login" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground">Log in</Link>
          </div>
        </div>
      </header>

      <section className="container py-20">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">NutriMap</h1>
            <h2 className="text-2xl mt-1 text-muted-foreground max-w-xl">Mapping child nutrition and connecting community health teams in Rwanda</h2>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              NutriMap helps community health workers and nutritionists record, track and act on child anthropometry and follow-ups — with simple mobile-first workflows, secure team communication and program-level reports for managers.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground shadow hover:opacity-95">
                Log in
              </Link>
              <button onClick={() => openMail('General enquiry - NutriMap')} className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border text-foreground bg-card/50 hover:bg-card">
                Contact Admin
              </button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 max-w-md text-sm text-muted-foreground">
              <div>
                <strong className="text-foreground">Email</strong>
                <div className="break-words"><a href={`mailto:${email}`} className="hover:underline">{email}</a></div>
              </div>
              <div>
                <strong className="text-foreground">Phone</strong>
                <div><a href={`tel:${phone}`} className="hover:underline">{phone}</a></div>
              </div>
            </div>
          </div>

          <div className="order-first lg:order-last">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-border bg-gradient-to-br from-[#f7fafc] to-[#edf2f7] p-6 flex items-center justify-center">
              {/* If a hero screenshot exists at /hero-screenshot.png use it, otherwise fall back to the app logo */}
              <img src="/hero-screenshot.png" alt="App preview" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }} className="w-full rounded-md shadow-md max-w-md object-contain" />
            </div>
          </div>
        </div>
      </section>

      <section id="what-we-do" className="bg-card/40 dark:bg-card py-16">
        <div className="container">
          <div className="md:flex md:items-start md:gap-8">
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold">What we do</h3>
              <p className="mt-4 text-muted-foreground">We make it easy for CHWs to collect child health and nutrition data, follow-up on growth, and collaborate with nutritionists and program managers. Key capabilities include:</p>

              <ul className="mt-4 space-y-2 list-disc list-inside text-muted-foreground">
                <li>Mobile-friendly child registration and anthropometry capture</li>
                <li>Repeat visit tracking, growth trends, and flags for malnutrition</li>
                <li>Secure team conversations and CHW-to-supervisor approvals</li>
                <li>Program-level reports and exports for managers</li>
              </ul>
            </div>

            <div className="mt-6 md:mt-0 md:w-1/2">
              <h4 className="text-lg font-semibold">Where we work in Rwanda (currently)</h4>
              <p className="mt-2 text-muted-foreground">NutriMap is active with partners across several provinces in Rwanda. If you'd like to add your district or partner with us, contact the admin below.</p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="bg-card p-3 rounded border border-border">Kigali City</div>
                <div className="bg-card p-3 rounded border border-border">Southern Province</div>
                <div className="bg-card p-3 rounded border border-border">Eastern Province</div>
                <div className="bg-card p-3 rounded border border-border">Western Province</div>
                <div className="bg-card p-3 rounded border border-border">Northern Province</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16">
        <div className="container grid gap-6 md:grid-cols-2">
          <div className="bg-card p-6 rounded-xl border border-border">
            <h3 className="text-xl font-bold">Contact admin</h3>
            <p className="mt-2 text-muted-foreground">For system enquiries, CHW approval requests or partnership inquiries, contact the admin below. We'll route your message to the right team.</p>

            <div className="mt-4 space-y-3">
              <div>
                <strong>Email:</strong> <a href={`mailto:${email}`} className="hover:underline">{email}</a>
              </div>
              <div>
                <strong>Phone:</strong> <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => openMail('System enquiry - NutriMap')} className="px-4 py-2 rounded bg-primary text-primary-foreground">Send enquiry</button>
              <button onClick={() => openMail('CHW approval request - NutriMap')} className="px-4 py-2 rounded border border-border">Request CHW approval</button>
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl border border-border">
            <h3 className="text-xl font-bold">Quick message</h3>
            <p className="mt-2 text-muted-foreground">Fill a short message — clicking send will open your email client so the admin can receive your request directly.</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement & { subject: HTMLInputElement; message: HTMLTextAreaElement };
              const subject = form.subject.value || 'Website message';
              const body = form.message.value || '';
              window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            }} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm">Subject</label>
                <input name="subject" className="w-full mt-1 px-3 py-2 rounded border border-border bg-transparent" placeholder="Subject" />
              </div>
              <div>
                <label className="block text-sm">Message</label>
                <textarea name="message" rows={5} className="w-full mt-1 px-3 py-2 rounded border border-border bg-transparent" placeholder="Write your message here" />
              </div>
              <div>
                <button type="submit" className="px-4 py-2 rounded bg-primary text-primary-foreground">Send message</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-card/30 py-8 border-t border-border">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} NutriMap — Built for community health in Rwanda</div>
          <div className="flex gap-4 items-center">
            <div>
              <strong>Contacts:</strong>
            </div>
            <a href={`mailto:${email}`} className="hover:underline">{email}</a>
            <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
