var margin = {top: 0, right: 0, bottom: 0, left: 0},
width = 850 - margin.left - margin.right,
height = 850 - margin.top - margin.bottom;

var svg = d3.select("#container").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom );
let a = svg.append("g")
.attr("transform","translate(" + margin.left + "," + margin.top + ")");

svg.append("rect").attr("x",0).attr("y",0).attr("width",width).attr("height",height).attr("fill","white").on("click",clearSelection);
var lGroup = svg.append("g").attr("transform","translate("+width/2+","+height/2+")");
var nGroup = svg.append("g").attr("transform","translate("+width/2+","+height/2+")");
var xGraph = d3.scaleTime().range([0,width]);
var yGraph = d3.scaleLinear().range([height-200,0]);
var sizeScale = d3.scaleLinear().range([3,20]);
var degScale = d3.scaleLinear().range([3,20]);
var colorScale = d3.scaleTime().range(["#A5FFD6","#BAD7F7","#EE5353"])
var yearParse = d3.timeParse("%Y");
var dateParse = d3.timeParse("%Y-%m-%d");
var yearFormat = d3.timeFormat("%Y");
var colors = {
  "race_ethnicity":{"pub":"#f4e1a1","authorHigh":"#52B2EE","authorLow":"#ccc"},
  "gender_only":{"pub":"#f4e1a1","authorHigh":"#A170E5","authorLow":"#ccc"},
  "intersectional":{"pub":"#f4e1a1","authorHigh":"#FF595E","authorLow":"#ccc"},
  "type":{"pub":"#eaa15d","author":"#5dd0ea"},
  "expert":{"pub":"#f4e1a1","race_ethnicity":"#52B2EE","gender_only":"#A170E5","intersectional":"#FF595E","other":"#ccc"},
  "date":{"pub":"#f4e1a1","2000":"#A5FFD6","2011":"#BAD7F7","2022":"#EE5353"},
  "gender":{"pub":"#f4e1a1","woman":"#fc8f95","man":"#8fa1fc","unknown":"#ccc"},
  "msi":{"pub":"#f4e1a1","msi":"#52B2EE","not_msi":"#eee"},
  "msi_detail":{"pub":"#f4e1a1","hsi":"#52B2EE","not_msi":"#eee"}
}
var legendLabels = {
  "pub":"Publication",
  "gender_only":"Gender Studies",
  "race_ethnicity":"Race & Ethnicity",
  "intersectional":"Intersectional",
  "other":"Other",
  "author":"Author",
  "authorHigh": "Expertise In",
  "authorLow": "Not Expert In",
  "woman":"Woman",
  "man":"Man",
  "unknown":"Unknown",
  "hbcu":"Historically black institution",
  "hsi": "Hispanic serving institution",
  "msi":"Minority serving institution",
  "not_msi":"Not minority serving",
  "2000":"2000",
  "2011":"2011",
  "2022":"2022"
}
var eData,eDataNP,nData, nodes=[], links=[],link,node,simulation,chosenNodes = [];
var dataFolder = "data/";
var showPubs = true, authRings = false, curYear = 2022, curColorScheme = "type", curScaling = "cite",play=false, animationTimeout, idleTimeout,idleTimer = 1500, runIdle = false;

