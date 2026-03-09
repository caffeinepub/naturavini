import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public type WineStyle = {
    #red;
    #white;
    #rose;
    #sparkling;
    #orange;
    #petNat;
  };

  // Core wine storage type — kept stable-compatible with existing on-chain data
  type WineRecord = {
    id : Text;
    country : Text;
    region : ?Text;
    winery : Text;
    wineName : Text;
    grapeVariety : ?Text;
    wineStyle : WineStyle;
    price : Text;
    createdAt : Time.Time;
    soldOut : Bool;
    year : ?Text;
  };

  // Public-facing Wine type
  public type Wine = {
    id : Text;
    country : Text;
    region : ?Text;
    winery : Text;
    wineName : Text;
    grapeVariety : ?Text;
    wineStyle : WineStyle;
    price : Text;
    createdAt : Time.Time;
    soldOut : Bool;
    hotPrice : Bool;
    year : ?Text;
    notes : ?Text;
  };

  // Existing stable wines map — type unchanged for compatibility
  let wines = Map.empty<Text, WineRecord>();

  // Separate stable map for hot price flags
  let hotPrices = Map.empty<Text, Bool>();

  // Separate stable map for notes — avoids migration issues
  let wineNotes = Map.empty<Text, Text>();

  // Helper: merge a WineRecord with its hotPrice flag and notes
  func toWine(r : WineRecord) : Wine = {
    id = r.id;
    country = r.country;
    region = r.region;
    winery = r.winery;
    wineName = r.wineName;
    grapeVariety = r.grapeVariety;
    wineStyle = r.wineStyle;
    price = r.price;
    createdAt = r.createdAt;
    soldOut = r.soldOut;
    hotPrice = switch (hotPrices.get(r.id)) { case (?v) v; case null false };
    year = r.year;
    notes = wineNotes.get(r.id);
  };

  public query func getWines() : async [Wine] {
    wines.values().map(toWine).toArray();
  };

  public shared ({ caller }) func addWine(
    id : Text,
    country : Text,
    region : ?Text,
    winery : Text,
    wineName : Text,
    grapeVariety : ?Text,
    wineStyle : WineStyle,
    price : Text,
    soldOut : Bool,
    hotPrice : Bool,
    year : ?Text,
    notes : ?Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add wines");
    };
    if (wines.containsKey(id)) {
      Runtime.trap("Wine with this ID already exists");
    };
    let newWine : WineRecord = {
      id;
      country;
      region;
      winery;
      wineName;
      grapeVariety;
      wineStyle;
      price;
      createdAt = Time.now();
      soldOut;
      year;
    };
    wines.add(id, newWine);
    hotPrices.add(id, hotPrice);
    switch (notes) {
      case (?n) { if (n != "") { wineNotes.add(id, n) } };
      case null {};
    };
  };

  public shared ({ caller }) func updateWine(
    id : Text,
    country : Text,
    region : ?Text,
    winery : Text,
    wineName : Text,
    grapeVariety : ?Text,
    wineStyle : WineStyle,
    price : Text,
    soldOut : Bool,
    hotPrice : Bool,
    year : ?Text,
    notes : ?Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update wines");
    };
    switch (wines.get(id)) {
      case (null) {
        Runtime.trap("Wine not found");
      };
      case (?existingWine) {
        let updatedWine : WineRecord = {
          id;
          country;
          region;
          winery;
          wineName;
          grapeVariety;
          wineStyle;
          price;
          createdAt = existingWine.createdAt;
          soldOut;
          year;
        };
        wines.add(id, updatedWine);
        hotPrices.add(id, hotPrice);
        switch (notes) {
          case (?n) {
            if (n != "") { wineNotes.add(id, n) } else { wineNotes.remove(id) };
          };
          case null { wineNotes.remove(id) };
        };
      };
    };
  };

  public shared ({ caller }) func deleteWine(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete wines");
    };
    switch (wines.get(id)) {
      case (null) {
        Runtime.trap("Wine not found");
      };
      case (_) {
        wines.remove(id);
        hotPrices.remove(id);
        wineNotes.remove(id);
      };
    };
  };

  func setupSampleData() {
    let sampleWines : [WineRecord] = [
      {
        id = "hr-1";
        country = "Croatia";
        region = ?"Dalmatia";
        winery = "Bibich";
        wineName = "R6 Riserva";
        grapeVariety = ?"Babi\u{107}";
        wineStyle = #red;
        price = "150 HRK";
        createdAt = Time.now();
        soldOut = false;
        year = ?"2019";
      },
      {
        id = "hr-2";
        country = "Croatia";
        region = ?"Slavonia";
        winery = "Krauthaker";
        wineName = "Grasevina Mitrovac";
        grapeVariety = ?"Grasevina";
        wineStyle = #white;
        price = "90 HRK";
        createdAt = Time.now();
        soldOut = false;
        year = ?"2020";
      },
      {
        id = "hr-3";
        country = "Croatia";
        region = ?"Peljesac";
        winery = "Saint Hills";
        wineName = "Dinga\u{10d}";
        grapeVariety = ?"Plavac Mali";
        wineStyle = #red;
        price = "250 HRK";
        createdAt = Time.now();
        soldOut = false;
        year = ?"2016";
      },
      {
        id = "it-1";
        country = "Italy";
        region = ?"Tuscany";
        winery = "Antinori";
        wineName = "Tignanello";
        grapeVariety = ?"Sangiovese";
        wineStyle = #red;
        price = "100 EUR";
        createdAt = Time.now();
        soldOut = false;
        year = ?"2019";
      },
      {
        id = "it-2";
        country = "Italy";
        region = ?"Piedmont";
        winery = "Gaja";
        wineName = "Barbaresco";
        grapeVariety = ?"Nebbiolo";
        wineStyle = #red;
        price = "200 EUR";
        createdAt = Time.now();
        soldOut = false;
        year = ?"2016";
      },
      {
        id = "it-3";
        country = "Italy";
        region = ?"Tuscany";
        winery = "Frescobaldi";
        wineName = "Nipozzano Riserva";
        grapeVariety = ?"Sangiovese";
        wineStyle = #red;
        price = "25 EUR";
        createdAt = Time.now();
        soldOut = false;
        year = ?"2022";
      },
    ];

    for (wine in sampleWines.values()) {
      wines.add(wine.id, wine);
      hotPrices.add(wine.id, false);
    };
  };
};
