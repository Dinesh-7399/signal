// src/components/WatchlistButton.tsx
"use client";
import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import { toggleWatchlist } from "@/lib/actions/watchlist.actions"; // New import

// Minimal WatchlistButton implementation to satisfy page requirements.
// This component focuses on UI contract only. It toggles local state and
// calls onWatchlistChange if provided. Styling hooks match globals.css.

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [isPending, startTransition] = useTransition(); // Add useTransition
  const router = useRouter(); // Add useRouter

  // The label logic is fine, keeping it.
  const label = useMemo(() => {
    if (type === "icon") return added ? "" : "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  // Refactored handleClick to be a transition that calls the server action
  const handleClick = () => {
    const next = !added
    
    startTransition(async () => {
      // Call the server action to toggle the state in the database
      const { success, message } = await toggleWatchlist(symbol, company, added);

      if (success) {
        // Toggle local state *only if server action succeeded*
        setAdded(next);
        
        // Notify external handlers (e.g., to remove from table row on Watchlist page)
        onWatchlistChange?.(symbol, next);
        
        toast.success(message);
        
        // Refresh the router to trigger a re-fetch of data on the server side 
        // which updates the Header and Watchlist page component data
        router.refresh(); 
      } else {
        toast.error('Failed to update watchlist', {
            description: message
        });
      }
    });
  };

  // --- Start of render logic with loading state ---

  // Content for the default button type (when not pending)
  const defaultButtonContent = (
    <>
      {/* Original Trash Icon logic */}
      {showTrashIcon && added ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 mr-2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
        </svg>
      ) : null}
      <span>{label}</span>
    </>
  );

  if (type === "icon") {
    return (
      <button
        title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
        onClick={handleClick}
        disabled={isPending} // Disable button while loading
      >
        {isPending ? <Loader2 className="h-6 w-6 animate-spin text-yellow-500" /> : <Star className=" size-6" fill="gold"/>}
      </button>
    );
  }

  // Default button type
  return (
    <button 
        className={`watchlist-btn ${added ? "watchlist-remove" : ""}`} 
        onClick={handleClick}
        disabled={isPending} // Disable button while loading
    >
        {isPending ? (
            <div className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{added ? 'Removing...' : 'Adding...'}</span>
            </div>
        ) : defaultButtonContent}
    </button>
  );
};

export default WatchlistButton;