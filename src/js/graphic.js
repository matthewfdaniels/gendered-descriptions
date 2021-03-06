import Swiper from 'swiper';
import "intersection-observer";
import scrollama from "scrollama";
import loadData from './load-data'
import rough from 'roughjs/bundled/rough.cjs';


let quiz = null;
let removedWords = ["her","blond","of","be"]
/* global d3 */
let zoomed = false;
function resize() {}

function initQuiz(){
  d3.select(".quiz-images").selectAll(".swiper-slide").select("img").on("click",function(d){
    quiz.slideNext();
  })
}

function initDek(){
  let container = d3.select(".body-graphic").select(".graphic-title-dek");
  container.selectAll("span").each(function(){
    let attr = d3.select(this).attr("data-attr");
    if(attr == "circle-size"){
      d3.select(this).attr("class","circle-wrapper").selectAll("div").data([0,1,2]).enter()
        .append("div")
        .attr("class","circle")
        .style("width",function(d,i){
          return (i+1)*9+"px"
        })
        .style("height",function(d,i){
          return (i+1)*9+"px"
        })
    }
    else {
      d3.select(this).attr("class","gender-wrapper").selectAll("div").data([0,1]).enter()
        .append("div")
        .attr("class","circle")
        .text(function(d,i){
          if(i==0){
            return "w";
          }
          return "m";
        })
    }
  })
}

function initAdjScroller(){
  const scroller = scrollama();

  scroller
    .setup({
      container: '#adj-graphic', // our outermost scrollytelling element
      graphic: '.graphic', // the graphic
      text: '.story', // the step container
      step: '.story .step', // the step elements
      offset: 0.5 // set the trigger to be 1/2 way down screen
    })
    .onStepEnter(response => {
      console.log("response");
      // { element, index, direction }
    })
    .onStepExit(response => {
      // { element, index, direction }
    });

  // setup resize event
  window.addEventListener("resize", scroller.resize);
}

