import eventBus from "../eventBus.js";

var positioningComponent = {
    template: `
    <div v-if="configs" class="positioning-component">
        <p v-if="document==null" style="color:orange;">** No Document **</p>
        <div v-if="configs.showDocumentTitle && document!=null" class="positioning-title">
            <p>{{document.title}}</p>
        </div>
        <div id="positioning-body" v-if="document!=null" class="positioning-body">
            <div v-if="configs.Show_Filters" class="filter-positioning">
            
                <p>Number of arguments supporting/against </p>

                <select id="first_select" v-model="first_filter">
                    <option disabled value="">Filter by:</option>
                    <option value="SPEAKER">Speaker</option>
                    <option v-for="key in document.attributes_keys" :value="key">{{key}}</option>
                </select>

                <select id="second_select" v-model="second_filter">
                    <option disabled value="">Choose one:</option>
                    <option v-for="val in second_options" :value="val">{{val}}</option>
                </select>

                
            </div>
        
            <div id="positioning-body-to-svg" class="positioning-body-to-svg"></div>

            <div><button @click="resetFilters()">Reset filters</button></div>
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
            position: "SUPPORT",
            plot_data1: null,
            plot_data2: null,
            selected_docs_: [],
            first_filter: "",
            second_filter: "",
            second_options: "",
            speakers: [],
            filters: [],
            titles: [],
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
                        this.titles.push(_doc.title)

                        this.document.attributes_keys = []
                        this.document.attributes = []
                        this.document.speakers.forEach(spk => {
                            spk.attributes.forEach(attr => {
                                Object.keys(attr).forEach(key => {
                                    if (!this.document.attributes_keys.includes(key)) {
                                        this.document.attributes_keys.push(key)
                                    }
                                })
                            })
                        })


                        this.document.attributes_keys.forEach(key => {
                            this.document.speakers.forEach(spk => {
                                if (this.document.attributes == []) {
                                    this.document.attributes.push({
                                        "key": key,
                                        "values": [spk.attributes[0][key]]
                                    })
                                } else {
                                    let count = 0
                                    this.document.attributes.forEach(attr => {
                                        if (attr.key == key && spk.attributes[0][key] != "NULL") {
                                            attr.values.push(spk.attributes[0][key])
                                            count++
                                        }
                                    })

                                    if (count == 0 && spk.attributes[0][key] != "NULL") {
                                        this.document.attributes.push({
                                            "key": key,
                                            "values": [spk.attributes[0][key]]
                                        })
                                    }
                                }
                            })
                        })
                    } else {
                        this.titles.push(_doc.title)
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

                        this.document.attributes_keys = []
                        this.document.attributes = []
                        this.document.speakers.forEach(spk => {
                            spk.attributes.forEach(attr => {
                                Object.keys(attr).forEach(key => {
                                    if (!this.document.attributes_keys.includes(key)) {
                                        this.document.attributes_keys.push(key)
                                    }
                                })
                            })
                        })


                        this.document.attributes_keys.forEach(key => {
                            this.document.speakers.forEach(spk => {
                                if (this.document.attributes == []) {
                                    this.document.attributes.push({
                                        "key": key,
                                        "values": [spk.attributes[0][key]]
                                    })
                                } else {
                                    let count = 0
                                    this.document.attributes.forEach(attr => {
                                        if (attr.key == key && spk.attributes[0][key] != "NULL") {
                                            attr.values.push(spk.attributes[0][key])
                                            count++
                                        }
                                    })

                                    if (count == 0 && spk.attributes[0][key] != "NULL") {
                                        this.document.attributes.push({
                                            "key": key,
                                            "values": [spk.attributes[0][key]]
                                        })
                                    }
                                }
                            })
                        })


                        this.document.boundaries.push(this.document.body.length);

                        this.document.body += "\n\n" + _doc.body;
                    }
                });

                this.speakers = []
                this.document.speakers.forEach(spk => {
                    this.speakers.push(spk.name)
                })

                this.$nextTick(() => {
                    this.prepareData(this.document);
                    this.drawPositioning();
                });
            })
        });
        

        eventBus.$on("selectSpeaker", (speaker_id,vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = speaker_id;
                this.clicked.type = "SPEAKER";

                let elements = document.querySelectorAll("[class=positioning-circle]");
                elements.forEach((el) => {
                    if (el.getAttribute("speaker_id") == speaker_id) {
                        el.style.fill = this.configs.Circle_Color_Highlighted;
                        el.setAttribute("r", this.configs.Circle_Radius_Highlighted)
                    }
                    else {
                        el.style.fill = this.configs.Circle_Color;
                        el.setAttribute("r", this.configs.Circle_Radius)
                    }
                });
            }
        });

        eventBus.$on("deselectSpeaker", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = document.querySelectorAll("[class=positioning-circle]");
                elements.forEach((el) => {
                    if (el.getAttribute("speaker_id") == this.clicked.id) {
                        el.style.fill = this.configs.Circle_Color;
                        el.setAttribute("r", this.configs.Circle_Radius)
                    } 
                });

                this.clicked.id = null;
                this.clicked.type = null;
            }
        });

        eventBus.$on("selectTopic", (topic, vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = topic;
                this.clicked.type = "TOPIC";

                let speakers = [];
                this.document.annotations.nodes.forEach((node) => {
                    if (node.topics.includes(topic)) speakers.push(node.speaker_id);
                });

                let elements = Array.from(
                    document.querySelectorAll("[class=positioning-circle]")
                );
                elements.forEach((el) => {
                    if (speakers.includes(el.getAttribute("speaker_id"))) {
                        el.style.fill = this.configs.Circle_Color_Highlighted;
                        el.setAttribute("r", this.configs.Circle_Radius_Highlighted)
                    } else {
                        el.style.fill = this.configs.Circle_Color;
                        el.setAttribute("r", this.configs.Circle_Radius)
                    }
                });
            }
        });

        eventBus.$on("deselectTopic", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = Array.from(
                    document.querySelectorAll("[class=positioning-circle]")
                );
                elements.forEach((el) => {
                    el.style.fill = this.configs.Circle_Color;
                    el.setAttribute("r", this.configs.Circle_Radius)
                });

                this.clicked.id = null;
                this.clicked.type = null;
            }
        });

        eventBus.$on("hoverSpeaker", (speaker_id, component, positioning) => {
            if (component.$el == this.$el && this.configs.Show_Tooltips) {
                this.tooltip = d3
                    .select("#" + component.$el.getAttribute("id"))
                    .append("div")
                    .attr("class", "d3-tip")
                    .attr("v-if", "showTooltip");

                let speaker = this.document.speakers.find(
                    (spk) => spk.id == speaker_id
                );

                let speaker_plot = null;
                if (positioning == "SUPPORT")
                    speaker_plot = this.plot_data1.find(
                        (spk) => spk.speaker_id == speaker_id
                    );
                else if (positioning == "AGAINST")
                    speaker_plot = this.plot_data2.find(
                        (spk) => spk.speaker_id == speaker_id
                    );

                let pos = "";
                positioning == "SUPPORT" ? (pos = "Supporting") : (pos = "Opposing");

                this.tooltip
                    .html(
                        "<p></p><b>Speaker: </b>" +
                        speaker.name +
                        "</p><p><b>Nr of " +
                        pos +
                        " Arguments: </b> " +
                        speaker_plot.total +
                        "</p>"
                    )
                    .style("left", d3.event.pageX + 15 + "px")
                    .style("top", d3.event.pageY - 30 + "px");

                this.showTooltip = true;
            }
        });
        eventBus.$on("leaveSpeaker", (component) => {
            if (component.$el == this.$el && this.configs.Show_Tooltips) {
                this.tooltip.remove();

                this.showTooltip = false;
            }
        });

        eventBus.$on("selectNode", (node, vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = node.id;
                this.clicked.type = "NODE";
                this.clicked.node = node;

                let elements = document.querySelectorAll("[class=positioning-circle]");
                elements.forEach((el) => {
                    if (el.getAttribute("speaker_id") == node.speaker_id) {
                        el.style.fill = this.configs.Circle_Color_Highlighted;
                        el.setAttribute("r", this.configs.Circle_Radius_Highlighted)
                    } 
                    else {
                        el.style.fill = this.configs.Circle_Color;
                        el.setAttribute("r", this.configs.Circle_Radius)
                    }
                });
            }
        });

        eventBus.$on("deselectNode", (vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = document.querySelectorAll("[class=positioning-circle]");
                elements.forEach((el) => {
                    el.style.fill = this.configs.Circle_Color;
                    el.setAttribute("r", this.configs.Circle_Radius)
                });

                this.clicked.id = null;
                this.clicked.type = null;
                this.clicked.node = null;
            }
        });
    },
    async beforeMount() {
        let configs = await import("./../../config_files/" + this.config.file);
        this.configs = configs.default;
        // this.position = this.configs.position
    },
    mounted() {},
    methods: {
        selectDocument(doc_id) {
            eventBus.$emit("selectDocument", doc_id);
        },
        clickSpeaker(speaker_id) {
            if (this.clicked.id == null || this.clicked.type != "SPEAKER")
                eventBus.$emit("selectSpeaker", speaker_id, this);
            else if (this.clicked.id == speaker_id) eventBus.$emit("deselectSpeaker", this);
            else {
                eventBus.$emit("deselectSpeaker", this);
                eventBus.$emit("selectSpeaker", speaker_id, this);
            }
        },
        prepareData() {
            this.plot_data1 = [];
            this.plot_data2 = [];

            this.document.speakers.forEach(spk => {
                let obj = {
                    speaker_id: spk.id,
                    speakers: [],
                    total: 0,
                };
                this.plot_data1.push(JSON.parse(JSON.stringify(obj)));
                this.plot_data2.push(JSON.parse(JSON.stringify(obj)));
            })

            this.document.annotations.links.forEach((link) => {
                if (link.type == this.position) {
                    let from_node = this.document.annotations.nodes.find(
                        (node) => node.id == link.from
                    );
                    let to_node = this.document.annotations.nodes.find(
                        (node) => node.id == link.to
                    );

                    let _el = null;
                    _el = this.plot_data1.find(
                        (el) => el.speaker_id == from_node.speaker_id
                    );

                    if (_el) {
                        let x = _el.speakers.find((spk => spk.id == to_node.speaker_id));
                        if (x) x.count += 1;
                        else
                            _el.speakers.push({
                                id: to_node.speaker_id,
                                count: 1,
                            });
                        _el.total += 1;
                    } else {
                        let obj = {
                            speaker_id: from_node.speaker_id,
                            speakers: [{
                                id: to_node.speaker_id,
                                count: 1,
                            }, ],
                            total: 1,
                        };
                        this.plot_data1.push(obj);
                    }
                } else {
                    let from_node = this.document.annotations.nodes.find(
                        (node) => node.id == link.from
                    );
                    let to_node = this.document.annotations.nodes.find(
                        (node) => node.id == link.to
                    );

                    let _el = null;
                    _el = this.plot_data2.find(
                        (el) => el.speaker_id == from_node.speaker_id
                    );

                    if (_el) {
                        let x = _el.speakers.find((spk => spk.id == to_node.speaker_id));
                        if (x) x.count += 1;
                        else
                            _el.speakers.push({
                                id: to_node.speaker_id,
                                count: 1,
                            });
                        _el.total += 1;
                    } else {
                        let obj = {
                            speaker_id: from_node.speaker_id,
                            speakers: [{
                                id: to_node.speaker_id,
                                count: 1,
                            }, ],
                            total: 1,
                        };
                        this.plot_data2.push(obj);
                    }
                }
            });

            this.plot_data1 = this.plot_data1.filter(element => element.total>0);
            this.plot_data2 = this.plot_data2.filter(element => element.total>0);
            // console.log(this.plot_data1)
        },
        prepareDataWithFilters() {
            this.plot_data1 = [];
            this.plot_data2 = [];

            this.document.speakers.forEach(spk => {
                let obj = {
                    speaker_id: spk.id,
                    speakers: [],
                    total: 0,
                };
                this.plot_data1.push(JSON.parse(JSON.stringify(obj)));
                this.plot_data2.push(JSON.parse(JSON.stringify(obj)));
            })

            this.document.annotations.links.forEach((link) => {
                if (link.type == this.position) {
                    let from_node = this.document.annotations.nodes.find(
                        (node) => node.id == link.from
                    );
                    let to_node = this.document.annotations.nodes.find(
                        (node) => node.id == link.to
                    );

                    if (this.first_filter == "SPEAKER") {
                        let _el = null;
                        _el = this.plot_data1.find(
                            (el) => el.speaker_id == from_node.speaker_id
                        );

                        let filter_speaker = this.document.speakers.find(spk => spk.name == this.second_filter)
                        if (to_node.speaker_id == filter_speaker.id)
                            _el.total++  
                    } else {
                        let _el = null;
                        _el = this.plot_data1.find(
                            (el) => el.speaker_id == from_node.speaker_id
                        );
                        let node_speaker = this.document.speakers.find(spk => spk.id == to_node.speaker_id)

                        if (node_speaker.attributes[0][this.first_filter] == this.second_filter) {
                            _el.total++
                        }
                            
                    }
                    
                } else {
                    let from_node = this.document.annotations.nodes.find(
                        (node) => node.id == link.from
                    );
                    let to_node = this.document.annotations.nodes.find(
                        (node) => node.id == link.to
                    );

                    if (this.first_filter == "SPEAKER") {
                        let _el = null;
                        _el = this.plot_data2.find(
                            (el) => el.speaker_id == from_node.speaker_id
                        );

                        let filter_speaker = this.document.speakers.find(spk => spk.name == this.second_filter)
                        if (to_node.speaker_id == filter_speaker.id)
                            _el.total++  
                    } else {
                        let _el = null;
                        _el = this.plot_data2.find(
                            (el) => el.speaker_id == from_node.speaker_id
                        );
                        let node_speaker = this.document.speakers.find(spk => spk.id == to_node.speaker_id)

                        if (node_speaker.attributes[0][this.first_filter] == this.second_filter) {
                            _el.total++
                        }
                            
                    }
                }
                
            });

            this.plot_data1 = this.plot_data1.filter(element => element.total>0);
            this.plot_data2 = this.plot_data2.filter(element => element.total>0);
            
        },
        drawPositioning() {
            this.$nextTick(() => {
                if (document.getElementById("positioning-svg1"))
                    document.getElementById("positioning-svg1").remove();
                if (document.getElementById("positioning-title1"))
                    document.getElementById("positioning-title1").remove();
                if (document.getElementById("positioning-svg2"))
                    document.getElementById("positioning-svg2").remove();
                if (document.getElementById("positioning-title2"))
                    document.getElementById("positioning-title2").remove();

                let height =
                    document.getElementById("positioning-body-to-svg").offsetHeight / 4;
                let width =
                    document.getElementById("positioning-body-to-svg").offsetWidth - 40;

                /*--------------------

                            SUPPORT SECTION

                        ---------------------*/

                d3.select("#positioning-body-to-svg")
                    .append("div")
                    .attr("id", "positioning-title1")
                    .attr("width", "100%")
                    .attr("height", "25%")
                    .append("p")

                    .html("Supporting")
                    .attr("margin", "auto");

                let svg1 = d3
                    .select("#positioning-body-to-svg")
                    .append("svg")
                    .attr("id", "positioning-svg1")
                    .attr("width", width)
                    .attr("height", height +10)
                    .attr("margin", "auto")
                    .attr("display", "block");

                let rect_height = 2;

                svg1
                    .append("rect")
                    .attr("x", 10)
                    .attr("y", height / 2 - this.configs.Rect_Height / 2)
                    .attr("width", width)
                    .attr("height", this.configs.Rect_Height)
                    .attr("fill", this.configs.Rect_Color);

                let total_max = 0;
                this.plot_data1.forEach((data) => {
                    if (data.total > total_max) total_max = data.total;
                });

                let total_max2 = 0;
                this.plot_data2.forEach((data) => {
                    if (data.total > total_max2) total_max2 = data.total;
                });

                let the_max = 0;
                total_max > total_max2 ? the_max = total_max : the_max = total_max2;

                // if (this.configs.Show_Labels) {
                    svg1
                        .append("text")
                        .attr("x",16)
                        .attr("y", height / 2 + 23)
                        .attr("font-size", "14px")
                        .attr("font-family", "Roboto")
                        .attr("font-weight", "bold")
                        .attr("color", "#102e4a")
                        .text("0");

                    svg1
                        .append("text")
                        .attr("id", "text-max")
                        .attr("x", width - 23)
                        .attr("y", height / 2 + 23)
                        .attr("font-size", "14px")
                        .attr("font-family", "Roboto")
                        .attr("font-weight", "bold")
                        .attr("color", "#102e4a")
                        // .text("+")
                        .text(the_max);
                // }
                

                function axis(scale) {
                    return Object.assign(d3.axisBottom(scale.range([20, width - 20])), {
                        render() {
                            return d3
                                .create("svg")
                                .attr("viewBox", [0, -10, width, 33])
                                .call(this)
                                .node();
                        },
                    });
                }

                var x = d3.scaleLinear().domain([0, the_max]).range([0, width]);

                axis(x).ticks(1).render();

                // Add brushing
                // var brush = d3.brushX() // Add the brush feature using the d3.brush function
                //     .extent([
                //         [0, 0],
                //         [width, height]
                //     ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
                //     .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

                // // Add the brushing
                // svg
                //     .append("g")
                //     .attr("class", "brush")
                //     .call(brush);

                // A function that set idleTimeOut to null
                var idleTimeout;

                function idled() {
                    idleTimeout = null;
                }

                // A function that update the chart for given boundaries
                function updateChart() {
                    let extent = d3.event.selection;

                    // If no selection, back to initial coordinate. Otherwise, update X axis domain
                    if (!extent) {
                        if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350)); // This allows to wait a little bit
                        x.domain([0, the_max]);
                    } else {
                        x.domain([x.invert(extent[0]), x.invert(extent[1])]);
                        svg.select(".brush").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
                    }

                    // Update axis and circle position
                    svg
                        .selectAll("circle")
                        .transition()
                        .duration(1000)
                        .attr("cx", (d) => x(d.total))
                        .attr("cy", height / 2);
                }

                

                svg1
                    .selectAll("circle")
                    .data(this.plot_data1)
                    .enter()
                    .append("circle")
                    .attr("class", "positioning-circle")
                    .attr("positioning", "SUPPORT")
                    .attr("speaker_id", (d) => d.speaker_id)
                    .attr("cx", (d) => x(d.total))
                    .attr("cy", height / 2)
                    .attr("r", this.configs.Circle_Radius)
                    .attr("fill", this.configs.Circle_Color)
                    .on("mouseover", (d) =>
                        eventBus.$emit("hoverSpeaker", d.speaker_id, this, "SUPPORT")
                    )
                    .on("mouseout", (d) => {
                        eventBus.$emit("leaveSpeaker", this);
                    })
                    .on("click", (d) => {
                        this.clickSpeaker(d.speaker_id);
                    });

                /*--------------------

                            AGGAINST SECTION

                        ---------------------*/

                d3.select("#positioning-body-to-svg")
                    .append("div")
                    .attr("id", "positioning-title2")
                    .attr("width", "100%")
                    .attr("height", "25%")
                    .append("p")
                    .html("Against")
                    .attr("margin", "auto");

                let svg2 = d3
                    .select("#positioning-body-to-svg")
                    .append("svg")
                    .attr("id", "positioning-svg2")
                    .attr("width", width)
                    .attr("height", height + 10)
                    .attr("margin", "auto")
                    .attr("display", "block");

                svg2
                    .append("rect")
                    .attr("x", 10)
                    .attr("y", height / 2 - this.configs.Rect_Height / 2)
                    .attr("width", width)
                    .attr("height", this.configs.Rect_Height)
                    .attr("fill", this.configs.Rect_Color);



                // if (this.configs.Show_Labels) {
                    svg2
                        .append("text")
                        .attr("x", 16)
                        .attr("y", height / 2 + 23)
                        .attr("font-size", "14px")
                        .attr("font-family", "Roboto")
                        .attr("font-weight", "bold")
                        .attr("color", "#102e4a")
                        .text("0");

                    svg2
                        .append("text")
                        .attr("id", "text-max")
                        .attr("x", width - 23)
                        .attr("y", height / 2 + 23)
                        .attr("font-size", "14px")
                        .attr("font-family", "Roboto")
                        .attr("font-weight", "bold")
                        .attr("color", "#102e4a")
                        .text(the_max);
                    // .text("+");
                // }

                function axis(scale) {
                    return Object.assign(d3.axisBottom(scale.range([20, width - 20])), {
                        render() {
                            return d3
                                .create("svg")
                                .attr("viewBox", [0, -10, width, 33])
                                .call(this)
                                .node();
                        },
                    });
                }

                var x = d3.scaleLinear().domain([0, the_max]).range([0, width]);

                axis(x).ticks(1).render();

                // Add brushing
                // var brush = d3.brushX() // Add the brush feature using the d3.brush function
                //     .extent([
                //         [0, 0],
                //         [width, height]
                //     ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
                //     .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

                // // Add the brushing
                // svg
                //     .append("g")
                //     .attr("class", "brush")
                //     .call(brush);

                // A function that set idleTimeOut to null
                var idleTimeout;

                function idled() {
                    idleTimeout = null;
                }

                // A function that update the chart for given boundaries
                function updateChart() {
                    let extent = d3.event.selection;

                    // If no selection, back to initial coordinate. Otherwise, update X axis domain
                    if (!extent) {
                        if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350)); // This allows to wait a little bit
                        x.domain([0, the_max]);
                    } else {
                        x.domain([x.invert(extent[0]), x.invert(extent[1])]);
                        svg.select(".brush").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
                    }

                    // Update axis and circle position
                    svg
                        .selectAll("circle")
                        .transition()
                        .duration(1000)
                        .attr("cx", (d) => x(d.total))
                        .attr("cy", height / 2);
                }

                svg2
                    .selectAll("circle")
                    .data(this.plot_data2)
                    .enter()
                    .append("circle")
                    .attr("class", "positioning-circle")
                    .attr("positioning", "AGAINST")
                    .attr("speaker_id", (d) => d.speaker_id)
                    .attr("cx", (d) => x(d.total))
                    .attr("cy", height / 2)
                    .attr("r", this.configs.Circle_Radius)
                    .attr("fill", this.configs.Circle_Color)
                    .on("mouseover", (d) =>
                        eventBus.$emit("hoverSpeaker", d.speaker_id, this, "AGAINST")
                    )
                    .on("mouseout", (d) => {
                        eventBus.$emit("leaveSpeaker", this);
                    })
                    .on("click", (d) => {
                        this.clickSpeaker(d.speaker_id);
                    });
            });
        },
        resetFilters() {
            this.prepareData()
            this.drawPositioning()
            document.querySelector("#first_select").selectedIndex =0
            document.querySelector("#second_select").selectedIndex =0
        }
    },
    watch: {
        documents: {
            async handler(newVal, oldVal) {
                this.docs = newVal;
            },
            deep: true,
        },
        component_width() {
            // console.log("positioning width changed");
            this.drawPositioning();
        },
        component_height() {
            // console.log("positioning height changed");
            this.drawPositioning();
        },
        position() {
            this.prepareData();
            this.drawPositioning();
        },
        first_filter(newVal, oldVal) {
            if (newVal == "SPEAKER") this.second_options = this.speakers
            else if (newVal == "TOPIC") this.second_options = this.document.topics
            else if (newVal == "title") this.second_options = this.titles
            else {
                let x = this.document.attributes.filter(attr => attr.key == newVal)
                this.second_options = [...new Set([
                    ...x[0].values
                ])]
            }
        },
        second_filter(newVal, oldVal) {
            // console.log("hey")
            this.prepareDataWithFilters();
            this.drawPositioning();
        }
    },
};

export default positioningComponent;