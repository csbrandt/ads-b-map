var d3 = require('d3');
var JSONP = require('browser-jsonp');
var FlightChart = require('./flight-chart.js');
var mapContainerSelector = '.map-container';
var vrsURL = '//global.adsbexchange.com/VirtualRadar/AircraftList.json';
var width = d3.select(mapContainerSelector)[0][0].clientWidth;
var height = d3.select(mapContainerSelector)[0][0].clientHeight;
var mapCenter = [-122.375, 37.618889];
var mapExtent = [[mapCenter[0] - 4, mapCenter[1] - 2], [mapCenter[0] + 4, mapCenter[1] + 2]];
var queryBounds = {
   fNBnd: mapExtent[1][1],
   fSBnd: mapExtent[0][1],
   fWBnd: mapExtent[0][0],
   fEBnd: mapExtent[1][0]
};
var ACList = [];
var lastTime;

setInterval(function() {
   JSONP({
      url: vrsURL,
      data: queryBounds,
      success: update
   });
}, 2000);

function acMap(ac) {
   var acIndex = ACList.findIndex(function(element) {
      return element.properties.Id === ac.Id;
   });

   var acNew = {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [ac.Long, ac.Lat]},
      "properties": {
         "Id": ac.Id,
         "Type": ac.Type,
         "Icao": ac.Icao,
         "Call": ac.Call,
         "Reg": ac.Reg,
         "Alt": ac.Alt,
         "Spd": ac.Spd,
         "Sqk": ac.Sqk,
         "Mil": ac.Mil,
         "Cou": ac.Cou,
         "Gnd": ac.Gnd,
         "Trak": ac.Trak,
         "TrkH": ac.TrkH
      }
   };

   if (acIndex !== -1) {
      ACList[acIndex] = acNew;
   } else {
      ACList.push(acNew);
   }
}

function update(data) {
   if (!lastTime || data.stm > lastTime) {
      lastTime = data.stm;
      data.acList.forEach(acMap);
      map.updateFlights(ACList);
   }
}

var map = new FlightChart({
   selector: mapContainerSelector,
   width: width,
   height: height,
   projection: {
      scale: 30000,
      translate: [width / 2, height / 2],
      center: [0, mapCenter[1]],
      rotation: [-mapCenter[0], 0, 0],
      parallels: [33, 45]
   },
   graticule: {
      extent: mapExtent,
      step: [0.5, 0.5]
   }
});

map.drawBoundaries("data/world-10m.json");

JSONP({
   url: vrsURL,
   data: queryBounds,
   success: update
});