function buildAdjChart(data){

  let width = d3.select("body").node().offsetWidth*.9;
  let height = 400;

  let container = d3.select(".chart");

  container.style("width",width+"px")
  container.style("height",height+"px")

  let nested = d3.nest().key(function(d){
      return d.BodyPart;
    })
    .entries(data)

  let nestedMap = d3.map(nested,function(d){return d.key});
  let bodyParts = nested.map(function(d){return d.key});

  d3.select(".part-selector").selectAll("div")
    .data(bodyParts).enter().append("div")
    .text(function(d){ return d; })
    .on("click",function(d){
      getNewData(d);
    })
    ;


  function getNewData(bodyPart){
    dataSelected = nestedMap.get(bodyPart).values;
    dataSelected = filterData(dataSelected);
    setScales();

    container.selectAll("p").remove();


    words = container.selectAll("p")
      .data(dataSelected)
      .enter()
      .append("p")
      .attr("class","word")
      .text(function(d){
        return d.adj;
      })
      .style("font-size",function(d){
        return radiusScale(+d.total)+"px";
      })
      .style("color",function(d){
        return colorScale(+d[varSelected]);
      })
      .each(function(d){
        let bounds = d3.select(this).node().getBoundingClientRect();
        d.width = bounds.width;
        d.height = bounds.height;
      })
      .style("width",function(d){
        return d.width+"px";
      })
      .style("height",function(d){
        return d.height+"px";
      })
      .style("background-color",function(d){
        let color = d3.color(colorScale(+d[varSelected]));
        return "rgba("+color.r+","+color.g+","+color.b+",.1)"
      })

    var simulation = d3.forceSimulation(dataSelected)
      .force("x", d3.forceX(function(d) {
          return x(+d[varSelected]);
        })
        .strength(1)
      )
      .force("y", d3.forceY(height / 2))
      .force("collide", collide)
      //.force("collide", collisionForce)
      // .force("collide", d3.forceCollide().radius(function(d){
      //     return d.width/2;
      //   })
      //   .iterations(1)
      // )
      .stop()
      ;

    for (var i = 0; i < 250; ++i) simulation.tick();

    words
      .style("left",function(d){
        if(d.adj == "her"){
          console.log(d);
        }
        return d.x+"px"
        //return d.x+"px";
      })
      .style("top",function(d){
        return d.y+"px";
      })

  }

  function setScales(){
    radiusScale.domain(d3.extent(dataSelected,function(d){ return +d.total }));
    x.domain(d3.extent(dataSelected,function(d){ return +d[varSelected] })).clamp(true);
    dataExtent = d3.extent(dataSelected,function(d){ return +d[varSelected] });
    colorScale.domain([dataExtent[0],0,dataExtent[1]]);
  }

  let varSelected = "logDiff";

  function filterData(data){
    return data.filter(function(d){
      d.shareF = +d.totalF / +d.total;
      d.logDiff = Math.log2(+d.pctF/+d.pctM);
      return removedWords.indexOf(d.adj) == -1
    });
  }

  let dataSelected = nestedMap.get("hair").values;
  dataSelected = filterData(dataSelected);
  let dataExtent = d3.extent(dataSelected,function(d){ return +d[varSelected] });

  let radiusScale = d3.scaleLinear().domain(d3.extent(dataSelected,function(d){ return +d.total })).range([12,36]);
  let colorScale = d3.scaleLinear().domain([dataExtent[0],0,dataExtent[1]]).range(["blue","purple","red"]);
  let x = d3.scaleLinear().domain(d3.extent(dataSelected,function(d){ return +d[varSelected] })).range([0,width]);
  x.domain([-2,4]).clamp(true)

  let words = container.selectAll("p")
    .data(dataSelected)
    .enter()
    .append("p")
    .attr("class","word")
    .text(function(d){
      return d.adj;
    })
    .style("font-size",function(d){
      return radiusScale(+d.total)+"px";
    })
    .style("color",function(d){
      return colorScale(+d[varSelected]);
    })
    .each(function(d){
      let bounds = d3.select(this).node().getBoundingClientRect();
      d.width = bounds.width;
      d.height = bounds.height;
    })
    .style("width",function(d){
      return d.width+"px";
    })
    .style("height",function(d){
      return d.height+"px";
    })
    .style("background-color",function(d){
      let color = d3.color(colorScale(+d[varSelected]));
      return "rgba("+color.r+","+color.g+","+color.b+",.1)"
    })
    ;

  function rectWidth(word, value) {
    return word.length * value;
  }

  var collide = bboxCollide(function (d,i) {
      d.value = d.height//radiusScale(+d.total)/10;
      let heightMod = .5;
      var width = d.width*1.2//rectWidth(d.adj, d.value)
      return [[-width / 2, -d.value * heightMod],[width / 2, d.value * heightMod]]
    })
    .strength(1)
    .iterations(2)

  var collisionForce = rectCollide()
      .size(function (d) { return [d.width*1.5, d.height] })

	var simulation = d3.forceSimulation(dataSelected)
  	.force("x", d3.forceX(function(d) {
        return x(+d[varSelected]);
      })
      .strength(1)
    )
  	.force("y", d3.forceY(height / 2))
    .force("collide", collide)
    //.force("collide", collisionForce)
  	// .force("collide", d3.forceCollide().radius(function(d){
    //     return d.width/2;
    //   })
    //   .iterations(1)
    // )
  	.stop()
  	;

  for (var i = 0; i < 250; ++i) simulation.tick();


  words
    .style("left",function(d){
      if(d.adj == "her"){
        console.log(d);
      }
      return d.x+"px"
    })
    .style("top",function(d){
      return d.y+"px";
    })


}

