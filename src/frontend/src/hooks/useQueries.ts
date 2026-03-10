import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Wine } from "../backend";
import type { WineStyle } from "../backend";
import { useActor } from "./useActor";

// ─── Fetch all wines ───────────────────────────────────────────────────────────
export function useGetAllWines() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Wine[]>({
    queryKey: ["wines"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWines();
    },
    enabled: !!actor && !actorFetching,
  });
}

// ─── Add wine ─────────────────────────────────────────────────────────────────
export function useAddWine() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wine: {
      id: string;
      country: string;
      region: string | null;
      winery: string;
      wineName: string;
      grapeVariety: string | null;
      wineStyle: WineStyle;
      price: string;
      soldOut: boolean;
      hotPrice: boolean;
      year: string | null;
    }) => {
      if (!actor)
        throw new Error(
          "Actor not available — please wait a moment and try again.",
        );
      await actor.addWine(
        wine.id,
        wine.country,
        wine.region,
        wine.winery,
        wine.wineName,
        wine.grapeVariety,
        wine.wineStyle,
        wine.price,
        wine.soldOut,
        wine.hotPrice,
        wine.year,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wines"] });
      toast.success("Wine added successfully!");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to add wine.";
      toast.error(message);
    },
  });
}

// ─── Update wine ──────────────────────────────────────────────────────────────
export function useUpdateWine() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wine: {
      id: string;
      country: string;
      region: string | null;
      winery: string;
      wineName: string;
      grapeVariety: string | null;
      wineStyle: WineStyle;
      price: string;
      soldOut: boolean;
      hotPrice: boolean;
      year: string | null;
    }) => {
      if (!actor)
        throw new Error(
          "Actor not available — please wait a moment and try again.",
        );
      await actor.updateWine(
        wine.id,
        wine.country,
        wine.region,
        wine.winery,
        wine.wineName,
        wine.grapeVariety,
        wine.wineStyle,
        wine.price,
        wine.soldOut,
        wine.hotPrice,
        wine.year,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wines"] });
      toast.success("Wine updated successfully!");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to update wine.";
      toast.error(message);
    },
  });
}

// ─── Delete wine ──────────────────────────────────────────────────────────────
export function useDeleteWine() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor)
        throw new Error(
          "Actor not available — please wait a moment and try again.",
        );
      await actor.deleteWine(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wines"] });
      toast.success("Wine deleted.");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to delete wine.";
      toast.error(message);
    },
  });
}
