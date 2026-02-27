import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";

module {
  type OldWine = {
    id : Text;
    country : Text;
    region : ?Text;
    winery : Text;
    wineName : Text;
    grapeVariety : ?Text;
    wineStyle : {
      #red;
      #white;
      #rose;
      #sparkling;
      #orange;
      #petNat;
    };
    price : Text;
    createdAt : Time.Time;
  };

  type OldActor = {
    wines : Map.Map<Text, OldWine>;
  };

  type NewWine = {
    id : Text;
    country : Text;
    region : ?Text;
    winery : Text;
    wineName : Text;
    grapeVariety : ?Text;
    wineStyle : {
      #red;
      #white;
      #rose;
      #sparkling;
      #orange;
      #petNat;
    };
    price : Text;
    createdAt : Time.Time;
    soldOut : Bool;
  };

  type NewActor = {
    wines : Map.Map<Text, NewWine>;
  };

  public func run(old : OldActor) : NewActor {
    let newWines = old.wines.map<Text, OldWine, NewWine>(
      func(_id, oldWine) {
        { oldWine with soldOut = false };
      }
    );
    { old with wines = newWines };
  };
};
