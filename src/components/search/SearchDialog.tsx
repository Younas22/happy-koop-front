"use client";

import { Search } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useLocalizedRouter, useMessages } from "@/i18n/client";

export interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Search entry point.
 *
 * It only navigates to `/search?q=...` - in the language being read - and
 * never renders invented suggestions or a fabricated "popular searches" list.
 * Results come from the backend on the search page.
 */
export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useLocalizedRouter();
  const m = useMessages();
  const [term, setTerm] = React.useState("");
  const inputId = React.useId();

  /** Clearing on close keeps a stale term from being resubmitted next time. */
  function handleOpenChange(next: boolean) {
    if (!next) setTerm("");
    onOpenChange(next);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = term.trim();
    if (!query) return;
    handleOpenChange(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{m.search.title}</DialogTitle>
          <DialogDescription>{m.search.description}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={submit} className="flex gap-2" role="search">
            <label htmlFor={inputId} className="sr-only">
              {m.header.searchProducts}
            </label>
            <Input
              id={inputId}
              type="search"
              name="q"
              value={term}
              maxLength={100}
              autoFocus
              placeholder={m.search.placeholder}
              onChange={(event) => setTerm(event.target.value)}
            />
            <Button type="submit" disabled={term.trim().length === 0}>
              <Search className="size-4" aria-hidden="true" />
              <span>{m.search.submit}</span>
            </Button>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