function buildHistogram(data){


  let container = d3.select(".chart");

  let nested = d3.nest().key(function(d){
      return d.BodyPart;
    })
    .entries(data)
  let nestedMap = d3.map(nested,function(d){return d.key});
  let bodyParts = nested.map(function(d){return d.key});

  let varSelected = "shareF";

  function filterData(data){
    return data.filter(function(d){
      d.shareF = +d.totalF / +d.total;
      return removedWords.indexOf(d.adj) == -1
    });
  }

  let dataSelected = nestedMap.get("hair").values;
  dataSelected = filterData(dataSelected);

  let radiusScale = d3.scaleLinear().domain(d3.extent(dataSelected,function(d){ return +d.total })).range([10,24]);
  let colorScale = d3.scaleLinear().domain([0,.5,1]).range(["blue","purple","red"]);

  let buckets = 15;
  var histogramScale = d3.scaleQuantile().domain([0,1]).range(d3.range(buckets));

  var nestedHistogram = d3.nest().key(function(d){
  		return histogramScale(1 - +d.shareF)
  	})
  	.sortKeys(function(a,b){
  		return +a - +b;
  	})
  	.sortValues(function(a,b){
  		return +a["total"] - +b["total"]
  	})
  	.entries(dataSelected)
  	;

  let words = container
    .attr("class","histogram")
    .selectAll("div")
    .data(nestedHistogram)
    .enter()
    .append("div")
    .attr("class","column")
    .selectAll("p")
    .data(function(d){
      return d.values;
    })
    .enter()
    .append("p")
    .text(function(d){
      return d.adj;
    })
    .attr("class","word")
    .style("font-size",function(d){
      return radiusScale(+d.total)+"px";
    })
    .style("color",function(d){
      return colorScale(+d[varSelected]);
    })
    .style("background-color",function(d){
      let color = d3.color(colorScale(+d[varSelected]));
      return "rgba("+color.r+","+color.g+","+color.b+",.1)"
    })
    ;


    // .append("p")
    // .attr("class","word")
    // .text(function(d){
    //   return d.adj;
    // })
    // .style("font-size",function(d){
    //   return radiusScale(+d.total)+"px";
    // })
    // .style("color",function(d){
    //   return colorScale(+d[varSelected]);
    // })
    // .each(function(d){
    //   let bounds = d3.select(this).node().getBoundingClientRect();
    //   d.width = bounds.width;
    //   d.height = bounds.height;
    // })
    // .style("width",function(d){
    //   return d.width+"px";
    // })
    // .style("height",function(d){
    //   return d.height+"px";
    // })
    // .style("background-color",function(d){
    //   let color = d3.color(colorScale(+d[varSelected]));
    //   return "rgba("+color.r+","+color.g+","+color.b+",.1)"
    // })
    // ;

}

function initBodyScroller(){
  const scroller = scrollama();

  scroller
    .setup({
      container: '#body-graphic', // our outermost scrollytelling element
			graphic: '.graphic', // the graphic
			text: '.story', // the step container
			step: '.story .step', // the step elements
			offset: 0.5 // set the trigger to be 1/2 way down screen
    })
    .onStepEnter(response => {
      console.log("response");
      // { element, index, direction }
    })
    .onStepExit(response => {
      // { element, index, direction }
    });

  // setup resize event
  window.addEventListener("resize", scroller.resize);

}
function init() {
  quiz = new Swiper('.swiper-container', {
    speed: 400,
    spaceBetween: 100,
    slidesPerView:"auto",
    centeredSlides:true,
    mousewheel:{
      forceToAxis:true,
      invert:true
    }
  });
  initQuiz();
  initDek();
  initBodyScroller();
  initAdjScroller();

	loadData(['adj_2.csv', 'parts.csv']).then(result => {
    buildAdjChart(result[0]);
    setupBodyImg(result[1])
	}).catch(console.error);

}

