"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createVehicle, listVehicles } from "@/lib/api";
import type { PaginatedVehicles, VehicleCreate } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface VehicleDashboardProps {
  initialPage: PaginatedVehicles;
  healthStatus?: string;
}

interface FormState {
  vin: string;
  make: string;
  model: string;
  description: string;
  imageUrlsInput: string;
}

interface FormErrors {
  vin?: string;
  make?: string;
  model?: string;
  description?: string;
}

const defaultFormState: FormState = {
  vin: "",
  make: "",
  model: "",
  description: "",
  imageUrlsInput: "",
};

// Validation functions
function validateVin(vin: string): string | undefined {
  if (!vin.trim()) return "VIN is required";
  if (vin.trim().length < 5) return "VIN must be at least 5 characters";
  if (vin.trim().length > 17) return "VIN must be at most 17 characters";
  return undefined;
}

function validateMake(make: string): string | undefined {
  if (!make.trim()) return "Manufacturer is required";
  if (make.trim().length < 2) return "Manufacturer must be at least 2 characters";
  return undefined;
}

function validateModel(model: string): string | undefined {
  if (!model.trim()) return "Model is required";
  if (model.trim().length < 1) return "Model is required";
  return undefined;
}

function validateDescription(description: string): string | undefined {
  if (!description.trim()) return "Description is required";
  if (description.trim().length < 10) return "Description must be at least 10 characters";
  return undefined;
}

