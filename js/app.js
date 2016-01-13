//Array of locations for markers
var locations = [
  'Vortex Bar & Grill',
  'Atlanta Botanical Garden',
  'Woodruff Arts Center',
  'World of Coca-Cola',
  'Georgia Dome',
  'Piedmont Park',
  'Zoo Atlanta',
  'Georgia Aquarium',
  'Turner Field'
];
//sorts array alphabetically
locations.sort();
//Array of markers to display
var locationsDisplay = locations.slice(0);
// declares a global map variable
var map;
// declares object array of markers
var markerObject = {};
//create infoWindow object variable
var infoWindowObject = {};
//creates alert if wiki api call doesn't come up in time
var wikiRequestTimeOut = setTimeout(function() {
  alert( "Wiki API call failed!");
},8000); 
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
  /*
  createMapMarker(placeData) reads Google Places search results to create map pins.
  placeData is the object returned from search results containing information
  about a single location.
  */
  function createMapMarker(placeData) {

    // The next lines save location data from the search result object to local variables
    // latitude from the place service
	var lat = placeData.geometry.location.lat();
	// longitude from the place service
    var lon = placeData.geometry.location.lng();
	// find name of place
	var name = placeData.name;
	// address of the place from the place service
    var address = placeData.formatted_address;
	// current boundaries of the map window
	var bounds = window.mapBounds;
	// create infoWindow variable
	var infoWindow;
    // marker is an object with additional data about the pin for a single location
    var marker = new google.maps.Marker({
      map: map,
      position: placeData.geometry.location,
      title: name,
	  animation: null
    });
	markerObject[name] = marker;
	//Added wikipedia api call
	var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search='+name+'&format=json&callback=wikiCallback';
	var infoContent = name + '<br>' + address;
	$.ajax({
      url: wikiUrl,
      dataType: 'jsonp',
      headers: { 'Api-User-Agent': 'Example/1.0' }
	}).done(function(data) {
	  var articles = data[1];
	  for(var i = 0; i < articles.length; i++){
		var artc = articles[i];
		var web_url = 'https://en.wikipedia.org/wiki/' + artc;
		infoContent = infoContent + '<br>' +
		'<a href="'+ web_url +'">' +
		artc +'</a>';
	  }
	  // infoWindows are the little helper windows that open when you click
      // or hover over a pin on a map. They usually contain more information
      // about a location.
      infoWindow = new google.maps.InfoWindow({
        content: infoContent
      });
	  infoWindowObject[name] = infoWindow;
	  clearTimeout(wikiRequestTimeOut);
	});
	//add event listener to open info Window when a map marker is clicked
	marker.addListener('click', function() {
      infoWindow.open(map, marker);
	  if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
	  //sets Timeout to stop marker bounce after 4 seconds
	  window.setTimeout(function() {
        marker.setAnimation(null);  
      }, 4000);
    });
	
	// this is where the pin actually gets added to the map.
    // bounds.extend() takes in a map location object
    bounds.extend(new google.maps.LatLng(lat, lon));
    // fit the map to the new marker
    map.fitBounds(bounds);
	// center the map
    map.setCenter(bounds.getCenter());
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
  pinPoster(locations);
}

// Vanilla JS way to listen for resizing of the window
// and adjust map bounds
window.addEventListener('resize', function(e) {
  //Make sure the map bounds get updated on page resize
  map.fitBounds(mapBounds);
});

//Alerts when google api fails to load
function googleError() {
  alert('Google Map API failed to load');
}

//Controller
var mapMarker = function(name) {
  this.name = ko.observable(name);
  this.openWindow = function(mark) {
	Object.keys(infoWindowObject).forEach(function(name) {
	  infoWindowObject[name].close();
	});
    infoWindowObject[mark.name()].open(map, markerObject[mark.name()]);
  };
};
//View
var ViewModel = function() {
  var self = this;
  this.mapMarkerList = ko.observableArray([]);
  locations.forEach(function(name) {
    self.mapMarkerList.push(new mapMarker(name));
  });
  this.filter = ko.observable('');
  //filters locations by filter observable
  this.filterLocations = function() {
	if(self.filter().length > 0) {
	  this.mapMarkerList.removeAll();
	  locations.forEach(function(name) {
        if(name.toLowerCase().search(self.filter().toLowerCase()) > -1) {
		  self.mapMarkerList.push(new mapMarker(name));
		  markerObject[name].setMap(map);
	    }
		else {
		  markerObject[name].setMap(null);
		}
      });
	}
	else {
	  this.mapMarkerList.removeAll();
	  locations.forEach(function(name) {
        self.mapMarkerList.push(new mapMarker(name));
		markerObject[name].setMap(map);
      });
	}
  };
};

ko.applyBindings(new ViewModel());