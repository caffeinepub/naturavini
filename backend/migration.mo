import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";

module {
  type OldWineStyle = {
    #red;
    #white;
    #rose;
    #sparkling;
    #orange;
    #petNat;
  };

  type OldWine = {
    id : Text;
    country : Text;
    region : ?Text;
    winery : Text;
    wineName : Text;
    grapeVariety : ?Text;
    wineStyle : OldWineStyle;
    price : Text;
    createdAt : Time.Time;
    soldOut : Bool;
  };

  type OldActor = {
    wines : Map.Map<Text, OldWine>;
  };

  type NewWineStyle = OldWineStyle;

  type NewWine = {
    id : Text;
    country : Text;
    region : ?Text;
    winery : Text;
    wineName : Text;
    grapeVariety : ?Text;
    wineStyle : NewWineStyle;
    price : Text;
    createdAt : Time.Time;
    soldOut : Bool;
    year : ?Text;
  };

  type NewActor = {
    wines : Map.Map<Text, NewWine>;
  };

  public func run(old : OldActor) : NewActor {
    let newWines = old.wines.map<Text, OldWine, NewWine>(
      func(_id, oldWine) {
        { oldWine with year = null };
      }
    );
    { wines = newWines };
  };
};
