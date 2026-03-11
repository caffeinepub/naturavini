import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Wine {
    id: string;
    region?: string;
    country: string;
    grapeVariety?: string;
    createdAt: Time;
    year?: string;
    winery: string;
    soldOut: boolean;
    hotPrice: boolean;
    lowStock: boolean;
    notes?: string;
    price: string;
    wineStyle: WineStyle;
    wineName: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WineStyle {
    red = "red",
    sparkling = "sparkling",
    petNat = "petNat",
    orange = "orange",
    rose = "rose",
    white = "white"
}
export interface backendInterface {
    addWine(id: string, country: string, region: string | null, winery: string, wineName: string, grapeVariety: string | null, wineStyle: WineStyle, price: string, soldOut: boolean, hotPrice: boolean, lowStock: boolean, year: string | null, notes: string | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteWine(id: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWines(): Promise<Array<Wine>>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateWine(id: string, country: string, region: string | null, winery: string, wineName: string, grapeVariety: string | null, wineStyle: WineStyle, price: string, soldOut: boolean, hotPrice: boolean, lowStock: boolean, year: string | null, notes: string | null): Promise<void>;
}