d3.csv(dataFolder+"ADVANCE_Outcome_AuthorPublication_EdgeList_v2.csv").then( function(edgeData) {
  d3.csv(dataFolder+"ADVANCE_Outcome_CoAuthor_EdgeList_v2.csv").then( function(edgeDataNoPubs) {
  d3.csv(dataFolder+"ADVANCE_Outcome_Publications.csv").then( function(pubData) {
    d3.csv(dataFolder+"ADVANCE_Outcome_CoAuthor_AuthorInfo_v4.csv").then( function(authorData) {
      pubData.forEach(function(d){
        d.datef = dateParse(d.Date);
        d.cite = +d.CitationCount;
        d.type = "pub";
        d.id = +d.PublicationId;
        d.name = d.PaperTitle;
        d.set = d.Publisher;
        d.network = false;
        d.degree = 0;
      })
      authorData.forEach(function(d){
        d.id = +d.AuthorId;
        d.idNP = +d.NetworkId;
        d.datef = yearParse(d.FirstYear);
        d.cite = +d.TotalCitations;
        d.type = "author";
        d.name = d.FullName;
        d.set = d.AffiliationName;
        d.network = false;
        d.gender = d.AuthorGender;
        d.doctype = d.carnegie_doctoral_type;
        d.degree = 0;

        var expert = "other";
        if(+d.race_ethnicity > +d.gender_only && +d.race_ethnicity > +d.intersectional && +d.race_ethnicity>2){
          expert = "race_ethnicity";
        }if(+d.gender_only > +d.race_ethnicity && +d.gender_only > +d.intersectional && +d.gender_only>2){
          expert = "gender_only";
        }if(+d.intersectional > +d.race_ethnicity && +d.intersectional > +d.gender_only && +d.intersectional>2){
          expert = "intersectional";
        }
        d.expert = expert;

        d.msi = "not_msi";
        if(d.carnegie_msi == "True"){d.msi = "msi"}

        d.msi_detail = "not_msi";
        if(d.carnegie_hsi == "True"){ d.msi_detail = "hsi"}
        if(d.carnegie_hbcu == "True"){d.msi_detail ="hbcu"}
      })
      edgeData.forEach(function(d){
        d.datef = yearParse(d.Year);
        d.network = false;
        d.source = {id: +d.AuthorId};
        d.target = {id: +d.PublicationId};
        d.type = "pub";
      });
      edgeDataNoPubs.forEach(function(d){
        d.datef = yearParse(d.Year);
        d.network = false;
        d.source = {id: +d.aid1};
        d.target = {id: +d.aid2};
        d.type = "coauth";
      });
      nData = pubData.concat(authorData);
      eData = edgeData;
      eDataNP = edgeDataNoPubs;
      console.log(eData,nData);
      setScales();
      makeNodesLinks();
      createGraph();
      updateLegend("type");
      yearChange(curYear);
      reScale();
    });
  });
});
});

function setScales(){
  //check years in pubdata and author data for x Scale
  xGraph.domain([yearParse(1999),yearParse(2022)]);
  //total citations yScale
  yGraph.domain(d3.extent(nData,d=>+d.cite));
  sizeScale.domain(d3.extent(nData,d=>+d.cite));
  degScale.domain([0,26]);
  colorScale.domain([yearParse(2000),yearParse(2011),yearParse(2022)])
}

function createGraph(){
  // Initialize the links
  link = lGroup
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", "#f4e1a1")
    .attr("opacity",0.6)
    .attr("class",function(d){return "link-"+d.source+" link-"+d.target})

  // Initialize the nodes
  node = nGroup
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
      .attr("id",function(d){return "node-"+d.id})
      .attr("class",d=>d.name)
      .attr("r", d=>d.radius)
      .attr("fill",function(d){
        if(d.type == "pub"){
          return "#eaa15d";
        }else{
          return "#5dd0ea";
        }
      })
      .on("click",clicked);
      // .on("mouseenter",clicked)
      // .on("mouseleave",clicked);

  // Let's list the force we wanna apply on the network
  simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink().links(links).id(function(d) { return d.id; }))//.strength(1))
      .force("charge", d3.forceManyBody())
      // .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX().strength(0.3))
      .force("y", d3.forceY().strength(0.3))
      .on("tick", ticked);

  // This function is run at each iteration of the force algorithm
  function ticked() {
    if(authRings){
      node
       .attr("cx", back2circle_x)
       .attr("cy", back2circle_y);

      nodes.forEach(function(d){
        d.x = back2circle_x(d);
        d.y = back2circle_y(d);
      })
    }else{
      node
       .attr("cx", function (d) {return d.x;})
       .attr("cy", function(d) { return d.y;});
    }
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
  }
}

