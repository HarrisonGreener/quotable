import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Sparkles, FileText, Calendar, Save, Receipt, PieChart, Zap, Wrench, Hammer, Paintbrush, TreePine, Drill, Users, Package, Copy, Share2, Briefcase, Gift, Clock, Flame, Wind, Car, Home, ShowerHead, Construction, Shovel, Truck, Fence, Sun, Thermometer, Key, Waves, UtensilsCrossed, Refrigerator, Cog, Anchor, Plane, Grid3X3, DoorOpen, Lightbulb, BatteryCharging } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, STRIPE_PRODUCTS } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { TradeSearchHero } from "@/components/TradeSearchHero";

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { createCheckout, isActive, loading: subLoading } = useSubscription();

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (isActive) {
      toast.info('You already have an active subscription');
      navigate('/dashboard');
      return;
    }

    try {
      await createCheckout(priceId);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    }
  };
  
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Quoting",
      description: "Create detailed quotes in seconds with automatic breakdowns for materials, labour, and overheads. Prices come from real UK supplier products wherever we can find them, and anything estimated is clearly marked for you to check."
    },
    {
      icon: Clock,
      title: "Real-Time Pricing",
      description: "Prices looked up from UK merchant sites and refreshed nightly. Every line shows where its price came from and how confident we are in it."
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Build your client database with full job histories. See all quotes, invoices, and total revenue per client at a glance."
    },
    {
      icon: Package,
      title: "Inventory System",
      description: "Store your commonly-used parts with your actual prices. AI prioritises your inventory for accurate, consistent quotes every time."
    },
    {
      icon: Copy,
      title: "Quote Templates",
      description: "Save common job configurations as templates. Quickly start new quotes from your proven setups without re-entering details."
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Drag quotes onto your calendar, set job durations by hours or days, and see 30-day payment windows. Track what's booked, complete, and paid."
    },
    {
      icon: Receipt,
      title: "One-Click Invoicing",
      description: "Turn any quote into a professional invoice instantly. Track payment status and send reminders to clients."
    },
    {
      icon: Share2,
      title: "Share & Preview PDFs",
      description: "Preview quotes and invoices before sending. Share directly via WhatsApp, email, or your phone's native share options."
    },
    {
      icon: Save,
      title: "Professional PDFs",
      description: "Export branded documents with your logo, contact details, VAT number, and bank details. Choose from three clean templates."
    },
    {
      icon: Briefcase,
      title: "Trade Profiles",
      description: "Set your primary trade, specialisations, and preferred suppliers. AI tailors every quote to your specific business context."
    },
    {
      icon: Share2,
      title: "Accept & Pay Online",
      description: "Every quote gets a link your customer can open on their phone, accept with a tap and pay the deposit through your own payment link."
    },
    {
      icon: Receipt,
      title: "Xero, QuickBooks & FreeAgent",
      description: "Export invoices in the exact import format your accounting software expects, ready for Making Tax Digital."
    },
    {
      icon: PieChart,
      title: "Tax Reports",
      description: "See your VAT breakdown, quarterly summaries, and profit margins. All financial data calculated automatically for easy reporting."
    },
    {
      icon: Sparkles,
      title: "Quote by Voice, with Photos",
      description: "Say the job out loud instead of typing, and attach site photos so the quote shows exactly what you saw."
    },
    {
      icon: FileText,
      title: "Edit Anytime",
      description: "Adjust material quantities, labour hours, or prices on the fly. Everything recalculates automatically so your totals are always accurate."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className={`pb-20 px-4 ${isMobile ? 'pt-24 min-h-[460px]' : 'pt-32 min-h-[500px]'}`}>
        <div className="container mx-auto text-center">
          <h1 className={`font-heading mb-6 text-foreground ${isMobile ? 'text-4xl' : 'text-5xl md:text-6xl lg:text-7xl'}`}>
            <span className="text-accent">Q</span>uoting, Invoicing & Scheduling
            <br />
            <span className={`text-accent inline-block mt-2 ${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl lg:text-6xl'}`}>
              Built for Tradespeople
            </span>
          </h1>
          <p className={`text-muted-foreground mb-8 max-w-2xl mx-auto ${isMobile ? 'text-base px-4' : 'text-xl'}`}>
            Create quotes, schedule jobs, track payments, and manage your tax reporting in one simple system.
          </p>
          <div className={`flex gap-4 justify-center ${isMobile ? 'flex-col px-4' : 'flex-wrap'}`}>
            <Link to="/auth" className={isMobile ? 'w-full' : ''}>
              <Button variant="accent" size="lg" className={isMobile ? 'w-full h-12' : ''}>
                Get Started
              </Button>
            </Link>
            <Link to="/auth?demo=true" className={isMobile ? 'w-full' : ''}>
              <Button variant="outline" size="lg" className={isMobile ? 'w-full h-12' : ''}>
                Try Demo
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground text-sm mt-4 max-w-md mx-auto">
            Demo mode lets you explore the software with sample data - no signup required
          </p>
        </div>
      </section>

      {/* Who It's For */}
      <section className={`pb-24 px-4 ${isMobile ? 'pt-16' : 'pt-32'}`}>
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className={`font-heading text-foreground mb-12 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            Who Quotable Works For
          </h2>
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-3 gap-4' : 'grid-cols-4 md:grid-cols-6'}`}>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Zap className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Electricians</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Wrench className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Plumbers</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Flame className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Gas Engineers</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Hammer className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Builders</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Drill className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Carpenters</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Paintbrush className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Decorators</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Home className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Roofers</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Construction className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Plasterers</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <ShowerHead className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Bathroom Fitters</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <TreePine className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Landscapers</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Shovel className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Groundworkers</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Thermometer className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">HVAC Engineers</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Car className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Auto Mechanics</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Fence className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Fencers</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Truck className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Removals</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Sun className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Solar Installers</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Key className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Locksmiths</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Grid3X3 className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Tilers</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <DoorOpen className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Window Fitters</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <UtensilsCrossed className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Kitchen Fitters</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Refrigerator className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Catering Engineers</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Cog className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Mechanical Engineers</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <Anchor className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Marine Engineers</p>
            </div>
            <div className="p-2 hover:scale-105 transition-smooth">
              <BatteryCharging className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">EV Installers</p>
            </div>
          </div>
          
          {/* Trade Search */}
          <div className="mt-12">
            <p className="text-muted-foreground text-sm mb-4">Don't see your trade? Search to check</p>
            <TradeSearchHero />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl mb-4 text-foreground">
              Simple Workflow, Start to Finish
            </h2>
            <p className="text-muted-foreground text-lg">
              From quote to payment in four straightforward steps
            </p>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-background rounded-full flex items-center justify-center font-bold text-lg">1</div>
              <div>
                <h3 className="font-heading text-xl mb-2 text-foreground">Create Your Quote</h3>
                <p className="text-muted-foreground">Describe the job (or just say it out loud) and let AI break down materials, labour, and overheads using UK supplier prices. Edit anything you need, then save or export a professional PDF with your branding.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-background rounded-full flex items-center justify-center font-bold text-lg">2</div>
              <div>
                <h3 className="font-heading text-xl mb-2 text-foreground">Schedule the Job</h3>
                <p className="text-muted-foreground">Drag your quote onto the calendar, set your start date and duration. See all your jobs laid out by week or month, with 30-day payment windows clearly marked.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-background rounded-full flex items-center justify-center font-bold text-lg">3</div>
              <div>
                <h3 className="font-heading text-xl mb-2 text-foreground">Get It Accepted</h3>
                <p className="text-muted-foreground">Send your customer a link: they read the quote on their phone, accept it with a tap and pay the deposit. When the job's done, turn it into an invoice with one click.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-background rounded-full flex items-center justify-center font-bold text-lg">4</div>
              <div>
                <h3 className="font-heading text-xl mb-2 text-foreground">Track Payments & Tax</h3>
                <p className="text-muted-foreground">Invoices carry a pay-now link, VAT is worked out for you, and exports drop straight into Xero, QuickBooks or FreeAgent for Making Tax Digital.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl mb-4 text-foreground">
              Everything You Need to Run Your Trade
            </h2>
            <p className="text-muted-foreground text-lg">
              No complicated software. Just the tools tradespeople actually use.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="p-6 border border-border rounded-lg hover:border-accent transition-smooth">
                <feature.icon className="w-10 h-10 text-accent mb-4" />
                <h3 className="font-heading text-xl mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl mb-4 text-foreground">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground text-lg mb-4">
              Choose the plan that works for you. No hidden fees.
            </p>
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full">
              <Gift className="h-5 w-5" />
              <span className="font-semibold">1 Month Free Trial on All Plans</span>
            </div>
          </div>
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
            <div className="p-8 border-2 border-border rounded-lg bg-background hover:border-accent transition-smooth">
              <h3 className="font-heading text-2xl mb-2">Monthly</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-foreground">£14.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">AI Quoting with Real-Time Pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Client Management & History</span>
                </li>
                <li className="flex items-start gap-2">
                  <Package className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Inventory & Quote Templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Smart Scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <Receipt className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">One-Click Invoicing</span>
                </li>
                <li className="flex items-start gap-2">
                  <PieChart className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Tax Reports & VAT Summaries</span>
                </li>
              </ul>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full"
                onClick={() => handleSubscribe(STRIPE_PRODUCTS.monthly.priceId)}
                disabled={subLoading}
              >
                Start Free Trial
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Then £14.99/month after trial
              </p>
            </div>
            <div className="p-8 border-2 border-accent rounded-lg bg-background relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-background px-4 py-1 rounded-full text-sm font-semibold">
                Best Value
              </div>
              <h3 className="font-heading text-2xl mb-2">Annual</h3>
              <div className="mb-2">
                <span className="text-5xl font-bold text-foreground">£159.99</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <p className="text-sm text-accent font-semibold mb-6">Save £19.89 a year</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">AI Quoting with Real-Time Pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Client Management & History</span>
                </li>
                <li className="flex items-start gap-2">
                  <Package className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Inventory & Quote Templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Smart Scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <Receipt className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">One-Click Invoicing</span>
                </li>
                <li className="flex items-start gap-2">
                  <PieChart className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Tax Reports & VAT Summaries</span>
                </li>
              </ul>
              <Button 
                variant="accent" 
                size="lg" 
                className="w-full"
                onClick={() => handleSubscribe(STRIPE_PRODUCTS.annual.priceId)}
                disabled={subLoading}
              >
                Start Free Trial
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Then £159.99/year after trial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="font-heading text-4xl mb-4 text-foreground">
            Ready to Get Your Business Organised?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Quote on site in minutes, send a link your customer can accept with a tap,
            and get paid without chasing.
          </p>
          <Link to="/auth">
            <Button variant="accent" size="lg">
              Start your free month
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
