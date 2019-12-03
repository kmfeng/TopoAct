var awesomplete_inst = new Awesomplete(document.getElementById("searchbox"), {minChars: 1});
var labels;

function array_intersect() {
  var a, b, c, d, e, f, g = [], h = {}, i;
  i = arguments.length - 1;
  d = arguments[0].length;
  c = 0;
  for (a = 0; a <= i; a++) {
    e = arguments[a].length;
    if (e < d) {
      c = a;
      d = e
    }
  }
  for (a = 0; a <= i; a++) {
    e = a === c ? 0 : a || c;
    f = arguments[e].length;
    for (var j = 0; j < f; j++) {
      var k = arguments[e][j];
      if (h[k] === a - 1) {
        if (a === i) {
          g.push(k);
          h[k] = 0
        } else {
          h[k] = a
        }
      } else if (a === 0) {
        h[k] = 0
      }
    }
  }
  return g
}

function getColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

function buildLayers() {
  function layerBtnClicked(data) {
    // First set all layer-buttons to unselected
    d3.selectAll("div.layer-button").classed("selected", false);

    // Then set clicked div to selected
    let layerDiv = d3.select(d3.event.target);
    layerDiv.classed("selected", true);

    let {dataset, layer} = getCurrentParams();
    draw_mapper(layer, dataset, "mapper-svg", awesomplete_inst);
  }

  try {
    let layers = ["3a", "3b", "4a", "4b", "4c", "4d", "4e", "5a", "5b"];

    let layer_div = d3.select("div#toolbar-layer-list");
    layer_div.selectAll("div.layer-button")
        .data(layers)
        .enter()
        .append("div")
        .attr("id", d => "mixed" + d)
        .attr("class", "layer-button")
        .classed("selected", d => d === "3a")
        .html(d => d)
        .on('click', layerBtnClicked);

    let glyph_div = layer_div.append("div")
        .style("margin", "30px");

    glyph_div.append("input")
        .attr("type", "checkbox")
        .style("display", "inline-block")
        .attr("id", "node-glyph-checkbox");

    glyph_div.append("label")
        .attr("for", "node-glyph-checkbox")
        .html("Show activation images");

    d3.select("#node-glyph-checkbox").on("change", function () {
      let glyph_checkbox = d3.select("#node-glyph-checkbox");
      if (glyph_checkbox.property("checked")) {
        d3.selectAll(".node-glyph").attr("visibility", "visible");
      } else {
        d3.selectAll(".node-glyph").attr("visibility", "hidden");
      }
    })
    // Set 3a as default selected layer
  } catch (e) {
    console.log(e)
  }
}

function buildDatasetDropdown() {
  function datasetChanged() {
    let {dataset, layer} = getCurrentParams();
    if (dataset === 'overlap-30') {
      layer = layer + '_30';
    }
    console.log(dataset, layer);
    draw_mapper(layer, dataset, "mapper-svg", awesomplete_inst);
  }

  try {
    let datasets = [
      // {name: "Overlap-20", path: "test1"},
      {name: "Overlap-30", path: "test2"},
      {name: "Overlap-50", path: "test3"}
    ];

    let dropdown = d3.select("#dataset-selector");
    dropdown.selectAll("option")
        .data(datasets)
        .enter()
        .append("option")
        .attr("id", d => d.name.toLowerCase())
        .attr("value", d => d.name.toLowerCase())
        .attr("selected", d => {
          return d.name === "Overlap-50" ? "selected" : null;
        })
        .html(d => d.name);

    dropdown.on("change", datasetChanged);
  } catch (e) {
    console.log(e);
  }
}

