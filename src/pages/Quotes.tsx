import { useState, useEffect, useMemo, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandPreviewDialog } from "@/components/BrandPreviewDialog";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from 'jspdf';
import { generateQuotePDF, generateQuotePDFBlob, isBrandComplete } from "@/utils/pdfTemplates";
import { PDFPreviewShareDialog } from "@/components/PDFPreviewShareDialog";
import { BrandCompletionNotice } from "@/components/BrandCompletionNotice";
import { DemoModeNotice } from "@/components/DemoModeNotice";
import { QuoteActionsDialog } from "@/components/QuoteActionsDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useQuoteTemplates } from "@/hooks/useQuoteTemplates";
import { useClients } from "@/hooks/useClients";
import { useInventory } from "@/hooks/useInventory";
import { ClientAutocomplete } from "@/components/ClientAutocomplete";
import { SaveAsClientButton } from "@/components/SaveAsClientButton";
import {
  Sparkles, 
  Edit3, 
  Zap, 
  Save, 
  FileDown,
  Search,
  Edit,
  Eye,
  Undo,
  Trash2,
  Filter,
  X,
  CheckCircle,
  XCircle,
  FileText,
  BookTemplate,
  Plus,
  Copy,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { demoQuotes, demoInvoices, demoStats } from "@/data/demoData";
import { getDemoData, setDemoData } from "@/utils/demoMode";
import { TradeAutocomplete } from "@/components/TradeAutocomplete";
import { ALL_TRADES } from "@/data/trades";
import { Footer } from "@/components/Footer";
import { QuoteListSkeleton } from "@/components/skeletons/QuoteCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { PriceSourceLegend } from "@/components/PriceSourceLegend";
import { QuoteConfidenceBadge } from "@/components/QuoteConfidenceBadge";
import { VoiceInputButton, appendDictation } from "@/components/VoiceInputButton";
import { QuotePhotos, type QuotePhoto } from "@/components/QuotePhotos";
import { SendLinkButton } from "@/components/SendLinkButton";
import { getSupplierSearchUrl, generateSupplierUrl } from "@/data/supplierMappings";
import { Package } from "lucide-react";
interface QuoteMaterial {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number | null;
  cost: number | null;
  fromInventory?: boolean;
  inventoryItemId?: string;
  priceSource?: string;
  priceConfidence?: number;
  lastPriceUpdate?: string;
  supplierUrl?: string;
  matchedProduct?: string;
  needsVerification?: boolean;
}

interface QuoteLabour {
  name: string;
  hours: number;
  rate: number;
  cost: number | null;
  workers?: number;
  unit?: 'hours' | 'days';
}

interface QuoteOverhead {
  name: string;
  cost: number | null;
}

interface QuoteBreakdown {
  projectTitle: string;
  materials: QuoteMaterial[];
  optional_materials?: QuoteMaterial[];
  labour: QuoteLabour[];
  overheads: QuoteOverhead[];
  suggested_overheads?: QuoteOverhead[];
  condensed_version?: {
    projectTitle: string;
    summary_description: string;
    materials_total: number;
    labour_total: number;
    overheads_total: number;
    optional_materials_total: number;
    grand_total: number;
  };
}

const Quotes = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDemo = searchParams.get("demo") === "true";
  const isMobile = useIsMobile();
  const { settings: appSettings } = useAppSettings();
  const { data: templates = [], isLoading: isLoadingTemplates, refetch: refetchTemplates } = useQuoteTemplates(!isDemo);
  const { clients } = useClients(!isDemo);
  const { inventory } = useInventory(!isDemo);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [quoteBreakdown, setQuoteBreakdown] = useState<QuoteBreakdown | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [photos, setPhotos] = useState<QuotePhoto[]>([]);
  const [client, setClient] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [lookingUpPostcode, setLookingUpPostcode] = useState(false);
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAdjusterDialog, setShowAdjusterDialog] = useState(false);
  const [showBrandPreviewDialog, setShowBrandPreviewDialog] = useState(false);
  const [editedQuote, setEditedQuote] = useState<QuoteBreakdown | null>(null);
  const [originalQuote, setOriginalQuote] = useState<QuoteBreakdown | null>(null);
  const [adjustmentPrompt, setAdjustmentPrompt] = useState("");
  const [savedQuotes, setSavedQuotes] = useState<any[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [brandSettings, setBrandSettings] = useState<any>(null);
  const [pdfTemplate, setPdfTemplate] = useState<"minimalist" | "modern" | "classic">("minimalist");
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [selectedQuoteForAction, setSelectedQuoteForAction] = useState<any>(null);
  const [showQuoteActionsDialog, setShowQuoteActionsDialog] = useState(false);
  
  // Pre-quote checkboxes
  const [equipmentRental, setEquipmentRental] = useState(false);
  const [equipmentRentalDetails, setEquipmentRentalDetails] = useState("");
  const [isGeneratorMinimized, setIsGeneratorMinimized] = useState(false);
  const [numWorkers, setNumWorkers] = useState(1);
  const [paymentType, setPaymentType] = useState<"hourly" | "day" | "job">("job");
  const [hourlyRate, setHourlyRate] = useState(45);
  const [dayRate, setDayRate] = useState(250);
  const [includeCalloutFee, setIncludeCalloutFee] = useState(false);
  const [includeEstimates, setIncludeEstimates] = useState(!appSettings.skip_ai_pricing);
  const [suggestedOverheads, setSuggestedOverheads] = useState<QuoteOverhead[]>([]);

  // Load settings and pre-fill defaults
  useEffect(() => {
    if (appSettings.default_hourly_rate && hourlyRate === 45) {
      setHourlyRate(appSettings.default_hourly_rate);
    }
    if (appSettings.default_day_rate && dayRate === 250) {
      setDayRate(appSettings.default_day_rate);
    }
  }, [appSettings.default_hourly_rate, appSettings.default_day_rate]);

  // Sync includeEstimates with persisted skip_ai_pricing setting
  useEffect(() => {
    setIncludeEstimates(!appSettings.skip_ai_pricing);
  }, [appSettings.skip_ai_pricing]);

  // Auto-fill hourly rate when switching to hourly payment
  useEffect(() => {
    if (paymentType === 'hourly' && appSettings.default_hourly_rate) {
      setHourlyRate(appSettings.default_hourly_rate);
    }
    if (paymentType === 'day' && appSettings.default_day_rate) {
      setDayRate(appSettings.default_day_rate);
    }
  }, [paymentType, appSettings.default_hourly_rate, appSettings.default_day_rate]);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("saved");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Pre-fill category from user's trade profile
  useEffect(() => {
    if (!isDemo && appSettings.primary_trade && !category && draftLoaded) {
      setCategory(appSettings.primary_trade);
    }
  }, [appSettings.primary_trade, isDemo, category, draftLoaded]);

  // Template management state
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showEditTemplateDialog, setShowEditTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [showDeleteTemplateDialog, setShowDeleteTemplateDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // PDF Preview & Share state
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState<{
    blobUrl: string;
    blob: Blob;
    fileName: string;
    documentType: "Quote" | "Invoice";
    client: string;
    total: number;
    date: string;
    // For condensed mode regeneration
    quoteData?: {
      projectTitle: string;
      client: string;
      address: string;
      date: string;
      paymentType: string;
      summary?: string;
      materials: Array<{ name: string; quantity: number; unit: string; unitPrice: number; cost: number }>;
      labour: Array<{ name: string; hours?: number; rate?: number; cost: number }>;
      overheads: Array<{ name: string; cost: number }>;
      totals: { subtotal: number; vat: number; total: number };
    };
  } | null>(null);

  // Draft data object for auto-save
  const draftData = useMemo(() => ({
    jobDescription,
    client,
    postcode,
    address,
    category,
    customCategory,
    equipmentRental,
    equipmentRentalDetails,
    numWorkers,
    paymentType,
    hourlyRate,
    dayRate,
    quoteBreakdown,
  }), [jobDescription, client, postcode, address, category, customCategory, equipmentRental, equipmentRentalDetails, numWorkers, paymentType, hourlyRate, dayRate, quoteBreakdown]);

  // Save draft to localStorage
  const saveDraftToStorage = useCallback(async (data: typeof draftData) => {
    try {
      const draftKey = isDemo ? 'quotable_demo_quote_draft' : `quotable_quote_draft_${user?.id || 'temp'}`;
      localStorage.setItem(draftKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [isDemo, user?.id]);

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    try {
      const draftKey = isDemo ? 'quotable_demo_quote_draft' : `quotable_quote_draft_${user?.id || 'temp'}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setJobDescription(draft.jobDescription || "");
        setClient(draft.client || "");
        setPostcode(draft.postcode || "");
        setAddress(draft.address || "");
        setCategory(draft.category || "");
        setCustomCategory(draft.customCategory || "");
        setEquipmentRental(draft.equipmentRental || false);
        setEquipmentRentalDetails(draft.equipmentRentalDetails || "");
        setNumWorkers(draft.numWorkers || 1);
        setPaymentType(draft.paymentType || "job");
        setHourlyRate(draft.hourlyRate || 0);
        setDayRate(draft.dayRate || 250);
        if (draft.quoteBreakdown) {
          setQuoteBreakdown(draft.quoteBreakdown);
          setShowQuote(true);
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    } finally {
      setDraftLoaded(true);
    }
  }, [isDemo, user?.id]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      const draftKey = isDemo ? 'quotable_demo_quote_draft' : `quotable_quote_draft_${user?.id || 'temp'}`;
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [isDemo, user?.id]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setJobDescription("");
    setPhotos([]);
    setClient("");
    setPostcode("");
    setAddress("");
    setCategory("");
    setCustomCategory("");
    setEquipmentRental(false);
    setEquipmentRentalDetails("");
    setNumWorkers(1);
    setPaymentType("job");
    setHourlyRate(45);
    setDayRate(250);
    setQuoteBreakdown(null);
    setShowQuote(false);
    setEditedQuote(null);
    setOriginalQuote(null);
    setIncludeCalloutFee(false);
    setSuggestedOverheads([]);
  }, []);

  // Auto-save draft (with debounce) - silently without toast notifications
  useEffect(() => {
    if (!draftLoaded) return;
    if (jobDescription === "" && client === "" && category === "") return;

    const timeoutId = setTimeout(() => {
      saveDraftToStorage(draftData);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [draftData, draftLoaded, saveDraftToStorage, jobDescription, client, category]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (isDemo) {
        // Load demo data from localStorage or defaults
        const saved = getDemoData();
        if (saved?.quotes) {
          setSavedQuotes(saved.quotes);
        } else {
          setSavedQuotes(demoQuotes);
          setDemoData({ quotes: demoQuotes, invoices: demoInvoices, stats: demoStats });
        }
        setIsLoadingQuotes(false);
      } else if (user) {
        loadSavedQuotes();
        loadBrandSettings();
        loadPdfTemplate();
      }
      
      // Load draft after user is loaded
      setTimeout(() => loadDraft(), 100);
    };
    getUser();
  }, [isDemo, loadDraft]);

  const loadBrandSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('brand_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setBrandSettings(data);
  };

  const loadPdfTemplate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('app_settings')
      .select('pdf_theme')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.pdf_theme) {
      setPdfTemplate(data.pdf_theme as "minimalist" | "modern" | "classic");
    }
  };

  const loadSavedQuotes = async () => {
    setIsLoadingQuotes(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoadingQuotes(false);
      return;
    }

    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error loading quotes:", error);
      setIsLoadingQuotes(false);
      return;
    }
    
    setSavedQuotes(data || []);
    setIsLoadingQuotes(false);
  };

  const handlePostcodeLookup = async () => {
    if (!postcode) {
      toast.error("Please enter a postcode");
      return;
    }

    setLookingUpPostcode(true);
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${postcode.replace(/\s/g, '')}`);
      const data = await response.json();

      if (data.status === 200) {
        const result = data.result;
        const fullAddress = `${result.admin_district}, ${result.region}, ${result.country}`;
        setAddress(fullAddress);
        toast.success("Address found!");
      } else {
        toast.error("Postcode not found");
      }
    } catch (error) {
      console.error("Error looking up postcode:", error);
      toast.error("Failed to lookup postcode");
    } finally {
      setLookingUpPostcode(false);
    }
  };

  const handleEditQuote = (quote: any) => {
    if (isDemo) {
      toast.error("Editing is not available in demo mode", {
        description: "Subscribe to Quotable Pro to edit and manage your quotes",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }
    
    setEditingQuoteId(quote.id);
    setClient(quote.client);
    setPostcode("");
    setAddress(quote.location);
    setCategory(quote.category);
    setJobDescription(quote.job_description);
    setPhotos(Array.isArray((quote as any).photos) ? (quote as any).photos : []);
    setEquipmentRental(quote.equipment_rental);
    setNumWorkers(quote.num_workers);
    setPaymentType(quote.payment_type);
    setHourlyRate(quote.hourly_rate || 25);
    setQuoteBreakdown({
      projectTitle: quote.title,
      materials: quote.materials,
      labour: quote.labour,
      overheads: quote.overheads,
    });
    setEditedQuote({
      projectTitle: quote.title,
      materials: quote.materials,
      labour: quote.labour,
      overheads: quote.overheads,
    });
    setActiveTab("create");
    setShowQuote(true);
  };

  const handleDeleteQuote = async () => {
    if (!editingQuoteId) return;

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', editingQuoteId);

    if (error) {
      toast.error("Failed to delete quote");
      return;
    }

    toast.success("Quote deleted successfully");
    setShowDeleteDialog(false);
    
    // Reset form and switch to saved tab
    resetForm();
    setEditingQuoteId(null);
    setActiveTab("saved");
    
    loadSavedQuotes();
  };

  const handleAcceptQuote = async (quote: any) => {
    if (isDemo) {
      toast.error("Cannot update quotes in demo mode");
      return;
    }

    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status: "Accepted" })
        .eq("id", quote.id);

      if (error) throw error;

      toast.success("Quote marked as accepted!");
      loadSavedQuotes();
      
      // Fetch the updated quote to pass to dialog
      const { data: updatedQuote } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", quote.id)
        .single();
      
      if (updatedQuote) {
        setSelectedQuoteForAction(updatedQuote);
        setShowQuoteActionsDialog(true);
      }
    } catch (error: any) {
      console.error("Error accepting quote:", error);
      toast.error("Failed to accept quote");
    }
  };

  const handleRejectQuote = async (quote: any) => {
    if (isDemo) {
      toast.error("Cannot update quotes in demo mode");
      return;
    }

    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status: "Rejected" })
        .eq("id", quote.id);

      if (error) throw error;

      toast.success("Quote marked as rejected");
      loadSavedQuotes();
      
      // Fetch the updated quote to pass to dialog
      const { data: updatedQuote } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", quote.id)
        .single();
      
      if (updatedQuote) {
        setSelectedQuoteForAction(updatedQuote);
      }
    } catch (error: any) {
      console.error("Error rejecting quote:", error);
      toast.error("Failed to reject quote");
    }
  };

  const handleCancelEdit = () => {
    clearDraft();
    setEditingQuoteId(null);
    setClient("");
    setPostcode("");
    setAddress("");
    setCategory("");
    setJobDescription("");
    setPhotos([]);
    setEquipmentRental(false);
    setNumWorkers(1);
    setPaymentType("job");
    setHourlyRate(25);
    setShowQuote(false);
    setQuoteBreakdown(null);
  };

  // Add a single material to inventory
  const handleAddToInventory = async (material: QuoteMaterial) => {
    if (isDemo) {
      toast.error("Create an account to save items to inventory", {
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }

    if (!user) {
      toast.error("Please log in to save to inventory");
      return;
    }

    // Can't save items that need price verification
    if (material.needsVerification || material.unitPrice === null) {
      toast.error("Please verify the price first before saving to inventory");
      return;
    }

    // Check if already in inventory
    const existing = inventory.find(
      item => item.name.toLowerCase() === material.name.toLowerCase()
    );

    if (existing) {
      toast.info(`"${material.name}" is already in your inventory`, {
        description: `Current price: £${existing.unit_price.toFixed(2)}`,
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory')
        .insert({
          user_id: user.id,
          name: material.name,
          unit: material.unit,
          unit_price: material.unitPrice,
          category: category || undefined,
          description: `Added from quote: ${quoteBreakdown?.projectTitle || 'Untitled'}`,
        });

      if (error) throw error;
      toast.success(`"${material.name}" added to inventory!`);
    } catch (error) {
      console.error('Error adding to inventory:', error);
      toast.error("Failed to add to inventory");
    }
  };

  // Add all non-inventory materials to inventory
  const handleSaveAllToInventory = async () => {
    if (isDemo || !user || !quoteBreakdown) return;

    // Filter out materials that need verification or have null prices
    const newMaterials = quoteBreakdown.materials.filter(m => 
      !m.fromInventory && !m.needsVerification && m.unitPrice !== null
    );
    
    const unverifiedCount = quoteBreakdown.materials.filter(m => 
      m.needsVerification || m.unitPrice === null
    ).length;
    
    if (newMaterials.length === 0) {
      if (unverifiedCount > 0) {
        toast.info("Please verify all prices first before saving to inventory");
      } else {
        toast.info("All materials are already in your inventory");
      }
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const material of newMaterials) {
      // Check if already in inventory
      const existing = inventory.find(
        item => item.name.toLowerCase() === material.name.toLowerCase()
      );

      if (existing) {
        skippedCount++;
        continue;
      }

      try {
        const { error } = await supabase
          .from('inventory')
          .insert({
            user_id: user.id,
            name: material.name,
            unit: material.unit,
            unit_price: material.unitPrice,
            category: category || undefined,
            description: `Added from quote: ${quoteBreakdown?.projectTitle || 'Untitled'}`,
          });

        if (!error) addedCount++;
      } catch (error) {
        console.error('Error adding to inventory:', error);
      }
    }

    if (addedCount > 0) {
      let message = `Added ${addedCount} item${addedCount > 1 ? 's' : ''} to inventory`;
      if (skippedCount > 0) message += ` (${skippedCount} already existed)`;
      if (unverifiedCount > 0) message += ` • ${unverifiedCount} unverified items skipped`;
      toast.success(message);
    } else if (skippedCount > 0) {
      toast.info("All materials are already in your inventory");
    }
  };

  const displayQuotes = savedQuotes;

  const handleGenerateQuote = async () => {
    if (isDemo) {
      toast.error("Please sign up or log in to generate quotes", {
        description: "Demo mode is view-only",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }

    if (!user) {
      toast.error("Please log in to generate quotes", {
        description: "You need to be signed in to use this feature",
        action: {
          label: "Log In",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }

    if (!jobDescription || !address || !category || !client) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);
    try {
      const finalCategory = category === "other" ? customCategory : category;

      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: { 
          jobDescription, 
          location: address, 
          category: finalCategory,
          paymentType,
          hourlyRate,
          dayRate,
          equipmentRental,
          equipmentRentalDetails,
          numWorkers,
          quoteGenerationMode: appSettings.quote_generation_mode || 'minimal',
          skipAiPricing: !includeEstimates,
          tradeProfile: {
            primaryTrade: appSettings.primary_trade,
            secondaryTrades: appSettings.secondary_trades,
            businessType: appSettings.business_type,
            typicalJobSize: appSettings.typical_job_size,
            specializations: appSettings.specializations,
            certifications: appSettings.certifications,
            tradeNotes: appSettings.trade_notes,
            otherTradeName: appSettings.other_trade_name,
            otherTradeDescription: appSettings.other_trade_description,
            preferredSuppliers: appSettings.preferred_suppliers as string[],
          },
          inventory: inventory.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            unit: item.unit,
            unit_price: item.unit_price
          }))
        }
      });

      if (error) {
        console.error("Error generating quote:", error);
        if (error.message?.includes('Unauthorized') || error.message?.includes('auth')) {
          toast.error("Session expired. Please log in again.", {
            action: {
              label: "Log In",
              onClick: () => navigate("/auth")
            }
          });
        } else {
          toast.error("Failed to generate quote. Please try again.");
        }
        return;
      }

      // Validate the response has expected structure (edge function may return {error: "..."} in data)
      if (!data || data.error || !Array.isArray(data.materials) || !Array.isArray(data.labour)) {
        console.error("Invalid quote response:", data);
        toast.error(data?.error || "Received an invalid response. Please try again.");
        return;
      }

      // Handle call-out fee if enabled
      if (includeCalloutFee && appSettings.default_callout_fee) {
        const calloutFeeItem: QuoteOverhead = {
          name: "Call-out Fee",
          cost: appSettings.default_callout_fee
        };
        data.overheads = [calloutFeeItem, ...(data.overheads || [])];
      }

      // Ensure overheads array exists
      if (!Array.isArray(data.overheads)) {
        data.overheads = [];
      }

      setQuoteBreakdown(data);
      setEditedQuote(data);
      
      // Store suggested overheads if present
      if (data.suggested_overheads && Array.isArray(data.suggested_overheads)) {
        setSuggestedOverheads(data.suggested_overheads);
      } else {
        setSuggestedOverheads([]);
      }
      
      setShowQuote(true);
      setEditingQuoteId(null);
      setIsGeneratorMinimized(true);
      clearDraft();
      toast.success("Quote generated successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuote = async () => {
    if (isDemo) {
      toast.error("Please sign up or log in to save quotes", {
        description: "Demo mode is view-only",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }

    if (!user) {
      toast.error("Please log in to save quotes");
      return;
    }

    if (!quoteBreakdown) return;

    const finalCategory = category === "other" ? customCategory : category;
    const totalMaterials = quoteBreakdown.materials.reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalLabour = quoteBreakdown.labour.reduce((sum, l) => sum + (l.cost || 0), 0);
    const totalOverheads = quoteBreakdown.overheads.reduce((sum, o) => sum + (o.cost || 0), 0);
    const grandTotal = totalMaterials + totalLabour + totalOverheads;

    try {
      // Generate professional summary
      const { data: summaryData, error: summaryError } = await supabase.functions.invoke('generate-summary', {
        body: { 
          jobDescription,
          total: grandTotal
        }
      });

      const summary = summaryError ? null : summaryData?.summary;

      if (editingQuoteId) {
        const { error } = await supabase
          .from('quotes')
          .update({
            title: quoteBreakdown.projectTitle,
            client,
            client_id: selectedClientId,
            location: address,
            category: finalCategory,
            job_description: jobDescription,
            photos: photos as any,
            summary,
            equipment_rental: equipmentRental,
            num_workers: numWorkers,
            payment_type: paymentType,
            hourly_rate: paymentType === 'hourly' ? hourlyRate : null,
            materials: quoteBreakdown.materials as any,
            labour: quoteBreakdown.labour as any,
            overheads: quoteBreakdown.overheads as any,
            total_materials: totalMaterials,
            total_labour: totalLabour,
            total_overheads: totalOverheads,
            grand_total: grandTotal,
          })
          .eq('id', editingQuoteId);

      if (error) {
        console.error("Error updating quote:", error);
        toast.error("Failed to update quote");
        return;
      }

      toast.success("Quote updated successfully!");
      clearDraft();
      resetForm();
      setEditingQuoteId(null);
      setActiveTab("saved");
    } else {
      const { error } = await supabase.from('quotes').insert([{
        user_id: user.id,
        title: quoteBreakdown.projectTitle,
        client,
        client_id: selectedClientId,
        location: address,
        category: finalCategory,
        job_description: jobDescription,
        photos: photos as any,
        summary,
        equipment_rental: equipmentRental,
        num_workers: numWorkers,
        payment_type: paymentType,
        hourly_rate: paymentType === 'hourly' ? hourlyRate : null,
        materials: quoteBreakdown.materials as any,
        labour: quoteBreakdown.labour as any,
        overheads: quoteBreakdown.overheads as any,
        total_materials: totalMaterials,
        total_labour: totalLabour,
        total_overheads: totalOverheads,
        grand_total: grandTotal,
        status: 'Draft',
      }]);

      if (error) {
        console.error("Error saving quote:", error);
        toast.error("Failed to save quote");
        return;
      }

      toast.success("Quote saved successfully!");
      clearDraft();
      resetForm();
      setActiveTab("saved");
    }

    loadSavedQuotes();
    } catch (error) {
      console.error("Error in handleSaveQuote:", error);
      toast.error("An error occurred while saving the quote");
    }
  };

  const handleExportPDF = async () => {
    if (isDemo) {
      toast.error("PDF export is not available in demo mode", {
        description: "Subscribe to Quotable Pro to save and export professional PDFs",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }

    if (!quoteBreakdown) {
      toast.error("Please generate a quote first");
      return;
    }

    try {
      const totalMaterials = quoteBreakdown.materials.reduce((sum, m) => sum + (m.cost || 0), 0);
      const totalLabour = quoteBreakdown.labour.reduce((sum, l) => sum + (l.cost || 0), 0);
      const totalOverheads = quoteBreakdown.overheads.reduce((sum, o) => sum + (o.cost || 0), 0);
      const subtotal = totalMaterials + totalLabour + totalOverheads;
      const vatAmount = appSettings.include_vat ? subtotal * 0.20 : 0;
      const grandTotal = subtotal + vatAmount;

      // Generate professional summary for PDF
      const vatText = appSettings.include_vat ? "All prices include VAT." : "Prices exclude VAT.";
      let summary = `This quote covers the supply and installation of materials and labour as detailed below. ${vatText}`;

      if (!isDemo && user) {
        try {
          const { data: summaryData } = await supabase.functions.invoke('generate-summary', {
            body: { 
              jobDescription,
              total: grandTotal
            }
          });
          if (summaryData?.summary) {
            summary = summaryData.summary;
          }
        } catch (error) {
          console.log("Could not generate summary, using default");
        }
      }

      const quoteData = {
        projectTitle: quoteBreakdown.projectTitle,
        client,
        address,
        date: new Date().toLocaleDateString('en-GB'),
        paymentType: paymentType === 'hourly' ? `Hourly (£${hourlyRate}/hr)` : 'Fixed Fee',
        summary,
        materials: quoteBreakdown.materials,
        labour: quoteBreakdown.labour,
        overheads: quoteBreakdown.overheads,
        totals: { subtotal, vat: vatAmount, total: grandTotal }
      };

      // Generate PDF as blob for preview
      const { blob } = generateQuotePDFBlob(quoteData, brandSettings, pdfTemplate, appSettings.include_vat);
      const blobUrl = URL.createObjectURL(blob);
      const fileName = `Quote_${client.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Open preview dialog with quote data for condensed mode support
      setPdfPreviewData({
        blobUrl,
        blob,
        fileName,
        documentType: 'Quote',
        client,
        total: grandTotal,
        date: new Date().toLocaleDateString('en-GB'),
        quoteData
      });
      setShowPDFPreview(true);
      
      if (!isBrandComplete(brandSettings)) {
        toast.success("Quote generated! Complete your brand details for professional PDFs.");
      }
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF. Please try again.");
    }
  };

  const handleSmartEdit = () => {
    setOriginalQuote(quoteBreakdown); // Save original for undo
    setEditedQuote(quoteBreakdown);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (editedQuote) {
      setQuoteBreakdown(editedQuote);
      setShowEditDialog(false);
      toast.success("Quote updated successfully!");
    }
  };

  const handleRevertEdit = () => {
    if (originalQuote) {
      setEditedQuote(originalQuote);
      toast.info("Changes reverted");
    }
  };

  const recalculateTotals = (updatedQuote: QuoteBreakdown) => {
    const clone = { ...updatedQuote };
    // Recalculate materials total (null-safe)
    clone.materials = clone.materials.map(m => ({
      ...m,
      cost: Math.round((m.quantity || 0) * (m.unitPrice || 0) * 100) / 100,
    }));
    
    // Recalculate labour total (null-safe)
    clone.labour = clone.labour.map(l => ({
      ...l,
      cost: Math.round((l.hours || 0) * (l.rate || 0) * (l.workers || 1) * 100) / 100,
    }));
    
    return clone;
  };

  const handleAIAdjuster = async () => {
    if (isDemo) {
      toast.error("Please sign up or log in to adjust quotes", {
        description: "Demo mode is view-only",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }

    if (!user) {
      toast.error("Please log in to adjust quotes", {
        description: "You need to be signed in to use this feature",
        action: {
          label: "Log In",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }

    if (!adjustmentPrompt) {
      toast.error("Please describe the adjustment you'd like to make");
      return;
    }

    if (!quoteBreakdown) {
      toast.error("Please generate a quote first");
      return;
    }

    setIsAdjusting(true);
    try {
      const finalCategory = category === "other" ? customCategory : category;
      
      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: { 
          jobDescription,
          location: address, 
          category: finalCategory,
          paymentType,
          hourlyRate,
          dayRate,
          equipmentRental,
          numWorkers,
          adjustmentMode: true,
          adjustmentPrompt,
          currentQuote: quoteBreakdown,
        }
      });

      if (error) {
        console.error("Error adjusting quote:", error);
        if (error.message?.includes('Unauthorized') || error.message?.includes('auth')) {
          toast.error("Session expired. Please log in again.", {
            action: {
              label: "Log In",
              onClick: () => navigate("/auth")
            }
          });
        } else {
          toast.error("Failed to adjust quote. Please try again.");
        }
        return;
      }

      // Validate the adjusted response has expected structure
      if (!data || data.error || !Array.isArray(data.materials) || !Array.isArray(data.labour)) {
        console.error("Invalid adjusted quote response:", data);
        toast.error(data?.error || "Received an invalid response. Please try again.");
        return;
      }

      // Ensure overheads array exists
      if (!Array.isArray(data.overheads)) {
        data.overheads = [];
      }

      setQuoteBreakdown(data);
      setEditedQuote(data);
      
      // Store suggested overheads if present
      if (data.suggested_overheads && Array.isArray(data.suggested_overheads)) {
        setSuggestedOverheads(data.suggested_overheads);
      } else {
        setSuggestedOverheads([]);
      }
      
      setShowAdjusterDialog(false);
      setAdjustmentPrompt("");
      toast.success("Quote adjusted successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsAdjusting(false);
    }
  };

  // Template management functions
  const handleSaveAsTemplate = async () => {
    if (isDemo) {
      toast.error("Templates not available in demo mode");
      return;
    }

    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (!quoteBreakdown) {
      toast.error("Please generate a quote first");
      return;
    }

    const finalCategory = category === "other" ? customCategory : category;

    try {
      const { error } = await supabase.from('quote_templates').insert([{
        user_id: user.id,
        name: templateName,
        category: finalCategory,
        job_description: jobDescription,
        materials: quoteBreakdown.materials as any,
        labour: quoteBreakdown.labour as any,
        overheads: quoteBreakdown.overheads as any,
        equipment_rental: equipmentRental,
        num_workers: numWorkers,
        payment_type: paymentType,
        hourly_rate: paymentType === 'hourly' ? hourlyRate : null,
      }]);

      if (error) {
        console.error("Error saving template:", error);
        toast.error("Failed to save template");
        return;
      }

      toast.success("Template saved successfully!");
      setShowSaveTemplateDialog(false);
      setTemplateName("");
      refetchTemplates();
    } catch (error) {
      console.error("Error in handleSaveAsTemplate:", error);
      toast.error("An error occurred while saving the template");
    }
  };

  const handleUseTemplate = (template: any) => {
    if (isDemo) {
      toast.error("Templates not available in demo mode");
      return;
    }

    // Pre-fill form with template data
    setCategory(template.category);
    setJobDescription(template.job_description);
    setEquipmentRental(template.equipment_rental);
    setNumWorkers(template.num_workers);
    setPaymentType(template.payment_type);
    setHourlyRate(template.hourly_rate || 25);
    
    // Pre-fill quote breakdown
    setQuoteBreakdown({
      projectTitle: template.name,
      materials: template.materials,
      labour: template.labour,
      overheads: template.overheads,
    });
    setEditedQuote({
      projectTitle: template.name,
      materials: template.materials,
      labour: template.labour,
      overheads: template.overheads,
    });
    
    // Clear client-specific data
    setClient("");
    setPostcode("");
    setAddress("");
    
    setShowQuote(true);
    setActiveTab("create");
    toast.success("Template loaded! Add client details to continue.");
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const { error } = await supabase
        .from('quote_templates')
        .delete()
        .eq('id', templateToDelete);

      if (error) {
        toast.error("Failed to delete template");
        return;
      }

      toast.success("Template deleted successfully");
      setShowDeleteTemplateDialog(false);
      setTemplateToDelete(null);
      refetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("An error occurred while deleting the template");
    }
  };

  const handleEditTemplate = async () => {
    if (!editingTemplate) return;

    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    try {
      const { error } = await supabase
        .from('quote_templates')
        .update({ name: templateName })
        .eq('id', editingTemplate.id);

      if (error) {
        toast.error("Failed to update template");
        return;
      }

      toast.success("Template updated successfully");
      setShowEditTemplateDialog(false);
      setEditingTemplate(null);
      setTemplateName("");
      refetchTemplates();
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("An error occurred while updating the template");
    }
  };

  // Handler to add a suggested item to the quote
  const handleAddSuggestion = (item: QuoteOverhead) => {
    if (!quoteBreakdown) return;
    
    const updatedOverheads = [...quoteBreakdown.overheads, item];
    setQuoteBreakdown({
      ...quoteBreakdown,
      overheads: updatedOverheads
    });
    
    // Remove from suggestions
    setSuggestedOverheads(prev => prev.filter(s => s.name !== item.name));
    toast.success(`Added ${item.name} to quote`);
  };

  // Handler to add optional material to main materials
  const handleAddOptionalMaterial = (material: QuoteMaterial) => {
    if (!quoteBreakdown) return;
    
    const updatedMaterials = [...quoteBreakdown.materials, material];
    const updatedOptionalMaterials = quoteBreakdown.optional_materials?.filter(
      m => m.name !== material.name
    ) || [];
    
    setQuoteBreakdown({
      ...quoteBreakdown,
      materials: updatedMaterials,
      optional_materials: updatedOptionalMaterials
    });
    
    toast.success(`Added ${material.name} to quote`);
  };

  const totalMaterials = quoteBreakdown?.materials.reduce((sum, m) => sum + (m.cost || 0), 0) || 0;
  const totalLabour = quoteBreakdown?.labour.reduce((sum, l) => sum + (l.cost || 0), 0) || 0;
  const totalOverheads = quoteBreakdown?.overheads.reduce((sum, o) => sum + (o.cost || 0), 0) || 0;
  const grandTotal = totalMaterials + totalLabour + totalOverheads;
  const itemsNeedingVerification = quoteBreakdown?.materials.filter(m => m.needsVerification).length || 0;
  const estimatedPriceCount = quoteBreakdown?.materials.filter(m => 
    m.priceSource === 'Estimated' || (m.priceConfidence && m.priceConfidence < 0.7)
  ).length || 0;
  const lowConfidenceCount = quoteBreakdown?.materials.filter(m => 
    !m.needsVerification && m.priceConfidence && m.priceConfidence >= 0.5 && m.priceConfidence < 0.7
  ).length || 0;

  // Handler to set manual price for unverified materials
  const handleSetManualPrice = (materialIndex: number, price: number, isOptional: boolean = false) => {
    if (!quoteBreakdown) return;
    
    if (isOptional) {
      const updatedOptionalMaterials = [...(quoteBreakdown.optional_materials || [])];
      const material = updatedOptionalMaterials[materialIndex];
      if (material) {
        material.unitPrice = price;
        material.cost = Math.round(price * material.quantity * 100) / 100;
        material.priceSource = 'Manual';
        material.priceConfidence = 1.0;
        material.needsVerification = false;
        setQuoteBreakdown({ ...quoteBreakdown, optional_materials: updatedOptionalMaterials });
        toast.success(`Price set for ${material.name}`);
      }
    } else {
      const updatedMaterials = [...quoteBreakdown.materials];
      const material = updatedMaterials[materialIndex];
      if (material) {
        material.unitPrice = price;
        material.cost = Math.round(price * material.quantity * 100) / 100;
        material.priceSource = 'Manual';
        material.priceConfidence = 1.0;
        material.needsVerification = false;
        setQuoteBreakdown({ ...quoteBreakdown, materials: updatedMaterials });
        offerToRememberPrice(material);
      }
    }
  };

  // After a manual price, offer to keep it so future quotes use it automatically.
  const offerToRememberPrice = (material: QuoteMaterial) => {
    if (isDemo || !user) {
      toast.success(`Price set for ${material.name}`);
      return;
    }
    const existing = inventory.find(item => item.name.toLowerCase() === material.name.toLowerCase());
    toast.success(`Price set for ${material.name}`, {
      description: existing ? "Update your saved price too?" : "Use this price on future quotes?",
      duration: 8000,
      action: {
        label: existing ? "Update saved price" : "Remember price",
        onClick: async () => {
          const { error } = existing
            ? await supabase.from('inventory').update({ unit_price: material.unitPrice, unit: material.unit }).eq('id', existing.id)
            : await supabase.from('inventory').insert({
                user_id: user.id,
                name: material.name,
                unit: material.unit,
                unit_price: material.unitPrice,
                category: category || undefined,
                description: `Saved from quote: ${quoteBreakdown?.projectTitle || 'Untitled'}`,
              });
          if (error) toast.error("Couldn't save that price");
          else toast.success("Saved — future quotes will use it");
        },
      },
    });
  };

  // Inline edit handlers for quote items
  const handleUpdateMaterial = (idx: number, field: keyof QuoteMaterial, value: string | number) => {
    if (!quoteBreakdown) return;
    const updatedMaterials = [...quoteBreakdown.materials];
    const material = updatedMaterials[idx];
    if (material) {
      if (field === 'name') {
        material.name = value as string;
      } else if (field === 'quantity') {
        material.quantity = value as number;
        material.cost = Math.round((material.unitPrice || 0) * material.quantity * 100) / 100;
      } else if (field === 'unitPrice') {
        material.unitPrice = value as number;
        material.cost = Math.round(material.unitPrice * material.quantity * 100) / 100;
        material.priceSource = 'Manual';
        material.needsVerification = false;
      }
      setQuoteBreakdown({ ...quoteBreakdown, materials: updatedMaterials });
    }
  };

  const handleUpdateLabour = (idx: number, field: keyof QuoteLabour, value: string | number) => {
    if (!quoteBreakdown) return;
    const updatedLabour = [...quoteBreakdown.labour];
    const labour = updatedLabour[idx];
    if (labour) {
      if (field === 'name') {
        labour.name = value as string;
      } else if (field === 'hours') {
        labour.hours = value as number;
        labour.cost = Math.round(labour.hours * labour.rate * (labour.workers || 1) * 100) / 100;
      } else if (field === 'rate') {
        labour.rate = value as number;
        labour.cost = Math.round(labour.hours * labour.rate * (labour.workers || 1) * 100) / 100;
      } else if (field === 'workers') {
        labour.workers = Math.max(1, Math.round(value as number));
        labour.cost = Math.round(labour.hours * labour.rate * labour.workers * 100) / 100;
      }
      setQuoteBreakdown({ ...quoteBreakdown, labour: updatedLabour });
    }
  };

  const handleUpdateOverhead = (idx: number, field: keyof QuoteOverhead, value: string | number) => {
    if (!quoteBreakdown) return;
    const updatedOverheads = [...quoteBreakdown.overheads];
    const overhead = updatedOverheads[idx];
    if (overhead) {
      if (field === 'name') {
        overhead.name = value as string;
      } else if (field === 'cost') {
        overhead.cost = value as number;
      }
      setQuoteBreakdown({ ...quoteBreakdown, overheads: updatedOverheads });
    }
  };

  // Add new item handlers
  const handleAddMaterial = () => {
    if (!quoteBreakdown) return;
    const newMaterial: QuoteMaterial = {
      name: 'New Material',
      quantity: 1,
      unit: 'unit',
      unitPrice: 0,
      cost: 0,
      priceSource: 'Manual',
      priceConfidence: 1.0,
      needsVerification: false
    };
    setQuoteBreakdown({ ...quoteBreakdown, materials: [...quoteBreakdown.materials, newMaterial] });
  };

  const handleAddLabour = () => {
    if (!quoteBreakdown) return;
    const newLabour: QuoteLabour = {
      name: 'New Labour Item',
      hours: 1,
      rate: hourlyRate || 25,
      cost: hourlyRate || 25
    };
    setQuoteBreakdown({ ...quoteBreakdown, labour: [...quoteBreakdown.labour, newLabour] });
  };

  const handleAddOverhead = () => {
    if (!quoteBreakdown) return;
    const newOverhead: QuoteOverhead = {
      name: 'New Overhead',
      cost: 0
    };
    setQuoteBreakdown({ ...quoteBreakdown, overheads: [...quoteBreakdown.overheads, newOverhead] });
  };

  // Remove item handlers
  const handleRemoveMaterial = (idx: number) => {
    if (!quoteBreakdown) return;
    const updatedMaterials = quoteBreakdown.materials.filter((_, i) => i !== idx);
    setQuoteBreakdown({ ...quoteBreakdown, materials: updatedMaterials });
  };

  const handleRemoveLabour = (idx: number) => {
    if (!quoteBreakdown) return;
    const updatedLabour = quoteBreakdown.labour.filter((_, i) => i !== idx);
    setQuoteBreakdown({ ...quoteBreakdown, labour: updatedLabour });
  };

  const handleRemoveOverhead = (idx: number) => {
    if (!quoteBreakdown) return;
    const updatedOverheads = quoteBreakdown.overheads.filter((_, i) => i !== idx);
    setQuoteBreakdown({ ...quoteBreakdown, overheads: updatedOverheads });
  };

  // Filter and search quotes
  const filteredQuotes = useMemo(() => {
    let filtered = displayQuotes;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(quote => 
        quote.title?.toLowerCase().includes(query) ||
        quote.client?.toLowerCase().includes(query) ||
        quote.location?.toLowerCase().includes(query) ||
        quote.category?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    // Date sort
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at || a.date).getTime();
      const dateB = new Date(b.created_at || b.date).getTime();
      return dateSort === "newest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [displayQuotes, searchQuery, statusFilter, dateSort]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        
        {/* Loading Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
            <Card className="p-8 text-center space-y-4 shadow-lg max-w-sm mx-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="font-semibold text-lg">Generating Your Quote</h3>
                <p className="text-muted-foreground text-sm">
                  Analyzing materials, labour, and costs...
                </p>
              </div>
              <Progress className="w-full" />
            </Card>
          </div>
        )}
        
        <main className="flex-1 overflow-auto w-full">
          {/* Sticky Header with Tabs */}
          <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center gap-4 p-4 h-16 border-b">
              <SidebarTrigger />
              <h1 className="font-heading text-2xl">Quotes</h1>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`w-full justify-start rounded-none border-b h-auto p-0 bg-transparent ${isMobile ? 'overflow-x-auto' : ''}`}>
                <TabsTrigger 
                  value="saved" 
                  className={`rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent ${isMobile ? 'px-4 py-4 text-sm min-h-[48px]' : 'px-6 py-3'}`}
                >
                  Saved Quotes
                </TabsTrigger>
                <TabsTrigger 
                  value="create" 
                  className={`rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent ${isMobile ? 'px-4 py-4 text-sm min-h-[48px]' : 'px-6 py-3'}`}
                >
                  Create Quote
                </TabsTrigger>
                {!isDemo && (
                  <TabsTrigger 
                    value="templates" 
                    className={`rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent ${isMobile ? 'px-4 py-4 text-sm min-h-[48px]' : 'px-6 py-3'}`}
                  >
                    Templates
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          <div className={`${isMobile ? 'p-3 space-y-4 pb-24' : 'p-6 space-y-8 pb-12'}`}>
            {isDemo && <DemoModeNotice />}
            {!isDemo && !isBrandComplete(brandSettings) && <BrandCompletionNotice brandSettings={brandSettings} />}

            <Tabs value={activeTab} onValueChange={setActiveTab} className={`${isMobile ? 'mt-6 mb-16' : 'mt-6 mb-10'}`}>
              {/* Saved Quotes Tab */}
              <TabsContent value="saved" className="mt-0 space-y-4">
                {/* Search and Filters - Sticky on scroll */}
                <Card className="shadow-smooth sticky top-[129px] z-10 bg-card">
                  <CardContent className="pt-6">
                    {/* Desktop: Search and Filters side by side */}
                    <div className="hidden md:flex gap-4 items-center">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search quotes by client, title, location..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Accepted">Accepted</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Mobile: Collapsible Search + Filter Button */}
                    <div className="md:hidden space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search quotes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12"
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-12 w-12"
                          onClick={() => setShowMobileFilters(!showMobileFilters)}
                        >
                          <Filter className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {showMobileFilters && (
                        <div className="p-3 border rounded-lg bg-muted/30">
                          <Label className="text-sm mb-2 block">Status</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all" className="py-3">All</SelectItem>
                              <SelectItem value="Draft" className="py-3">Draft</SelectItem>
                              <SelectItem value="Accepted" className="py-3">Accepted</SelectItem>
                              <SelectItem value="Rejected" className="py-3">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quotes List */}
                {isLoadingQuotes ? (
                  <QuoteListSkeleton count={6} />
                ) : filteredQuotes.length > 0 ? (
                  <div className={isMobile ? 'space-y-6' : 'space-y-3'}>
                    {filteredQuotes.map((quote) => (
                      <Card key={quote.id} className="shadow-smooth hover:border-accent transition-smooth">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{quote.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {quote.client} • {quote.location}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  quote.status === "Accepted" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" :
                                  quote.status === "Rejected" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" :
                                  quote.status === "Sent" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {quote.status || "Draft"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(quote.created_at || quote.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className={`flex items-center gap-2 ${isMobile ? 'flex-col items-stretch w-full' : ''}`}>
                              <span className={`font-bold text-primary ${isMobile ? 'text-lg text-left' : 'text-xl'}`}>
                                £{((quote.grand_total ?? quote.total ?? 0) as number).toLocaleString('en-GB')}
                              </span>
                              <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                                <Button 
                                  variant={quote.status === "Accepted" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleAcceptQuote(quote)}
                                  className={`gap-1 ${isMobile ? 'flex-1' : ''} ${quote.status === "Accepted" ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                >
                                  <CheckCircle className={`h-4 w-4 ${quote.status === "Accepted" ? 'text-white' : 'text-green-600'}`} />
                                  <span className="hidden md:inline">Accepted</span>
                                </Button>
                                <Button 
                                  variant={quote.status === "Rejected" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleRejectQuote(quote)}
                                  className={`gap-1 ${isMobile ? 'flex-1' : ''} ${quote.status === "Rejected" ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                >
                                  <XCircle className={`h-4 w-4 ${quote.status === "Rejected" ? 'text-white' : 'text-red-600'}`} />
                                  <span className="hidden md:inline">Rejected</span>
                                </Button>
                                 {!isDemo && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEditQuote(quote)}
                                      className={isMobile ? 'flex-1 justify-start' : ''}
                                    >
                                      <Edit className="h-4 w-4 md:mr-2" />
                                      <span className={isMobile ? '' : 'hidden md:inline'}>Edit</span>
                                    </Button>
                                    <SendLinkButton
                                      type="quote"
                                      record={quote as any}
                                      businessName={brandSettings?.company_name}
                                      onUpdated={loadSavedQuotes}
                                      className={isMobile ? 'flex-1 justify-start' : ''}
                                    />
                                    {!quote.client_id && (
                                      <SaveAsClientButton
                                        clientName={quote.client}
                                        address={quote.location}
                                        quoteId={quote.id}
                                        onClientSaved={loadSavedQuotes}
                                      />
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title={searchQuery || statusFilter !== "all" ? "No quotes found" : "No quotes yet"}
                    description={
                      searchQuery || statusFilter !== "all"
                        ? "Try adjusting your search or filters to find what you're looking for"
                        : "Create your first AI-powered quote to get started with Quotable"
                    }
                    primaryAction={
                      searchQuery || statusFilter !== "all"
                        ? undefined
                        : {
                            label: "Create Your First Quote",
                            onClick: () => setActiveTab("create")
                          }
                    }
                  />
                )}
              </TabsContent>

              {/* Create Quote Tab */}
              <TabsContent value="create" className="mt-0">
                <div className={`flex gap-6 ${isGeneratorMinimized && showQuote ? 'flex-row' : 'grid lg:grid-cols-2'}`}>
                  {/* Quote Generator - Collapsible */}
                  <Card className={`shadow-smooth transition-all duration-300 ${isGeneratorMinimized && showQuote ? 'w-auto flex-shrink-0' : 'w-full'}`}>
                    <CardHeader 
                      className={`cursor-pointer ${isGeneratorMinimized && showQuote ? 'p-3' : ''}`}
                      onClick={() => showQuote && setIsGeneratorMinimized(!isGeneratorMinimized)}
                    >
                      {isGeneratorMinimized && showQuote ? (
                        <div className="flex flex-col items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <span className="text-xs font-medium writing-mode-vertical" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                            New Quote
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="font-heading flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-primary" />
                              {editingQuoteId ? "Edit Quote" : "Generate New Quote"}
                            </CardTitle>
                            <CardDescription>
                              {editingQuoteId ? "Update your quote details" : "AI-powered quote generation with smart estimates"}
                            </CardDescription>
                          </div>
                          {showQuote && (
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              Minimize
                            </Button>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    {!(isGeneratorMinimized && showQuote) && (
                    <CardContent className={`${isMobile ? 'space-y-5 px-4' : 'space-y-4'}`}>
                      <div className="space-y-2">
                        <Label htmlFor="client" className={isMobile ? 'text-base' : ''}>Client Name *</Label>
                        <ClientAutocomplete
                          clients={clients}
                          value={client}
                          onValueChange={setClient}
                          onClientSelect={(selectedClient) => {
                            if (selectedClient) {
                              setSelectedClientId(selectedClient.id);
                              if (selectedClient.address) {
                                setAddress(selectedClient.address);
                              }
                            } else {
                              setSelectedClientId(null);
                            }
                          }}
                          disabled={isDemo}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postcode" className={isMobile ? 'text-base' : ''}>Postcode</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="postcode" 
                            placeholder="e.g. SW1A 1AA"
                            value={postcode}
                            onChange={(e) => setPostcode(e.target.value)}
                            className={isMobile ? 'h-12' : ''}
                          />
                          <Button 
                            variant="outline" 
                            onClick={handlePostcodeLookup}
                            disabled={lookingUpPostcode}
                            className={isMobile ? 'h-12 w-12' : ''}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {address && (
                        <div className="space-y-2">
                          <Label htmlFor="address" className={isMobile ? 'text-base' : ''}>Location</Label>
                          <Input 
                            id="address" 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className={isMobile ? 'h-12' : ''}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="category" className={isMobile ? 'text-base' : ''}>Job Category *</Label>
                        <TradeAutocomplete
                          value={category}
                          onValueChange={setCategory}
                          placeholder="Search for your trade..."
                          disabled={isDemo}
                        />
                      </div>

                      {category === "other" && (
                        <div className="space-y-2">
                          <Label htmlFor="customCategory" className={isMobile ? 'text-base' : ''}>Describe Your Trade</Label>
                          <Input 
                            id="customCategory" 
                            placeholder="e.g., Solar Panel Maintenance"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className={isMobile ? 'h-12' : ''}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label htmlFor="jobDescription" className={isMobile ? 'text-base' : ''}>Job Description</Label>
                          <VoiceInputButton onText={(t) => setJobDescription((d) => appendDictation(d, t))} />
                        </div>
                        <Textarea 
                          id="jobDescription"
                          placeholder="Describe the work required in detail, or tap Speak and say it..."
                          rows={isMobile ? 3 : 4}
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          className={isMobile ? 'text-base' : ''}
                        />
                        <QuotePhotos userId={isDemo ? undefined : user?.id} photos={photos} onChange={setPhotos} />
                      </div>

                      <div className={`space-y-3 ${isMobile ? 'p-3' : 'p-4'} border rounded-lg`}>
                        <Label className={isMobile ? 'text-base' : ''}>Payment Structure</Label>
                        <label htmlFor="paymentJob" className={`flex items-center gap-3 ${isMobile ? 'min-h-[44px] py-2' : 'space-x-2'} cursor-pointer`}>
                          <Checkbox 
                            id="paymentJob" 
                            checked={paymentType === "job"}
                            onCheckedChange={(checked) => checked && setPaymentType("job")}
                            className={isMobile ? 'h-5 w-5' : ''}
                          />
                          <span className={isMobile ? 'text-base' : 'text-sm'}>
                            Charge by the job (fixed price)
                          </span>
                        </label>
                        <label htmlFor="paymentHourly" className={`flex items-center gap-3 ${isMobile ? 'min-h-[44px] py-2' : 'space-x-2'} cursor-pointer`}>
                          <Checkbox 
                            id="paymentHourly" 
                            checked={paymentType === "hourly"}
                            onCheckedChange={(checked) => checked && setPaymentType("hourly")}
                            className={isMobile ? 'h-5 w-5' : ''}
                          />
                          <span className={isMobile ? 'text-base' : 'text-sm'}>
                            Charge by the hour
                          </span>
                        </label>
                        {paymentType === "hourly" && (
                          <div className="space-y-2 ml-8">
                            <Label htmlFor="hourlyRate" className={isMobile ? 'text-base' : ''}>Hourly Rate (£)</Label>
                            <Input 
                              id="hourlyRate" 
                              type="number" 
                              min="0" 
                              value={hourlyRate === 0 ? '' : hourlyRate}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                  setHourlyRate(0);
                                  return;
                                }
                                const parsed = parseFloat(val);
                                if (!Number.isNaN(parsed) && parsed >= 0) {
                                  setHourlyRate(parsed);
                                }
                              }}
                              className={isMobile ? 'h-12' : ''}
                            />
                          </div>
                        )}
                        <label htmlFor="paymentDay" className={`flex items-center gap-3 ${isMobile ? 'min-h-[44px] py-2' : 'space-x-2'} cursor-pointer`}>
                          <Checkbox 
                            id="paymentDay" 
                            checked={paymentType === "day"}
                            onCheckedChange={(checked) => checked && setPaymentType("day")}
                            className={isMobile ? 'h-5 w-5' : ''}
                          />
                          <span className={isMobile ? 'text-base' : 'text-sm'}>
                            Charge by the day
                          </span>
                        </label>
                        {paymentType === "day" && (
                          <div className="space-y-2 ml-8">
                            <Label htmlFor="dayRate" className={isMobile ? 'text-base' : ''}>Day Rate (£)</Label>
                            <Input 
                              id="dayRate" 
                              type="number" 
                              min="0" 
                              value={dayRate === 0 ? '' : dayRate}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                  setDayRate(0);
                                  return;
                                }
                                const parsed = parseFloat(val);
                                if (!Number.isNaN(parsed) && parsed >= 0) {
                                  setDayRate(parsed);
                                }
                              }}
                              className={isMobile ? 'h-12' : ''}
                            />
                          </div>
                        )}
                        {appSettings.default_callout_fee && (
                          <label htmlFor="calloutFee" className={`flex items-center gap-3 ${isMobile ? 'min-h-[44px] py-2' : 'space-x-2 mt-2'} cursor-pointer`}>
                            <Checkbox 
                              id="calloutFee" 
                              checked={includeCalloutFee}
                              onCheckedChange={(checked) => setIncludeCalloutFee(checked as boolean)}
                              className={isMobile ? 'h-5 w-5' : ''}
                            />
                            <span className={isMobile ? 'text-base' : 'text-sm'}>
                              Include call-out fee (£{appSettings.default_callout_fee})
                            </span>
                          </label>
                        )}
                      </div>

                      <div className={`space-y-3 ${isMobile ? 'p-3' : 'p-4'} border rounded-lg`}>
                        <Label className={isMobile ? 'text-base' : ''}>Additional Options</Label>
                        <label htmlFor="equipmentRental" className={`flex items-center gap-3 ${isMobile ? 'min-h-[44px] py-2' : 'space-x-2'} cursor-pointer`}>
                          <Checkbox 
                            id="equipmentRental" 
                            checked={equipmentRental}
                            onCheckedChange={(checked) => {
                              setEquipmentRental(checked as boolean);
                              if (!checked) setEquipmentRentalDetails("");
                            }}
                            className={isMobile ? 'h-5 w-5' : ''}
                          />
                          <span className={isMobile ? 'text-base' : 'text-sm'}>
                            Equipment rental required
                          </span>
                        </label>
                        {equipmentRental && (
                          <div className="space-y-2 ml-8">
                            <Label htmlFor="equipmentDetails" className={isMobile ? 'text-base' : ''}>What equipment do you need?</Label>
                            <Input 
                              id="equipmentDetails" 
                              value={equipmentRentalDetails}
                              onChange={(e) => setEquipmentRentalDetails(e.target.value)}
                              placeholder="e.g. Scaffolding, cherry picker, excavator..."
                              className={isMobile ? 'h-12' : ''}
                            />
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center justify-between ${isMobile ? 'p-3' : 'p-4'} border rounded-lg bg-primary/5`}>
                        <div className="space-y-0.5 flex-1 pr-4">
                          <Label htmlFor="includeEstimates" className={`${isMobile ? 'text-base' : 'text-sm'} font-medium cursor-pointer`}>
                            Include price estimates
                          </Label>
                          <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                            {appSettings.skip_ai_pricing 
                              ? "Overrides 'Generate quotes without prices' setting for this quote"
                              : "Each item shows a confidence indicator (🟢 high, 🟡 medium, 🔴 estimate)"}
                          </p>
                        </div>
                        <Switch
                          id="includeEstimates"
                          checked={includeEstimates}
                          onCheckedChange={async (checked) => {
                            setIncludeEstimates(checked);
                            if (user) {
                              try {
                                await supabase
                                  .from('app_settings')
                                  .update({ skip_ai_pricing: !checked })
                                  .eq('user_id', user.id);
                              } catch (err) {
                                console.error('Failed to save estimate preference:', err);
                              }
                            }
                          }}
                        />
                      </div>

                      {editingQuoteId ? (
                        <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                          <Button 
                            variant="outline"
                            onClick={handleCancelEdit} 
                            className={`flex-1 ${isMobile ? 'h-12' : ''}`}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)} 
                            className={`flex-1 ${isMobile ? 'h-12' : ''}`}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Quote
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          onClick={handleGenerateQuote} 
                          disabled={isGenerating || !client || !jobDescription || !category || (category === "other" && !customCategory)}
                          className={`w-full ${isMobile ? 'h-14 text-base font-semibold' : ''}`}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className={`mr-2 animate-spin ${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className={`mr-2 ${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                              Generate Quote
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                    )}
                  </Card>

                  {/* Generated Quote Display */}
                  {showQuote && quoteBreakdown && (
                    <Card className={`shadow-smooth transition-all duration-300 ${isGeneratorMinimized ? 'flex-1' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Input
                              value={quoteBreakdown.projectTitle}
                              onChange={(e) => setQuoteBreakdown({ ...quoteBreakdown, projectTitle: e.target.value })}
                              className="font-heading text-lg font-semibold border-none bg-transparent px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            <CardDescription className="mt-1">
                              {client} • {address}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setShowAdjusterDialog(true)}
                              title="AI Adjuster"
                            >
                              <Zap className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <QuoteConfidenceBadge materials={quoteBreakdown.materials} />
                        {/* Materials */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Materials</h3>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddMaterial}
                                className="text-xs h-7"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                              {!isDemo && quoteBreakdown.materials.some(m => !m.fromInventory) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleSaveAllToInventory}
                                  className="text-xs h-7"
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  Save All
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {quoteBreakdown.materials.map((material, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30">
                                <div className="flex flex-col gap-1 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Input
                                      value={material.name}
                                      onChange={(e) => handleUpdateMaterial(idx, 'name', e.target.value)}
                                      className="flex-1 min-w-[150px] h-7 text-sm"
                                    />
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        value={material.quantity}
                                        onChange={(e) => handleUpdateMaterial(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                        className="w-16 h-7 text-sm text-right"
                                      />
                                      <span className="text-xs text-muted-foreground">{material.unit}</span>
                                    </div>
                                    {/* Price source badges */}
                                    {material.needsVerification ? (
                                      <a 
                                        href={material.supplierUrl || generateSupplierUrl(material.name, undefined, category).url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 hover:opacity-80 transition-opacity cursor-pointer"
                                        title="Click to verify price on supplier website"
                                      >
                                        🔍 Verify ↗
                                      </a>
                                    ) : material.fromInventory ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                                        📦
                                      </span>
                                    ) : material.priceSource === 'Manual' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                        ✏️
                                      </span>
                                    ) : material.priceSource && (
                                      <a 
                                        href={material.supplierUrl || generateSupplierUrl(material.name, material.priceSource, category).url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer ${
                                          (material.priceConfidence || 0) >= 0.85 
                                            ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' 
                                            : (material.priceConfidence || 0) >= 0.7 
                                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                                              : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                                        }`}
                                        title={`${material.priceSource} • ${Math.round((material.priceConfidence || 0) * 100)}% confidence`}
                                      >
                                        {(material.priceConfidence || 0) >= 0.85 
                                          ? '🟢' 
                                          : (material.priceConfidence || 0) >= 0.7 
                                            ? '🟡' 
                                            : '🔴 Estimate'
                                        } ↗
                                      </a>
                                    )}
                                  </div>
                                </div>
                                {/* Price input - always editable */}
                                <div className="flex items-center gap-1 ml-2">
                                  <span className="text-sm">£</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={material.unitPrice ?? ''}
                                    placeholder="0.00"
                                    onChange={(e) => handleUpdateMaterial(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    className={`w-20 h-7 text-sm text-right ${material.needsVerification ? 'border-orange-300' : ''}`}
                                  />
                                </div>
                                <span className="font-medium min-w-[60px] text-right">£{(material.cost || 0).toFixed(2)}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveMaterial(idx)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex justify-between font-semibold pt-2 border-t">
                              <span>Materials Total</span>
                              <span>£{totalMaterials.toFixed(2)}</span>
                            </div>
                          </div>
                          <PriceSourceLegend 
                            estimatedCount={estimatedPriceCount} 
                            lowConfidenceCount={lowConfidenceCount} 
                          />
                        </div>

                        {/* Optional Materials (Upgrades) */}
                        {quoteBreakdown.optional_materials && quoteBreakdown.optional_materials.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className="font-semibold">Optional Upgrades</h3>
                              <span className="text-xs text-muted-foreground">(Not included in total)</span>
                            </div>
                            <div className="space-y-2">
                              {quoteBreakdown.optional_materials.map((material, idx) => (
                                <div key={idx} className={`flex justify-between items-start text-sm p-2 rounded border border-dashed ${material.needsVerification ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800' : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'}`}>
                                  <div className="flex flex-col gap-1 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {material.supplierUrl || material.priceSource ? (
                                        <a
                                          href={material.supplierUrl || generateSupplierUrl(material.name, material.priceSource, category).url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:text-primary hover:underline transition-colors"
                                        >
                                          {material.name} ({material.quantity} {material.unit})
                                        </a>
                                      ) : (
                                        <span>{material.name} ({material.quantity} {material.unit})</span>
                                      )}
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                        ⭐ Upgrade
                                      </span>
                                      {material.needsVerification ? (
                                        <a 
                                          href={material.supplierUrl || generateSupplierUrl(material.name, undefined, category).url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 hover:opacity-80 transition-opacity cursor-pointer"
                                          title="Click to verify price on supplier website"
                                        >
                                          🔍 Verify Price ↗
                                        </a>
                                      ) : material.priceSource && material.priceSource !== 'Verify' && (
                                        <a 
                                          href={material.supplierUrl || generateSupplierUrl(material.name, material.priceSource, category).url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:opacity-80 transition-opacity cursor-pointer"
                                        >
                                          {material.priceSource} ↗
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    {material.needsVerification ? (
                                      <>
                                        <span className="text-xs text-orange-600 dark:text-orange-400">£</span>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          placeholder="0.00"
                                          className="w-20 h-7 text-sm text-right"
                                          onBlur={(e) => {
                                            const value = parseFloat(e.target.value);
                                            if (!isNaN(value) && value > 0) {
                                              handleSetManualPrice(idx, value, true);
                                            }
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              const value = parseFloat((e.target as HTMLInputElement).value);
                                              if (!isNaN(value) && value > 0) {
                                                handleSetManualPrice(idx, value, true);
                                              }
                                            }
                                          }}
                                        />
                                      </>
                                    ) : (
                                      <span className="font-medium text-blue-600 dark:text-blue-400">+£{(material.cost || 0).toFixed(2)}</span>
                                    )}
                                    {!material.needsVerification && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddOptionalMaterial(material)}
                                        className="h-7 px-2 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 border-blue-300 dark:border-blue-700"
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              <div className="flex justify-between font-semibold pt-2 border-t border-dashed text-muted-foreground">
                                <span>Optional Total (if all selected)</span>
                                <span>+£{quoteBreakdown.optional_materials.reduce((sum, m) => sum + (m.cost || 0), 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Labour */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Labour</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddLabour}
                              className="text-xs h-7"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {quoteBreakdown.labour.map((labour, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30">
                                <Input
                                  value={labour.name}
                                  onChange={(e) => handleUpdateLabour(idx, 'name', e.target.value)}
                                  className="flex-1 h-7 text-sm"
                                />
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={labour.hours}
                                    onChange={(e) => handleUpdateLabour(idx, 'hours', parseFloat(e.target.value) || 0)}
                                    className="w-16 h-7 text-sm text-right"
                                  />
                                  <span className="text-xs text-muted-foreground">{paymentType === 'day' ? 'days @' : 'hrs @'}</span>
                                  <span className="text-xs">£</span>
                                  <Input
                                    type="number"
                                    value={labour.rate}
                                    onChange={(e) => handleUpdateLabour(idx, 'rate', parseFloat(e.target.value) || 0)}
                                    className="w-16 h-7 text-sm text-right"
                                  />
                                  <span className="text-xs text-muted-foreground">{paymentType === 'day' ? '/day' : '/hr'}</span>
                                </div>
                                <span className="font-medium min-w-[60px] text-right">£{(labour.cost || 0).toFixed(2)}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveLabour(idx)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex justify-between font-semibold pt-2 border-t">
                              <span>Labour Total</span>
                              <span>£{totalLabour.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Overheads */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Overheads</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddOverhead}
                              className="text-xs h-7"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {quoteBreakdown.overheads.map((overhead, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30">
                                <Input
                                  value={overhead.name}
                                  onChange={(e) => handleUpdateOverhead(idx, 'name', e.target.value)}
                                  className="flex-1 h-7 text-sm"
                                />
                                <div className="flex items-center gap-1">
                                  <span className="text-sm">£</span>
                                  <Input
                                    type="number"
                                    value={overhead.cost}
                                    onChange={(e) => handleUpdateOverhead(idx, 'cost', parseFloat(e.target.value) || 0)}
                                    className="w-20 h-7 text-sm text-right"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveOverhead(idx)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex justify-between font-semibold pt-2 border-t">
                              <span>Overheads Total</span>
                              <span>£{totalOverheads.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Suggested Overheads - Quick Add */}
                          {suggestedOverheads.length > 0 && (
                            <div className="mt-4 p-4 bg-muted/20 rounded-lg border border-dashed">
                              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Suggested Additions
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {suggestedOverheads.map((item, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddSuggestion(item)}
                                    className="text-xs"
                                  >
                                    {item.name} (+£{(item.cost || 0).toFixed(2)})
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Grand Total */}
                        <div className="flex justify-between text-lg font-bold pt-4 border-t-2">
                          <span>TOTAL ESTIMATE</span>
                          <span className="text-primary">£{grandTotal.toFixed(2)}</span>
                        </div>

                        {/* Actions */}
                        <div className={`pt-4 ${isMobile ? 'flex flex-col gap-2' : 'flex gap-2'}`}>
                          <Button onClick={handleSaveQuote} variant="default" className="flex-1">
                            <Save className="mr-2 h-4 w-4" />
                            {editingQuoteId ? "Update Quote" : "Save Quote"}
                          </Button>
                          <Button onClick={handleExportPDF} variant="outline" className="flex-1">
                            <FileDown className="mr-2 h-4 w-4" />
                            Download PDF
                          </Button>
                          {!isDemo && (
                            <Button 
                              onClick={() => setShowSaveTemplateDialog(true)}
                              variant="outline"
                              className="flex-1"
                            >
                              <BookTemplate className="mr-2 h-4 w-4" />
                              Save as Template
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Templates Tab */}
              {!isDemo && (
                <TabsContent value="templates" className="mt-0 space-y-4">
                  <Card className="shadow-smooth">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookTemplate className="h-5 w-5" />
                        Quote Templates
                      </CardTitle>
                      <CardDescription>
                        Save common quote configurations for quick reuse
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingTemplates ? (
                        <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
                      ) : templates.length > 0 ? (
                        <div className="space-y-3">
                          {templates.map((template) => (
                            <Card key={template.id} className="shadow-sm hover:border-accent transition-smooth">
                              <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{template.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {template.category}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                      <span>{Array.isArray(template.materials) ? template.materials.length : 0} materials</span>
                                      <span>•</span>
                                      <span>{Array.isArray(template.labour) ? template.labour.length : 0} labour items</span>
                                      <span>•</span>
                                      <span>{new Date(template.created_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                                    <Button 
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleUseTemplate(template)}
                                      className={isMobile ? 'flex-1' : ''}
                                    >
                                      <Copy className="mr-2 h-4 w-4" />
                                      Use Template
                                    </Button>
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingTemplate(template);
                                        setTemplateName(template.name);
                                        setShowEditTemplateDialog(true);
                                      }}
                                      className={isMobile ? 'flex-1' : ''}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setTemplateToDelete(template.id);
                                        setShowDeleteTemplateDialog(true);
                                      }}
                                      className={isMobile ? 'flex-1' : ''}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={BookTemplate}
                          title="No templates yet"
                          description="Create a quote and save it as a template for quick reuse"
                          primaryAction={{
                            label: "Create Quote",
                            onClick: () => setActiveTab("create")
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
            
            <div className={`${isMobile ? 'h-6' : 'h-4'}`} aria-hidden />
          </div>
          <Footer />
        </main>
      </div>

      {/* Edit Dialog with enhanced functionality */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Smart Edit Quote</DialogTitle>
            <DialogDescription>Manually adjust quote items and values. Totals recalculate automatically.</DialogDescription>
          </DialogHeader>
          {editedQuote && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Project Title</Label>
                <Input 
                  value={editedQuote.projectTitle}
                  onChange={(e) => setEditedQuote({...editedQuote, projectTitle: e.target.value})}
                  className="break-words"
                />
              </div>

              {/* Materials */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Materials</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditedQuote({
                      ...editedQuote,
                      materials: [...editedQuote.materials, { name: "", quantity: 1, unit: "unit", unitPrice: 0, cost: 0 }]
                    })}
                  >
                    Add Material
                  </Button>
                </div>
                {editedQuote.materials.map((material, idx) => (
                  <div key={idx} className="grid grid-cols-6 gap-2 p-3 border rounded-lg">
                    <Input
                      placeholder="Name"
                      className="col-span-2 break-words"
                      value={material.name}
                      onChange={(e) => {
                        const updated = [...editedQuote.materials];
                        updated[idx].name = e.target.value;
                        setEditedQuote(recalculateTotals({...editedQuote, materials: updated}));
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={material.quantity}
                      onChange={(e) => {
                        const updated = [...editedQuote.materials];
                        updated[idx].quantity = parseFloat(e.target.value) || 0;
                        setEditedQuote(recalculateTotals({...editedQuote, materials: updated}));
                      }}
                    />
                    <Input
                      placeholder="Unit"
                      value={material.unit}
                      onChange={(e) => {
                        const updated = [...editedQuote.materials];
                        updated[idx].unit = e.target.value;
                        setEditedQuote({...editedQuote, materials: updated});
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={material.unitPrice}
                      onChange={(e) => {
                        const updated = [...editedQuote.materials];
                        updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                        setEditedQuote(recalculateTotals({...editedQuote, materials: updated}));
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const updated = editedQuote.materials.filter((_, i) => i !== idx);
                        setEditedQuote({...editedQuote, materials: updated});
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Labour */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Labour</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditedQuote({
                      ...editedQuote,
                      labour: [...editedQuote.labour, { name: "", hours: 1, rate: 25, cost: 25 }]
                    })}
                  >
                    Add Labour
                  </Button>
                </div>
                {editedQuote.labour.map((labour, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 p-3 border rounded-lg">
                    <Input
                      placeholder="Description"
                      className="col-span-2 break-words"
                      value={labour.name}
                      onChange={(e) => {
                        const updated = [...editedQuote.labour];
                        updated[idx].name = e.target.value;
                        setEditedQuote({...editedQuote, labour: updated});
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Hours"
                      value={labour.hours}
                      onChange={(e) => {
                        const updated = [...editedQuote.labour];
                        updated[idx].hours = parseFloat(e.target.value) || 0;
                        setEditedQuote(recalculateTotals({...editedQuote, labour: updated}));
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={labour.rate}
                      onChange={(e) => {
                        const updated = [...editedQuote.labour];
                        updated[idx].rate = parseFloat(e.target.value) || 0;
                        setEditedQuote(recalculateTotals({...editedQuote, labour: updated}));
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const updated = editedQuote.labour.filter((_, i) => i !== idx);
                        setEditedQuote({...editedQuote, labour: updated});
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Overheads */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Overheads</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditedQuote({
                      ...editedQuote,
                      overheads: [...editedQuote.overheads, { name: "", cost: 0 }]
                    })}
                  >
                    Add Overhead
                  </Button>
                </div>
                {editedQuote.overheads.map((overhead, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 p-3 border rounded-lg">
                    <Input
                      placeholder="Description"
                      className="col-span-2 break-words"
                      value={overhead.name}
                      onChange={(e) => {
                        const updated = [...editedQuote.overheads];
                        updated[idx].name = e.target.value;
                        setEditedQuote({...editedQuote, overheads: updated});
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Cost"
                      value={overhead.cost}
                      onChange={(e) => {
                        const updated = [...editedQuote.overheads];
                        updated[idx].cost = parseFloat(e.target.value) || 0;
                        setEditedQuote({...editedQuote, overheads: updated});
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const updated = editedQuote.overheads.filter((_, i) => i !== idx);
                        setEditedQuote({...editedQuote, overheads: updated});
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Totals Display */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Materials Total:</span>
                  <span className="font-semibold">£{editedQuote.materials.reduce((sum, m) => sum + (m.cost || 0), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Labour Total:</span>
                  <span className="font-semibold">£{editedQuote.labour.reduce((sum, l) => sum + (l.cost || 0), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Overheads Total:</span>
                  <span className="font-semibold">£{editedQuote.overheads.reduce((sum, o) => sum + (o.cost || 0), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Grand Total:</span>
                  <span className="text-primary">
                    £{(
                      editedQuote.materials.reduce((sum, m) => sum + (m.cost || 0), 0) +
                      editedQuote.labour.reduce((sum, l) => sum + (l.cost || 0), 0) +
                      editedQuote.overheads.reduce((sum, o) => sum + (o.cost || 0), 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={handleRevertEdit}>
              <Undo className="h-4 w-4 mr-2" />
              Revert
            </Button>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Adjuster Dialog */}
      <Dialog open={showAdjusterDialog} onOpenChange={setShowAdjusterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Adjuster</DialogTitle>
            <DialogDescription>Describe how you'd like to adjust the quote</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="E.g., 'Reduce labour by 10%' or 'Add contingency buffer of 15%'"
              value={adjustmentPrompt}
              onChange={(e) => setAdjustmentPrompt(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjusterDialog(false)}>Cancel</Button>
            <Button onClick={handleAIAdjuster} disabled={isAdjusting}>
              {isAdjusting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adjusting...
                </>
              ) : (
                "Apply Adjustment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Brand Preview Dialog */}
      <BrandPreviewDialog 
        open={showBrandPreviewDialog}
        onOpenChange={setShowBrandPreviewDialog}
        brandSettings={brandSettings}
      />

            {/* Delete Quote Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this quote? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteQuote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Save Template Dialog */}
            <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save as Template</DialogTitle>
                  <DialogDescription>
                    Give this quote configuration a name so you can reuse it later
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      placeholder="e.g., Standard Boiler Service"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>
                  <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                    <p className="font-medium">This template will include:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Job category and description</li>
                      <li>Materials, labour, and overheads</li>
                      <li>Payment structure and options</li>
                    </ul>
                    <p className="text-muted-foreground mt-2">
                      Client details will not be saved
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveAsTemplate}>
                    <BookTemplate className="mr-2 h-4 w-4" />
                    Save Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Template Dialog */}
            <Dialog open={showEditTemplateDialog} onOpenChange={setShowEditTemplateDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Template</DialogTitle>
                  <DialogDescription>
                    Update the template name
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editTemplateName">Template Name</Label>
                    <Input
                      id="editTemplateName"
                      placeholder="e.g., Standard Boiler Service"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setShowEditTemplateDialog(false);
                    setEditingTemplate(null);
                    setTemplateName("");
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditTemplate}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Template Confirmation Dialog */}
            <AlertDialog open={showDeleteTemplateDialog} onOpenChange={setShowDeleteTemplateDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Template</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this template? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

      {/* Quote Actions Dialog */}
      <QuoteActionsDialog
        open={showQuoteActionsDialog}
        onOpenChange={setShowQuoteActionsDialog}
        quote={selectedQuoteForAction}
        isDemo={isDemo}
        onStatusUpdate={loadSavedQuotes}
      />

      {/* PDF Preview & Share Dialog */}
      {pdfPreviewData && (
        <PDFPreviewShareDialog
          open={showPDFPreview}
          onOpenChange={setShowPDFPreview}
          blobUrl={pdfPreviewData.blobUrl}
          blob={pdfPreviewData.blob}
          fileName={pdfPreviewData.fileName}
          documentType={pdfPreviewData.documentType}
          client={pdfPreviewData.client}
          total={pdfPreviewData.total}
          date={pdfPreviewData.date}
          quoteData={pdfPreviewData.quoteData}
          brandSettings={brandSettings}
          pdfTemplate={pdfTemplate}
          includeVat={appSettings.include_vat}
        />
      )}
    </SidebarProvider>
  );
};

export default Quotes;