function makeNodesLinks(){
  nData.forEach(function(d){
    if(d.datef <= yearParse(curYear) && !(d.type=="pub" && !showPubs)){
      //if node is not in network and meets current criteria, add it to nodes array
      if(d.network == false){
        var randx = Math.random()*width - Math.random()*width;
        var randy = Math.random()*height - Math.random()*height;
        nodes.push({radius:sizeScale(+d.cite)-1,x:randx,y:randy,id:d.id,type:d.type,date:d.datef,name:d.name,cite:d.cite,set:d.set,degree:d.degree, doctype:d.doctype});
        d.network = true;
      }
    }
    //remove nodes that don't fit the current criteria
    else{
      d.network = false;
      for(n=nodes.length-1;n>=0;n--){
        if(nodes[n].id == d.id || nodes[n].id == d.idNP){
          nodes.splice(n,1);
          break;
        }
      }
    }

    //if show pubs then use auth/pub id's, else use NetworkId
    for(n=0;n<nodes.length;n++){
      if(nodes[n].id == d.id || nodes[n].id == d.idNP){
        if(showPubs){
          if(nodes[n].type == "author"){
            nodes[n].id = d.id
          }
        }else{
          if(nodes[n].type == "author"){
            nodes[n].id = d.idNP
          }
        }
      }
    }
  });

  //pick edge data with or without pubs
  var linkDataToUse;
  if(showPubs){
    linkDataToUse = eData;
    eDataNP.forEach(d=>d.network = false);
  }else{
    linkDataToUse = eDataNP;
    eData.forEach(d=>d.network = false);
  }

  linkDataToUse.forEach(function(d){
    if(d.datef < yearParse(curYear) && !(d.type=="pub" && !showPubs)){
      //if link is not in network, add it to links array
      if(d.network == false){
        links.push({source:d.source.id,target:d.target.id,date:d.datef,id:d.source.id+"-"+d.target.id,type:d.type});
        d.network = true;
      }
    }
    //if link is after curYear remove it from nodes array
    else{
      d.network = false;
      for(l=links.length-1;l>=0;l--){
        if(links[l].id == d.source.id+"-"+d.target.id){
          links.splice(l,1);
        }
      }
    }
  });

  //remove leftover links of opposite type
  for(l=links.length-1;l>=0;l--){
    var typeToRemove = "pub";
    if(showPubs){
      typeToRemove = "coauth";
    }
    if(links[l].type == typeToRemove){
      links.splice(l,1);
    }
  }

  console.log(nodes,links);
}

function clicked(){
  if(play){playPause();}
  if(runIdle){playPauseIdle();}

  if(this.classList.contains("selected")){
    clearSelection();
  }else{
    d3.selectAll(".selected").classed("selected",false);
    this.classList.add("selected");
    var clickData = this.__data__;
    //highlight neighbors
    highlightNeighbors(clickData.id);
    //add basic info
    d3.select("#infoText").html("<p><span class='"+clickData.type+"'>"+clickData.name+"</span><br/><span class='year'>"+yearFormat(clickData.date)+"</span><br/><span class='set'>"+clickData.set+"</span><br/><span class='doctype-"+clickData.type+"'>"+clickData.doctype+"<br/></span><span class='cite'>Citations: "+clickData.cite+"</span></p>");
  }
}

function clearSelection(){
  d3.selectAll(".selected").classed("selected",false);
  d3.selectAll(".selected-result").classed("selected-result",false);
  d3.selectAll("line").attr("opacity",0.6);
  d3.selectAll("circle").attr("opacity",1);
  d3.select("#infoText").html('');
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
  var button = d3.select("#toggleTimelineButton");
  clearSelection();
  if(authRings){
    authRings = false;
    button.html("Show timeline");
  }else{
    authRings = true;
    button.html("Hide timeline");
  }
  simulation.alpha(1).restart();
}

