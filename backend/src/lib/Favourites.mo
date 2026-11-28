import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Set "mo:core/Set";
import Text "mo:core/Text";

/// Helpers on the favourites store: for each principal, the set of recipe ids
/// they marked as favourite.
module {
  public type Store = Map.Map<Principal, Set.Set<Text>>;

  /// Adds `recipeId` to `user`'s favourites. Adding it twice changes nothing.
  public func add(store : Store, user : Principal, recipeId : Text) {
    switch (Map.get(store, Principal.compare, user)) {
      case (?ids) Set.add(ids, Text.compare, recipeId);
      case null Map.add(store, Principal.compare, user, Set.singleton<Text>(recipeId));
    };
  };

  /// Removes `recipeId` from `user`'s favourites, if it is there. A user whose
  /// last favourite is removed is dropped from the store.
  public func remove(store : Store, user : Principal, recipeId : Text) {
    switch (Map.get(store, Principal.compare, user)) {
      case (?ids) {
        Set.remove(ids, Text.compare, recipeId);
        if (Set.isEmpty(ids)) Map.remove(store, Principal.compare, user);
      };
      case null {};
    };
  };

  /// Whether `recipeId` is one of `user`'s favourites.
  public func has(store : Store, user : Principal, recipeId : Text) : Bool {
    switch (Map.get(store, Principal.compare, user)) {
      case (?ids) Set.contains(ids, Text.compare, recipeId);
      case null false;
    };
  };

  /// Whether `user` has at least one favourite.
  public func hasAny(store : Store, user : Principal) : Bool {
    Map.containsKey(store, Principal.compare, user);
  };
};
