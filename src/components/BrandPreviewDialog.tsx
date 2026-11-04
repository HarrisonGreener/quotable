import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BrandPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandSettings: any;
}

export const BrandPreviewDialog = ({ open, onOpenChange, brandSettings }: BrandPreviewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">PDF Branding Preview</DialogTitle>
        </DialogHeader>
        <div className="border border-border rounded-lg bg-background overflow-hidden">
          {/* Brand Info Section - Sits above quote */}
          <div className="bg-muted/30 p-8 border-b-2 border-primary/20">
            {brandSettings?.company_name && (
              <h1 className="text-3xl font-bold text-foreground mb-3">
                {brandSettings.company_name.toUpperCase()}
              </h1>
            )}
            <div className="space-y-1.5 text-sm text-muted-foreground">
              {brandSettings?.address && (
                <p>{brandSettings.address}</p>
              )}
              {brandSettings?.phone && (
                <p>Tel: {brandSettings.phone}</p>
              )}
              {brandSettings?.email && (
                <p>Email: {brandSettings.email}</p>
              )}
              {brandSettings?.website && (
                <p>Web: {brandSettings.website}</p>
              )}
              {brandSettings?.vat_number && (
                <p className="font-medium">VAT: {brandSettings.vat_number}</p>
              )}
            </div>
          </div>

          {/* Quote Section - Sits below brand info */}
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-foreground">QUOTATION</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex">
                <span className="font-semibold text-foreground w-24">Project:</span>
                <span className="text-muted-foreground">Sample Project</span>
              </div>
              <div className="flex">
                <span className="font-semibold text-foreground w-24">Client:</span>
                <span className="text-muted-foreground">Sample Client</span>
              </div>
              <div className="flex">
                <span className="font-semibold text-foreground w-24">Date:</span>
                <span className="text-muted-foreground">{new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          </div>

          {!brandSettings && (
            <div className="text-center py-12 px-8 text-muted-foreground">
              <p className="font-medium">No brand settings configured</p>
              <p className="text-sm mt-2">Add your company details in Account to see them here</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};