async function draw_mapper(layer_name, dataset, svg_container, awesomeplete_instace) {

  function handleMouseClick(data) {
    handleMouseOut(data);

    // In HTML event handlers, this refers to the HTML element that received the event
    d3.select(this).select("circle").attr("stroke-width", "3px").classed("focus-node", true);

    // Clear the selection from search-box
    let searchbox = d3.select("#searchbox");
    searchbox.node().value = "";
    searchbox.dispatch("keyup");

    let legend_text_data = data["top_classes"].map(d => {
      return {"label": d.split(",")[0], "len": d.split(",")[0].length}
    });

    let legend_group = d3.select("g#legend-" + data.id).append("g")
        .attr("class", "legend-group");

    let legend_text_group = legend_group.append("g")
        .attr("id", "legend-table")
        .attr("style", "background: green");

    legend_text_group.append("text")
        .attr("id", "label-names")
        .attr("x", 40)
        .attr("y", -20)
        .selectAll("tspan")
        .data(legend_text_data)
        .enter()
        .append("tspan")
        .attr("x", 40)
        .html(d => d.label.substr(0, 15) + (d.label.length > 15 ? "..." : ''))
        .attr("dy", "1.5em")
        .attr("fill", "white")
        .append("title")
        .html(d => d.label);

    legend_text_group.append("text")
        .attr("id", "label-percentages")
        // .attr("x", 140)
        .attr("y", -20)
        .selectAll("tspan")
        .data(legend_text_data)
        .enter()
        .append("tspan")
        .attr("x", 240)
        // .html(d => d.len + "%")
        .html((d, i) => (data["top_class_percents"][i] * 100).toFixed(2) + "%")
        .attr("text-anchor", "end")
        .attr("dy", "1.5em")
        .attr("fill", "white");

    legend_text_group.append("text")
        .attr("id", "label-counts")
        // .attr("x", 140)
        .attr("y", -20)
        .selectAll("tspan")
        .data(legend_text_data)
        .enter()
        .append("tspan")
        .attr("x", 270)
        // .html(d => d.len + "%")
        .html((d, i) => Math.round(data["top_class_percents"][i] * data["membership"].length) + "/" + data["membership"].length)
        .attr("text-anchor", "start")
        .attr("dy", "1.5em")
        .attr("fill", "white");

    let bounding_box = legend_text_group.node().getBBox();

    let image_height = 80;

    legend_group.insert("rect", "g#legend-table")
        .attr("x", bounding_box.x - 10)
        .attr("y", bounding_box.y - 5)
        .attr("width", bounding_box.width + 20)
        .attr("height", bounding_box.height + 35 + image_height)
        .attr("opacity", 0.8)
        .attr("stroke", "#999");
    console.log(bounding_box)
    legend_text_group.append("image")
        .attr("x", bounding_box.width / 2)
        .attr("y", bounding_box.height)
        // .attr("x", "50%")
        .attr("height", image_height)
        .attr("xlink:href", `data/final_mapper_outputs/${layer_name}/${data.id}/opt/avg.jpg`);

    // legend_text_group.append("line")
    //     .attr("id", "separator1")
    //     .attrs({"x1": 170, "y1": -15, "x2": 170, "y2": bounding_box.height - 2})
    //     .attr("stroke", "white");

    let orig_imgdiv = d3.select("#original-images");
    let orig_image_list = [];

    for (let i = 0; i < data["top_classes"].length; i++) {
      for (let j = 0; j < 5; j++) {
        let img_src = `data/final_mapper_outputs/${layer_name}/${data.id}/icons/${data["top_classes"][i]}_${j}.jpg`;
        orig_image_list.push(img_src);
      }
    }

    orig_imgdiv.selectAll("img")
        .data(orig_image_list)
        .enter()
        .append("img")
        .attr("src", d => d)
        .attr("style", "margin: 1px; width:19%");

    let act_imgdiv = d3.select("#activation-images");
    let act_image_list = [];

    for (let i = 0; i < data["top_classes"].length; i++) {
      for (let j = 0; j < 5; j++) {
        let img_src = `data/final_mapper_outputs/${layer_name}/${data.id}/opt/${data["top_classes"][i]}${j}.jpg`;
        act_image_list.push(img_src);
      }
    }

    act_imgdiv.selectAll("img")
        .data(act_image_list)
        .enter()
        .append("img")
        .attr("onerror", "this.src=''")
        .attr("src", d => d)
        .attr("style", "margin: 1px; width:19%");

    // Add average activation image
    let avg_image_path = `data/final_mapper_outputs/${layer_name}/${data.id}/opt/avg.jpg`;
    act_imgdiv.append("div")
        .attr("id", "averaged-image")
        .html("Averaged image <hr style='width: 100%'>")
        .append("img")
        .attr("onerror", "this.src=''")
        .attr("src", avg_image_path)
        .attr("style", "margin: 1px; width:30%; display: block; margin: auto; image-rendering: pixelated;");

    function create_image_list(layer_name, cluster_id) {
      let base_path = "data/final_mapper_outputs/";
      let image_list = [];
      for (let i = 0; i < 15; i++) {
        let img_src = `${base_path + layer_name}/${cluster_id}/opt/optimized_image_${i}.jpg`;
        image_list.push(img_src);
      }
      return image_list;
    }

    act_imgdiv.exit().remove();

    let top_classes_div = d3.select("#top-classes");

    top_classes_div.append("ul")
        .attr("id", "top-classes-list")
        .attr("style", "padding-left: 0")
        .selectAll("li")
        .data(data["top_classes"])
        .enter()
        .append("li")
        .html(d => d)
  }

  function handleMouseOut(data) {
    if (data !== '') {
      node.attr("opacity", 1);
      link.attr("opacity", 1);
    }

    d3.selectAll("circle").attr("stroke-width", "1px")
        .classed("focus-node", false);
    d3.selectAll(".legend-group").remove();

    let orig_imgdiv = d3.select("#original-images");
    orig_imgdiv.selectAll("img").remove();

    let act_imgdiv = d3.select("#activation-images");
    act_imgdiv.selectAll("img").remove();

    d3.select("#averaged-image").remove();

    let top_classes_div = d3.select("#top-classes");
    top_classes_div.html("");
  }

  function jaccard(link_data) {
    // return link_data["intersection"];
    let node_ids = nodes.map(d => d.id);
    let source_size = nodes[node_ids.indexOf(link_data.source)]["membership"].length;
    let target_size = nodes[node_ids.indexOf(link_data.target)]["membership"].length;
    return link_data["intersection"] / (source_size + target_size - link_data["intersection"]);
  }

  // Remove the previous force-directed graph
  d3.select("#mapper-svg").selectAll("g").remove();

  // Clear selection-details
  handleMouseOut("");

  // Clear searchbox
  d3.select("#searchbox").node().value = "";

  // Remove disable-styles from modal-labels
  d3.selectAll(".modal-label").classed("modal-label-disabled", false);

  // Read the mapper results stored in JSON file
  let graph_data = await d3.json("data/final_mapper_outputs/" + layer_name + "/output.json");
  const mapper_svg = d3.select("#mapper-svg")
      .attr("width", "100%")
      .attr("height", "95%");

  mapper_svg.on('click', function () {
    if (d3.event.target.id === "mapper-svg") {
      d3.selectAll(".legend-group").remove();
    }
  });

  // Force directed graph
  const links = graph_data.links.map(d => Object.create(d));
  const nodes = graph_data.nodes.map(d => Object.create(d));

  // Compute arrays of important properties
  let l2normvals = graph_data.nodes.map(d => parseFloat(d["l2NormAvg"]));
  let membership_length = graph_data.nodes.map(d => d["membership"].length);
  let class_names = graph_data.nodes.map(d => d["top_classes"]);
  let overlaps = graph_data.links.map(jaccard);

  // Dedupe and flatten class name
  class_names = [...new Set(class_names.map(d => d.map(x => x.split(","))).flat(2).map(y => y.trim()))];

  // Create autocomplete text-box
  awesomeplete_instace.list = class_names;

  // Disable all classes not present in current graph
  let modal_labels = d3.selectAll(".modal-label");
  modal_labels.filter(d => d.some(x => class_names.indexOf(x) <= 0)).classed("modal-label-disabled", true);

  let search_term = d3.select("#searchbox");

  function checkStrInArr(strArray, searchTerm) {
    return strArray["top_classes"].flat().join(", ").split(",").map(d => d.trim()).includes(searchTerm.trim());
  }

  search_term.on("awesomplete-selectcomplete", function () {
    handleMouseOut("");
    let search_term_val = search_term.node().value;
    if (search_term_val === "") {
      node.attr("opacity", 1);
      link.attr("opacity", 1)
    } else {
      node.filter(d => !checkStrInArr(d, search_term_val)).attr("opacity", 0.1);
      link.attr("opacity", 0.1);
    }
  });

  search_term.on("keyup", function () {
    let search_term_val = search_term.node().value;
    if (search_term_val === "") {
      node.attr("opacity", 1);
      link.attr("opacity", 1);
    }
  });


  let color_scale = d3.scaleSequential(d3.interpolateTurbo).domain(d3.extent(l2normvals));
  color_scale.nice();

  let link_strength_scale = d3.scaleLinear()
      .domain(d3.extent(overlaps))
      .range([1, 10]);

  let links_color_scale = d3.scaleSequential(d3.interpolatePlasma).domain(d3.extent(overlaps));
    links_color_scale.nice();

  let radius_scale = d3.scaleLog()
      .domain(d3.extent(membership_length))
      .range([3, 8]);

  const mapper_svg_g = mapper_svg.append("g").attr("id", "mapper-svg-g");

  let width = Math.max(500, +mapper_svg.style("width").replace("px", ""));
  let height = Math.max(400, +mapper_svg.style("height").replace("px", ""));
  let node_radius = 6;

  // noinspection JSUnresolvedVariable

  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id))
      .force("charge", d3.forceManyBody().strength(-5))
      // .force("collision", d3.forceCollide().radius(10))
      .force("center", d3.forceCenter(width / 2, height / 2));

  const link = mapper_svg_g.append("g")
      .attr('id', 'link-group')
      .attr("stroke", getColor("--link-stroke-color"))
      .attr("stroke-opacity", 1)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d, i) => link_strength_scale(overlaps[i]))
      .attr("stroke", (d, i) => links_color_scale(overlaps[i]));

  link.append("title")
      .text((d, i) => 'Jaccard similarity between vertices = ' + overlaps[i].toFixed(3));

  const node = mapper_svg_g.append("g")
      .attr("stroke", getColor("--node-stroke-color"))
      .attr("stroke-width", 1)
      .attr("stroke-opactiy", 0.6)
      .attr("id", "node-group")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("g");

  // node.on("click", handleMouseClick);

  node.append("circle")
      .attr("r", d => radius_scale(d["membership"].length))
      .attr("fill", d => color_scale(d["l2NormAvg"]))
      .attr("stroke-width", "1px")
      .attr("id", d => d.id)
      .attr("class", "clickable");

  let img_size = 20;
  node.append("image")
      .attr("xlink:href", d => `data/final_mapper_outputs/${layer_name}/${d.id}/opt/avg.jpg`)
      .attr("x", -img_size / 2)
      .attr("y", -img_size / 2)
      .attr("width", img_size)
      .attr("height", img_size)
      .attr("visibility", d3.select("#node-glyph-checkbox").property("checked") ? "visibile" : "hidden")
      .attr("class", "node-glyph");


  node.append("title")
      .attr("dx", 12)
      .attr("dy", "0.35em")
      .attr("class", "node-label")
      .text(d => d.id + ', size=' + d["membership"].length + "\n" + "l2norm=" + d['l2NormAvg'].toFixed(4) + '\n----------\n' +
          d["top_classes"].map(x => x.split(",")[0]).join('\n'));

  node.on("click", handleMouseClick);

  let legend = mapper_svg_g.append("g")
      .attr("id", "legend")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("id", d => "legend-" + d.id);

  // add drag capabilities
  const drag_handler = d3.drag()
      .on("start", drag_start)
      .on("drag", drag_drag)
      .on("end", drag_end);

  //add zoom capabilities
  const zoom_handler = d3.zoom()
      .on("zoom", zoom_actions);

  drag_handler(node);
  zoom_handler(mapper_svg);


  simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("transform", function (d) {
          return "translate(" + d.x + "," + d.y + ")";
        });

    legend
        .attr("transform", function (d) {
          return "translate(" + d.x + "," + d.y + ")";
        });
  });

  // Drag functions
  function drag_start(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  //make sure you can"t drag the circle outside the box
  function drag_drag(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function drag_end(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  //Zoom functions
  function zoom_actions() {
    mapper_svg_g.attr("transform", d3.event.transform);
  }
}

function getCurrentParams() {
  //  Get the current params - selected layer and dataset
  let selected_layer = d3.select(".selected");
  let selected_dataset = d3.select("#dataset-selector");
  return {layer: selected_layer.node().id, dataset: selected_dataset.node().value};
}


function populateModal() {
  function smallestString(strArr) {
    // console.log(strArr)
    return strArr[strArr.indexOf(Math.max(strArr.split(",").map(x => x.length)))];
  }

  function modalLabelClicked() {
    // if d3.selec
    d3.select(this).classed("selected-label", !d3.select(this).classed("selected-label"));
  }

  // Modal window
  const modal = d3.select(".modal-body");

  modal.selectAll("div")
      .data(labels)
      .enter()
      .append("div")
      .attr("id", d => d[0].replace(" ", "-"))
      .classed("modal-label", true)
      .classed("clickable", true)
      // .append("span")
      .html(d => d[0])
      .attr('data-classes', d => d)
      .on("click", modalLabelClicked);
}

function make_modal_window() {
  // Get the modal
  const modal = document.getElementById("classes-modal");

  // Get the button that opens the modal
  const btn = document.getElementById("myBtn");

  // Get the <span> element that closes the modal
  const span = document.getElementsByClassName("close")[0];

  // When the user clicks the button, open the modal
  btn.onclick = function () {
    modal.style.display = "block";
  };

  function isIntersectionEmpty(arr1, arr2) {

  }

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = "none";
    let selected_labels = d3.selectAll(".selected-label").data().flat();
    let nodes = d3.selectAll("#node-group>g");
    nodes.attr("opacity", 1);
    nodes.filter(d => array_intersect(d["top_classes"], selected_labels).length === 0).attr("opacity", 0.1);
  };

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  }
}

// Wrapper to call all functions
async function wrapper() {
  try {
    // Read the label file
    labels = Object.values(await d3.json("data/labels.json"));
    labels = labels.map(x => x.split(",").map(y => y.trim()));
    // console.log(labels);
    buildLayers();
    buildDatasetDropdown();
    make_modal_window();
    populateModal();

    let {dataset, layer} = getCurrentParams();
    draw_mapper(layer, dataset, '#mapper-svg', awesomplete_inst);
  } catch (e) {
    console.log(e)
  }
}

wrapper();