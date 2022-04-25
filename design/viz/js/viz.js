var margin = {top: 0, right: 0, bottom: 0, left: 0},
width = 850 - margin.left - margin.right,
height = 850 - margin.top - margin.bottom;

var svg = d3.select("#container").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom );
let a = svg.append("g")
.attr("transform","translate(" + margin.left + "," + margin.top + ")");


var xGraph = d3.scaleTime().range([0,width]);
var yGraph = d3.scaleLinear().range([height-200,0]);
var sizeScale = d3.scaleLinear().range([3,20]);
var colorScale = d3.scaleLinear().range(["#0000ff","#ff0000"])
var yearParse = d3.timeParse("%Y");
var dateParse = d3.timeParse("%Y-%m-%d");
var yearFormat = d3.timeFormat("%Y");
var colors = {
  "race_ethnicity":{"pub":"#ccc","authorHigh":"#52B2EE","authorLow":"tan"},
  "gender_only":{"pub":"#ccc","authorHigh":"#A170E5","authorLow":"tan"},
  "intersectional":{"pub":"#ccc","authorHigh":"#FF595E","authorLow":"tan"},
  "type":{"pub":"#eaa15d","author":"#5dd0ea"},
  "expert":{"pub":"#ccc","race_ethnicity":"#52B2EE","gender_only":"#A170E5","intersectional":"#FF595E","other":"tan"}
}
var legendLabels = {
  "pub":"Publication",
  "gender_only":"Gender Studies",
  "race_ethnicity":"Race & Ethnicity",
  "intersectional":"Intersectional",
  "other":"Other",
  "author":"Author",
  "authorHigh": "Focus on",
  "authorLow": "Does not focus on"
}
var eData,nData, nodes=[], links=[],link,node,simulation,timeline;
var dataFolder = "../../data/";
var edgeFile, showPubs = true, authRings = false;

if(showPubs){
  edgeFile = "ADVANCE_Outcome_AuthorPublication_EdgeList.csv";
}else{
  edgeFile = "ADVANCE_Outcome_CoAuthor_FullEdgeList.csv"
}


d3.csv(dataFolder+edgeFile).then( function(edgeData) {
  d3.csv(dataFolder+"ADVANCE_Outcome_Publications.csv").then( function(pubData) {
    d3.csv(dataFolder+"ADVANCE_Outcome_CoAuthor_AuthorInfo_v2.csv").then( function(authorData) {
      pubData.forEach(function(d){
        d.datef = dateParse(d.Date);
        d.cite = +d.CitationCount;
        d.type = "pub";
        d.id = +d.PublicationId;
        d.name = d.PaperTitle;
      })
      authorData.forEach(function(d){
        d.datef = yearParse(d.FirstYear);
        d.cite = +d.TotalCitations;
        d.type = "author";
        d.name = d.FullName;

        if(showPubs){
          d.id = +d.AuthorId;
        }else{
          d.id = +d.NetworkId;
        }

        var expert = "other";
        if(+d.race_ethnicity > +d.gender_only && +d.race_ethnicity > +d.intersectional){
          expert = "race_ethnicity";
        }if(+d.gender_only > +d.race_ethnicity && +d.gender_only > +d.intersectional){
          expert = "gender_only";
        }if(+d.intersectional > +d.race_ethnicity && +d.intersectional > +d.gender_only){
          expert = "intersectional";
        }
        d.expert = expert;
      })
      edgeData.forEach(function(d){
        d.datef = yearParse(d.Year);
        if(showPubs){
          d.source = {id: +d.AuthorId};
          d.target = {id: +d.PublicationId};
        }else{
          console.log(d.aid1)
          d.source = {id: +d.aid1};
          d.target = {id: +d.aid2};
        }
      });

      if(showPubs){
        nData = pubData.concat(authorData);
      }else{
        nData = authorData;
      }
      eData = edgeData;

      setScales();
      updateLegend("type");
      nData.forEach(function(d){
        nodes.push({radius:sizeScale(d.cite),x:width/2,y:height/2,id:d.id,type:d.type,date:d.datef,name:d.name,cite:d.cite});
      });
      eData.forEach(function(d){
        console.log(d.source.id);
        links.push({source:d.source.id,target:d.target.id,date:d.datef});
      });

      console.log(eData,nData);
      createGraph();
    });
  });
});

function setScales(){
  //check years in pubdata and author data for x Scale
  xGraph.domain(d3.extent(nData,d=>+d.datef));
  //total citations yScale
  yGraph.domain(d3.extent(nData,d=>+d.cite));
  sizeScale.domain(d3.extent(nData,d=>+d.cite));
}

