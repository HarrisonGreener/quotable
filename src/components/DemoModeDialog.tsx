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

interface DemoModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DemoModeDialog = ({ open, onOpenChange }: DemoModeDialogProps) => {
  const navigate = useNavigate();
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Demo Mode Restriction</AlertDialogTitle>
          <AlertDialogDescription>
            Demo mode is for preview only. Create an account to save your own quotes and invoices.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => navigate("/auth")}>
            Sign Up / Log In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
