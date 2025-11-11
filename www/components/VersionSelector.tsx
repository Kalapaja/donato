"use client";

import { useState, useRef, useEffect } from "react";
import { useVersions, formatFileSize, formatVersionDate, sortVersionsDescending } from "../lib/useVersions";
import type { VersionEntry } from "../types/versions";

interface VersionSelectorProps {
  /** Currently selected version */
  selectedVersion: string | null;
  
  /** Callback when version is selected */
  onVersionChange: (version: string, entry: VersionEntry) => void;
  
  /** Optional: Custom manifest URL */
  manifestUrl?: string;
}

/**
 * VersionSelector Component
 * 
 * Displays a dropdown/list UI for selecting widget versions.
 * Features:
 * - Fetches available versions from versions.json
 * - Displays version metadata (date, size)
 * - Highlights latest version
 * - Handles loading and error states
 * - Keyboard navigation support
 * 
 * @example
 * ```tsx
 * <VersionSelector
 *   selectedVersion={selectedVersion}
 *   onVersionChange={(version, entry) => {
 *     setSelectedVersion(version);
 *     console.log('Selected:', version, entry);
 *   }}
 * />
 * ```
 */
export function VersionSelector({
  selectedVersion,
  onVersionChange,
  manifestUrl,
}: VersionSelectorProps) {
  const { manifest, isLoading, error, refetch } = useVersions({ manifestUrl });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);
  
  // Auto-select latest version if none selected
  useEffect(() => {
    if (manifest && !selectedVersion) {
      const latestEntry = manifest.versions[manifest.latest];
      if (latestEntry) {
        onVersionChange(manifest.latest, latestEntry);
      }
    }
  }, [manifest, selectedVersion, onVersionChange]);
  
  const handleVersionSelect = (version: string, entry: VersionEntry) => {
    onVersionChange(version, entry);
    setIsOpen(false);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div
        className="w-full px-4 py-3 rounded-lg border flex items-center gap-3"
        style={{
          background: "var(--color-secondary)",
          borderColor: "var(--color-border)",
          borderRadius: "calc(var(--radius) - 2px)",
        }}
      >
        <div
          className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-muted-foreground)" }}
        />
        <span style={{ color: "var(--color-muted-foreground)" }}>
          Loading versions...
        </span>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div
        className="w-full px-4 py-3 rounded-lg border"
        style={{
          background: "oklch(from var(--color-accent) calc(l + 0.4) c h / 0.1)",
          borderColor: "var(--color-accent)",
          borderRadius: "calc(var(--radius) - 2px)",
        }}
      >
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: "var(--color-accent)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-accent)" }}
            >
              Failed to load versions
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              {error}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-xs font-medium mt-2 underline"
              style={{ color: "var(--color-accent)" }}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // No manifest data
  if (!manifest) {
    return null;
  }
  
  // Sort versions (newest first)
  const sortedVersions = sortVersionsDescending(Object.keys(manifest.versions));
  const selectedEntry = selectedVersion ? manifest.versions[selectedVersion] : null;
  
  return (
    <div className="relative" ref={dropdownRef}>
      <label
        className="block text-sm font-medium mb-2"
        style={{ color: "var(--color-foreground)" }}
      >
        Widget Version
      </label>
      
      {/* Selected version display (trigger) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg border text-left flex items-center justify-between gap-3 transition-colors"
        style={{
          background: "var(--color-secondary)",
          borderColor: "var(--color-border)",
          borderRadius: "calc(var(--radius) - 2px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--color-muted)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--color-secondary)";
        }}
      >
        <div className="flex-1 min-w-0">
          {selectedVersion && selectedEntry ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="font-mono font-semibold"
                  style={{ color: "var(--color-foreground)" }}
                >
                  v{selectedVersion}
                </span>
                {selectedVersion === manifest.latest && (
                  <span
                    className="px-2 py-0.5 text-xs font-medium rounded"
                    style={{
                      background: "var(--color-primary)",
                      color: "var(--color-background)",
                    }}
                  >
                    Latest
                  </span>
                )}
                {selectedEntry.releaseUrl && (
                  <a
                    href={selectedEntry.releaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors"
                    style={{
                      color: "var(--color-muted-foreground)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--color-border)";
                      e.currentTarget.style.color = "var(--color-foreground)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--color-muted-foreground)";
                    }}
                    title={`View release notes for v${selectedVersion}`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    <span className="text-xs">Release</span>
                  </a>
                )}
              </div>
              <div
                className="text-xs flex items-center gap-2"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  {formatFileSize(selectedEntry.size)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {formatVersionDate(selectedEntry.date)}
                </span>
              </div>
            </>
          ) : (
            <span style={{ color: "var(--color-muted-foreground)" }}>
              Select version...
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      {/* Dropdown list */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 rounded-lg border shadow-lg overflow-hidden"
          style={{
            background: "var(--color-background)",
            borderColor: "var(--color-border)",
            borderRadius: "calc(var(--radius) - 2px)",
            maxHeight: "320px",
          }}
        >
          <div className="overflow-y-auto max-h-80">
            {sortedVersions.map((version) => {
              const entry = manifest.versions[version];
              const isLatest = version === manifest.latest;
              const isSelected = version === selectedVersion;
              
              return (
                <button
                  key={version}
                  type="button"
                  onClick={() => handleVersionSelect(version, entry)}
                  className="w-full px-4 py-3 text-left transition-colors border-b last:border-b-0"
                  style={{
                    background: isSelected ? "var(--color-muted)" : "transparent",
                    borderColor: "var(--color-border)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--color-secondary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="font-mono font-semibold"
                          style={{ color: "var(--color-foreground)" }}
                        >
                          v{version}
                        </span>
                        {isLatest && (
                          <span
                            className="px-2 py-0.5 text-xs font-medium rounded"
                            style={{
                              background: "var(--color-primary)",
                              color: "var(--color-background)",
                            }}
                          >
                            Latest
                          </span>
                        )}
                        {entry.releaseUrl && (
                          <a
                            href={entry.releaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors"
                            style={{
                              color: "var(--color-muted-foreground)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--color-border)";
                              e.currentTarget.style.color = "var(--color-foreground)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "var(--color-muted-foreground)";
                            }}
                            title={`View release notes for v${version}`}
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="currentColor"
                              viewBox="0 0 16 16"
                            >
                              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                            </svg>
                            <span className="text-xs">Release</span>
                          </a>
                        )}
                        {isSelected && (
                          <svg
                            className="w-4 h-4 ml-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "var(--color-primary)" }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <div
                        className="text-xs flex items-center gap-2 flex-wrap"
                        style={{ color: "var(--color-muted-foreground)" }}
                      >
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          {formatFileSize(entry.size)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Released {formatVersionDate(entry.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Info footer */}
          <div
            className="px-4 py-2 border-t text-xs"
            style={{
              background: "var(--color-secondary)",
              borderColor: "var(--color-border)",
              color: "var(--color-muted-foreground)",
            }}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {sortedVersions.length} version{sortedVersions.length !== 1 ? "s" : ""} available
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

