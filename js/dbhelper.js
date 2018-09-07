/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    const DB_NAME = 'restaurantDB';
    const DB_VERSION = 1; // Use a long long for this value (don't use a float)
    const DB_STORE_NAME = 'restaurants';

    //if the databases is already open, don't reopen it
    if(!req){
      var db;
      console.log(`Opening  ${DB_NAME} version ${DB_VERSION} store ${DB_STORE_NAME}...`);
      var req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (event) {
        db = req.result;
        console.log(`${DB_NAME} version ${DB_VERSION} opened!`);
        console.log(`Upgrading ${DB_NAME}`);
        var objectStore = db.createObjectStore(DB_STORE_NAME,{keyPath:'id'});
        console.log(`${DB_STORE_NAME} created`);
        var nameIndex = objectStore.createIndex("by_name", "name", {unique: true});
        var neighborhoodIndex = objectStore.createIndex("by_neighborhood", "neighborhood");
        var cuisineIndex = objectStore.createIndex("by_cuisine", "cuisine_type");
        objectStore.transaction.oncomplete = function(event){
          fetch(DBHelper.DATABASE_URL).then(response => {
            return response.json();
            }).then(myJson => {
                var tx = db.transaction(DB_STORE_NAME, 'readwrite');
                var store = tx.objectStore('restaurants');
                myJson.forEach(function(restaurant){
                  store.put(restaurant);
                });
                const json = myJson;
                const restaurants = myJson;
                callback(null, restaurants);
              }).catch(function(){
                const error = (`Request failed.`);
                callback(error, null);
                });
          }
        };
      req.onsuccess = function (evt) {
        db = req.result;
        console.log(`${DB_NAME} version ${DB_VERSION} opened!`);
        var rq = db.transaction('restaurants').objectStore('restaurants').getAll();
        rq.onsuccess = function(reqSuccess){
          const restaurants = rq.result;
          callback(null,restaurants);
        }
      };
      req.onerror = function (evt) {
        console.error(`Error opening ${DB_NAME}:`, evt.target.errorCode);
      };
    }
  }

  /**
   * Fetch all reviews.
   */
  static fetchReviews(callback) {
    const RVW_DB_NAME = 'reviewsDB';
    const RVW_VERSION = 1; // Use a long long for this value (don't use a float)
    const RVW_DB_STORE_NAME = 'reviews';

    //if the databases is already open, don't reopen it
    if(!req){
      var db;
      console.log(`Opening  ${RVW_DB_NAME} version ${RVW_VERSION} store ${RVW_DB_STORE_NAME}...`);
      var req = window.indexedDB.open(RVW_DB_NAME, RVW_VERSION);
      req.onupgradeneeded = function (event) {
        db = req.result;
        console.log(`${RVW_DB_NAME} version ${RVW_VERSION} opened!`);
        console.log(`Upgrading ${RVW_DB_NAME}`);
        var objectStore = db.createObjectStore(RVW_DB_STORE_NAME,{keyPath:'id', autoIncrement:true});
        console.log(`${RVW_DB_STORE_NAME} created`);
        var nameIndex = objectStore.createIndex("by_name", "name");
        var restaurantIndex = objectStore.createIndex("by_restaurant_id", "restaurant_id");
        objectStore.transaction.oncomplete = function(event){
          fetch(`http://localhost:1337/reviews/`).then(response => {return response.json();})
            .then(myJson => {
                var tx = db.transaction(RVW_DB_STORE_NAME, 'readwrite');
                var store = tx.objectStore(RVW_DB_STORE_NAME);
                myJson.forEach(function(review){
                  store.put(review);
                });
                const json = myJson;
                const reviews = myJson;
                callback(null, reviews);
              }).catch(function(){
                const error = (`Request failed.`);
                callback(error, null);
                });
          }
        };
      req.onsuccess = function (evt) {
        db = req.result;
        console.log(`${RVW_DB_NAME} version ${RVW_VERSION} opened!`);
        var rq = db.transaction(RVW_DB_STORE_NAME).objectStore(RVW_DB_STORE_NAME).getAll();
        rq.onsuccess = function(reqSuccess){
          const restaurants = rq.result;
          callback(null,restaurants);
        }
      };
      req.onerror = function (evt) {
        console.error(`Error opening ${RVW_DB_NAME}:`, evt.target.errorCode);
      };
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
      if (restaurant.photograph) {
      return (`/img/${restaurant.photograph}.jpg`);
    }else {
      return('/img/daniel-jensen-440210-unsplash_800x533.jpg');
    }

  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }
  /**
   * Fetch a review by its restaurant ID.
   */
  static fetchReviewsByRestaurantId(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {callback(error, null);} else {
        const results = reviews.filter(r => r.restaurant_id == id);
        if (results) { // Got the review
          callback(null, results);
        } else { // Review does not exist in the database
          callback('No reviews found', null);
        }
      }
    });
  }

  static insertReview(rst_id, nm, rtg, cmmnts){
    var newRow = {restaurant_id:rst_id,name:nm,rating:rtg,comments:cmmnts,
                createdAt:Date.now(),updatedAt:Date.now()};
    const DB_NAME = 'reviewsDB';
    const DB_VERSION = 1; // Use a long long for this value (don't use a float)
    const DB_STORE_NAME = 'reviews';
    var db;
    console.log(`Opening  ${DB_NAME} version ${DB_VERSION} store ${DB_STORE_NAME}...`);
    var req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = function (evt) {
      db = req.result;
      console.log(`${DB_NAME} version ${DB_VERSION} opened!`);
      //  store.put(newRow);
      var store = db.transaction(DB_STORE_NAME, 'readwrite').objectStore(DB_STORE_NAME);

      try{store.add(newRow);} catch(err){throw err;}
    }

    var putBody = {restaurant_id:rst_id,name:nm,rating:rtg,comments:cmmnts};
    fetch(`http://localhost:1337/reviews/`,{
        method: 'post',
        body: putBody}).then(function(response){console.log(response);});
    return newRow;
    };
}
