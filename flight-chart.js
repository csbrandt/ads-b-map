var d3 = require('d3');
var topojson = require('topojson');
var padStart = require('lodash.padstart');
var locationArrowPath = "m 401.789,15.302 c -0.664,-3.906 -2.43,-7.187 -5.283,-9.854 -3.426,-3.612 -7.707,-5.424 -12.848,-5.424 -3.045,0 -5.804,0.662 -8.281,1.997 L 9.933,184.746 c -3.811,1.906 -6.567,4.755 -8.282,8.563 -1.713,3.809 -2.092,7.808 -1.143,11.99 0.951,4.188 3.095,7.562 6.423,10.143 3.33,2.566 7.09,3.854 11.277,3.854 h 164.445 v 164.452 c 0,4.192 1.287,7.949 3.855,11.282 2.572,3.33 5.951,5.476 10.138,6.424 1.903,0.373 3.333,0.568 4.283,0.568 7.612,0 13.04,-3.33 16.274,-9.996 L 399.935,26.578 c 1.902,-3.615 2.515,-7.374 1.854,-11.276 z";
require("d3-geo-projection")(d3);

function FlightChart(options) {
   this.options = options;
   this.projection = d3.geo.conicConformal()
      .scale(options.projection.scale)
      .rotate(options.projection.rotation)
      .center(options.projection.center)
      .parallels(options.projection.parallels)
      .translate(options.projection.translate)
      .precision(0.1);

   var graticule = d3.geo.graticule()
      .extent(options.graticule.extent)
      .step(options.graticule.step);

   this.path = d3.geo.path()
      .projection(this.projection);

   var svg = d3.select(options.selector).append("svg")
      .attr("width", options.width)
      .attr("height", options.height)
      .attr("class", "map");

   svg.append("circle")
      .attr("cx", options.width / 2).attr("cy", options.height / 2)
      .attr("r", options.width)
      .style("fill", "#03002b");

   this.layer1 = svg.append('g');
   this.layer2 = svg.append('g');

   svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", this.path);

   d3.select(self.frameElement).style("height", options.height + "px");
}

FlightChart.prototype.drawBoundaries = function(topoFilename) {
   d3.json(topoFilename, function(error, world) {
      if (error) throw error;

      var country = this.layer1.selectAll(".boundary").data(topojson.feature(world, world.objects.countries).features);

      country.enter().insert("path")
         .attr("class", "boundary")
         .attr("d", this.path);
   }.bind(this));
};

FlightChart.prototype.updateFlights = function(flights) {
   // DATA JOIN
   // Join new data with old elements, if any.
   var div = d3.select(this.options.selector).selectAll("div")
      .data(flights);
   var locationArrow = this.layer2
      .attr("class", "points").selectAll("svg").data(flights);

   // UPDATE
   // Update old elements as needed.

   // ENTER
   // Create new elements as needed.
   div.enter().append("div")
      .attr("id", function(d) {
         return d.properties.Id;
      })
      .attr("class", function(d) {
         var military = (d.properties.Mil) ? 'military' : '';
         return 'flight-label ' + military;
      })
      .style("position", "absolute")
      .html(function(d) {
         var registration = (d.properties.Reg) ? d.properties.Reg + '<br>' : '';
         var callsign = (d.properties.Call) ? d.properties.Call + '<br>' : '';
         var altitude = (d.properties.Alt) ? padStart(Math.floor(d.properties.Alt / 100).toString(), 3, '0') : '';
         var speed = (d.properties.Spd) ? ' ' + Math.floor(d.properties.Spd / 10) : '';
         return registration + callsign + altitude + speed;
      });
   locationArrow.enter().append("svg")
      .attr("viewBox", "0 0 424.13002 424.12999")
      .attr("preserveAspectRatio", "xMinYMin")
      .attr("width", "26")
      .attr("height", "26")
      .attr("class", function(d) {
         var military = (d.properties.Mil) ? 'military' : '';
         return 'flight-arrow ' + military;
      })
      .append("g").append("path")
      .attr("d", locationArrowPath)
      .attr("transform", "scale(0.7 0.7)");

   // ENTER + UPDATE
   // Appending to the enter selection expands the update selection to include
   // entering elements; so, operations on the update selection after appending to
   // the enter selection will apply to both entering and updating nodes.
   div
      .style("top", function(d) {
         return this.projection(d.geometry.coordinates)[1] + "px";
      }.bind(this))
      .style("left", function(d) {
         return this.projection(d.geometry.coordinates)[0] + "px";
      }.bind(this));
   locationArrow
      .attr("x", function(d) {
         return this.projection(d.geometry.coordinates)[0] - 13;
      }.bind(this))
      .attr("y", function(d) {
         return this.projection(d.geometry.coordinates)[1] - 13;
      }.bind(this))
      .selectAll("g")
      .attr("transform", function(d) {
         var matrix = "matrix(0.70710678,-0.70710678,0.70710678,0.70710678,-65.379817,276.77063) ";
         var rotate = (d.properties.Trak) ? "rotate(" + (d.properties.Trak) + " 219 190)" : "";
         return matrix + rotate;
      });

   // EXIT
   // Remove old elements as needed.
   div.exit().remove();
   locationArrow.exit().remove();
};

module.exports = FlightChart;