function setupBodyImg(data){

  let bodyPartMap = d3.map(data,function(d){ return d.BodyPart; });

  function getCentroid(element) {
      var bbox = element.getBBox();
      return [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
  }

  let svg = d3.select(".body-img")

  let roughSvg = rough.svg(svg.node());

  let bodyAnnotated = [];
  let bodyAnnotatedFace = [];

  svg.select("#parts").selectAll("path").each(function(d){
    bodyAnnotated.push(d3.select(this).attr("id"));
  })

  svg.select("#face-parts").selectAll("path").each(function(d){
    bodyAnnotatedFace.push(d3.select(this).attr("id"));
  })

  let face = svg.select("#click-circle").on("click",function(d){
    if(!zoomed){
      zoomed = true;
      svg.transition().duration(1000).style("transform","scale(3)")
      svg.select("#zoom").transition().duration(1000).style("opacity",0);
      svg.select("#face-parts").selectAll(".face-circle").selectAll("path").transition().duration(1000).style("opacity",1);
      svg.selectAll(".body-circle").transition().duration(1000).style("opacity",0);
    }
    else {
      zoomed = false;
      svg.transition().duration(1000).style("transform",null)
      svg.select("#zoom").transition().duration(1000).style("opacity",null);
      svg.select("#face-parts").selectAll(".face-circle").selectAll("path").transition().duration(1000).style("opacity",null);
      svg.selectAll(".body-circle").transition().duration(1000).style("opacity",null);
    }
  })

  let extent = d3.extent(data.filter(function(d){
    return d.skew != "Inf" && d.skew != "-Inf" && bodyAnnotated.indexOf(d.BodyPart) > -1;
  }).map(function(d){
    return Math.log2(d.pctF/d.pctM);
  }));

  let extentFace = d3.extent(data.filter(function(d){
    return d.skew != "Inf" && d.skew != "-Inf" && bodyAnnotatedFace.indexOf(d.BodyPart) > -1;
  }).map(function(d){
    return Math.log2(d.pctF/d.pctM);
  }));

  let circleRadius = d3.scalePow().domain(extent).range([10,90]).exponent(.6)
  let circleRadiusFace = d3.scalePow().domain(extentFace).range([4,40]).exponent(.5)

  let colorScale = d3.scaleLinear().domain([extent[0],0,extent[1]]).range(["blue","purple","red"]);

  let dots = svg.select("#parts").selectAll("path").attr("fill","none").datum(function(d){
    let part = d3.select(this).attr("id");
    let bodyData = bodyPartMap.get(part);
    let centroid = getCentroid(d3.select(this).node())
    return {"oddsRatio":Math.log2(bodyData.pctF/bodyData.pctM),"centroid": centroid, "bodyPart":part};
  })
  .each(function(d){
    let centroid = d.centroid;
    let oddsRatio = d.oddsRatio;
    let part = d.bodyPart;
    let radius = circleRadius(oddsRatio);
    let faceCircle = false;
    let strokeWidth = 3;
    let hachureGap = 2;
    let roughness = 1.2;
    let fillWeight = .8;


    if(d3.select(this.parentNode).attr("id") == "face-parts"){
      faceCircle = true;
      radius = circleRadiusFace(oddsRatio);
      strokeWidth = 1;
      hachureGap = 1;
      fillWeight = .5;
      roughness = .5;
    }

    let angle = d3.scaleLinear().domain([0,1]).range([-180,180]);


    let rcCircle = roughSvg.circle(centroid[0], centroid[1], radius, {
      fill: colorScale(oddsRatio),
      fillStyle: 'hashure',
      hachureGap:hachureGap,
      roughness:roughness,
      hachureAngle:angle(Math.random()),
      //simplification:.1,
      //bowing: 1,
      //roughness: 2,
      strokeWidth: strokeWidth,
      fillWeight: fillWeight, // thicker lines for hachure
      stroke:d3.color(colorScale(oddsRatio)).darker(1)
    });

    let appendedCircle = d3.select(this.parentNode).node().appendChild(rcCircle);
    d3.select(appendedCircle)
      .attr("class",function(d){
        if(bodyAnnotatedFace.indexOf(part) > -1){
          return "face-circle";
        }
        return "body-circle";
      })
      .on("click",function(d){
      })
      .attr("data-part",part)
      ;


    d3.select(this.parentNode)
      .append("circle")
      .attr("cx",centroid[0])
      .attr("cy",centroid[1])
      .attr("r",function(){
        if(d3.select(this.parentNode).attr("id") == "face-parts"){
          return circleRadiusFace(oddsRatio)
        }
        return circleRadius(oddsRatio)
      })
      .attr("fill",function(d){
        return colorScale(oddsRatio)
      })
      .attr("class",function(d){
        if(bodyAnnotatedFace.indexOf(part) > -1){
          return "face-circle";
        }
        return "body-circle";
      })
      .on("click",function(d){
      })
      .attr("data-part",part)
      .style("display","none")
      ;
  })
  ;

}

function constant(_) {
    return function () { return _ }
}

function rectCollide() {
    var nodes, sizes, masses
    var size = constant([0, 0])
    var strength = 1
    var iterations = 1

    function force() {
        var node, size, mass, xi, yi
        var i = -1
        while (++i < iterations) { iterate() }

        function iterate() {
            var j = -1
            var tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare)

            while (++j < nodes.length) {
                node = nodes[j]
                size = sizes[j]
                mass = masses[j]
                xi = xCenter(node)
                yi = yCenter(node)

                tree.visit(apply)
            }
        }

        function apply(quad, x0, y0, x1, y1) {
            var data = quad.data
            var xSize = (size[0] + quad.size[0]) / 2
            var ySize = (size[1] + quad.size[1]) / 2
            if (data) {
                if (data.index <= node.index) { return }

                var x = xi - xCenter(data)
                var y = yi - yCenter(data)
                var xd = Math.abs(x) - xSize
                var yd = Math.abs(y) - ySize

                if (xd < 0 && yd < 0) {
                    var l = Math.sqrt(x * x + y * y)
                    var m = masses[data.index] / (mass + masses[data.index])

                    if (Math.abs(xd) < Math.abs(yd)) {
                        node.vx -= (x *= xd / l * strength) * m
                        data.vx += x * (1 - m)
                    } else {
                        node.vy -= (y *= yd / l * strength) * m
                        data.vy += y * (1 - m)
                    }
                }
            }

            return x0 > xi + xSize || y0 > yi + ySize ||
                   x1 < xi - xSize || y1 < yi - ySize
        }

        function prepare(quad) {
            if (quad.data) {
                quad.size = sizes[quad.data.index]
            } else {
                quad.size = [0, 0]
                var i = -1
                while (++i < 4) {
                    if (quad[i] && quad[i].size) {
                        quad.size[0] = Math.max(quad.size[0], quad[i].size[0])
                        quad.size[1] = Math.max(quad.size[1], quad[i].size[1])
                    }
                }
            }
        }
    }

    function xCenter(d) { return d.x + d.vx + sizes[d.index][0] / 2 }
    function yCenter(d) { return d.y + d.vy + sizes[d.index][1] / 2 }

    force.initialize = function (_) {
        sizes = (nodes = _).map(size)
        masses = sizes.map(function (d) { return d[0] * d[1] })
    }

    force.size = function (_) {
        return (arguments.length
             ? (size = typeof _ === 'function' ? _ : constant(_), force)
             : size)
    }

    force.strength = function (_) {
        return (arguments.length ? (strength = +_, force) : strength)
    }

    force.iterations = function (_) {
        return (arguments.length ? (iterations = +_, force) : iterations)
    }

    return force
}

