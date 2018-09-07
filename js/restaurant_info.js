//Register Service Worker - copied from developer.google.com
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}else{console.log('No Service Worker found in navigator');}

let restaurant, id;
var map;

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      self.id = id;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
    DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
      // fill reviews
      fillReviewsHTML();
      callback(null, reviews)
    });
  }
}


/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  //Add checkbox for favorite
  const fav = document.getElementById('is_favorite');
  if (restaurant.is_favorite) {fav.setAttribute('checked');}


  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 *
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  const rvwFrm = document.createElement('li');
  rvwFrm.innerHTML = `
  <p>Would you like to add a review for ${self.restaurant.name}?</p>
  <form id="writeReviewForm" action="">
    <label for="name">Your name:</label>
      <input aria-label="Name" required type="text" name="name" placeholder="Please enter your name"/>
    <label for="rating">Rating (1-5):</label>
      <input aria-label="Rating"  type="number" name="rating" placeholder="3" required min="1" max="5"/>
    <label for="comments">Review:</label>
      <textarea required aria-label="Enter comments here" name="comments" placeholder="Please enter your comments here (<=325 characters)." rows="6" maxlength="325">
      </textarea>
    <button type="button" id="submit">
      <label for="submit">Submit Review!</label></button>
    </form></li>
  `;
  ul.appendChild(rvwFrm);
  //iterate through available reviews
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });

  container.appendChild(ul);
  //add submit listener for writeReview
  document.getElementById("submit").onclick=writeReview;
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  var createdAt = new Date(review.createdAt)
  var updatedAt = new Date(review.updatedAt);

  const date = document.createElement('p');
  date.innerHTML = `Created: ${createdAt}`;
  li.appendChild(date);

  if (updatedAt > createdAt) {
    date.innerHTML = date.innerHTML + `</p><p>Updated: ${updatedAt}`;
    li.appendChild(date);
  }

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Add listener to detect change in favorite
 */
window .addEventListener('load', function(){
  document.getElementById("is_favorite").onchange=updateFavorite;
  //document.getElementById("writeReview").onclick=writeReview;
  //document.getElementById("writeReview").onsubmit=writeReview;
  /*var frm = document.querySelector('form');
  console.log(frm);
  frm.addEventListener('onsubmit',writeReview);*/
},false);



function updateFavorite(event) {
  fetch(`${DBHelper.DATABASE_URL}/${self.id}/?is_favorite=${this.checked}`)
    .then(function(response){
      console.log(response);
    });
  }
function writeReview(data) {
  //alert("Thank you for submitting your review!");
  var fd = new FormData(document.getElementById("writeReviewForm"));
  review = DBHelper.insertReview(self.restaurant.id,fd.get("name"),fd.get("rating"),
                fd.get("comments"));
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));
  document.getElementById("writeReviewForm").reset();
  //console.log(self.writeReview);
  }