function togglePubs(){
  var button = d3.select("#togglePubsButton");
  clearSelection();
  if(showPubs){
    showPubs = false;
    button.html("Show Publications");
  }else{
    showPubs = true;
    button.html("Hide Publications");
  }
  makeNodesLinks();
  updateSim();
}

function yearSlider(year){
  // curColorScheme = "date";
  //d3.select("#colorDropdown").property("value","date");
  clearSelection();
  yearChange(year);
  makeNodesLinks();
  updateSim();
  if(runIdle){
    playPauseIdle();
  }
}

function yearChange(year){
  d3.select("#yearSlider").property("value",year)
  d3.select("#yearLabel").text(year);
  curYear = year;
}

function updateSim(){
  link = lGroup.selectAll("line").data(links,d=>d.id);//.join();
  link.exit().remove();
  link.enter().append("line")
    .attr("stroke", "#f4e1a1")
    .attr("opacity",0.6)
    .attr("class",function(d){return "link-"+d.source+" link-"+d.target});
  link = lGroup.selectAll("line").data(links,d=>d.id);

  node = nGroup.selectAll("circle").data(nodes,d=>d.id);
  //update exisiting ID's
  node.attr("id",d=>"node-"+d.id);
  if(curScaling == "cite"){node.attr("r",d=>d.radius);}else{
    calcDegrees();
    node.attr("r",d=>degScale(d.degree)-1);
  }
  //remove culled nodes
  node.exit().remove();
  //add new nodes
  node.enter().append("circle")
    .attr("id",function(d){return "node-"+d.id})
    .attr("class",d=>d.name)
    .attr("r", function(d){if(curScaling =="cite"){return d.radius}else{return degScale(d.degree)-1}})
    .attr("fill",d=>colorScale(d.date))
    .attr("cx",d=>d.x)
    .attr("cy",d=>d.y)
    .on("click",clicked);
  node = nGroup.selectAll("circle").data(nodes,d=>d.id);

  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.alpha(1).restart();
  reColor(curColorScheme);
}

