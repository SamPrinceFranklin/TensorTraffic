
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { autocompletePlaces, getPlaceDetails, PlaceDetails, AutocompletePrediction } from '@/lib/places-service';
import { useDebounce } from '@/hooks/use-debounce';
import { Label } from './ui/label';
import { LucideProps } from 'lucide-react';
import { LoaderCircle } from 'lucide-react';

interface PlacesAutocompleteInputProps {
  label: string;
  onPlaceSelect: (place: PlaceDetails) => void;
  icon: React.ElementType<LucideProps>;
  initialValue?: string;
}

export function PlacesAutocompleteInput({ label, onPlaceSelect, icon: Icon, initialValue = '' }: PlacesAutocompleteInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length > 2) {
        setIsLoading(true);
        const result = await autocompletePlaces(debouncedQuery, null);
        if (result.success && result.data) {
          setSuggestions(result.data);
        } else {
          setSuggestions([]);
        }
        setIsLoading(false);
      } else {
        setSuggestions([]);
      }
    };

    if (showSuggestions) {
        fetchSuggestions();
    }
  }, [debouncedQuery, showSuggestions]);

  useEffect(() => {
      if (query.length <= 2) {
          setSuggestions([]);
      }
  }, [query]);

  const handleSelectSuggestion = async (placeId: string, description: string) => {
    setIsLoading(true);
    setQuery(description);
    setShowSuggestions(false);
    setSuggestions([]);

    const result = await getPlaceDetails(placeId);
    if (result.success && result.data) {
      onPlaceSelect(result.data);
    } else {
      toast({ variant: 'destructive', title: 'Could not fetch place details.' });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-start gap-3" ref={wrapperRef}>
        <Icon className="w-5 h-5 text-green-500 mt-1" />
        <div className='w-full relative'>
            <Label className="font-semibold">{label}</Label>
            <div className="relative mt-1">
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        if(!showSuggestions) setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Type an address..."
                />
                {isLoading && <LoaderCircle className="w-4 h-4 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />}
            </div>

            {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-background border border-border mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion) => (
                <div
                    key={suggestion.placeId}
                    className="p-2 hover:bg-accent cursor-pointer text-sm"
                    onClick={() => handleSelectSuggestion(suggestion.placeId, suggestion.description)}
                >
                    {suggestion.description}
                </div>
                ))}
            </div>
            )}
        </div>
    </div>
  );
}

    