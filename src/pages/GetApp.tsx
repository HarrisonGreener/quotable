import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { InstallGuide } from "@/components/InstallApp";
import { usePageMeta, type PageMeta } from "@/seo/meta";
import { OFFER } from "@/config/offer";

export const appMeta: PageMeta = {
  path: "/app",
  title: "Get the Quotable app on your phone | Quotable",
  description: "Add Quotable to your iPhone or Android home screen in four taps. It opens full screen like any other app, with no app store download.",
};

const GetApp = () => {
  usePageMeta(appMeta);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 pt-24 sm:pt-32 pb-20">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-[clamp(2rem,4.5vw,3rem)] leading-tight text-primary text-balance">Get Quotable on your phone</h1>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80">
            Add Quotable to your home screen and it works like an app: one tap to open, full screen, no browser bars.
            There's nothing to download from an app store, and it updates itself.
          </p>
          <div className="mt-10">
            <InstallGuide />
          </div>
          <section className="mt-12 space-y-3 text-foreground/80 leading-relaxed">
            <h2 className="text-xl text-primary">Good to know</h2>
            <p>You stay signed in, so opening it from your home screen takes you straight to your quotes and jobs.</p>
            <p>To remove it, press and hold the icon and choose Remove (iPhone) or Uninstall (Android). Your account and data aren't affected.</p>
          </section>
          <div className="mt-12 flex flex-col sm:flex-row gap-3">
            <Button asChild variant="accent" size="lg" className="h-12 px-6"><Link to="/auth">{OFFER.button}</Link></Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6"><Link to="/dashboard">Open Quotable</Link></Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GetApp;
