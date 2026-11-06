import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { LegalDialogBody } from "@/components/LegalDialogBody";
import { termsIntro, termsSections } from "@/pages/Terms";
import { TERMS_VERSION, LEGAL_UPDATED } from "@/config/legal";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
}

// Same text as the /terms page, so there's only one version of it.
export const TermsDialog = ({ open, onOpenChange, onAccept }: TermsDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-3xl max-h-[85vh] w-[calc(100vw-2rem)]">
      <DialogHeader>
        <DialogTitle className="text-2xl">Terms and conditions</DialogTitle>
        <DialogDescription>Version {TERMS_VERSION} · last updated {LEGAL_UPDATED}</DialogDescription>
      </DialogHeader>
      <ScrollArea className="h-[60vh] pr-4">
        <LegalDialogBody intro={termsIntro} sections={termsSections} />
      </ScrollArea>
      {onAccept && (
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onAccept(); onOpenChange(false); }}>I accept</Button>
        </div>
      )}
    </DialogContent>
  </Dialog>
);
