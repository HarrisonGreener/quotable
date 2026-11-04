import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Receipt, Calendar, CheckCircle, Building2, Palette } from "lucide-react";

interface WelcomeTourProps {
  open: boolean;
  onComplete: () => void;
}

const tourSteps = [
  {
    icon: Sparkles,
    title: "Welcome to Quotable!",
    description: "Your all-in-one solution for quotes, invoices, and job scheduling. Let's show you around.",
  },
  {
    icon: Building2,
    title: "Brand Your Documents",
    description: "Your quotes and invoices display YOUR brand - company name, logo, address, and bank details. Complete your Account Settings to create professional PDFs that impress clients.",
  },
  {
    icon: Palette,
    title: "Choose Your Template",
    description: "Pick from 3 beautiful PDF templates: Minimalist for a clean look, Modern with bold accents, or Classic for traditional style. Find them in Account Settings.",
  },
  {
    icon: FileText,
    title: "AI-Powered Quotes",
    description: "Generate professional quotes in seconds using AI. Just describe the job, and we'll handle the rest with accurate pricing and detailed breakdowns.",
  },
  {
    icon: Receipt,
    title: "Easy Invoicing",
    description: "Convert quotes to invoices instantly or create standalone invoices. Track payments and manage your cash flow effortlessly.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Drag and drop quotes onto your calendar, set durations, and track payment windows. Keep your projects organized in one place.",
  },
  {
    icon: CheckCircle,
    title: "First Step: Complete Your Profile",
    description: "Head to Account Settings first to add your logo, address, and bank details. This ensures your PDFs look fully professional from day one!",
  },
];

export const WelcomeTour = ({ open, onComplete }: WelcomeTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === tourSteps.length - 1;
  const step = tourSteps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onComplete}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <StepIcon className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">{step.title}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center gap-1 py-4">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentStep
                  ? "bg-primary w-8"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          {!isLastStep && (
            <Button
              variant="ghost"
              onClick={handleSkip}
            >
              Skip Tour
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="w-full sm:w-auto"
          >
            {isLastStep ? "Get Started" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
