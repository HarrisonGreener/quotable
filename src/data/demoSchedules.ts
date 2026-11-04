// Demo schedules for Smart Scheduling in demo mode
export interface DemoSchedule {
  id: string;
  quoteId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  durationDays: number;
  durationHours: number;
  notes: string;
}

export const getDemoSchedules = (): DemoSchedule[] => {
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Schedule Q-001 (Approved kitchen job) - completed
  const kitchenStart = new Date(today);
  kitchenStart.setDate(today.getDate() - 10);
  const kitchenEnd = new Date(kitchenStart);
  kitchenEnd.setDate(kitchenStart.getDate() + 4); // 5 day job

  // Schedule Q-003 (Approved deck job) - ongoing
  const deckStart = new Date(today);
  deckStart.setDate(today.getDate() - 2);
  const deckEnd = new Date(deckStart);
  deckEnd.setDate(deckStart.getDate() + 6); // 7 day job

  // Schedule Q-005 (Approved landscaping) - upcoming
  const landscapeStart = new Date(today);
  landscapeStart.setDate(today.getDate() + 5);
  const landscapeEnd = new Date(landscapeStart);
  landscapeEnd.setDate(landscapeStart.getDate() + 4); // 5 day job

  // Schedule Q-007 (Approved painting) - starting soon
  const paintingStart = new Date(today);
  paintingStart.setDate(today.getDate() + 14);
  const paintingEnd = new Date(paintingStart);
  paintingEnd.setDate(paintingStart.getDate() + 5); // 6 day job

  return [
    {
      id: "SCH-001",
      quoteId: "Q-001",
      startDate: formatDate(kitchenStart),
      endDate: formatDate(kitchenEnd),
      startTime: "08:00:00",
      durationDays: 5,
      durationHours: 0,
      notes: "Kitchen renovation completed successfully",
    },
    {
      id: "SCH-002",
      quoteId: "Q-003",
      startDate: formatDate(deckStart),
      endDate: formatDate(deckEnd),
      startTime: "09:30:00",
      durationDays: 0,
      durationHours: 4,
      notes: "Weather dependent - ongoing work",
    },
    {
      id: "SCH-003",
      quoteId: "Q-005",
      startDate: formatDate(landscapeStart),
      endDate: formatDate(landscapeEnd),
      startTime: "10:00:00",
      durationDays: 5,
      durationHours: 0,
      notes: "Garden landscaping scheduled",
    },
    {
      id: "SCH-004",
      quoteId: "Q-007",
      startDate: formatDate(paintingStart),
      endDate: formatDate(paintingEnd),
      startTime: "07:00:00",
      durationDays: 0,
      durationHours: 6,
      notes: "Full house interior painting",
    },
  ];
};