function boundedBox() {
    var nodes, sizes
    var bounds
    var size = constant([0, 0])

    function force() {
        var node, size
        var xi, x0, x1, yi, y0, y1
        var i = -1
        while (++i < nodes.length) {
            node = nodes[i]
            size = sizes[i]
            xi = node.x + node.vx
            x0 = bounds[0][0] - xi
            x1 = bounds[1][0] - (xi + size[0])
            yi = node.y + node.vy
            y0 = bounds[0][1] - yi
            y1 = bounds[1][1] - (yi + size[1])
            if (x0 > 0 || x1 < 0) {
                node.x += node.vx
                node.vx = -node.vx
                if (node.vx < x0) { node.x += x0 - node.vx }
                if (node.vx > x1) { node.x += x1 - node.vx }
            }
            if (y0 > 0 || y1 < 0) {
                node.y += node.vy
                node.vy = -node.vy
                if (node.vy < y0) { node.vy += y0 - node.vy }
                if (node.vy > y1) { node.vy += y1 - node.vy }
            }
        }
    }

    force.initialize = function (_) {
        sizes = (nodes = _).map(size)
    }

    force.bounds = function (_) {
        return (arguments.length ? (bounds = _, force) : bounds)
    }

    force.size = function (_) {
        return (arguments.length
             ? (size = typeof _ === 'function' ? _ : constant(_), force)
             : size)
    }

    return force
}