function reColor(colorBy){
  curColorScheme = colorBy;
  var threshhold = 2;

  nData.forEach(function(d){
    var c = d[colorBy];
    var idToUse = d.idNP;
    if(showPubs){idToUse = d.id}
    d3.select("#node-"+idToUse).attr("fill",function(e){
      if(e.type == "pub"){
        return colors[colorBy].pub;
      }else{
        if(colorBy == "type"){
          return colors[colorBy].author;
        }else if(colorBy == "date"){
          return colorScale(e.date);
        }else if(colorBy == "expert" || colorBy == "gender" || colorBy == "msi" || colorBy == "msi_detail"){
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

function reScale(){
  var button = d3.select("#reScaleButton");
  if(curScaling == 'deg'){
    curScaling = 'cite';
    button.html("Scale by degree");
  }else{
    curScaling = 'deg';
    button.html("Scale by citations");
    calcDegrees();
  }
  updateSim();
}

function calcDegrees(){
  //calculate current degree for each node
  for(n=0;n<nodes.length;n++){
    var nid = nodes[n].id;
    var deg = d3.selectAll(".link-"+nid).size();
    nodes[n].degree = deg;
  }
  degScale.domain(d3.extent(nodes,d=>+d.degree));
}

function updateLegend(colorBy){
  d3.select("#legend").html(null);
  for( c in colors[colorBy]){
    var label = legendLabels[c];
    var li = d3.select("#legend").append("li");
    li.append("span").html('&#8226;').attr("class","bullet").style("color",colors[colorBy][c]);
    li.append("p").text(label);
  }
}

function playPause(){
  var button = d3.select("#playPauseButton");
  if(play){
    play = false
    clearTimeout(animationTimeout);
    button.html("Play animation");
  }else{
    play = true;
    button.html("Pause animation");
    if(curYear == 2022){
      yearChange(2000);
    }
    animateYear();
  }
}

function playPauseIdle(){
  var button = d3.select("#idleButton");
  if(runIdle){
    runIdle = false
    clearTimeout(idleTimeout);
    button.html("Highlight Modules");
  }else{
    clearTimeout(animationTimeout);
    runIdle = true;
    button.html("Pause Modules");
    idle();
  }
}

function animateYear(){
  if(curYear < 2022 && play == true){
    animationTimeout = setTimeout(function(){
      curYear++;
      yearSlider(curYear);
      animateYear();
    },1000)
  }
}

function searchFor(searchTerm){
  searchTerm = searchTerm.toLowerCase();
  var results = d3.select("#searchResults");
  results.html('');
  for(n=0;n<nodes.length;n++){
    if(nodes[n].name.includes(searchTerm) && nodes[n].type == "author"){
      results.append("li").text(nodes[n].name)
        .attr("nodeid",nodes[n].id)
        .on("click",function(){
          if(this.classList.contains("selected-result")){
            console.log("selected already");
            clearSelection();
          }else{
            d3.select("#node-"+d3.select(this).attr("nodeid")).dispatch('click');
            d3.selectAll(".selected-result").classed("selected-result",false);
            this.classList.add("selected-result");
          }
        });
    }
  }
  if(results.selectAll('li').size()<1){
    results.append("li").html("<i>No results</i>")
  }
}

function idle(){
  var chosen = getNewChosenNode();
  var component = getComponent([chosen]);
  highlight(component);
  chosenNodes.concat(component);
  if(runIdle){
    idleTimeout = setTimeout(function(){
      idle();
    },idleTimer)
  }
}

function getComponent(nodeArray){
  //get neighbors
  neighbors = getNeighborIds(nodeArray);
  var newNeighbors = false;

  //if mark new neighbors
  for(n=0;n<neighbors.length;n++){
    if(nodeArray.includes(neighbors[n]) == false){
      newNeighbors = true;
      nodeArray.push(neighbors[n]);
    }
  }
  //if new, do recursion, if not, return list
  if(newNeighbors){
    return getComponent(nodeArray)
  }else{
    return nodeArray;
  }
}

function getNeighborIds(nodeArray){
  var connected = nodeArray;
  for(m=0;m<nodeArray.length;m++){
    var lanks = d3.selectAll(".link-"+nodeArray[m]).attr("opacity",1);

    lanks.each(function(d){
      if(connected.includes(d.source.id) == false){
        connected.push(d.source.id);
      }
      if(connected.includes(d.target.id) == false){
        connected.push(d.target.id);
      }
    });
  }

  return connected;
}

function highlight(nodeArray){
  d3.selectAll("line").attr("opacity",0.1);
  d3.selectAll("circle").attr("opacity",0.1);

  for(m=0;m<nodeArray.length;m++){
    d3.select("#node-"+nodeArray[m]).attr("opacity",0.8);
    d3.selectAll(".link-"+nodeArray[m]).attr("opacity",1);
  }
}

function getNewChosenNode(){
  if(chosenNodes.length > nodes.length - 5){
    chosenNodes = [];
  }
  var random = Math.floor(Math.random()*nodes.length);
  var nodeID = nodes[random].id;
  if(chosenNodes.includes(nodeID)){
    getNewChosenNode();
  }else{
    return nodeID;
  }
}


//====== concentric ring functions ========
function cartesian2polar(x, y){
  return {r:Math.sqrt(x*x + y*y), theta:Math.atan2(y,x)};
}

function polar2cartesian(r, theta){
  return {x:r * Math.cos(theta), y:r * Math.sin(theta)};
}

function back2circle_x(d){
  var newx = d.x //- width/2
  var newy = d.y //- height/2
  var polar = cartesian2polar(newx, newy);
  var cart = polar2cartesian(xGraph(d.date)/2, polar.theta);
  return cart.x //+ width/2;
}

function back2circle_y(d){
  var newx = d.x //- width/2
  var newy = d.y //- height/2
  var polar = cartesian2polar(newx, newy);
  var cart = polar2cartesian(xGraph(d.date)/2, polar.theta);
  return cart.y //+ height/2;
}
