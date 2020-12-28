import eventBus from "../eventBus.js";

var donutComponent = {
    template: `
    <div v-if="configs" class="donut-component">
        <p v-if="document==null" style="color:orange;">** No Document **</p>
        <div v-if="document!=null" class="donut-body" id="donut-body">

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
            data: {},
            component_width: null,
            component_heigth: null,
            showTooltip: false,
            tooltip: null,
            clicked: {
                id: null,
                type: null,
                node: null
            },
            selected_docs_: []
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

                            new_node.ranges[0] += 4 + this.document.body.length;
                            new_node.ranges[1] += 4 + this.document.body.length;
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
                    this.drawChart()
                });
            })
        });

        

        eventBus.$on("selectSpeaker", (speaker_id, vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = speaker_id
                this.clicked.type = "SPEAKER"

                let topics = []
                this.document.annotations.nodes.forEach(node => {
                    if (node.speaker_id == speaker_id) {
                        node.topics.forEach(topic => {
                            topics.push(topic)
                        })
                    }
                })

                let elements = document.querySelectorAll('[class=donut-slice]');
                // console.log(elements)
                elements.forEach(el => {
                    if (topics.includes(el.getAttribute("topic")))
                        el.style.fill = this.configs.Arc_Color_Highlighted
                    else {
                        el.style.fill = this.configs.Arc_Color
                    }
                })

                let elements2 = document.querySelectorAll('[class=donut-label]');
                elements2.forEach(el => {
                    if (topics.includes(el.getAttribute("topic")))
                        el.style.fontWeight = "bold"
                    else {
                        el.style.fontWeight = "normal"
                    }
                })
                this.$nextTick(() => {
                    let elements = document.querySelectorAll('[class=donut-slice]');
                    // console.log(elements)

                })
            }
        })

        eventBus.$on("deselectSpeaker", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = document.querySelectorAll('[class=donut-slice]');
                elements.forEach(el => {
                    el.style.fill = this.configs.Arc_Color
                })

                let elements2 = document.querySelectorAll('[class=donut-label]');
                elements2.forEach(el => {
                    el.style.fontWeight = "normal"
                })

                this.clicked.id = null
                this.clicked.type = null
            }
        })

        eventBus.$on("selectTopic", (topic, vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = topic
                this.clicked.type = "TOPIC"

                let elements = document.querySelectorAll('[class=donut-slice]');
                elements.forEach(el => {
                    if (el.getAttribute("topic") == topic)
                        el.style.fill = this.configs.Arc_Color_Highlighted
                    else {
                        el.style.fill = this.configs.Arc_Color
                    }
                })

                let elements2 = document.querySelectorAll('[class=donut-label]');
                elements2.forEach(el => {
                    if (el.getAttribute("topic") == topic)
                        el.style.fontWeight = "bold"
                    else {
                        el.style.fontWeight = "normal"
                    }
                })
            }
        })

        eventBus.$on("deselectTopic", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = document.querySelectorAll('[class=donut-slice]');
                elements.forEach(el => {
                    el.style.fill = this.configs.Arc_Color
                })

                let elements2 = document.querySelectorAll('[class=donut-label]');
                elements2.forEach(el => {
                    el.style.fontWeight = "normal"
                })

                this.clicked.id = null
                this.clicked.type = null
            }
        })

        eventBus.$on("hoverTopic", (topic, component) => {
            if (component.$el == this.$el && this.configs.Show_Tooltips) {
                this.tooltip = d3.select("#" + component.$el.getAttribute("id")).append("div")
                    .attr("class", "d3-tip")
                    .attr("v-if", "showTooltip")

                this.tooltip.html("<p></p><b>Topic: </b>" + topic.key + "</p>" +
                        "<p><b>Nr. of Arguments: </b> " + topic.value + "</p>")
                    .style("left", (d3.event.pageX + 15) + "px")
                    .style("top", (d3.event.pageY - 30) + "px");

                this.showTooltip = true
            }
        })

        eventBus.$on("leaveTopic", component => {
            if (component.$el == this.$el && this.configs.Show_Tooltips) {
                this.tooltip.remove()

                this.showTooltip = false
            }
        })

        eventBus.$on("selectNode", (node,vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = node.id
                this.clicked.type = "NODE"

                let elements = document.querySelectorAll('[class=donut-slice]');
                elements.forEach(el => {
                    if (node.topics.includes(el.getAttribute("topic")))
                        el.style.fill = this.configs.Arc_Color_Highlighted
                    else {
                        el.style.fill = this.configs.Arc_Color
                    }
                })

                let elements2 = document.querySelectorAll('[class=donut-label]');
                elements2.forEach(el => {
                    if (node.topics.includes(el.getAttribute("topic")))
                        el.style.fontWeight = "bold"
                    else {
                        el.style.fontWeight = "normal"
                    }
                })
            }
        })

        eventBus.$on("deselectNode", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = document.querySelectorAll('[class=donut-slice]');
                elements.forEach(el => {
                    el.style.fill = this.configs.Arc_Color
                })

                let elements2 = document.querySelectorAll('[class=donut-label]');
                elements2.forEach(el => {
                    el.style.fontWeight = "normal"
                })

                this.clicked.id = null
                this.clicked.type = null
            }
        })
    },
    async beforeMount() {
        let configs = await import("./../../config_files/" + this.config.file);
        this.configs = configs.default;
    },
    async mounted() {

    },
    methods: {
        selectDocument(doc_id) {
            eventBus.$emit("selectDocument", doc_id);
        },
        selectTopic(topic) {
            if (this.clicked.id == null || this.clicked.type != "TOPIC")
                eventBus.$emit("selectTopic", topic,this)
            else if (this.clicked.id == topic)
                eventBus.$emit("deselectTopic", this)
            else {
                eventBus.$emit("deselectTopic", this)
                eventBus.$emit("selectTopic", topic, this)
            }
        },
        prepareData() {
            let data = {}

            this.document.annotations.nodes.forEach(node => {
                node.topics.forEach(topic => {
                    if (Object.keys(data).includes(String(topic)))
                        data[String(topic)] += 1
                    else
                        data[String(topic)] = 1
                })
            })


            this.data = data
        },
        drawChart() {
            this.$nextTick(() => {
                if (document.getElementById("donut-svg")) document.getElementById("donut-svg").remove()


                // set the dimensions and margins of the graph
                let width = document.getElementById("donut-body").offsetWidth
                let height = document.getElementById("donut-body").offsetHeight
                let margin = 8

                // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
                var radius = Math.min(width, height) / 2 - margin

                // console.log(radius * 0.8)

                // append the svg object to the div called 'my_dataviz'
                var svg = d3.select("#donut-body")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("id", "donut-svg")

                var container = svg.append("g")
                    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

                // svg.call(
                //     d3.zoom()
                //     .scaleExtent([.1, 4])
                //     .on("zoom", () => {
                //         // console.log("zoom")
                //         console.log(d3.event.transform)
                //         container.attr("transform", d3.event.transform);
                //         // container.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
                //     })
                // );


                // Compute the position of each group on the pie:
                var pie = d3.pie()
                    .sort(null) // Do not sort group by size
                    .value(function (d) {
                        return d.value;
                    })
                var data_ready = pie(d3.entries(this.data))

                // The arc generator
                var arc = d3.arc()
                    .innerRadius(this.configs.Inner_Radius) // This is the size of the donut hole
                    .outerRadius(this.configs.Outer_Radius)

                // Another arc that won't be drawn. Just for labels positioning
                var outerArc = d3.arc()
                    .innerRadius(this.configs.Outer_Radius +10)
                    .outerRadius(this.configs.Outer_Radius + 10)
                

                // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
                container
                    .selectAll('allSlices')
                    .data(data_ready)
                    .enter()
                    .append('path')
                    .attr('d', arc)
                    .attr('fill', this.configs.Arc_Color)
                    .attr("class", "donut-slice")
                    .attr("topic", d => d.data.key)
                    .attr("stroke", this.configs.Sections_Outline_Color)
                    .style("stroke-width", "2px")
                    .style("opacity", 1)
                    .on("click", d => this.selectTopic(d.data.key))
                    .on("mouseover", d => eventBus.$emit("hoverTopic", d.data, this))
                    .on("mouseout", () => eventBus.$emit("leaveTopic", this))

                if (this.configs.Show_Labels) {
                    // Add the polylines between chart and labels:
                    container
                        .selectAll('allPolylines')
                        .data(data_ready)
                        .enter()
                        .append('polyline')
                        .attr("stroke", "black")
                        .style("fill", "none")
                        .attr("stroke-width", 1)
                        .attr('points', function (d) {
                            var posA = arc.centroid(d) // line insertion in the slice
                            var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
                            var posC = outerArc.centroid(d); // Label position = almost the same as posB
                            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
                            posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
                            return [posA, posB, posC]
                        })

                    // Add the polylines between chart and labels:
                    container
                        .selectAll('allLabels')
                        .data(data_ready)
                        .enter()
                        .append('text')
                        .attr("class", "donut-label")
                        .attr("topic", d => d.data.key)
                        .on("click", d => this.selectTopic(d.data.key))
                        .text(function (d) {
                            // console.log(d.data.key);
                            return d.data.key
                        })
                        .attr('transform', function (d) {
                            var pos = outerArc.centroid(d);
                            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                            pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
                            return 'translate(' + pos + ')';
                        })
                        .style('text-anchor', function (d) {
                            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                            return (midangle < Math.PI ? 'start' : 'end')
                        })
                }
            })

        }

    },
    watch: {
        documents: {
            async handler(newVal, oldVal) {
                this.docs = newVal

            },
            deep: true,
        },
        component_width() {
            // console.log("donut width changed");
            this.drawChart()
        },
        component_height() {
            // console.log("donut height changed");
            this.drawChart()
        },

    },
};

export default donutComponent;