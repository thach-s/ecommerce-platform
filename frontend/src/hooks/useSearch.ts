import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface SearchSuggestion {
  _id: string;
  name: string;
  image?: string;
  price: number;
  category: string;
}

export function useSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Load history từ LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('search_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  const saveHistory = (keyword: string) => {
    if (!keyword || !keyword.trim()) return;
    const term = keyword.trim();
    const newHistory = [term, ...history.filter(h => h !== term)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const removeHistoryItem = (keyword: string) => {
    const newHistory = history.filter(h => h !== keyword);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('search_history');
  };

  useEffect(() => {
    if (!query || query.trim() === '') {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/search/suggestions?q=${encodeURIComponent(query.trim())}`);
        setSuggestions(data.items || []);
      } catch (e) {
        console.error("Search error:", e);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms Debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return { 
    query, 
    setQuery, 
    suggestions, 
    loading, 
    history, 
    saveHistory, 
    removeHistoryItem, 
    clearHistory 
  };
}