function createGraph(){
  // Initialize the links
  link = svg
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", "#f4e1a1")
    .attr("class",function(d){return "link-"+d.source+" link-"+d.target})

  // Initialize the nodes
  node = svg
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
      .attr("id",function(d){return "node-"+d.id})
      .attr("class",d=>d.name)
      .attr("r", d=>d.radius-1)
      .attr("fill",function(d){
        if(d.type == "pub"){
          return "#eaa15d";
        }else{
          return "#5dd0ea";
        }
      })
      .on("click",clicked)
      //.classed("fixed", d => d.fx !== undefined)

  // Let's list the force we wanna apply on the network
  simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink().links(links).id(function(d) { return d.id; }))//.strength(1))
      .force("charge", d3.forceManyBody())//.strength(1))
      .force("x", d3.forceX().strength(0.3))
      .force("y", d3.forceY().strength(0.3))
      .force("center", d3.forceCenter(width / 2, height / 2))
      // .force('collide', d3.forceCollide().strength(100))
      .on("tick", ticked);

  // This function is run at each iteration of the force algorithm
  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    node
     .attr("cx", function (d) { return d.x; })
     .attr("cy", function(d) { return d.y; });
  }
}

function clicked(){
  if(this.classList.contains("selected")){
    this.classList.remove("selected");
    d3.selectAll("line").attr("opacity",1);
    d3.selectAll("circle").attr("opacity",1);
  }else{
    d3.selectAll(".selected").classed("selected",false);
    this.classList.add("selected");
    var clickData = this.__data__;
    //highlight neighbors
    highlightNeighbors(clickData.id);
    //add basic info
    d3.select("#infoText").html("<p>"+clickData.name+" "+yearFormat(clickData.date)+"<br/>Citations: "+clickData.cite+"</p>");
    if(clickData.type == "pub"){
      //add list of authors
    }else{
      //add list of publications and collaborators
    }
  }
}

function highlightNeighbors(nodeID){
  var collaborators = [];
  d3.selectAll("line").attr("opacity",0.1);
  d3.selectAll("circle").attr("opacity",0.1);
  d3.select("#node-"+nodeID).attr("opacity",1);
  var lanks = d3.selectAll(".link-"+nodeID).attr("opacity",1);
  lanks.each(function(d){
    var neighborId;
    if(d.source.id == nodeID){
      neighborId = d.target.id;
      collaborators.push(neighborId);
    }else{
      neighborId = d.source.id;
    }
    d3.select("#node-"+neighborId).attr("opacity",0.8);

    for(c=0;c<collaborators.length;c++){
      var lanks = d3.selectAll(".link-"+collaborators[c]).attr("opacity",1);
      lanks.each(function(d){
        var neighborId2;
        if(d.source.id == collaborators[c]){
          neighborId2 = d.target.id;
        }else{
          neighborId2 = d.source.id;
        }
        d3.select("#node-"+neighborId2).attr("opacity",0.8);
      });
    }
  });

}

function toggleTimeline(){
  if(timeline){
    timeline = false;
    nodes.forEach(function(d){
      delete d.fx;
      delete d.fy;
    })
  }else{
    timeline = true;
    nodes.forEach(function(d){
      d.fx = xGraph(d.date);
      d.fy = yGraph(d.cite);
    })
  }
  simulation.alpha(1).restart();
}

function yearChange(year){
  // console.log(year);
  d3.select("#yearLabel").text(year);
  var time = yearParse(year);
  //
  // //clear and recreate nodes/links with filter
  // nodes = [];
  // links = [];
  // nData.forEach(function(d){
  //   if(d.datef <= time){
  //     nodes.push({radius:sizeScale(d.cite),x:width/2,y:height/2,id:d.id,type:d.type,date:d.datef,name:d.name,cite:d.cite});
  //   }
  // });
  // eData.forEach(function(d){
  //   if(d.datef <= time){
  //     links.push({source:d.AuthorId,target:d.PublicationId,date:d.datef});
  //   }
  // });
  //
  // //reset sim data
  // node.data(nodes,function(d){return d.id});
  // link.data(links);
  // simulation.nodes(nodes,function(d){return d.id});
  // simulation.force("link",d3.forceLink().links(links));

  // if(timeline){
    d3.selectAll("circle")
      .attr("opacity",function(d){
        if(d.date>time){
          return 0;
        }
        else{
          return 1;
        }
      })

      d3.selectAll("line")
        .attr("opacity",function(d){
          if(d.date>time){
            return 0;
          }
          else{
            return 1;
          }
        })
  // }

}

function reColor(colorBy){
  var threshhold;

  if(colorBy != "type"){
    colorScale.domain(d3.extent(nData,d=>d[colorBy]));
    //threshhold = d3.quantile([d3.median(nData,d=>d[colorBy]),colorScale.domain()[1]],0.1);
    threshhold = 3;
  }

  nData.forEach(function(d){
    var c = d[colorBy];
    d3.select("#node-"+d.id).attr("fill",function(e){
      if(e.type == "pub"){
        return colors[colorBy].pub;
      }else{
        if(colorBy == "type"){
          return colors[colorBy].author;
        }else if(colorBy == "expert"){
          return colors[colorBy][c];
        }else{
          if(c<threshhold){
            return colors[colorBy].authorLow;
          }else{
            return colors[colorBy].authorHigh;
          }
        }
      }
    });
  });
  updateLegend(colorBy);
}

function updateLegend(colorBy){
  d3.select("#legend").html(null);
  for( c in colors[colorBy]){
    var label = legendLabels[c];
    d3.select("#legend").append("li").text(label).style("color",colors[colorBy][c]);
  }
}
