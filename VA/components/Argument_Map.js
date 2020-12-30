import eventBus from "../eventBus.js";

var mapComponent = {
    template: `
    <div v-if="configs" class="map-component">
        <p v-if="document==null" style="color:orange;">** No Document **</p>
        <div id="map-body" class="map-body sc2" v-if="document!=null">
            <div id="map" class="sc2"></div>
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
            // available_documents: null,
            document: null,
            data_tree: [],
            docs: [],
            // ann_with_speakers: null,
            configs: null,
            component_width: null,
            component_height: null,
            showTooltip: false,
            tooltip: null,
            clicked: {
                id: null,
                type: null,
                node: null
            },
            selected_docs_: [],
            highlighted:[]
        }
    },
    async beforeMount() {
        let configs = await import('./../../config_files/' + this.config.file)
        this.configs = configs.default
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
                    this.prepareDataForMap(this.document)
                    this.drawMap()
                });

                var erd = elementResizeDetectorMaker();
                var comp = this

                erd.listenTo(this.$el, function(element) {
                    // var width = element.offsetWidth;
                    // var height = element.offsetHeight;
                    if (comp.document != null) {
                        comp.prepareDataForMap(comp.document)
                        comp.drawMap()
                    }
                });
            })
        });



        eventBus.$on("selectSpeaker", (speaker_id,vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = speaker_id
                this.clicked.type = "SPEAKER"

                this.highlighted =[]

                let elements = Array.from(document.querySelectorAll('[class=tree-node]'));
                elements.forEach(el => {
                    if (el.getAttribute("speaker_id") == speaker_id) {
                        this.highlighted.push(el.getAttribute("node_id"))
                        el.style.backgroundColor = this.configs.Box_Background_Color_Highlighted
                        el.style.color = this.configs.Text_Color_Highlighted
                    } else {
                        el.style.backgroundColor = this.configs.Box_Background_Color
                        el.style.color = this.configs.Text_Color
                    }
                })
            }
        })
        eventBus.$on("deselectSpeaker", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = Array.from(document.querySelectorAll('[class=tree-node]'));
                elements.forEach(el => {
                    el.style.backgroundColor = this.configs.Box_Background_Color
                    el.style.color = this.configs.Text_Color
                })

                this.clicked.id = null
                this.clicked.type = null
                this.highlighted =[]
            }
        })

        eventBus.$on("selectTopic", (topic,vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = topic
                this.clicked.type = "TOPIC"
                this.highlighted =[]

                let nodes = []
                this.document.annotations.nodes.forEach(node => {
                    if (node.topics.includes(topic))
                        nodes.push(node.id)
                })

                let elements = Array.from(document.querySelectorAll('[class=tree-node]'));
                elements.forEach(el => {
                    if (nodes.includes(el.getAttribute("node_id"))) {
                         this.highlighted.push(el.getAttribute("node_id"))
                        el.style.backgroundColor = this.configs.Box_Background_Color_Highlighted
                        el.style.color = this.configs.Text_Color_Highlighted
                    } else {
                        el.style.backgroundColor = this.configs.Box_Background_Color
                        el.style.color = this.configs.Text_Color
                    }
                })
            }
        })
        eventBus.$on("deselectTopic", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = Array.from(document.querySelectorAll('[class=tree-node]'));
                elements.forEach(el => {
                    el.style.backgroundColor = this.configs.Box_Background_Color
                    el.style.color = this.configs.Text_Color
                })

                this.clicked.id = null
                this.clicked.type = null
                this.highlighted =[]
            }
        })

        eventBus.$on("selectNode", (node, vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
            
                this.clicked.id = node.id
                this.clicked.type = "NODE"
                this.clicked.node = node

                this.highlighted =[]

                let elements = document.querySelectorAll('[class=tree-node]');
                let els = Array.from(elements)
                els.forEach(el => {
                    if (el.getAttribute("node_id") == node.id) {
                        this.highlighted.push(el.getAttribute("node_id"))
                        el.style.backgroundColor = this.configs.Box_Background_Color_Highlighted
                        el.style.color = this.configs.Text_Color_Highlighted
                        if (this.$el != vue_el.$el && this.configs.Scroll_On_Selection)
                            el.scrollIntoView()
                    } else {
                        el.style.backgroundColor = this.configs.Box_Background_Color
                        el.style.color = this.configs.Text_Color
                    }
                })
            }
        })

        eventBus.$on("deselectNode", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = Array.from(document.querySelectorAll('[class=tree-node]'));

                elements.forEach(el => {
                    el.style.backgroundColor = this.configs.Box_Background_Color
                    el.style.color = this.configs.Text_Color
                })


                this.clicked.id = null
                this.clicked.type = null
                this.clicked.node = null

                this.highlighted =[]
            }
        })

        eventBus.$on("hoverNode", (node, component) => {
            if (component.$el == this.$el && this.configs.Show_Tooltip_On_Hover_Node) {
                this.tooltip = d3.select("body").append("div")
                    .attr("class", "d3-tip")
                    .attr("v-if", "showTooltip")

                let speaker_name = this.document.speakers.find(
                    (spk) => spk.id == node.speaker_id
                ).name;

                // console.log(event.clientX)

                let doc = this.documents.filter(_doc => _doc.annotations.nodes.filter(_node => _node.id == node.id).length > 0)

                this.tooltip.html("<p></p><b>Document: </b>" + String(doc[0].title) +
                        "<p></p><b>Speaker: </b>" + String(speaker_name) +
                        "</p><p></p><b>Topic: </b> " + String(node.topics) )
                        // "</p><p><b>Stance: </b> " + String(node.stances) + "</p>")
                    .style("left", event.clientX + "px")
                    .style("top", event.clientY + "px");

                this.showTooltip = true
            }
        })
        eventBus.$on("leaveNode", (component) => {
            if (component.$el == this.$el && this.configs.Show_Tooltip_On_Hover_Node) {
                this.tooltip.remove()

                this.showTooltip = false
            }
        })

        eventBus.$on("showArcTooltip", value => {
            if ( this.configs.Show_Tooltip_On_Hover_Link) {
                let text = ""
                value == "SUPPORT" ? text = "Support" : text = "Against"
                
                if (text != "") {
                    d3.select("#calendar-heatmap-component").append("div")
                    .attr("class", "d3-tip")
                    .html(text)
                    .style("left", event.clientX + "px")
                    .style("top", event.clientY + "px");
                }
            }
        })
        eventBus.$on("hideArcTooltip", value => {
            if (this.configs.Show_Tooltip_On_Hover_Link) {
                d3.select(".d3-tip").remove()
            }
        })
    },
    mounted() {},
    beforeUpdate() {},
    methods: {
        selectDocument(doc_id) {
            eventBus.$emit("selectDocument", doc_id);
        },
        selectNode(_node,vue_el) {
            let node = this.document.annotations.nodes.find(node => node.id == _node.data.id)
            if (this.clicked.id == null || this.clicked.type != "NODE")
                eventBus.$emit("selectNode", node, vue_el)
            else if (this.clicked.id == node.id)
                eventBus.$emit("deselectNode",vue_el)
            else {
                eventBus.$emit("deselectNode", vue_el)
                eventBus.$emit("selectNode", node, vue_el)
            }
        },
        prepareDataForMap(doc) {
            let roots = [];
            doc.annotations.nodes.forEach(node => {
                let counter = 0;
                doc.annotations.links.forEach(edge => {
                    edge.from == node.id ? counter++ : null;
                });
                counter == 0 ? roots.push(node) : null;
            });

            const hasChildren = id => {
                let counter = 0;
                doc.annotations.links.forEach(edge => {
                    edge.to == id ? counter++ : null;
                });
                return counter != 0;
            };

            const getChildren = node => {
                let children = [];
                doc.annotations.links.forEach(edge => {
                    if (edge.to == node.id) {
                        doc.annotations.nodes.forEach(_node => {
                            if (_node.id == edge.from) children.push(_node);
                        });
                    }
                });
                return children;
            };

            const setObject = node => {
                let obj_children = [];
                if (hasChildren(node.id)) {
                    let children = getChildren(node);
                    children.forEach(child => {
                        obj_children.push(setObject(child));
                    });
                }

                let new_obj = {};
                new_obj.id = node.id;
                new_obj.speaker_id = node.speaker_id;
                if (node.type == "RA") new_obj.text = "Suporte";
                else if (node.type == "CA") new_obj.text = "Ataque";
                // else new_obj.text = node.text;
                else new_obj.text = this.document.body.substring(node.ranges[0], node.ranges[1]);
                new_obj.type = node.type;
                new_obj.size = [0, 0];
                new_obj.hue = node.color;
                new_obj.ranges = node.ranges;
                new_obj.children = obj_children;
                return new_obj;
            };

            let treeData = [];
            roots.forEach(node => {
                treeData.push(setObject(node));
            });

            this.data_tree = treeData;
        },
        drawMap() {
            d3.select("#map").style("height", "100%")

            const setSizes = tree => {
                tree.forEach(element => {
                    if (element.children != []) setSizes(element.children);

                    var dummy_div = document.createElement("div"); // Create a <div> element

                    // console.log(this.document.body.substring(element.ranges[0], element.ranges[1]))
                    // dummy_div.innerHTML = element.text;
                    dummy_div.innerHTML = this.document.body.substring(element.ranges[0], element.ranges[1]);
                    dummy_div.style.width = this.configs.Box_Width +"px";
                    dummy_div.style.padding = "3px";
                    document.getElementById("map").appendChild(dummy_div);
                    element.size[0] = this.configs.Box_Width;
                    element.size[1] = dummy_div.getBoundingClientRect().height + 60;
                    dummy_div.remove();

                });
            };

            setSizes(this.data_tree);

            const defaults = {
                vertical: true,
                svg: {
                    width: 1000,
                    height: 1000
                },
                box: {
                    padding: {
                        x: 0,
                        y: 50
                    }
                },
                spacing: 20,
                hue: data => ("hue" in data ? data.hue : 0)
            };


            d3.selectAll(".myDiv").remove();

            this.data_tree.forEach((obj, index) => {
                var myDiv = document.createElement("div");
                myDiv.id = `myDiv-${index}`;
                myDiv.className = "myDiv sc2";
                document.getElementById("map").appendChild(myDiv);

                // // const flextree = require("d3-flextree").flextree;
                const flextree = d3.flextree;
                const layout = flextree();
                if (defaults.spacing !== null) layout.spacing(defaults.spacing);
                const tree = layout.hierarchy(this.data_tree[index]);
                layout(tree);


                const svg = d3
                    .select(`#myDiv-${index}`)
                    .append("svg")
                    .attr("width", defaults.svg.width)
                    .attr("height", defaults.svg.height);



                this.document.annotations.links.forEach(_link => {
                    const marker = svg
                        .append("marker")
                        .attr("id", `arrow_${_link.id}`)
                        .attr("viewBox", "0 0 10 10")
                        .attr("refX", 0)
                        .attr("refY", 5)
                        .attr("markerWidth", 5)
                        .attr("markerHeight", 5)
                        .attr("orient", "auto-start-reverse");

                    marker
                        .append("path")
                        .attr("d", "M 0 0 L 10 5 L 0 10 z")
                        .attr("fill", () => {
                            if (_link.type == "SUPPORT") return this.configs.Support_Link_Color
                            if (_link.type == "AGAINST") return this.configs.Against_Link_Color
                        });
                })


                const svgG = svg
                    .append("g")
                    .attr("transform", `translate(0, 0)`)
                    .attr("id", `g-el-${index}`);

                // svg.call(
                //     d3.zoom()
                //     .scaleExtent([.1, 4])
                //     .on("zoom", () => {
                //         // console.log("zoom")
                //         svgG.attr("transform", d3.event.transform);
                //     })
                // );

                const nodes = tree.nodes;
                const boxXSize = node =>
                    node.data.size[0] - 2 * defaults.box.padding.x;
                const boxYSize = node => node.data.size[1] - defaults.box.padding.y;

                const nodeSel = svgG.selectAll("g.node").data(nodes, d => d.id);
                const nodeEnter = nodeSel
                    .enter()
                    .append("g")
                    .attr("class", "node")
                    .attr("transform", node => `translate(${node.x}, ${node.y})`);

                const foreign_obj = nodeEnter
                    .append("foreignObject")
                    .attr("x", node => -boxXSize(node) / 2)
                    .attr("y", 0)
                    .attr("width", boxXSize)
                    .attr("height", boxYSize);

                const div = foreign_obj
                    .append("xhtml:div")
                    .attr("id", node => `map_node_${node.data.id}`)
                    .attr("class", `tree-node`)
                    .attr("style", node => {
                        if (this.highlighted.includes(node.data.id))
                            return `
                                color: ${this.configs.Text_Color_Highlighted};
                                background-color: ${this.configs.Box_Background_Color_Highlighted};
                                `
                        else
                            return `
                                color: ${this.configs.Text_Color};
                                background-color: ${this.configs.Box_Background_Color};
                                `
                    })
                    .attr("node_id", node => node.data.id)
                    .attr("speaker_id", node => node.data.speaker_id)
                    .on("click", node => this.selectNode(node, this))
                    .on("mouseover", node => {
                        let _node = this.document.annotations.nodes.find(__node => __node.id == node.data.id)
                        eventBus.$emit("hoverNode", _node, this)
                    })
                    .on("mouseout", node => eventBus.$emit("leaveNode", this))

                // div
                //     .append("xhtml:div")
                //     .attr("class", node => {
                //         if (node.data.type == "RA" || node.data.type == "CA")
                //             return "div-header-solo";
                //         else return "div-header";
                //     })
                //     .text(node => {
                //         if (node.data.type == "RA" || node.data.type == "CA")
                //             return node.data.text;
                //         else return `Arg Node ${node.data.id}`;
                //     });

                div
                    .filter(node => node.data.type != "RA")
                    .append("xhtml:div")
                    .attr("class", "div-content")
                    .text(node => {
                        // console.log(node.data);
                        return node.data.text
                    });

                const links = tree.links();
                // console.log(links)
                const linkSel = svgG
                    .selectAll("path.link")
                    .data(links, link => link.target.id);
                const linkEnter = linkSel.enter();

                const linkPath = d3.linkVertical();
                linkPath.target(link => {
                    const srcNode = link.source;
                    return [srcNode.x, srcNode.y + boxYSize(srcNode) + 10];
                });
                linkPath.source(link => {
                    const trgNode = link.target;
                    return [trgNode.x, trgNode.y];
                });
                linkEnter
                    .append("path")
                    .attr("class", "link")
                    .attr("d", linkPath)
                    .attr("fill", "none")
                    .attr("stroke", link => {
                        let u = this.document.annotations.links.find(el => el.from == link.target.data.id)
                        if (u.type === "SUPPORT")
                            return this.configs.Support_Link_Color;

                        if (u.type === "AGAINST")
                            return this.configs.Against_Link_Color;

                    })
                    .attr("stroke-width", 2)
                    .attr("marker-end", link => {
                        let u = this.document.annotations.links.find(el => el.from == link.target.data.id);
                        return `url(#arrow_${u.id})`
                    })
                    .on("mouseover", link => {
                        let u = this.document.annotations.links.find(el => el.from == link.target.data.id)
                        // console.log(link)
                    eventBus.$emit("showArcTooltip", u.type)
                })
                .on("mouseout", link=> {
                    eventBus.$emit("hideArcTooltip", null)
                });

                const extents = tree.extents;
                const treeWidth = extents.right - extents.left;
                const treeHeight = extents.bottom - extents.top;
                const sX = defaults.svg.width / treeWidth;
                const sY = defaults.svg.height / treeHeight;
                const scale = Math.min(1, sX, sY);
                svgG.attr(
                    "transform",
                    `translate(${-scale * extents.left}), scale(${scale})`
                );

                var g_el = document.getElementById(`g-el-${index}`);

                svg.attr("width", g_el.getBoundingClientRect().width)
                    .attr("height", g_el.getBoundingClientRect().height);
            });
        }
    },
    watch: {
        // document_id: {
        //     async handler(newVal, oldVal) {
        //         // this.document = await this.documents.find((doc) => doc._id === newVal);
        //     },
        //     deep: true,
        // },
        document: {
            async handler(newVal, oldVal) {
                // eventBus.$emit("highlightDocument", event, newVal._id);
                // console.log("hey")

                // await this.prepareDataForMap(newVal);
                // this.drawMap()

                // eventBus.$emit("selectDocument", newVal._id);
            },
            deep: true,
        },
        documents: {
            async handler(newVal, oldVal) {
                this.docs = newVal
            },
            deep: true,
        },
        component_width() {
            // console.log("map width changed");
            this.drawMap()
        },
        component_height() {
            // console.log("map height changed");
            this.drawMap()
        },
    },
};

export default mapComponent;