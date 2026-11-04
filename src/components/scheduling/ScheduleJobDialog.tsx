import { useState, useEffect } from "react";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DemoModeDialog } from "@/components/DemoModeDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScheduleJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedQuote: any;
  selectedDate: Date | null;
  isDemo: boolean;
}

export const ScheduleJobDialog = ({
  open,
  onOpenChange,
  selectedQuote,
  selectedDate,
  isDemo,
}: ScheduleJobDialogProps) => {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState<Date | undefined>(selectedDate || undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [durationType, setDurationType] = useState<"hours" | "days">("days");
  const [durationDays, setDurationDays] = useState(1);
  const [durationHours, setDurationHours] = useState(4);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlappingJobs, setOverlappingJobs] = useState<any[]>([]);
  const [showForceScheduleDialog, setShowForceScheduleDialog] = useState(false);
  const [forceSchedule, setForceSchedule] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      setStartDate(selectedDate);
      setError(null);
    }
  }, [selectedDate]);

  // Check for overlapping schedules
  useEffect(() => {
    const checkOverlaps = async () => {
      if (!startDate || isDemo) {
        setOverlappingJobs([]);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch all schedules for this user
        const { data: schedules, error: fetchError } = await supabase
          .from("schedules")
          .select("*, quotes(*)")
          .eq("user_id", user.id);

        if (fetchError) throw fetchError;
        if (!schedules) return;

        // Calculate the time range for the current selection
        const currentStartTime = startTime;
        const [startHour, startMinute] = currentStartTime.split(':').map(Number);
        
        const overlaps = schedules.filter((schedule: any) => {
          // Skip if it's the same quote (editing scenario)
          if (selectedQuote && schedule.quote_id === selectedQuote.id) return false;

          const scheduleStartDate = new Date(schedule.start_date);
          const scheduleEndDate = new Date(schedule.end_date);
          const scheduleDurationHours = schedule.duration_hours || 0;
          const scheduleDurationDays = schedule.duration_days || 0;

          if (durationType === "hours" && scheduleDurationHours > 0) {
            // Hour-based overlap check: same day and overlapping time ranges
            if (!isSameDay(startDate, scheduleStartDate)) return false;

            const [scheduleStartHour, scheduleStartMinute] = (schedule.start_time || "09:00").split(':').map(Number);
            const scheduleEndHour = scheduleStartHour + scheduleDurationHours;
            const currentEndHour = startHour + durationHours;

            // Check if time ranges overlap
            return (
              (startHour >= scheduleStartHour && startHour < scheduleEndHour) ||
              (currentEndHour > scheduleStartHour && currentEndHour <= scheduleEndHour) ||
              (startHour <= scheduleStartHour && currentEndHour >= scheduleEndHour)
            );
          } else if (durationType === "days" || scheduleDurationDays > 0) {
            // Day-based overlap check: overlapping date ranges
            const currentEndDate = addDays(startDate, durationDays - 1);
            
            return (
              (startDate >= scheduleStartDate && startDate <= scheduleEndDate) ||
              (currentEndDate >= scheduleStartDate && currentEndDate <= scheduleEndDate) ||
              (startDate <= scheduleStartDate && currentEndDate >= scheduleEndDate)
            );
          }

          return false;
        });

        setOverlappingJobs(overlaps);
      } catch (error) {
        console.error("Error checking overlaps:", error);
      }
    };

    checkOverlaps();
  }, [startDate, startTime, durationType, durationDays, durationHours, isDemo, selectedQuote]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setError("Please select a valid date");
      setStartDate(undefined);
      return;
    }

    // Clear any previous errors
    setError(null);
    setStartDate(date);
  };

  const handleSchedule = async () => {
    if (isDemo) {
      setShowDemoDialog(true);
      return;
    }

    if (!selectedQuote) {
      setError("Please select a quote to schedule");
      toast.error("Please select a quote to schedule");
      return;
    }

    if (!startDate) {
      setError("Please select a start date");
      toast.error("Please select a start date");
      return;
    }

    if (durationType === "days" && durationDays < 1) {
      setError("Duration must be at least 1 day");
      toast.error("Duration must be at least 1 day");
      return;
    }

    if (durationType === "hours" && durationHours < 1) {
      setError("Duration must be at least 1 hour");
      toast.error("Duration must be at least 1 hour");
      return;
    }

    // Check for overlaps and show confirmation dialog if found
    if (overlappingJobs.length > 0 && !forceSchedule) {
      setShowForceScheduleDialog(true);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const endDate = durationType === "days" 
        ? addDays(startDate, durationDays - 1)
        : startDate;

      const { error: insertError } = await supabase.from("schedules").insert({
        user_id: user.id,
        quote_id: selectedQuote.id,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        start_time: startTime,
        duration_days: durationType === "days" ? durationDays : 0,
        duration_hours: durationType === "hours" ? durationHours : 0,
        notes: notes,
      });

      if (insertError) throw insertError;

      // Update quote status to Scheduled
      await supabase
        .from("quotes")
        .update({ status: "Scheduled" })
        .eq("id", selectedQuote.id);

      toast.success("Job scheduled successfully", {
        description: forceSchedule 
          ? `Force scheduled for ${format(startDate, "MMM d, yyyy")} despite conflicts`
          : `Scheduled for ${format(startDate, "MMM d, yyyy")}`
      });
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      
      onOpenChange(false);
      setNotes("");
      setDurationType("days");
      setDurationDays(1);
      setDurationHours(4);
      setStartDate(undefined);
      setStartTime("09:00");
      setForceSchedule(false);
    } catch (error) {
      console.error("Error scheduling job:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to schedule job";
      setError(errorMessage);
      toast.error("Failed to schedule job", {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const endDate = startDate && durationType === "days" 
    ? addDays(startDate, durationDays - 1) 
    : startDate;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Schedule Job</DialogTitle>
            <DialogDescription>
              {selectedQuote 
                ? `Schedule "${selectedQuote.title}" for ${selectedQuote.client}` 
                : "Select a quote and date to schedule"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm border border-destructive/20">
                {error}
              </div>
            )}

            {overlappingJobs.length > 0 && (
              <Alert variant="destructive" className="border-orange-500 bg-orange-500/10">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-900 dark:text-orange-200">
                  <strong>Scheduling Conflict:</strong> This time slot overlaps with {overlappingJobs.length} existing {overlappingJobs.length === 1 ? 'job' : 'jobs'}:
                  <ul className="mt-2 space-y-1 text-sm">
                    {overlappingJobs.map((job: any) => (
                      <li key={job.id} className="flex items-start gap-2">
                        <span className="text-orange-600 dark:text-orange-400">•</span>
                        <span>
                          <strong>{job.quotes?.client}</strong> - {job.quotes?.title}
                          {job.duration_hours > 0 && (
                            <span className="text-xs ml-1">
                              ({job.start_time} - {(() => {
                                const [h, m] = job.start_time.split(':').map(Number);
                                const endH = h + job.duration_hours;
                                return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                              })()})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => {
                      // Allow today and future dates unless in demo mode
                      if (isDemo) return false;
                      const today = startOfDay(new Date());
                      return date < today;
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Select today or any future date
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="start-time" className="pl-9">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                      const timeOptions = [0, 30].map((minute) => {
                        const h = hour.toString().padStart(2, '0');
                        const m = minute.toString().padStart(2, '0');
                        const time = `${h}:${m}`;
                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                        const period = hour < 12 ? 'AM' : 'PM';
                        const displayTime = `${displayHour}:${m} ${period}`;
                        return { value: time, label: displayTime };
                      });
                      return timeOptions.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ));
                    })}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                When the job is scheduled to start
              </p>
            </div>

            {/* Duration Type Toggle */}
            <div className="space-y-2">
              <Label>Duration Type</Label>
              <Tabs value={durationType} onValueChange={(v) => setDurationType(v as "hours" | "days")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="hours">Hours</TabsTrigger>
                  <TabsTrigger value="days">Days</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">
                {durationType === "hours" ? "Duration (hours) *" : "Duration (days) *"}
              </Label>
              {durationType === "hours" ? (
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="24"
                  value={durationHours === 0 ? '' : durationHours}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setDurationHours(0);
                      setError(null);
                      return;
                    }
                    const value = parseInt(val);
                    if (!Number.isNaN(value) && value > 0 && value <= 24) {
                      setDurationHours(value);
                      setError(null);
                    }
                  }}
                />
              ) : (
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="365"
                  value={durationDays === 0 ? '' : durationDays}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setDurationDays(0);
                      setError(null);
                      return;
                    }
                    const value = parseInt(val);
                    if (!Number.isNaN(value) && value > 0 && value <= 365) {
                      setDurationDays(value);
                      setError(null);
                    }
                  }}
                />
              )}
              <p className="text-xs text-muted-foreground">
                {durationType === "hours" 
                  ? "Enter the number of hours (1-24)" 
                  : "Enter the number of days this job will take"}
              </p>
            </div>

            {startDate && (
              <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start:</span>
                  <span className="font-medium">{format(startDate, "EEE, MMM d, yyyy")} at {startTime}</span>
                </div>
                {durationType === "hours" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End:</span>
                      <span className="font-medium">
                        {format(startDate, "EEE, MMM d, yyyy")} at {
                          (() => {
                            const [hours, minutes] = startTime.split(':').map(Number);
                            const endHours = (hours + durationHours) % 24;
                            return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                          })()
                        }
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-semibold">{durationHours} {durationHours === 1 ? 'hour' : 'hours'}</span>
                    </div>
                  </>
                ) : endDate && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End:</span>
                      <span className="font-medium">{format(endDate, "EEE, MMM d, yyyy")}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-muted-foreground">Total Duration:</span>
                      <span className="font-semibold">{durationDays} {durationDays === 1 ? 'day' : 'days'}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions or requirements..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSchedule} 
              disabled={loading || !selectedQuote || !startDate}
            >
              {loading ? "Scheduling..." : "Schedule Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DemoModeDialog 
        open={showDemoDialog} 
        onOpenChange={setShowDemoDialog} 
      />

      {/* Force Schedule Confirmation Dialog */}
      <Dialog open={showForceScheduleDialog} onOpenChange={setShowForceScheduleDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Scheduling Conflict Detected
            </DialogTitle>
            <DialogDescription>
              This job overlaps with {overlappingJobs.length} existing {overlappingJobs.length === 1 ? 'job' : 'jobs'}. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-2">Conflicting Jobs:</p>
              <ul className="space-y-2">
                {overlappingJobs.map((job: any) => (
                  <li key={job.id} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400">•</span>
                    <div>
                      <div className="font-medium text-foreground">{job.quotes?.client}</div>
                      <div>{job.quotes?.title}</div>
                      {job.duration_hours > 0 ? (
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(job.start_date), "MMM d, yyyy")} at {job.start_time} 
                          ({job.duration_hours}h)
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(job.start_date), "MMM d")} - {format(new Date(job.end_date), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Force scheduling will create this job despite the time conflict. You may need to adjust resources or timing later.
            </p>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowForceScheduleDialog(false);
                setForceSchedule(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={() => {
                setForceSchedule(true);
                setShowForceScheduleDialog(false);
                handleSchedule();
              }}
            >
              Force Schedule Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
