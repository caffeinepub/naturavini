import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  // Use RBAC system for authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Mixin for blob storage (not used for current logic)
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
  };

  let wines = Map.empty<Text, Wine>();

  public query ({ caller }) func getWines() : async [Wine] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users and admins can view wines");
    };
    wines.values().toArray();
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
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add wines");
    };
    if (wines.containsKey(id)) {
      Runtime.trap("Wine with this ID already exists");
    };
    let newWine : Wine = {
      id;
      country;
      region;
      winery;
      wineName;
      grapeVariety;
      wineStyle;
      price;
      createdAt = Time.now();
    };
    wines.add(id, newWine);
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
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update wines");
    };
    switch (wines.get(id)) {
      case (null) {
        Runtime.trap("Wine not found");
      };
      case (?existingWine) {
        let updatedWine : Wine = {
          id;
          country;
          region;
          winery;
          wineName;
          grapeVariety;
          wineStyle;
          price;
          createdAt = existingWine.createdAt;
        };
        wines.add(id, updatedWine);
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
      };
    };
  };

  func setupSampleData() {
    let sampleWines = [
      {
        id = "hr-1";
        country = "Croatia";
        region = ?"Dalmatia";
        winery = "Bibich";
        wineName = "R6 Riserva";
        grapeVariety = ?"Babić";
        wineStyle = #red;
        price = "150 HRK";
        createdAt = Time.now();
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
      },
      {
        id = "hr-3";
        country = "Croatia";
        region = ?"Peljesac";
        winery = "Saint Hills";
        wineName = "Dingač";
        grapeVariety = ?"Plavac Mali";
        wineStyle = #red;
        price = "250 HRK";
        createdAt = Time.now();
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
      },
    ];

    for (wine in sampleWines.values()) {
      wines.add(wine.id, wine);
    };
  };
};
