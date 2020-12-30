import eventBus from "../eventBus.js";

let minimapComponent = {
    template: `
    <div v-if="configs" class="minimap-component">
        <p v-if="document==null" style="color:orange;">** No Document **</p>
        <div v-if="document!=null" id="minimap-body" class="minimap-body">
            <!-- <svg width="100%" height="100%"></svg> -->
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
            docs: null,
            configs: null,
            component_width: null,
            component_height: null,
            speakers: null,
            showTooltip: false,
            tooltip: null,
            selected_speaker: null,
            selected_node: null,
            clicked: {
                id: null,
                type: null,
                node: null,
            },
            selected_docs_: [],
            highlighted:[]
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
                    this.drawMinimap();
                });

                 var erd = elementResizeDetectorMaker();
                var comp = this

                erd.listenTo(this.$el, function(element) {
                    // var width = element.offsetWidth;
                    // var height = element.offsetHeight;
                    if (comp.document != null) {
                        comp.drawMinimap()
                    }
                });
            })
        });


        // eventBus.$on("updateSpeakers", (speakers) => {
        //     this.speakers = speakers;
        //     // console.log(this.speakers)
        // });

        eventBus.$on("selectSpeaker", (speaker_id, vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = speaker_id;
                this.clicked.type = "SPEAKER";

                this.highlighted=[]

                let elements = document.querySelectorAll("[class=minimap-circle]");
                elements.forEach((el) => {
                    if (el.getAttribute("speaker_id") == speaker_id) {
                        this.highlighted.push(el.getAttribute("node_id"))
                        el.style.fill = this.configs.Circle_Highlight_Color;
                    }
                    else {
                        el.style.fill = this.configs.Circle_Color;
                    }
                });
            }
        });
        eventBus.$on("deselectSpeaker", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = document.querySelectorAll("[class=minimap-circle]");
                elements.forEach((el) => {
                    if (el.getAttribute("speaker_id") == this.clicked.id)
                        el.style.fill = this.configs.Circle_Color;
                });

                this.clicked.id = null;
                this.clicked.type = null;
                this.highlighted=[]
            }
        });

        eventBus.$on("selectTopic", (topic, vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = topic;
                this.clicked.type = "TOPIC";

                this.highlighted=[]

                let nodes = [];
                this.document.annotations.nodes.forEach((node) => {
                    if (node.topics.includes(topic)) nodes.push(node.id);
                });

                let elements = Array.from(
                    document.querySelectorAll("[class=minimap-circle]")
                );
                elements.forEach((el) => {
                    if (nodes.includes(el.getAttribute("node_id"))) {
                        this.highlighted.push(el.getAttribute("node_id"))
                        el.style.fill = this.configs.Circle_Highlight_Color;
                    } else {
                        el.style.fill = this.configs.Circle_Color;
                    }
                });
            }
        });
        eventBus.$on("deselectTopic", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = Array.from(
                    document.querySelectorAll("[class=minimap-circle]")
                );
                elements.forEach((el) => {
                    el.style.fill = this.configs.Circle_Color;
                });

                this.clicked.id = null;
                this.clicked.type = null;
                this.highlighted=[]
            }
        });

        eventBus.$on("hoverNode", (node, component) => {
            if (component.$el == this.$el && this.configs.Show_Tooltip_On_Hover_Node) {
                this.tooltip =  d3.select("body").append("div")
                    .append("div")
                    .attr("class", "d3-tip")
                    .attr("v-if", "showTooltip");

                let speaker_name = this.document.speakers.find(
                    (spk) => spk.id == node.speaker_id
                ).name;

                let doc = this.documents.filter(_doc => _doc.annotations.nodes.filter(_node => _node.id == node.id).length > 0)

                this.tooltip
                    .html(
                        "<p></p><b>Document: </b>" +
                        String(doc[0].title) +
                        "<p></p><b>Speaker: </b>" +
                        String(speaker_name) +
                        "</p><p></p><b>Topic: </b> " +
                        String(node.topics) +
                        "</p>"
                    )
                    .style("left", d3.event.pageX + 15 + "px")
                    .style("top", d3.event.pageY - 30 + "px");

                this.showTooltip = true;
            }

            // let elements = document.querySelectorAll('[class=minimap-circle]');
            // elements.forEach(el => {
            //     if (el.getAttribute("node_id") == node.id)
            //         el.setAttribute("r", el.getAttribute("r") * 1.3)
            // })

            // // if (this.selected_speaker == node.speaker_id) {
            // //     let elements = document.querySelectorAll('[class=minimap-circle]');
            // //     elements.forEach(el => {
            // //         if (el.getAttribute("node_id") == node.id)
            // //             el.setAttribute("r", el.getAttribute("r") * 1.3)
            // //     })
            // // } else {
            // //     let elements = document.querySelectorAll('[class=minimap-circle]');
            // //     elements.forEach(el => {
            // //         if (el.getAttribute("node_id") == node.id)
            // //             el.setAttribute("r", el.getAttribute("r") * 1.3)
            // //         if (el.getAttribute("speaker_id") == node.speaker_id)
            // //             el.style.fill = "rgba(114,188,212,0.7)"
            // //     })
            // // }
        });
        eventBus.$on("leaveNode", (component) => {
            if (component.$el == this.$el && this.configs.Show_Tooltip_On_Hover_Node) {
                this.tooltip.remove();

                this.showTooltip = false;
            }

            // let elements = document.querySelectorAll('[class=minimap-circle]');
            // elements.forEach(el => {
            //     if (el.getAttribute("node_id") == node.id)
            //         el.setAttribute("r", el.getAttribute("r") / 1.3)
            // })

            // // if (this.selected_speaker != node.speaker_id) {
            // //     let elements = document.querySelectorAll('[class=minimap-circle]');
            // //     elements.forEach(el => {
            // //         if (el.getAttribute("speaker_id") == node.speaker_id) {
            // //             el.style.fill = "rgba(16, 46, 74,0.7)"
            // //         }
            // //     })
            // // }

            // // if (this.selected_node) {
            // //     let elements = document.querySelectorAll('[class=minimap-circle]');
            // //     elements.forEach(el => {
            // //         if (el.getAttribute("speaker_id") == this.selected_node.speaker_id) {
            // //             el.style.fill = "rgba(255, 105, 180,0.7)"
            // //         }
            // //     })
            // // }
        });

        eventBus.$on("selectNode", (node,vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = node.id;
                this.clicked.type = "NODE";
                this.clicked.node = node;

                this.highlighted=[]

                let elements = document.querySelectorAll("[class=minimap-circle]");
                elements.forEach((el) => {
                    if (el.getAttribute("node_id") == node.id) {
                        this.highlighted.push(el.getAttribute("node_id"))
                        el.style.fill = this.configs.Circle_Highlight_Color;
                    } else {
                        el.style.fill = this.configs.Circle_Color;
                    }
                });
            }
        });
        eventBus.$on("deselectNode", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = document.querySelectorAll("[class=minimap-circle]");
                elements.forEach((el) => {
                    el.style.fill = this.configs.Circle_Color;
                });

                this.clicked.id = null;
                this.clicked.type = null;
                this.clicked.node = null;
                this.highlighted=[]
            }
        });
    },
    async beforeMount() {
        let configs = await import("./../../config_files/" + this.config.file);
        this.configs = configs.default;
    },
    mounted() {},
    methods: {
        selectDocument(doc_id) {
            eventBus.$emit("selectDocument", doc_id);
        },
        clickNode(node) {
            if (this.clicked.id == null || this.clicked.type != "NODE")
                eventBus.$emit("selectNode", node, this);
            else if (this.clicked.id == node.id) eventBus.$emit("deselectNode", this);
            else {
                eventBus.$emit("deselectNode", this);
                eventBus.$emit("selectNode", node, this);
            }
        },
        drawMinimap() {
            this.$nextTick(() => {

                if (document.getElementById("minimap-svg"))
                    document.getElementById("minimap-svg").remove();

                let padding = 10;

                let height = document.getElementById("minimap-body").offsetHeight - padding * 2;
                let width =
                    document.getElementById("minimap-body").offsetWidth - padding * 2;

                // let showArcs = this.configs.showArcs;

                let extra_height = 0;
                // showArcs ? (extra_height = 15) : null;


                let svg = d3
                    .select("#minimap-body")
                    .append("svg")
                    .attr("id", "minimap-svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("margin", "auto")
                    .attr("display", "block");

                let rect_width = this.configs.Rect_Size;

                svg.append("rect")
                    .attr("y", 0)
                    .attr("x", width / 2 - rect_width / 2 + extra_height)
                    .attr("width", rect_width)
                    .attr("height", height)
                    .attr("fill", this.configs.Rect_Color);

                let body_length = this.document.body.length;

                let y = d3.scaleLinear().domain([0, body_length]).range([0, height]);

                svg
                    .selectAll("line")
                    .data(this.document.boundaries)
                    .enter()
                    .append("line")
                    .attr("y1", (d) => {
                        return y(d);
                    }) //<<== change your code here
                    .attr("x1", 10)
                    .attr("y2", (d) => {
                        return y(d);
                    }) //<<== and here
                    .attr("x2", width - 10)
                    .style("stroke-width", this.configs.Documents_Division_Size)
                    .style("stroke", this.configs.Documents_Division_Color)
                    .style("stroke-dasharray", "3, 3")
                    .style("fill", "none");

                // Add brushing
                    let brush = d3
                        .brushY() // Add the brush feature using the d3.brush function
                        .extent([
                            [0, 0],
                            [width, height],
                        ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
                    .on("end", updateChart); // Each time the brush selection changes, trigger the 'updateChart' function
                
                
                if (this.configs.Allow_Brushing) {
                    // Add the brushing
                    svg.append("g").attr("class", "brush").call(brush);
                }
                

                // A function that set idleTimeOut to null
                let idleTimeout;

                function idled() {
                    idleTimeout = null;
                }

                // A function that update the chart for given boundaries
                function updateChart() {
                    let extent = d3.event.selection;

                    // If no selection, back to initial coordinate. Otherwise, update X axis domain
                    if (!extent) {
                        if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350)); // This allows to wait a little bit
                        y.domain([0, body_length]);
                    } else {
                        y.domain([y.invert(extent[0]), y.invert(extent[1])]);
                        svg.select(".brush").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
                    }

                    // Update axis and circle position
                    svg
                        .selectAll("circle")
                        .transition()
                        .duration(1000)
                        .attr("cy", (d) => {
                            return y((d.ranges[0] + d.ranges[1]) / 2);
                        })
                        .attr("cx", width / 2 + extra_height);

                    svg
                        .selectAll("line")
                        .transition()
                        .duration(1000)
                        .attr("y1", (d) => {
                            return y(d);
                        })
                        .attr("x1", 10)
                        .attr("y2", (d) => {
                            return y(d);
                        })
                        .attr("x2", width - 10);

                    // if (showArcs) {
                    //     svg
                    //         .selectAll("path.arc")
                    //         .transition()
                    //         .duration(1000)
                    //         .attr("d", (d) => {
                    //             let source_node = this.document.annotations.nodes.find(
                    //                 (node) => node.id == d.from
                    //             );
                    //             let target_node = this.document.annotations.nodes.find(
                    //                 (node) => node.id == d.to
                    //             );

                    //             let source_x = x(
                    //                 (source_node.ranges[0] + source_node.ranges[1]) / 2
                    //             );
                    //             let target_x = x(
                    //                 (target_node.ranges[0] + target_node.ranges[1]) / 2
                    //             );
                    //             let high = height / 2 - 30;
                    //             return (
                    //                 "M" +
                    //                 source_x +
                    //                 "," +
                    //                 height / 2 +
                    //                 "C" +
                    //                 source_x +
                    //                 "," +
                    //                 high +
                    //                 " " +
                    //                 target_x +
                    //                 "," +
                    //                 high +
                    //                 " " +
                    //                 target_x +
                    //                 "," +
                    //                 height / 2
                    //             );
                    //         });
                    // }
                }

                // if (showArcs) {
                //     svg
                //         .selectAll("path.arc")
                //         .data(this.document.annotations.links)
                //         .enter()
                //         .append("svg:path")
                //         .attr("class", "arc")
                //         .attr("fill", "none")
                //         .attr("stroke", (d) => {
                //             let x = "black";
                //             d.type == "SUPPORT" ? (x = "green") : (x = "red");
                //             return x;
                //         })
                //         .attr("stroke-width", "2")
                //         .attr("d", (d) => {
                //             let source_node = this.document.annotations.nodes.find(
                //                 (node) => node.id == d.from
                //             );
                //             let target_node = this.document.annotations.nodes.find(
                //                 (node) => node.id == d.to
                //             );

                //             let source_x = x(
                //                 (source_node.ranges[0] + source_node.ranges[1]) / 2
                //             );
                //             let target_x = x(
                //                 (target_node.ranges[0] + target_node.ranges[1]) / 2
                //             );
                //             let high = height / 2 - 30;
                //             return (
                //                 "M" +
                //                 source_x +
                //                 "," +
                //                 height / 2 +
                //                 "C" +
                //                 source_x +
                //                 "," +
                //                 high +
                //                 " " +
                //                 target_x +
                //                 "," +
                //                 high +
                //                 " " +
                //                 target_x +
                //                 "," +
                //                 height / 2
                //             );
                //         });
                // }

                svg
                    .selectAll("circle")
                    .data(this.document.annotations.nodes)
                    .enter()
                    .append("circle")
                    .attr("class", "minimap-circle")
                    .attr("node_id", (d) => d.id)
                    .attr("speaker_id", (d) => d.speaker_id)
                    .attr("cy", (d) => {
                        // console.log(d.ranges)
                        // console.log(x(((d.ranges[0] + d.ranges[1]) / 2)))
                        return y((d.ranges[0] + d.ranges[1]) / 2);
                    })
                    .attr("cx", width / 2 + extra_height)
                    .attr("r", d => {
                        // if (this.highlighted.includes(d.id))
                        //     return this.configs.Circle_Highlight_Color
                        return this.configs.Circle_Radius
                    })
                    .attr("fill", (d) => {
                        if (this.highlighted.includes(d.id))
                            return this.configs.Circle_Highlight_Color
                        else
                            return this.configs.Circle_Color;
                    })
                    .on("mouseover", (d) => {
                        eventBus.$emit("hoverNode", d, this);
                    })
                    .on("mouseout", (d) => {
                        eventBus.$emit("leaveNode", this);
                    })
                    .on("click", (d) => {
                        this.clickNode(d);
                    });
            });
        },
    },
    watch: {
        documents(newVal, oldVal) {
            // console.log("changed")
            // this.docs = newVal;
            // console.log(newVal)

        },
        component_width() {
            // console.log("minimap width changed");
            this.drawMinimap();
        },
        component_height() {
            // console.log("minimap height changed");
            this.drawMinimap();
        },
    },
};

export default minimapComponent;