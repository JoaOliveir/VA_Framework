import eventBus from "../eventBus.js";

var networkComponent = {
    template: `
    <div v-if="configs" class="network-component">
        <p v-if="document==null" style="color:orange;">** No Document **</p>
        <div id="network-body" v-if="document!=null" class="network-body">
            <!--<div id="network-body-svg-div"></div>-->
        </div>
    </div>
    `,
    props: {
        documents: Array,
        // document_id: String,
        config: Object,
    },
    data() {
        return {
            document: null,
            open_docs: [],
            docs: [],
            body: "",
            configs: null,
            nodes: [],
            links: [],
            show_select_docs: false,
            docs_without_selected: [],
            component_width: null,
            component_heigth: null,
            speakers: null,
            clicked: {
                id: null,
                type: null,
                node: null
            },
            selected_docs_: [],
            window_width: null,
            highlighted: []
        };
    },
    created() {
        eventBus.$on("setDocument", documents => {

            this.$nextTick(() => {
                this.selected_docs_ = JSON.parse(JSON.stringify(documents))

                this.selected_docs_.sort((b, a) => new Date(b.date) - new Date(a.date));

                this.document = null;

                this.selected_docs_.forEach((_doc) => {
                    if (this.document == null) {
                        this.document = Object.assign({}, _doc);
                        this.document.boundaries = [];
                    } else {
                        _doc.annotations.nodes.forEach((_node) => {
                            let new_node = Object.assign({}, _node);

                            new_node.ranges[0] += 2 + this.document.body.length;
                            new_node.ranges[1] += 2 + this.document.body.length;
                            this.document.annotations.nodes.push(new_node);
                        });

                        this.document.speakers = [
                            ...new Set([...this.document.speakers, ..._doc.speakers]),
                        ];

                        this.document.stances = [
                            ...new Set([...this.document.stances, ..._doc.stances]),
                        ];

                        this.document.annotations.links = [
                            ...new Set([
                                ...this.document.annotations.links,
                                ..._doc.annotations.links,
                            ]),
                        ];

                        this.document.boundaries.push(this.document.body.length);

                        this.document.body += "\n\n" + _doc.body;
                    }
                });

                this.$nextTick(() => {
                    this.prepareData()
                    this.drawGraph()
                });

                
                var erd = elementResizeDetectorMaker();
                var comp = this

                erd.listenTo(this.$el, function(element) {
                    // var width = element.offsetWidth;
                    // var height = element.offsetHeight;
                    if (comp.document != null) {
                        comp.prepareData()
                        comp.drawGraph()
                    }
                });
            })
        });

    
        // eventBus.$on("updateSpeakers", speakers => {
        //     this.speakers = speakers
        //     // console.log(this.speakers)
        // })

        eventBus.$on("selectSpeaker", (speaker_id,vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = speaker_id
                this.clicked.type = "SPEAKER"

                this.highlighted=[]

                let elements = Array.from(document.querySelectorAll('[class=network-circle]'));
                elements.forEach(el => {
                    if (el.getAttribute("speaker_id") == speaker_id) {
                        this.highlighted.push(speaker_id)
                        el.style.fill = this.configs.Circle_Color_Highlighted
                        el.setAttribute("r", this.configs.Circle_Radius_Highlighted)
                    } else {
                        el.style.fill = this.configs.Circle_Color
                        el.setAttribute("r", this.configs.Circle_Radius)
                    }
                })
            }
        })
        eventBus.$on("deselectSpeaker", vue_el=> {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = Array.from(document.querySelectorAll('[class=network-circle]'));

                elements.forEach(el => {
                    el.style.fill = this.configs.Circle_Color
                    el.setAttribute("r", this.configs.Circle_Radius)
                })

                this.clicked.id = null
                this.clicked.type = null

                this.highlighted=[]
            }
        })

        eventBus.$on("selectTopic", (topic, vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = topic
                this.clicked.type = "TOPIC"
                this.highlighted= []

                let speakers = []
                this.document.annotations.nodes.forEach(node => {
                    if (node.topics.includes(topic))
                        speakers.push(node.speaker_id)
                })

                let elements = Array.from(document.querySelectorAll('[class=network-circle]'));
                elements.forEach(el => {
                    if (speakers.includes(el.getAttribute("speaker_id"))) {
                        this.highlighted.push(el.getAttribute("speaker_id"))
                        el.style.fill = this.configs.Circle_Color_Highlighted
                        el.setAttribute("r", this.configs.Circle_Radius_Highlighted)
                    } else {
                        el.style.fill = this.configs.Circle_Color
                        el.setAttribute("r", this.configs.Circle_Radius)
                    }
                })
            }
        })

        eventBus.$on("deselectTopic", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = Array.from(document.querySelectorAll('[class=network-circle]'));
                elements.forEach(el => {
                    el.style.fill = this.configs.Circle_Color
                        el.setAttribute("r", this.configs.Circle_Radius)
                })

                this.clicked.id = null
                this.clicked.type = null
                this.highlighted=[]
            }
        })

        eventBus.$on("selectNode", (node, vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = node.id
                this.clicked.type = "NODE"
                this.clicked.node = node

                this.highlighted=[]

                let elements = document.querySelectorAll('[class=network-circle]');
                let els = Array.from(elements)
                els.forEach(el => {
                    if (el.getAttribute("speaker_id") == node.speaker_id) {
                        this.highlighted.push(node.speaker_id)
                        el.style.fill = this.configs.Circle_Color_Highlighted
                        el.setAttribute("r", this.configs.Circle_Radius_Highlighted)
                    } else {
                        el.style.fill = this.configs.Circle_Color
                        el.setAttribute("r", this.configs.Circle_Radius)
                    }
                })
            }
        })
        eventBus.$on("deselectNode", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = Array.from(document.querySelectorAll('[class=network-circle]'));

                elements.forEach(el => {
                    el.style.fill = this.configs.Circle_Color
                    el.setAttribute("r", this.configs.Circle_Radius)
                })


                this.clicked.id = null
                this.clicked.type = null
                this.clicked.node = null
                
                this.highlighted=[]
            }
        })
    },
    async beforeMount() {
        let configs = await import("./../../config_files/" + this.config.file);
        this.configs = configs.default;
    },
    mounted() {    },
    methods: {
        openSelected(doc) {
            this.document.push(doc)
            const index = this.docs_without_selected.indexOf(doc);
            if (index > -1) {
                this.docs_without_selected.splice(index, 1);
            }
        },
        closeSelected(doc) {
            this.docs_without_selected.push(doc)
            const index = this.document.indexOf(doc);
            if (index > -1) {
                this.document.splice(index, 1);
            }
        },
        selectDocument(doc_id) {
            eventBus.$emit("selectDocument", doc_id)
        },
        selectSpeaker(speaker_id) {
            if (this.clicked.id == null || this.clicked.type != "SPEAKER")
                eventBus.$emit("selectSpeaker", speaker_id, this)
            else if (this.clicked.id == speaker_id)
                eventBus.$emit("deselectSpeaker", this)
            else {
                eventBus.$emit("deselectSpeaker", this)
                eventBus.$emit("selectSpeaker", speaker_id, this)
            }
        },
        showTooltip(d) {
            if (this.configs.Show_Tooltip_On_Hover_Speaker){
                let text = ""

                let speaker = this.document.speakers.find(spk => spk.id == d.id)
                
                text = "<p><strong>Name: </strong>" + speaker.name + "</p>"
                Object.keys(speaker.attributes[0]).forEach(key => {
                    text += "<p><strong>" + key + ": </strong>" + speaker.attributes[0][key] + "</p>"
                })
            

                if (text != "") {
                     d3.select("body").append("div")
                        .attr("class", "d3-tip")
                        .html(text)
                        .style("left", event.clientX + "px")
                        .style("top", event.clientY + "px");
                }
            }
        },
        hideTooltip() {
            if (this.configs.Show_Tooltip_On_Hover_Speaker) {
                d3.select(".d3-tip").remove()
            }
        },
        prepareData() {

            this.nodes = []
            this.document.annotations.nodes.forEach(node => {
                let speaker_name = this.document.speakers.find(
                    (spk) => spk.id == node.speaker_id
                ).name;

                if (this.nodes == [])
                    this.nodes.push({
                        "id": node.speaker_id,
                        "name": speaker_name
                    })
                else {
                    let found = this.nodes.find(_node => _node.id == node.speaker_id)
                    if (found == undefined) {
                        this.nodes.push({
                            "id": node.speaker_id,
                            "name": speaker_name
                        })
                    }
                }
            })



            this.links = []

            this.document.annotations.links.forEach(link => {
                let speaker_1 = this.document.annotations.nodes.find(node => node.id == link.from).speaker_id
                let speaker_2 = this.document.annotations.nodes.find(node => node.id == link.to).speaker_id

                if (speaker_1 != speaker_2) {
                    if (this.links == []) {
                        this.links.push({
                            "source": speaker_1,
                            "target": speaker_2,
                            "value": 1
                        })
                    } else {
                        let _link = this.links.find(link => link.source == speaker_1)
                        if (_link != undefined) {
                            if (_link.target == speaker_2)
                                _link.value += 1
                            else {
                                this.links.push({
                                    "source": speaker_1,
                                    "target": speaker_2,
                                    "value": 1
                                })
                            }
                        } else {
                            let _link2 = this.links.find(link => link.target == speaker_1)
                            if (_link2 != undefined) {
                                if (_link2.source == speaker_2)
                                    _link2.value += 1
                            } else {
                                this.links.push({
                                    "source": speaker_1,
                                    "target": speaker_2,
                                    "value": 1
                                })
                            }
                        }
                    }
                }
            })

        },
        drawGraph() {
            this.$nextTick(() => {
                var width = document.getElementById("network-body").offsetWidth;
                var height = document.getElementById("network-body").offsetHeight;

                // var color = d3.scaleOrdinal(d3.schemeCategory10);

                var label = {
                    'nodes': [],
                    'links': []
                };

                this.nodes.forEach(function (d, i) {
                    label.nodes.push({
                        node: d
                    });
                    label.nodes.push({
                        node: d
                    });
                    label.links.push({
                        source: i * 2,
                        target: i * 2 + 1
                    });
                });

                var labelLayout = d3.forceSimulation(label.nodes)
                    .force("charge", d3.forceManyBody().strength(-50))
                    .force("link", d3.forceLink(label.links).distance(0).strength(2));

                var graphLayout = d3.forceSimulation(this.nodes)
                    .force("charge", d3.forceManyBody().strength(-3000))
                    .force("center", d3.forceCenter(width / 2, height / 2))
                    .force("x", d3.forceX(width / 2).strength(1))
                    .force("y", d3.forceY(height / 2).strength(1))
                    .force("link", d3.forceLink(this.links).id(function (d) {
                        return d.id;
                    }).distance(50).strength(1))
                    .on("tick", ticked);

                var adjlist = [];

                this.links.forEach(function (d) {
                    adjlist[d.source.index + "-" + d.target.index] = true;
                    adjlist[d.target.index + "-" + d.source.index] = true;
                });

                function neigh(a, b) {
                    return a == b || adjlist[a + "-" + b];
                }


                if(document.getElementById("network-body"))
                    d3.select("#network-svg").remove()

                var svg = d3.select("#network-body").append("svg").attr("id", "network-svg").attr("width", width).attr("height", height);
                var container = svg.append("g");

                svg.call(
                    d3.zoom()
                    .scaleExtent([.1, 4])
                    .on("zoom", function () {
                        container.attr("transform", d3.event.transform);
                    })
                );

                var link = container.append("g").attr("class", "links")
                    .selectAll("line")
                    .data(this.links)
                    .enter()
                    .append("line")
                    .attr("stroke", "#aaa")
                    .attr("stroke-width", "2px");

                var node = container.append("g").attr("class", "nodes")
                    .selectAll("g")
                    .data(this.nodes)
                    .enter()
                    .append("circle")
                    .attr("class", "network-circle")
                    .attr("speaker_id", d => d.id)
                    .attr("r", d => {
                        if (this.highlighted.includes(d.id))
                            return this.configs.Circle_Radius_Highlighted
                        else
                            return this.configs.Circle_Radius
                    })
                    .attr("fill", d => {
                        if (this.highlighted.includes(d.id))
                            return this.configs.Circle_Color_Highlighted
                        else
                            return this.configs.Circle_Color
                    })

                node.on("mouseover", d => { 
                        this.showTooltip(d)
                        focus()
                    })
                    .on("mouseout", () => {
                        this.hideTooltip()
                        unfocus()
                    })
                    .on("click", d => this.selectSpeaker(d.id));

                node.call(
                    d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
                );

                if (this.configs.Show_Speaker_Names) {
                    var labelNode = container.append("g").attr("class", "labelNodes")
                    .selectAll("text")
                    .data(label.nodes)
                    .enter()
                    .append("text")
                    .text(function (d, i) {
                        return i % 2 == 0 ? "" : d.node.name;
                    })
                    .style("fill", this.configs.Label_Font_Color)
                    .style("font-size", this.configs.Label_Font_Size)
                    .style("pointer-events", "none"); // to prevent mouseover/drag capture
                }
                

                var el= this

                function ticked() {

                    node.call(updateNode);
                    link.call(updateLink);

                    labelLayout.alphaTarget(0.3).restart();

                    if (el.configs.Show_Speaker_Names) {
                        labelNode.each(function (d, i) {
                            if (i % 2 == 0) {
                                d.x = d.node.x;
                                d.y = d.node.y;
                            } else {
                                var b = this.getBBox();

                                var diffX = d.x - d.node.x;
                                var diffY = d.y - d.node.y;

                                var dist = Math.sqrt(diffX * diffX + diffY * diffY);

                                var shiftX = b.width * (diffX - dist) / (dist * 2);
                                shiftX = Math.max(-b.width, Math.min(0, shiftX));
                                var shiftY = 16;
                                this.setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
                            }
                        });
                        labelNode.call(updateNode);
                    }
                }

                function fixna(x) {
                    if (isFinite(x)) return x;
                    return 0;
                }

                function focus(d) {
                    var index = d3.select(d3.event.target).datum().index;
                    node.style("opacity", function (o) {
                        return neigh(index, o.index) ? 1 : 0.1;
                    });
                    if (el.configs.Show_Speaker_Names) {
                        labelNode.attr("display", function (o) {
                            return neigh(index, o.node.index) ? "block" : "none";
                        });
                    }
                    link.style("opacity", function (o) {
                        return o.source.index == index || o.target.index == index ? 1 : 0.1;
                    });
                }

                function unfocus() {
                    if (el.configs.Show_Speaker_Names) 
                        labelNode.attr("display", "block");
                    node.style("opacity", 1);
                    link.style("opacity", 1);
                }

                function updateLink(link) {
                    link.attr("x1", function (d) {
                            return fixna(d.source.x);
                        })
                        .attr("y1", function (d) {
                            return fixna(d.source.y);
                        })
                        .attr("x2", function (d) {
                            return fixna(d.target.x);
                        })
                        .attr("y2", function (d) {
                            return fixna(d.target.y);
                        });
                }

                function updateNode(node) {
                    node.attr("transform", function (d) {
                        return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
                    });
                }

                function dragstarted(d) {
                    d3.event.sourceEvent.stopPropagation();
                    if (!d3.event.active) graphLayout.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                }

                function dragged(d) {
                    d.fx = d3.event.x;
                    d.fy = d3.event.y;
                }

                function dragended(d) {
                    if (!d3.event.active) graphLayout.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }

            })
        }
    },
    watch: {
        documents: {
            async handler(newVal, oldVal) {
                if (newVal != oldVal)
                    this.docs = newVal
            },
            deep: true,
        },
        docs: {
            async handler(newVal, oldVal) {
                if (newVal != oldVal)
                    this.docs_without_selected = newVal
            },
            deep: true,
        },
        component_width() {
            // console.log("network graph width changed");
            // this.drawGraph()
        },
        component_height() {
            // console.log("network graph height changed");
            // this.drawGraph()
        },
    },
};

export default networkComponent;