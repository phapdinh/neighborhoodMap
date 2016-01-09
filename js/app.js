//Array of locations for markers
var locations = [
  'Vortex Bar & Grill',
  'Atlanta Botanical Garden',
  'Woodruff Arts Center',
  'World of Coca-Cola',
  'Georgia Dome',
  'Piedmont Park',
  'Zoo Atlanta'
];
//Array of markers to display
var locationsDisplay = locations.slice(0);
//Controller
var mapMarker = function(name) {
  this.name = ko.observable(name);
};
//View
var ViewModel = function() {
  var self = this;
  this.mapMarkerList = ko.observableArray([]);
  locationsDisplay.forEach(function(name) {
    self.mapMarkerList.push(new mapMarker(name));
  });
  this.filter = ko.observable('');
  //filters locations by filter observable
  this.filterLocations = function() {
	this.mapMarkerList.removeAll();
	if(self.filter().length !== 0) {
	  locationsDisplay = [];
      locations.forEach(function(name) {
        if(name.search(self.filter()) !== -1) {
	      locationsDisplay.push(name);
		  self.mapMarkerList.push(new mapMarker(name));
	    }
      });
	}
	else {
	  locationsDisplay = locations.slice(0);
	  locationsDisplay.forEach(function(name) {
        self.mapMarkerList.push(new mapMarker(name));
      });
	}
	initializeMap();
  };
};

ko.applyBindings(new ViewModel());

// declares a global map variable
var map;
/*
Got this code from the Front End Nanodegree Resume project
initializeMap() is called when page is loaded.
*/
function initializeMap() {

  var mapOptions = {
	center: {lat: 33.7550, lng: -84.3900},
    zoom: 12,
	mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  /* 
  For the map to be displayed, the googleMap var must be
  appended to #mapDiv in resumeBuilder.js. 
  */
  map = new google.maps.Map(document.querySelector('#map'), mapOptions);
  //Gets li element by class
  var markerLi = document.querySelector('.marker');
  
  /*
  createMapMarker(placeData) reads Google Places search results to create map pins.
  placeData is the object returned from search results containing information
  about a single location.
  */
  function createMapMarker(placeData) {

    // The next lines save location data from the search result object to local variables
    var lat = placeData.geometry.location.lat();  // latitude from the place service
    var lon = placeData.geometry.location.lng();  // longitude from the place service
	var name = placeData.name; //find name of place
    var address = placeData.formatted_address;   // address of the place from the place service
	var bounds = window.mapBounds;            // current boundaries of the map window
    
    // marker is an object with additional data about the pin for a single location
    var marker = new google.maps.Marker({
      map: map,
      position: placeData.geometry.location,
      title: name
    });
	//Added wikipedia api call
	var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search='+name+'&format=json&callback=wikiCallback';
	var articles;
	var artc;
	var web_url;
	$.ajax({
    url: wikiUrl,
    dataType: 'jsonp',
    headers: { 'Api-User-Agent': 'Example/1.0' },
    success: function(data) {
	  var articles = data[1];
	  for(var i = 0; i < articles.length; i++){
	    artc = articles[i];
	    web_url = 'https://en.wikipedia.org/wiki/' + artc;
		name = name + web_url;
	  }
	}
	});
    // infoWindows are the little helper windows that open when you click
    // or hover over a pin on a map. They usually contain more information
    // about a location.
    var infoWindow = new google.maps.InfoWindow({
      content: name + ' ' + address + '<br>' + web_url
    });
	//add event listener to open info Window when a map marker is clicked
	marker.addListener('click', function() {
      infoWindow.open(map, marker);
	  if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
    });
	//Added event listener to open info Window and bounce when marker li is clicked
	markerLi.addEventListener('click', function() {
      infoWindow.open(map, marker);
	  if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
    });
	
	// this is where the pin actually gets added to the map.
    // bounds.extend() takes in a map location object
    bounds.extend(new google.maps.LatLng(lat, lon));
    // fit the map to the new marker
    map.fitBounds(bounds);
  }
  
  
  /*
  callback(results, status) makes sure the search returned results for a location.
  If so, it creates a new map marker for that location.
  */
  function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      createMapMarker(results[0]);
    }
  }

  /*
  pinPoster(locations) takes in the array of locations created by locationFinder()
  and fires off Google place searches for each location
  */
  function pinPoster(locations) {

    // creates a Google place search service object. PlacesService does the work of
    // actually searching for location data.
    var service = new google.maps.places.PlacesService(map);

    // Iterates through the array of locations, creates a search object for each location
    var locationsLength = locations.length;
    for (var index = 0; index < locationsLength; index++) {
	  
      // the search request object
      var request = {
        query: locations[index]
      };

      // Actually searches the Google Maps API for location data and runs the callback
      // function with the search results after each search.
      service.textSearch(request, callback);
    }
  }

  // Sets the boundaries of the map based on pin locations
  window.mapBounds = new google.maps.LatLngBounds();

  // pinPoster(locations) creates pins on the map for each location in
  // the locations array
  pinPoster(locationsDisplay);
}

// Calls the initializeMap() function when the page loads
window.addEventListener('load', initializeMap);

// Vanilla JS way to listen for resizing of the window
// and adjust map bounds
window.addEventListener('resize', function(e) {
  //Make sure the map bounds get updated on page resize
  map.fitBounds(mapBounds);
});