function bboxCollide (bbox) {

  function x (d) {
    return d.x + d.vx;
  }

  function y (d) {
    return d.y + d.vy;
  }

  function constant (x) {
    return function () {
      return x;
    };
  }

  var nodes,
      boundingBoxes,
      strength = 1,
      iterations = 1;

      if (typeof bbox !== "function") {
        bbox = constant(bbox === null ? [[0,0][1,1]] : bbox)
      }

      function force () {
        var i,
            tree,
            node,
            xi,
            yi,
            bbi,
            nx1,
            ny1,
            nx2,
            ny2

            var cornerNodes = []
            nodes.forEach(function (d, i) {
              cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + (boundingBoxes[i][1][0] + boundingBoxes[i][0][0]) / 2, y: d.y + (boundingBoxes[i][0][1] + boundingBoxes[i][1][1]) / 2})
              cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + boundingBoxes[i][0][0], y: d.y + boundingBoxes[i][0][1]})
              cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + boundingBoxes[i][0][0], y: d.y + boundingBoxes[i][1][1]})
              cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + boundingBoxes[i][1][0], y: d.y + boundingBoxes[i][0][1]})
              cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + boundingBoxes[i][1][0], y: d.y + boundingBoxes[i][1][1]})
            })
            var cn = cornerNodes.length

        for (var k = 0; k < iterations; ++k) {
          tree = d3.quadtree(cornerNodes, x, y).visitAfter(prepareCorners);

          for (i = 0; i < cn; ++i) {
            var nodeI = ~~(i / 5);
            node = nodes[nodeI]
            bbi = boundingBoxes[nodeI]
            xi = node.x + node.vx
            yi = node.y + node.vy
            nx1 = xi + bbi[0][0]
            ny1 = yi + bbi[0][1]
            nx2 = xi + bbi[1][0]
            ny2 = yi + bbi[1][1]
            tree.visit(apply);
          }
        }

        function apply (quad, x0, y0, x1, y1) {
            var data = quad.data
            if (data) {
              var bWidth = bbLength(bbi, 0),
              bHeight = bbLength(bbi, 1);

              if (data.node.index !== nodeI) {
                var dataNode = data.node
                var bbj = boundingBoxes[dataNode.index],
                  dnx1 = dataNode.x + dataNode.vx + bbj[0][0],
                  dny1 = dataNode.y + dataNode.vy + bbj[0][1],
                  dnx2 = dataNode.x + dataNode.vx + bbj[1][0],
                  dny2 = dataNode.y + dataNode.vy + bbj[1][1],
                  dWidth = bbLength(bbj, 0),
                  dHeight = bbLength(bbj, 1)

                if (nx1 <= dnx2 && dnx1 <= nx2 && ny1 <= dny2 && dny1 <= ny2) {

                  var xSize = [Math.min.apply(null, [dnx1, dnx2, nx1, nx2]), Math.max.apply(null, [dnx1, dnx2, nx1, nx2])]
                  var ySize = [Math.min.apply(null, [dny1, dny2, ny1, ny2]), Math.max.apply(null, [dny1, dny2, ny1, ny2])]

                  var xOverlap = bWidth + dWidth - (xSize[1] - xSize[0])
                  var yOverlap = bHeight + dHeight - (ySize[1] - ySize[0])

                  var xBPush = xOverlap * strength * (yOverlap / bHeight)
                  var yBPush = yOverlap * strength * (xOverlap / bWidth)

                  var xDPush = xOverlap * strength * (yOverlap / dHeight)
                  var yDPush = yOverlap * strength * (xOverlap / dWidth)

                  if ((nx1 + nx2) / 2 < (dnx1 + dnx2) / 2) {
                    node.vx -= xBPush
                    dataNode.vx += xDPush
                  }
                  else {
                    node.vx += xBPush
                    dataNode.vx -= xDPush
                  }
                  if ((ny1 + ny2) / 2 < (dny1 + dny2) / 2) {
                    node.vy -= yBPush
                    dataNode.vy += yDPush
                  }
                  else {
                    node.vy += yBPush
                    dataNode.vy -= yDPush
                  }
                }

              }
              return;
            }

            return x0 > nx2 || x1 < nx1 || y0 > ny2 || y1 < ny1;
        }

      }

      function prepareCorners (quad) {

        if (quad.data) {
          return quad.bb = boundingBoxes[quad.data.node.index]
        }
          quad.bb = [[0,0],[0,0]]
          for (var i = 0; i < 4; ++i) {
            if (quad[i] && quad[i].bb[0][0] < quad.bb[0][0]) {
              quad.bb[0][0] = quad[i].bb[0][0]
            }
            if (quad[i] && quad[i].bb[0][1] < quad.bb[0][1]) {
              quad.bb[0][1] = quad[i].bb[0][1]
            }
            if (quad[i] && quad[i].bb[1][0] > quad.bb[1][0]) {
              quad.bb[1][0] = quad[i].bb[1][0]
            }
            if (quad[i] && quad[i].bb[1][1] > quad.bb[1][1]) {
              quad.bb[1][1] = quad[i].bb[1][1]
            }
        }
      }

      function bbLength (bbox, heightWidth) {
        return bbox[1][heightWidth] - bbox[0][heightWidth]
      }

      force.initialize = function (_) {
        var i, n = (nodes = _).length; boundingBoxes = new Array(n);
        for (i = 0; i < n; ++i) boundingBoxes[i] = bbox(nodes[i], i, nodes);
      };

      force.iterations = function (_) {
        return arguments.length ? (iterations = +_, force) : iterations;
      };

      force.strength = function (_) {
        return arguments.length ? (strength = +_, force) : strength;
      };

      force.bbox = function (_) {
        return arguments.length ? (bbox = typeof _ === "function" ? _ : constant(+_), force) : bbox;
      };

      return force;
}

export default { init, resize };
