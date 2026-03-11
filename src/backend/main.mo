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

  // Core wine storage type
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
    lowStock : Bool;
    year : ?Text;
    notes : ?Text;
  };

  let wines = Map.empty<Text, WineRecord>();
  let hotPrices = Map.empty<Text, Bool>();
  let lowStocks = Map.empty<Text, Bool>();
  let wineNotes = Map.empty<Text, Text>();

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
    lowStock = switch (lowStocks.get(r.id)) { case (?v) v; case null false };
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
    lowStock : Bool,
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
    lowStocks.add(id, lowStock);
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
    lowStock : Bool,
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
        lowStocks.add(id, lowStock);
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
        lowStocks.remove(id);
        wineNotes.remove(id);
      };
    };
  };

  func addSample(r : WineRecord) {
    if (not wines.containsKey(r.id)) {
      wines.add(r.id, r);
      hotPrices.add(r.id, false);
      lowStocks.add(r.id, false);
    };
  };

  func setupSampleData() {
    addSample({ id = "austria--rebenhof-spatfullung-1772576040263"; country = "Austria"; region = ?("Stiria"); winery = "Rebenhof"; wineName = "Spatfullung"; grapeVariety = ?("Muskateller"); wineStyle = #white; price = "13\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2021") });
    addSample({ id = "austria-rebenhof-burgunder-silt-1772575936873"; country = "Austria"; region = ?("Stiria"); winery = "Rebenhof"; wineName = "Burgunder Silt"; grapeVariety = ?("Sauvignon Blanc/Chardonnay"); wineStyle = #white; price = "15\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2020") });
    addSample({ id = "croatia--bartulovi-dinga-1772470989879"; country = "Croatia"; region = ?("Dalmacija"); winery = "Bartulovi\u{107}"; wineName = "Ding\u{e4}"; grapeVariety = ?("Ding\u{e4}"); wineStyle = #red; price = "24\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2023") });
    addSample({ id = "croatia-atimo-malvazija-1772472761307"; country = "Croatia"; region = ?("Istra"); winery = "Atimo"; wineName = "Malvazija"; grapeVariety = ?("Malvazija Istarska"); wineStyle = #orange; price = "22\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2023") });
    addSample({ id = "croatia-bartulovi-bartul-1772470797795"; country = "Croatia"; region = ?("Dalmacija"); winery = "Bartulovi\u{107}"; wineName = "Bartul"; grapeVariety = ?("Plavac Mali"); wineStyle = #red; price = "18\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2023") });
    addSample({ id = "croatia-cota-baba-manda-1772565682265"; country = "Croatia"; region = ?("Dal\u{10d}macija"); winery = "Cota"; wineName = "Baba Manda"; grapeVariety = ?("Debit/Mara\u{161}tina"); wineStyle = #white; price = "11.50"; createdAt = 0; soldOut = false; year = ?("2022") });
    addSample({ id = "croatia-cota-lapacha-1772565809553"; country = "Croatia"; region = ?("Dalmacija"); winery = "Cota"; wineName = "Lapacha"; grapeVariety = ?("Merlot"); wineStyle = #rose; price = "11.50"; createdAt = 0; soldOut = false; year = ?("2022") });
    addSample({ id = "croatia-cota-oklaj-white-1772472683100"; country = "Croatia"; region = ?("Dalmacija"); winery = "Cota"; wineName = "Oklaj White"; grapeVariety = ?("Mara\u{161}tina"); wineStyle = #orange; price = "14\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "croatia-cota-pero-jdero-1772565989691"; country = "Croatia"; region = ?("Dalmacija"); winery = "Cota"; wineName = "Pero j'dero"; grapeVariety = ?("Lasina/Merlot/Plavina"); wineStyle = #red; price = "11.50"; createdAt = 0; soldOut = false; year = ?("2022") });
    addSample({ id = "croatia-delusional-wine-angel-1772472593492"; country = "Croatia"; region = ?("Dalmacija"); winery = "Delusional Wine"; wineName = "Angel"; grapeVariety = ?("Babi\u{107}"); wineStyle = #red; price = "19\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "croatia-delusional-wines-drunken-english-1772472439241"; country = "Croatia"; region = ?("Dalmacija"); winery = "Delusional Wines"; wineName = "Drunken Englishman"; grapeVariety = ?("Plavac mali/Crljenik Ka\u{161}telanski"); wineStyle = #red; price = "15\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "croatia-ghira-kalamita-1772230845802"; country = "Croatia"; region = ?("Istra"); winery = "Ghira"; wineName = "Kalamita"; grapeVariety = ?("malvazija"); wineStyle = #white; price = "13 \u{20ac}"; createdAt = 0; soldOut = false; year = ?("2025") });
    addSample({ id = "croatia-ghira-manera-1772470038035"; country = "Croatia"; region = ?("Istra"); winery = "Ghira"; wineName = "Manera"; grapeVariety = ?("Cabernet sauvignon/Merlot"); wineStyle = #red; price = "12\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2021") });
    addSample({ id = "croatia-ghira-tortura-1772469915987"; country = "Croatia"; region = ?("Istra"); winery = "Ghira"; wineName = "Tortura"; grapeVariety = ?("White Moscato"); wineStyle = #white; price = "15\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2025") });
    addSample({ id = "ghira-tortura--malvazija-1772230965732"; country = "Croatia"; region = ?("Istra"); winery = "Ghira"; wineName = "Madura"; grapeVariety = ?("malvazija"); wineStyle = #orange; price = "22 \u{20ac}"; createdAt = 0; soldOut = false; year = ?("2023") });
    addSample({ id = "croatia-gordia-rdee-1772477497979"; country = "Croatia"; region = ?("Istra"); winery = "Gordia"; wineName = "Rde\u{10d}e"; grapeVariety = ?("Rfo\u{161}k"); wineStyle = #red; price = "23"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "croatia-kosovec-frankovka-1772471816818"; country = "Croatia"; region = ?("Moslavina"); winery = "Kosovec"; wineName = "Frankovka"; grapeVariety = ?("Frankovka"); wineStyle = #red; price = "11\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "croatia-kosovec-krlet-1772471213313"; country = "Croatia"; region = ?("Moslavina"); winery = "Kosovec"; wineName = "\u{160}krlet"; grapeVariety = ?("\u{160}krlet"); wineStyle = #white; price = "12\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "croatia-kosovec-ovnek-1772471294134"; country = "Croatia"; region = ?("Moslavina"); winery = "Kosovec"; wineName = "Ovnek"; grapeVariety = ?("\u{160}krlet"); wineStyle = #orange; price = "16\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "kosovec-kosovec-pinot-noir-1772471885276"; country = "Croatia"; region = ?("Dalmacija"); winery = "Kosovec"; wineName = "Pinot Noir"; grapeVariety = ?("Pinot Noir"); wineStyle = #red; price = "?"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "croatia-kri-grk-1772471121571"; country = "Croatia"; region = ?("Dalmacija"); winery = "Kri\u{17e}"; wineName = "Grk"; grapeVariety = ?("Grk"); wineStyle = #orange; price = "22\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2023") });
    addSample({ id = "croatia-kri-milo-1772471400269"; country = "Croatia"; region = ?("Dalmacija"); winery = "Kri\u{17e}"; wineName = "Milo"; grapeVariety = ?("Mali Plavac"); wineStyle = #red; price = "18\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "kri-kri-mali-plavac-1772471472337"; country = "Croatia"; region = ?("Dalmacija"); winery = "Kri\u{17e}"; wineName = "Mali Plavac"; grapeVariety = ?("Mali Plavac"); wineStyle = #red; price = "23\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "croatia-piquentum-malvazija-1772470222852"; country = "Croatia"; region = ?("Istra"); winery = "Piquentum"; wineName = "Malvazija"; grapeVariety = ?("Malvazija Istarska"); wineStyle = #white; price = "13.50\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2024") });
    addSample({ id = "croatia-piquentum-malvazija-1772470291318"; country = "Croatia"; region = ?("Istra"); winery = "Piquentum"; wineName = "Teran"; grapeVariety = ?("Teran"); wineStyle = #red; price = "13.50\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2024") });
    addSample({ id = "croatia-piquentum-refok-1772470412128"; country = "Croatia"; region = ?("Istra"); winery = "Piquentum"; wineName = "Rfo\u{161}k"; grapeVariety = ?("Rfo\u{161}k"); wineStyle = #red; price = "18\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2023") });
    addSample({ id = "croatia-rawino-malvazija-1772470517287"; country = "Croatia"; region = ?("Istra"); winery = "Rawino"; wineName = "Malvazija"; grapeVariety = ?("Malvazija Istarska"); wineStyle = #orange; price = "23\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2023") });
    addSample({ id = "croatia-tomac-marany-1772566697066"; country = "Croatia"; region = ?("Ple\u{161}ivica"); winery = "Tomac"; wineName = "Marany"; grapeVariety = null; wineStyle = #orange; price = "?"; createdAt = 0; soldOut = false; year = ?("2022") });
    addSample({ id = "tomac-tomac-pet-nat-rose-1772472870683"; country = "Croatia"; region = ?("Ple\u{161}ivica"); winery = "Tomac"; wineName = "Pet Nat Rose"; grapeVariety = ?("Old local grapes"); wineStyle = #petNat; price = "14\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2024") });
    // France
    addSample({ id = "france-julien-pinneau-chicos-1772576161915"; country = "France"; region = ?("Loire"); winery = "Julien Pinneau"; wineName = "Chicos"; grapeVariety = ?("Chenin/Sauvignon Blanc"); wineStyle = #white; price = "13\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2022") });
    // Hungary
    addSample({ id = "hungary-gran-vin-de-barnag-furmint-1772575607144"; country = "Hungary"; region = ?("Barnag"); winery = "Gran Vin de Barnag"; wineName = "Furmint"; grapeVariety = ?("Furmint"); wineStyle = #white; price = "14\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "hungary-wassman-cabarnet-franc-1772575733767"; country = "Hungary"; region = ?("Villany"); winery = "Wassman"; wineName = "Cabarnet Franc"; grapeVariety = ?("Cabarnet Franc"); wineStyle = #red; price = "18.50\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    // Italy
    addSample({ id = "croatia-angiolino-maule-sassaia-1772473099766"; country = "Italy"; region = ?("Veneto"); winery = "Angiolino Maule"; wineName = "Sassaia"; grapeVariety = ?("Garganega"); wineStyle = #white; price = "12.50\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2024") });
    addSample({ id = "italy-angiolino-maule-gargngo-1772473465071"; country = "Italy"; region = ?("Veneto"); winery = "Angiolino Maule"; wineName = "Garg'N'Go"; grapeVariety = ?("Pet Nat"); wineStyle = #petNat; price = "11.50"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-angiolino-maule-massieri-1772473028613"; country = "Italy"; region = ?("Veneto"); winery = "Angiolino Maule"; wineName = "Massieri"; grapeVariety = ?("Garganega"); wineStyle = #white; price = "10\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2025") });
    addSample({ id = "italy-angiolino-maule-pico-1772473293470"; country = "Italy"; region = ?("Veneto"); winery = "Angiolino Maule"; wineName = "Pico"; grapeVariety = ?("Garganega"); wineStyle = #orange; price = "18.50\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2023") });
    addSample({ id = "italy-cantina-martinelli-il-gigante-1772568723066"; country = "Italy"; region = ?("Veneto"); winery = "Cantina Martinelli"; wineName = "Il Gigante"; grapeVariety = ?("Garganega di Soave"); wineStyle = #white; price = "13\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2024") });
    addSample({ id = "italy-cantina-martinelli-leviatano-1772568631107"; country = "Italy"; region = ?("Veneto"); winery = "Cantina Martinelli"; wineName = "Leviatano"; grapeVariety = ?("Garganega"); wineStyle = #petNat; price = "11.50"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-cascina-boccaccio-celso-zero-1772566867991"; country = "Italy"; region = ?("Piemonte"); winery = "Cascina Boccaccio"; wineName = "Celso zero"; grapeVariety = ?("Dolcetto"); wineStyle = #red; price = "12.50"; createdAt = 0; soldOut = false; year = ?("2021") });
    addSample({ id = "italy--coltamarie-milu-1772474148834"; country = "Italy"; region = ?("Veneto"); winery = "Coltamarie"; wineName = "MIlu"; grapeVariety = ?("Malvazija/Riesling/Bianchetta"); wineStyle = #orange; price = "11.50"; createdAt = 0; soldOut = false; year = ?("2024") });
    addSample({ id = "italy-coltamarie-alma-1772474035408"; country = "Italy"; region = ?("Veneto"); winery = "Coltamarie"; wineName = "Alma"; grapeVariety = ?("Prosecco Grapes"); wineStyle = #sparkling; price = "10.50\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2024") });
    addSample({ id = "italy-cretapaglia-forse-sono-fiori-1772573214130"; country = "Italy"; region = ?("Calabria"); winery = "Cretapaglia"; wineName = "Forse sono fiori"; grapeVariety = ?("Guardavalle/Guarnaccia/Mantonico"); wineStyle = #orange; price = "14\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-cretapaglia-sciccu-1772573026175"; country = "Italy"; region = ?("Calabria"); winery = "Cretapaglia"; wineName = "Sciccu"; grapeVariety = ?("Guardavalle/Guarnaccia/Montonico"); wineStyle = #orange; price = "12.50"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-cretapaglia-strampalato-1772573349021"; country = "Italy"; region = ?("Calabria"); winery = "Cretapaglia"; wineName = "Strampalato"; grapeVariety = ?("Magliocco"); wineStyle = #red; price = "14\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-folk-folk-1772573105136"; country = "Italy"; region = ?("Calabria"); winery = "Cretapaglia"; wineName = "Folk"; grapeVariety = ?("Pecorello"); wineStyle = #orange; price = "13\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-croci-campodello-1772567045906"; country = "Italy"; region = ?("Emilia Romagna"); winery = "Croci"; wineName = "Campodello"; grapeVariety = ?("Malvasia di Candia"); wineStyle = #sparkling; price = "12\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2022") });
    addSample({ id = "italy-crocizia-besiosa-1772567650307"; country = "Italy"; region = ?("Emilia Romagna"); winery = "Crocizia"; wineName = "Besiosa"; grapeVariety = ?("Malvasia"); wineStyle = #petNat; price = "13\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-crocizia-la-mosca-1772567759212"; country = "Italy"; region = ?("Emilia Romagna"); winery = "Crocizia"; wineName = "La Mosca"; grapeVariety = ?("Moscato"); wineStyle = #petNat; price = "12.50"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-de-fermo-concrete-bianco-1772572380395"; country = "Italy"; region = ?("Abruzzo"); winery = "De Fermo"; wineName = "Concrete Bianco"; grapeVariety = ?("Pecorino"); wineStyle = #white; price = "12\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2022") });
    addSample({ id = "italy-de-fermo-concrete-rosso-1772572228581"; country = "Italy"; region = ?("Abruzzo"); winery = "De Fermo"; wineName = "Concrete Rosso"; grapeVariety = ?("Montepulciano"); wineStyle = #red; price = "12\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2021") });
    addSample({ id = "italy-etnella-anselmo-1772573848585"; country = "Italy"; region = ?("Sicilia"); winery = "Etnella"; wineName = "Anselmo"; grapeVariety = ?("Nerello"); wineStyle = #red; price = "12\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-etnella-kaos-rosso-1772573785439"; country = "Italy"; region = ?("Sicilia"); winery = "Etnella"; wineName = "Kaos Rosso"; grapeVariety = ?("Nerello"); wineStyle = #red; price = "16.50\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-etnella-kaos50-1772573712153"; country = "Italy"; region = ?("Sicily"); winery = "Etnella"; wineName = "Kaos5.0"; grapeVariety = ?("Carricante/Catarratto/Malvasia"); wineStyle = #orange; price = "17.50\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-federico-orsi-arlecchino-1772568449910"; country = "Italy"; region = ?("Emilia Romagna"); winery = "Federico Orsi"; wineName = "Arlecchino"; grapeVariety = null; wineStyle = #red; price = "14\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-federico-orsi-monterodano-1772568269917"; country = "Italy"; region = ?("Emilia Romagna"); winery = "Federico Orsi"; wineName = "Monterodano"; grapeVariety = ?("Pignoletto"); wineStyle = #orange; price = "14\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-federico-orsi-posca-bianca-1772568125934"; country = "Italy"; region = ?("Emilia Romagna"); winery = "Federico Orsi"; wineName = "Posca Bianca"; grapeVariety = ?("Pignoletto/Alana/Alionza"); wineStyle = #orange; price = "13\u{20ac}"; createdAt = 0; soldOut = false; year = ?("N.V.") });
    addSample({ id = "italy-federico-orsi-sui-lieviti-1772567998692"; country = "Italy"; region = ?("Emilia Romagna"); winery = "Federico Orsi"; wineName = "Sui Lieviti"; grapeVariety = ?("Pignoletto"); wineStyle = #petNat; price = "12.50"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-la-ginestra-chianti-riserva-1772479518925"; country = "Italy"; region = ?("Toscana"); winery = "La Ginestra"; wineName = "Chianti Riserva"; grapeVariety = ?("San Giovese"); wineStyle = #red; price = "13.50"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-la-ginestra-jun-rose-1772474509415"; country = "Italy"; region = ?("Toscana"); winery = "La Ginestra"; wineName = "Jun rose"; grapeVariety = ?("San Giovese"); wineStyle = #petNat; price = "13\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-la-ginestra-santellero-bianco-1772478966838"; country = "Italy"; region = ?("Veneto"); winery = "La Ginestra"; wineName = "Sant'Ellero Bianco"; grapeVariety = ?("Trebbiano/Malvasia Toscana/Malvasia di Candia"); wineStyle = #white; price = "11.50\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2024") });
    addSample({ id = "italy-la-ginestra-santellero-chianti-1772479415134"; country = "Italy"; region = ?("Toscana"); winery = "La Ginestra"; wineName = "Sant'ellero Chianti"; grapeVariety = ?("San Giovese"); wineStyle = #red; price = "12.50\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-la-ginestra-tutto-amfora-bianco-1772479269592"; country = "Italy"; region = ?("Veneto"); winery = "La Ginestra"; wineName = "Tutto Amfora Bianco"; grapeVariety = ?("Trebbiano/Malvasia toscana"); wineStyle = #orange; price = "12.50\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-la-ginestra-tutto-amfora-rosso-1772479665022"; country = "Italy"; region = ?("Toscana"); winery = "La Ginestra"; wineName = "Tutto Amfora Rosso"; grapeVariety = ?("San Giovese"); wineStyle = #red; price = "13.50"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-la-stoppa-ageneo-1772567388842"; country = "Italy"; region = ?("Emilia Romagna"); winery = "La Stoppa"; wineName = "Ageneo"; grapeVariety = ?("Malvasia di Candia"); wineStyle = #white; price = "24\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2020") });
    addSample({ id = "italy-la-stoppa-camporomano-1772567286729"; country = "Italy"; region = ?("Emilia Romagna"); winery = "La Stoppa"; wineName = "Camporomano"; grapeVariety = ?("Barera"); wineStyle = #red; price = "22\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "la-stoppa-la-stoppa-trebbiolo-1772567212887"; country = "Italy"; region = ?("Emilia Romagna"); winery = "La Stoppa"; wineName = "Trebbiolo"; grapeVariety = ?("Barera/Bonarda"); wineStyle = #red; price = "12.50\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy--maurizio-donadi-prosecco-1772569041286"; country = "Italy"; region = ?("Veneto"); winery = "Maurizio Donadi"; wineName = "Prosecco"; grapeVariety = ?("Glera"); wineStyle = #sparkling; price = "11\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-maurizio-donadi-bocciato-di-trevis-1772568969750"; country = "Italy"; region = ?("Veneto"); winery = "Maurizio Donadi"; wineName = "Bocciato di Treviso"; grapeVariety = ?("Glera"); wineStyle = #sparkling; price = "11\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-maurizio-donadi-casera-frontin-1772568872453"; country = "Italy"; region = ?("Veneto"); winery = "Maurizio Donadi"; wineName = "Casera Frontin"; grapeVariety = ?("Bonner/Solaris/Joannither"); wineStyle = #sparkling; price = "11\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-nikolas-jureti-grande-waldo-1772571972173"; country = "Italy"; region = ?("Friuli"); winery = "Nikolas Jureti\u{107}"; wineName = "Grande waldo"; grapeVariety = ?("Malvasia/Rebula/Tocai"); wineStyle = #orange; price = "32\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2022") });
    addSample({ id = "italy-nikolas-jureti-riserva-1772572066082"; country = "Italy"; region = ?("Friuli"); winery = "Nikolas Jureti\u{107}"; wineName = "Riserva"; grapeVariety = ?("Reula/Malvasia"); wineStyle = #orange; price = "32\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2019") });
    addSample({ id = "italy-salvatore-marino-turi-bianco-1772574474567"; country = "Italy"; region = ?("Sicilia"); winery = "Salvatore Marino"; wineName = "Turi Bianco"; grapeVariety = ?("Catarratto"); wineStyle = #white; price = "12.50\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-salvatore-marino-turi-rosso-1772574566662"; country = "Italy"; region = ?("Sicilia"); winery = "Salvatore Marino"; wineName = "Turi Rosso"; grapeVariety = ?("Nero d'avola"); wineStyle = #red; price = "12.50\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-tenuta-l-armonia-chic-1772473691910"; country = "Italy"; region = ?("Veneto"); winery = "Tenuta l' Armonia"; wineName = "Chic"; grapeVariety = ?("Chardonnay/Durella"); wineStyle = #sparkling; price = "17\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-tenuta-l-armonia-easy-bianco-1772473798595"; country = "Italy"; region = ?("Veneto"); winery = "Tenuta l' Armonia"; wineName = "Easy Bianco"; grapeVariety = ?("Sauvignon Gris/Traminer/Trebiano"); wineStyle = #white; price = "9.50\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-tenuta-l-armonia-freak-1772473923060"; country = "Italy"; region = ?("Veneto"); winery = "Tenuta l' Armonia"; wineName = "Freak"; grapeVariety = ?("chardonnay/Durella"); wineStyle = #orange; price = "12.50"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "italy-tenuta-l-armonia-rose-de-noir-1772473567669"; country = "Italy"; region = ?("Veneto"); winery = "Tenuta l' Armonia"; wineName = "Rose De Noir"; grapeVariety = ?("Pinot Noir"); wineStyle = #sparkling; price = "15\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    // Portugal
    addSample({ id = "portugal-cortes-de-cima-chamine-1772576288395"; country = "Portugal"; region = ?("Alentejo"); winery = "Cortes De Cima"; wineName = "Chamine"; grapeVariety = ?("local blends"); wineStyle = #white; price = "13\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2022") });
    // Slovenia
    addSample({ id = "slovenia-gordia-light-orange-1772477321100"; country = "Slovenia"; region = ?("Istra"); winery = "Gordia"; wineName = "Light Orange"; grapeVariety = null; wineStyle = #orange; price = "14\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "slovenia-gordia-light-red-1772477443822"; country = "Slovenia"; region = ?("Istra"); winery = "Gordia"; wineName = "Light red"; grapeVariety = null; wineStyle = #red; price = "14.50"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "slovenia-gordia-malvazija-1772477226050"; country = "Slovenia"; region = ?("Istra"); winery = "Gordia"; wineName = "Malvazija"; grapeVariety = ?("Malvazija Istarska"); wineStyle = #white; price = "10\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "slovenia-gordia-pet-nat-rose-1772477153793"; country = "Slovenia"; region = ?("Istra"); winery = "Gordia"; wineName = "Pet Nat Rose"; grapeVariety = null; wineStyle = #petNat; price = "12\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2025") });
    addSample({ id = "slovenia-gordia-pet-nat-white-1772477072326"; country = "Slovenia"; region = ?("Istra"); winery = "Gordia"; wineName = "Pet nat white"; grapeVariety = null; wineStyle = #petNat; price = "12\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2025") });
    addSample({ id = "slovenija-gordia-amfora-1772477379106"; country = "Slovenia"; region = ?("Istra"); winery = "Gordia"; wineName = "Amfora"; grapeVariety = null; wineStyle = #orange; price = "16"; createdAt = 0; soldOut = false; year = ?("2023") });
    addSample({ id = "slovenia-klet-jankovi-method-traditionna-1772576547566"; country = "Slovenia"; region = ?("Stajermarska"); winery = "Klet Jankovi\u{107}"; wineName = "Method Traditionnalle"; grapeVariety = ?("Rajnski Rizling/Chardonnay"); wineStyle = #sparkling; price = "18\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2018") });
    addSample({ id = "slovenia-klet-jankovi-rose-1772576671735"; country = "Slovenia"; region = ?("Stajermarska"); winery = "Klet Jankovi\u{107}"; wineName = "Rose"; grapeVariety = ?("Pinot Noir/Frankovka"); wineStyle = #sparkling; price = "18.50\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2021") });
    addSample({ id = "slovenia-uro-klabijan-black-lable-malvaz-1772477992567"; country = "Slovenia"; region = ?("Istra"); winery = "Uro\u{161} Klabjan"; wineName = "Black Lable Malvazija"; grapeVariety = ?("Malvazija Istarska"); wineStyle = #red; price = "23\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "slovenia-uro-klabijan-white-lable-malvaz-1772477670806"; country = "Slovenia"; region = ?("Istra"); winery = "Uro\u{161} Klabjan"; wineName = "White Lable Malvazija"; grapeVariety = ?("Malvazija Istarska"); wineStyle = #white; price = "14\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2022") });
    addSample({ id = "slovenia-uro-klabijan-white-lable-refok-1772477759371"; country = "Slovenia"; region = ?("Istra"); winery = "Uro\u{161} Klabjan"; wineName = "White Lable Refo\u{161}k"; grapeVariety = ?("Refo\u{161}k"); wineStyle = #red; price = "14\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "slovenia-uro-klabjan-back-lable-refok-1772565272051"; country = "Slovenia"; region = ?("Istra"); winery = "Uro\u{161} Klabjan"; wineName = "Back Lable Refo\u{161}k"; grapeVariety = ?("Refo\u{161}k"); wineStyle = #red; price = "?"; createdAt = 0; soldOut = false; year = null });
    // Spain
    addSample({ id = "spain-mas-goma-la-volta-1772575377321"; country = "Spain"; region = ?("Catalunia"); winery = "Mas Goma"; wineName = "La Volta"; grapeVariety = ?("Xarello/Macabeu"); wineStyle = #sparkling; price = "12"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "spain-mas-goma-tiet-jan-1772575444046"; country = "Spain"; region = ?("Catalunia"); winery = "Mas Goma"; wineName = "Tiet Jan"; grapeVariety = ?("Xarelo"); wineStyle = #white; price = "9\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "spain-tentenublo-tentenublo-tinto-1772575170516"; country = "Spain"; region = ?("Rioja"); winery = "Tentenublo"; wineName = "Tentenublo Tinto"; grapeVariety = ?("Tempranillo/Viura"); wineStyle = #red; price = "10\u{20ac}"; createdAt = 0; soldOut = false; year = null });
    addSample({ id = "spain-vina-ilusion-ilusion-lanco-1772574916175"; country = "Spain"; region = ?("Rioja"); winery = "Vina Ilusion"; wineName = "Ilusion lanco"; grapeVariety = ?("Tempranillo blanco"); wineStyle = #white; price = "9.50\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2022") });
    addSample({ id = "spain-vina-ilusion-ilusion-tinto-1772574813911"; country = "Spain"; region = ?("Rioja"); winery = "Vina Ilusion"; wineName = "Ilusion Tinto"; grapeVariety = ?("Tempranillo"); wineStyle = #red; price = "9.50\u{20ac}"; createdAt = 0; soldOut = false; year = ?("2022") });
    addSample({ id = "spain-vina-ilusion-prana-1772574977616"; country = "Spain"; region = ?("Rioja"); winery = "Vina Ilusion"; wineName = "Prana"; grapeVariety = ?("Tempranillo"); wineStyle = #red; price = "11\u{20ac}"; createdAt = 0; soldOut = false; year = null });
  };

  // Auto-load sample data if catalogue is empty (first deploy)
  do {
    if (wines.size() == 0) {
      setupSampleData();
    };
  };
};
