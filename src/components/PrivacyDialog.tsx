import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { LegalDialogBody } from "@/components/LegalDialogBody";
import { privacyIntro, privacySections } from "@/pages/Privacy";
import { PRIVACY_VERSION, LEGAL_UPDATED } from "@/config/legal";

interface PrivacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
}

// Same text as the /privacy page, so there's only one version of it.
export const PrivacyDialog = ({ open, onOpenChange, onAccept }: PrivacyDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-3xl max-h-[85vh] w-[calc(100vw-2rem)]">
      <DialogHeader>
        <DialogTitle className="text-2xl">Privacy policy</DialogTitle>
        <DialogDescription>Version {PRIVACY_VERSION} · last updated {LEGAL_UPDATED}</DialogDescription>
      </DialogHeader>
      <ScrollArea className="h-[60vh] pr-4">
        <LegalDialogBody intro={privacyIntro} sections={privacySections} />
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