export default function VehicleDashboard({ initialPage, healthStatus }: VehicleDashboardProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  
  const emptyPage: PaginatedVehicles = {
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
  };

  const [pageData, setPageData] = useState<PaginatedVehicles>(initialPage ?? emptyPage);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ message: string; tone: "success" | "error" | null }>({
    message: "",
    tone: null,
  });

  const {
    items: vehicles = [],
    total = 0,
    page = 1,
    page_size: pageSize = 10,
    total_pages: totalPagesRaw = 1,
  } = pageData ?? emptyPage;

  const totalPages = totalPagesRaw || 1;

  const parsedImageUrls = useMemo(() => {
    return formState.imageUrlsInput
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [formState.imageUrlsInput]);

  // Validate form
  const validateForm = useMemo(() => {
    return {
      vin: validateVin(formState.vin),
      make: validateMake(formState.make),
      model: validateModel(formState.model),
      description: validateDescription(formState.description),
    };
  }, [formState]);

  const isFormValid = useMemo(() => {
    return !validateForm.vin && !validateForm.make && !validateForm.model && !validateForm.description;
  }, [validateForm]);

  const handleInputChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof FormErrors) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFormErrors((prev) => ({ ...prev, [field]: validateForm[field] }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Mark all fields as touched
    setTouched({ vin: true, make: true, model: true, description: true });
    setFormErrors(validateForm);
    
    if (!isFormValid) return;
    
    setStatusMessage({ message: "", tone: null });
    setIsSubmitting(true);

    const payload: VehicleCreate = {
      vin: formState.vin.trim(),
      make: formState.make.trim(),
      model: formState.model.trim(),
      description: formState.description.trim(),
      image_urls: parsedImageUrls,
    };

    try {
      await createVehicle(payload);
      await handlePageChange(1, { resetStatus: false });
      setFormState(defaultFormState);
      setTouched({});
      setFormErrors({});
      setStatusMessage({ message: "Vehicle added successfully!", tone: "success" });
      setTimeout(() => {
        setIsDialogOpen(false);
        setStatusMessage({ message: "", tone: null });
      }, 1500);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Something went wrong.";
      setStatusMessage({ message: detail, tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = async (targetPage: number, options?: { resetStatus?: boolean; silent?: boolean }) => {
    if (targetPage < 1 || targetPage > totalPages) return;
    if (options?.resetStatus) {
      setStatusMessage({ message: "", tone: null });
    }
    setIsPageLoading(true);
    try {
      const data = await listVehicles({ page: targetPage, pageSize });
      setPageData(data);
    } catch (error) {
      if (!options?.silent) {
        const detail = error instanceof Error ? error.message : "Unable to load vehicles.";
        setStatusMessage({ message: detail, tone: "error" });
      }
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setFormState(defaultFormState);
      setFormErrors({});
      setTouched({});
      setStatusMessage({ message: "", tone: null });
    }
  };

  useEffect(() => {
    if (bootstrapped) return;
    const fetchData = async () => {
      try {
        const data = await listVehicles({ page: 1, pageSize });
        setPageData(data);
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      } finally {
        setBootstrapped(true);
        setIsInitialLoading(false);
      }
    };
    fetchData();
  }, [bootstrapped, pageSize]);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-500">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[150px] animate-spin-slow" />
      </div>

      {/* Header */}
      <header className="relative border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold font-display animate-fade-in text-black dark:text-white">
                Tummala Motors
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl border border-border/50 bg-card/50 hover:bg-card transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? (
                  <SunIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors group-hover:rotate-180 duration-500" />
                ) : (
                  <MoonIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors group-hover:-rotate-12 duration-300" />
                )}
              </button>
              <Button 
                variant="primary" 
                onClick={() => setIsDialogOpen(true)}
                className="animate-fade-in stagger-2 hover-lift"
              >
                <PlusIcon className="h-5 w-5" />
                Add Vehicle
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-7xl px-6 py-8">
        {/* Page Title */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-gradient mb-3 animate-fade-in-up stagger-1 font-display">
            Vehicle Collection
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up stagger-2">
            Browse and manage your vehicle inventory. Click on any listing to view detailed information.
          </p>
        </div>

        {/* Vehicle Table */}
        <div className="animate-fade-in-up stagger-3">
          {isInitialLoading ? (
            <SkeletonTable rows={6} />
          ) : vehicles.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-16 animate-scale-in">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center animate-bounce-subtle">
                  <CarIcon className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">No vehicles yet</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Your inventory is empty. Add your first vehicle to get started.
                  </p>
                </div>
                <Button variant="primary" onClick={() => setIsDialogOpen(true)} className="hover-lift">
                  <PlusIcon className="h-5 w-5" />
                  Add Your First Vehicle
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats Bar */}
              <div className="flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="hover-scale">
                    {total} Vehicle{total !== 1 ? "s" : ""}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Showing {rangeStart}–{rangeEnd}
                  </span>
                </div>
                {isPageLoading && <Spinner size="sm" />}
              </div>

              {/* Table */}
              <div className={cn(
                "transition-opacity duration-300",
                isPageLoading && "opacity-50"
              )}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">No.</TableHead>
                      <TableHead>VIN</TableHead>
                      <TableHead>Make / Model</TableHead>
                      <TableHead className="hidden md:table-cell">Added</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle, index) => (
                      <TableRow 
                        key={vehicle.vin} 
                        className="cursor-pointer group hover-lift" 
                        onClick={() => window.location.href = `/vehicles/${encodeURIComponent(vehicle.vin)}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <TableCell>
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-sm font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                            {(page - 1) * pageSize + index + 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 rounded-md bg-muted/50 text-xs font-mono text-primary group-hover:bg-primary/10 transition-colors duration-300">
                            {vehicle.vin}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                              {vehicle.make} {vehicle.model}
                            </span>
                            <span className="text-xs text-muted-foreground">In Stock</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {vehicle.created_at 
                            ? new Date(vehicle.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              }) 
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/vehicles/${encodeURIComponent(vehicle.vin)}`} onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm" className="group-hover:border-primary group-hover:text-primary transition-all duration-300 hover:scale-105">
                              View Details
                              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border/30 animate-fade-in">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || isPageLoading}
                      onClick={() => handlePageChange(page - 1, { resetStatus: true })}
                      className="hover:scale-105 transition-transform duration-200"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || isPageLoading}
                      onClick={() => handlePageChange(page + 1, { resetStatus: true })}
                      className="hover:scale-105 transition-transform duration-200"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border/30 py-6 mt-auto">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-lg font-semibold font-display text-black dark:text-white">
              Tummala Motors
            </p>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Vehicle inventory management system
              </p>
              <Badge 
                variant={healthStatus === "ok" ? "success" : "warning"} 
                className="animate-fade-in stagger-1 hover-scale cursor-default"
              >
                <span className={cn(
                  "h-2 w-2 rounded-full mr-1.5 animate-pulse",
                  healthStatus === "ok" ? "bg-emerald-400" : "bg-amber-400"
                )} />
                API: {healthStatus ?? "..."}
              </Badge>
            </div>
          </div>
        </div>
      </footer>

      {/* Add Vehicle Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Fill in all required fields to add a vehicle to your inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <FormField 
                label="VIN" 
                htmlFor="vin" 
                required
                error={touched.vin ? formErrors.vin : undefined}
              >
                <Input
                  id="vin"
                  name="vin"
                  placeholder="e.g. 1HGCM82633A004352"
                  value={formState.vin}
                  onChange={handleInputChange("vin")}
                  onBlur={handleBlur("vin")}
                  className={cn(
                    "transition-all duration-300",
                    touched.vin && formErrors.vin && "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField 
                  label="Manufacturer" 
                  htmlFor="make" 
                  required
                  error={touched.make ? formErrors.make : undefined}
                >
                  <Input
                    id="make"
                    name="make"
                    placeholder="e.g. Porsche"
                    value={formState.make}
                    onChange={handleInputChange("make")}
                    onBlur={handleBlur("make")}
                    className={cn(
                      "transition-all duration-300",
                      touched.make && formErrors.make && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                </FormField>
                <FormField 
                  label="Model" 
                  htmlFor="model" 
                  required
                  error={touched.model ? formErrors.model : undefined}
                >
                  <Input
                    id="model"
                    name="model"
                    placeholder="e.g. 911 Turbo S"
                    value={formState.model}
                    onChange={handleInputChange("model")}
                    onBlur={handleBlur("model")}
                    className={cn(
                      "transition-all duration-300",
                      touched.model && formErrors.model && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                </FormField>
              </div>

              <FormField 
                label="Description" 
                htmlFor="description" 
                required
                error={touched.description ? formErrors.description : undefined}
              >
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description about the vehicle (at least 10 characters)..."
                  value={formState.description}
                  onChange={handleInputChange("description")}
                  onBlur={handleBlur("description")}
                  className={cn(
                    "min-h-[100px] transition-all duration-300",
                    touched.description && formErrors.description && "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </FormField>

              <FormField label="Image URLs" htmlFor="images">
                <Textarea
                  id="images"
                  name="images"
                  placeholder="Paste image URLs (one per line or comma-separated)"
                  value={formState.imageUrlsInput}
                  onChange={handleInputChange("imageUrlsInput")}
                  className="min-h-[80px]"
                />
                {parsedImageUrls.length > 0 && (
                  <p className="text-xs text-primary mt-2 animate-fade-in">
                    ✓ {parsedImageUrls.length} image{parsedImageUrls.length === 1 ? "" : "s"} detected
                  </p>
                )}
              </FormField>

              {statusMessage.tone && (
                <div
                  role="status"
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm animate-scale-in",
                    statusMessage.tone === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                      : "border-destructive/30 bg-destructive/10 text-destructive",
                  )}
                >
                  {statusMessage.tone === "success" ? (
                    <span className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4" />
                      {statusMessage.message}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <AlertIcon className="h-4 w-4" />
                      {statusMessage.message}
                    </span>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => handleDialogClose(false)}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={!isFormValid || isSubmitting}
                  className={cn(
                    "min-w-[140px] transition-all duration-300",
                    !isFormValid && "opacity-50 cursor-not-allowed",
                    isFormValid && "hover:scale-105"
                  )}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" className="border-current border-t-transparent" />
                      Adding...
                    </span>
                  ) : (
                    "Add Vehicle"
                  )}
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  children,
  required,
  error,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-primary ml-1">*</span>}
        </Label>
      </div>
      {children}
      {error && (
        <p className="text-xs text-destructive animate-fade-in flex items-center gap-1">
          <AlertIcon className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  );
}
