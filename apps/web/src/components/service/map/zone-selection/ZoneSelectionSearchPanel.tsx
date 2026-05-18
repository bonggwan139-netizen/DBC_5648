"use client";

import { useEffect, useRef, useState } from "react";
import { useZoneSelectionSearch } from "./zoneSelectionSearchState";
import type { ZoneSelectionSearchCandidate } from "./zoneSelectionSearchTypes";

type CandidateSearchResponse = {
  results?: ZoneSelectionSearchCandidate[];
  message?: string;
};

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_MESSAGE = "주소를 두 글자 이상 입력하세요.";

function getAddressTypeLabel(addressType: ZoneSelectionSearchCandidate["addressType"]) {
  return addressType === "road" ? "도로명" : "지번";
}

export function ZoneSelectionSearchPanel() {
  const { state, closePanel, requestCandidateSelection } = useZoneSelectionSearch();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ZoneSelectionSearchCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(MIN_QUERY_MESSAGE);
  const [messageTone, setMessageTone] = useState<"neutral" | "error">("neutral");
  const [panelTop, setPanelTop] = useState(241);
  const activeRequestIdRef = useRef(0);
  const pendingControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      pendingControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!state.isPanelOpen) {
      return;
    }

    const syncPanelTop = () => {
      const panelParent = panelRef.current?.parentElement;
      const zoneCard = document.querySelector<HTMLElement>('[data-zone-selection-card="true"]');
      if (!panelParent || !zoneCard) {
        return;
      }

      const parentTop = panelParent.getBoundingClientRect().top;
      const cardTop = zoneCard.getBoundingClientRect().top;
      setPanelTop(Math.max(16, Math.round(cardTop - parentTop)));
    };

    syncPanelTop();
    window.addEventListener("resize", syncPanelTop);

    return () => {
      window.removeEventListener("resize", syncPanelTop);
    };
  }, [state.isPanelOpen]);

  useEffect(() => {
    if (!state.isPanelOpen) {
      pendingControllerRef.current?.abort();
      pendingControllerRef.current = null;
      setQuery("");
      setResults([]);
      setIsSearching(false);
      setMessage(MIN_QUERY_MESSAGE);
      setMessageTone("neutral");
      return;
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      pendingControllerRef.current?.abort();
      pendingControllerRef.current = null;
      setResults([]);
      setIsSearching(false);
      setMessage(MIN_QUERY_MESSAGE);
      setMessageTone("neutral");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      pendingControllerRef.current?.abort();
      const controller = new AbortController();
      pendingControllerRef.current = controller;
      const requestId = activeRequestIdRef.current + 1;
      activeRequestIdRef.current = requestId;

      setIsSearching(true);
      setMessage(null);
      setMessageTone("neutral");

      const params = new URLSearchParams({ query: trimmedQuery, limit: "10" });
      void fetch(`/api/vworld/search-candidates?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal
      })
        .then(async (response) => {
          const payload = (await response.json().catch(() => null)) as CandidateSearchResponse | null;
          if (controller.signal.aborted || activeRequestIdRef.current !== requestId) {
            return;
          }

          if (!response.ok) {
            setResults([]);
            setMessage(payload?.message ?? "검색 결과를 불러올 수 없습니다.");
            setMessageTone("error");
            return;
          }

          const nextResults = Array.isArray(payload?.results) ? payload.results.slice(0, 10) : [];
          setResults(nextResults);
          setMessage(nextResults.length > 0 ? null : "검색 결과가 없습니다.");
          setMessageTone("neutral");
        })
        .catch((error) => {
          if (controller.signal.aborted || activeRequestIdRef.current !== requestId) {
            return;
          }

          setResults([]);
          setMessage(error instanceof Error ? error.message : "검색 중 오류가 발생했습니다.");
          setMessageTone("error");
        })
        .finally(() => {
          if (controller.signal.aborted || activeRequestIdRef.current !== requestId) {
            return;
          }

          pendingControllerRef.current = null;
          setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query, state.isPanelOpen]);

  const handleClose = () => {
    closePanel();
  };

  const handleCandidateClick = (candidate: ZoneSelectionSearchCandidate) => {
    requestCandidateSelection(candidate);
  };

  if (!state.isPanelOpen) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      style={{ top: panelTop }}
      className="absolute left-6 z-20 w-[320px] rounded-xl border border-slate-200 bg-white/95 p-3 text-[11px] text-slate-700 shadow-lg backdrop-blur"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">구역 검색</p>
        <button
          type="button"
          onClick={handleClose}
          aria-label="구역 검색 닫기"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="m5.5 5.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <label htmlFor="zone-selection-search" className="sr-only">
        도로명 또는 지번 주소 검색
      </label>
      <input
        id="zone-selection-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="도로명 또는 지번 주소"
        autoFocus
        className="mt-3 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
      />

      {isSearching ? <p className="mt-2 text-[11px] text-slate-500">검색 중...</p> : null}
      {message ? (
        <p className={`mt-2 text-[11px] ${messageTone === "error" ? "text-rose-600" : "text-slate-500"}`}>
          {message}
        </p>
      ) : null}
      {state.selectionFeedback ? (
        <p
          className={`mt-2 text-[11px] ${
            state.selectionFeedback.tone === "error" ? "text-rose-600" : "text-slate-500"
          }`}
        >
          {state.selectionFeedback.message}
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="mt-3 max-h-[280px] overflow-y-auto rounded-lg border border-slate-200 bg-white">
          {results.map((candidate) => (
            <li key={candidate.id} className="border-b border-slate-100 last:border-b-0">
              <button
                type="button"
                onClick={() => handleCandidateClick(candidate)}
                disabled={state.pendingSelection !== null}
                className="flex w-full flex-col items-start gap-1 px-3 py-2 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="line-clamp-2 text-[12px] font-medium leading-5 text-slate-700">
                  {candidate.label}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {getAddressTypeLabel(candidate.addressType)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
