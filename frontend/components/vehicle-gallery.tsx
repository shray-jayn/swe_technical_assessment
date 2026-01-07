"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface VehicleGalleryProps {
  gallery: string[];
  make: string;
  model: string;
}

export function VehicleGallery({ gallery, make, model }: VehicleGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const isOpen = selectedIndex !== null;

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleClose = () => {
    setSelectedIndex(null);
  };

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex === null) return;
    const prevIndex = selectedIndex === 0 ? gallery.length - 1 : selectedIndex - 1;
    setSelectedIndex(prevIndex);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex === null) return;
    const nextIndex = selectedIndex === gallery.length - 1 ? 0 : selectedIndex + 1;
    setSelectedIndex(nextIndex);
  };

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, gallery.length]);

  if (gallery.length <= 1) return null;

  return (
    <>
      <section className="mt-12 space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Gallery</p>
            <h3 className="font-display text-2xl font-bold text-foreground">More Images</h3>
          </div>
          <Badge variant="outline">{gallery.length} Photos</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {gallery.map((url, index) => (
            <div
              key={index}
              onClick={() => handleImageClick(index)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-md hover-lift cursor-pointer animate-fade-in-up",
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <img
                src={url}
                alt={`${make} ${model} - Image ${index + 1}`}
                className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <p className="text-sm font-medium text-foreground">Image {index + 1}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Image Carousel Modal */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-50 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Close carousel"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Previous button */}
            {selectedIndex !== null && (
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                aria-label="Previous image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}

            {/* Next button */}
            {selectedIndex !== null && (
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                aria-label="Next image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}

            {/* Current image */}
            {selectedIndex !== null && (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img
                  src={gallery[selectedIndex]}
                  alt={`${make} ${model} - Image ${selectedIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

