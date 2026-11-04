import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DemoModeAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DemoModeAlert = ({ open, onOpenChange }: DemoModeAlertProps) => {
  const navigate = useNavigate();
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Demo Mode - Changes Not Saved</AlertDialogTitle>
          <AlertDialogDescription>
            You're viewing demo data. To save your work and access all features, subscribe to Quotable Pro.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => {
            onOpenChange(false);
            navigate("/auth");
          }}>
            Get Quotable Pro
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
