import eventBus from "../eventBus.js";

let calendarHeatmapComponent = {
    template: `
    <div v-if="configs" class="calendar-heatmap-component">
        <p v-if="document==null" style="color:orange;">** No Document **</p>
        <div v-if="document!=null" class="button"><</div>
        <div v-if="document!=null" id="calendar-heatmap-body-1">
            <h3 v-if="configs.Show_Current_Year">Year: {{currentYear}}</h3>
            <div id="calendar-heatmap-body" class="calendar-heatmap-body">
                <!-- <svg width="100%" height="100%"></svg> -->
            </div>
        </div>
       
        <div class="button">></div>
    </div>
    `,
    props: {
        documents: Array,
        config: Object,
    },
    data() {
        return {
            document: 1,
            configs: null,
            docs_data: [],
            currentYear: 2020,
            clicked: {
                id: null,
                type: null,
                node: null
            },
            maxDate: 0,
            maxCount:0
        };
    },
    created() {

    },
    async beforeMount() {
        let configs = await import("./../../config_files/" + this.config.file);
        this.configs = configs.default;
    },
    mounted() {
        eventBus.$on("setDocument", docs => {

            this.$nextTick(() => {
                this.docs_data = []
                docs.forEach(doc => {

                    if (this.docs_data.length == 0) {
                        this.docs_data.push({
                            day: String(doc.date),
                            docs: [doc.title],
                            count: 1
                        })
                    } else {
                        let elem = this.docs_data.find(data => data.day == String(doc.date))
                        // console.log(elem)
                        if (elem != undefined) {
                            elem.count++
                            elem.docs.push(doc.title)
                        }
                        else {
                            this.docs_data.push({
                                day: String(doc.date),
                                docs: [doc.title],
                                count: 1
                            })
                        }
                    }
                });

                // console.log(this.docs_data)

                this.maxDate = d3.max(this.docs_data, function (d) {
                    return new Date(d.day)
                })

                this.maxCount= d3.max(this.docs_data, function (d) {
                    return new Date(d.count)
                })

                // this.currentYear = maxDate.getFullYear()

                this.docs_data.filter(data => {
                    let date = new Date(data.day)
                    return date.setFullYear() === this.currentYear
                })

                if(this.docs_data.length>0)
                    this.drawCalendar(this.docs_data)
            })

        })

        eventBus.$on("selectSpeaker", (speaker_id,vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id)) {
                this.clicked.id = speaker_id
                this.clicked.type = "SPEAKER"

                var svg = d3.select("#calendar-heatmap-body").selectAll("svg")

                var rect = svg.selectAll("rect.day")

                var lookup = d3.nest()
                    .key(function (d) {
                        return d.day;
                    })
                    .rollup(function (leaves) {
                        return d3.sum(leaves, function (d) {
                            return parseInt(d.count);
                        });
                    })
                    .object(this.docs_data);

                var scale = d3.scaleLinear()
                    .domain([0, this.maxCount])
                    .range([this.configs.Day_Color_Range_Zero, this.configs.Day_Color_Range_Max]);

                rect.filter(function (d) {
                    return d in lookup;
                })
                    .style("fill", function (d) {
                        // console.log(scale(lookup[d]))
                        return scale(lookup[d]);
                        // return d3.interpolatePuBu(scale(lookup[d]));
                    })

                let docs = this.documents.filter(doc => doc.speakers.filter(spk => spk.id == speaker_id).length > 0)

                let elements = Array.from(document.querySelectorAll('[class=day]'));

                docs.forEach(_doc => {
                    let doc_date = new Date(_doc.date)
                    elements.forEach(el => {
                        let el_date = new Date(el.getAttribute("date"))
                        if (el_date.getDate() == doc_date.getDate() && el_date.getMonth() == doc_date.getMonth() && el_date.getFullYear() == doc_date.getFullYear()) {
                            el.style.fill = this.configs.Day_Color_Highlighted
                        }
                    })
                })
            }
        })

        eventBus.$on("deselectSpeaker", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id)) {
                var svg = d3.select("#calendar-heatmap-body").selectAll("svg")

                var rect = svg.selectAll("rect.day")

                var lookup = d3.nest()
                    .key(function (d) {
                        return d.day;
                    })
                    .rollup(function (leaves) {
                        return d3.sum(leaves, function (d) {
                            return parseInt(d.count);
                        });
                    })
                    .object(this.docs_data);

                var scale = d3.scaleLinear()
                    .domain([0, this.maxCount])
                    .range([this.configs.Day_Color_Range_Zero, this.configs.Day_Color_Range_Max]);

                rect.filter(function (d) {
                    return d in lookup;
                })
                    .style("fill", function (d) {
                        // console.log(scale(lookup[d]))
                        return scale(lookup[d]);
                        // return d3.interpolatePuBu(scale(lookup[d]));
                    })

                this.clicked.id = null
                this.clicked.type = null
            }
        })

        eventBus.$on("selectNode", (node, vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id)) {
                this.clicked.id = node.id;
                this.clicked.type = "NODE";
                this.clicked.node = node;

                var svg = d3.select("#calendar-heatmap-body").selectAll("svg")

                var rect = svg.selectAll("rect.day")

                var lookup = d3.nest()
                    .key(function (d) {
                        return d.day;
                    })
                    .rollup(function (leaves) {
                        return d3.sum(leaves, function (d) {
                            return parseInt(d.count);
                        });
                    })
                    .object(this.docs_data);

                var scale = d3.scaleLinear()
                    .domain([0, this.maxCount])
                    .range([this.configs.Day_Color_Range_Zero, this.configs.Day_Color_Range_Max]);

                rect.filter(function (d) {
                    return d in lookup;
                })
                    .style("fill", function (d) {
                        // console.log(scale(lookup[d]))
                        return scale(lookup[d]);
                        // return d3.interpolatePuBu(scale(lookup[d]));
                    })

                let docs = this.documents.filter(doc => doc.annotations.nodes.filter(_node => _node.id == node.id).length > 0)

                let elements = Array.from(document.querySelectorAll('[class=day]'));

                docs.forEach(_doc => {
                    let doc_date = new Date(_doc.date)
                    elements.forEach(el => {
                        let el_date = new Date(el.getAttribute("date"))
                        if (el_date.getDate() == doc_date.getDate() && el_date.getMonth() == doc_date.getMonth() && el_date.getFullYear() == doc_date.getFullYear()) {
                            el.style.fill = this.configs.Day_Color_Highlighted
                        }
                    })
                })
            }
        });

        eventBus.$on("deselectNode", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id)) {
                var svg = d3.select("#calendar-heatmap-body").selectAll("svg")

                var rect = svg.selectAll("rect.day")

                var lookup = d3.nest()
                    .key(function (d) {
                        return d.day;
                    })
                    .rollup(function (leaves) {
                        return d3.sum(leaves, function (d) {
                            return parseInt(d.count);
                        });
                    })
                    .object(this.docs_data);

                var scale = d3.scaleLinear()
                    .domain([0, this.maxCount])
                    .range([this.configs.Day_Color_Range_Zero, this.configs.Day_Color_Range_Max]);

                rect.filter(function (d) {
                    return d in lookup;
                })
                    .style("fill", function (d) {
                        // console.log(scale(lookup[d]))
                        return scale(lookup[d]);
                        // return d3.interpolatePuBu(scale(lookup[d]));
                    })

                this.clicked.id = null;
                this.clicked.type = null;
                this.clicked.node = null;
            }
        });

        eventBus.$on("selectTopic", (topic, vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id)) {
                this.clicked.id = topic;
                this.clicked.type = "TOPIC";

                var svg = d3.select("#calendar-heatmap-body").selectAll("svg")

                var rect = svg.selectAll("rect.day")

                var lookup = d3.nest()
                    .key(function (d) {
                        return d.day;
                    })
                    .rollup(function (leaves) {
                        return d3.sum(leaves, function (d) {
                            return parseInt(d.count);
                        });
                    })
                    .object(this.docs_data);

                var scale = d3.scaleLinear()
                    .domain([0, this.maxCount])
                    .range([this.configs.Day_Color_Range_Zero, this.configs.Day_Color_Range_Max]);

                rect.filter(function (d) {
                    return d in lookup;
                })
                    .style("fill", function (d) {
                        // console.log(scale(lookup[d]))
                        return scale(lookup[d]);
                        // return d3.interpolatePuBu(scale(lookup[d]));
                    })

                let docs = this.documents.filter(doc => doc.topics.filter(_topic => _topic == topic).length > 0)

                let elements = Array.from(document.querySelectorAll('[class=day]'));

                docs.forEach(_doc => {
                    let doc_date = new Date(_doc.date)
                    elements.forEach(el => {
                        let el_date = new Date(el.getAttribute("date"))
                        if (el_date.getDate() == doc_date.getDate() && el_date.getMonth() == doc_date.getMonth() && el_date.getFullYear() == doc_date.getFullYear()) {
                            el.style.fill = this.configs.Day_Color_Highlighted
                        }
                    })
                })
            }
        });

        eventBus.$on("deselectTopic", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id)) {
                var svg = d3.select("#calendar-heatmap-body").selectAll("svg")

                var rect = svg.selectAll("rect.day")

                var lookup = d3.nest()
                    .key(function (d) {
                        return d.day;
                    })
                    .rollup(function (leaves) {
                        return d3.sum(leaves, function (d) {
                            return parseInt(d.count);
                        });
                    })
                    .object(this.docs_data);

                var scale = d3.scaleLinear()
                    .domain([0, this.maxCount])
                    .range([this.configs.Day_Color_Range_Zero, this.configs.Day_Color_Range_Max]);

                rect.filter(function (d) {
                    return d in lookup;
                })
                    .style("fill", function (d) {
                        // console.log(scale(lookup[d]))
                        return scale(lookup[d]);
                        // return d3.interpolatePuBu(scale(lookup[d]));
                    })

                this.clicked.id = null;
                this.clicked.type = null;
            }
        });

        eventBus.$on("showTooltip", date => {
            if (this.configs.Show_Tooltips) {
                let text = ""
                this.docs_data.forEach(doc_data => {
                    if (doc_data.day == date) {
                        doc_data.docs.forEach(doc_title => {
                            // if (text == "")
                            //     text = "<p>"+doc_title+"</p>"
                            // else
                            text = text + "<p>" + doc_title + "</p>"
                        })
                    }
                })

                if (text != "") {
                    text = "<p><strong>Date: </strong>" + date + "</p><p><strong>Documents:</strong></p>" + text
                    d3.select("#calendar-heatmap-component").append("div")
                        .attr("class", "d3-tip")
                        .html(text)
                        .style("left", event.clientX + "px")
                        .style("top", event.clientY + "px");
                } else {
                    text = "<p><strong>Date: </strong>" + date + "</p><p><strong>Documents:</strong> None</p>"
                    d3.select("#calendar-heatmap-component").append("div")
                        .attr("class", "d3-tip")
                        .html(text)
                        .style("left", event.clientX + "px")
                        .style("top", event.clientY + "px");
                }
            }
        })

        eventBus.$on("hideTooltip", date => {
            if (this.configs.Show_Tooltips) 
                d3.select(".d3-tip").remove()
        })
            
    },
    methods: {
        drawCalendar(dateData) {
            // console.log(dateData)
            d3.select("#calendar-heatmap-body").selectAll("svg") ?d3.select("#calendar-heatmap-body").selectAll("svg").remove(): null

            var weeksInMonth = function (month) {
                var m = d3.timeMonth.floor(month)
                return d3.timeWeeks(d3.timeWeek.floor(m), d3.timeMonth.offset(m, 1)).length;
            }

            var minDate = d3.min(dateData, function (d) {
                return new Date(d.day)
            })
            var maxDate = d3.max(dateData, function (d) {
                return new Date(d.day)
            })


            var cellMargin = this.configs.Space_Between_Cells,
                cellSize = this.configs.Day_Cell_Size;

            var day = d3.timeFormat("%w"),
                week = d3.timeFormat("%U"),
                format = d3.timeFormat("%Y-%m-%d"),
                titleFormat = d3.utcFormat("%a, %d-%b"),
                monthName = d3.timeFormat("%B"),
                months = d3.timeMonth.range(new Date(minDate.getFullYear(), 0, 1), new Date(maxDate.getFullYear(), 12, 1));
            // months = d3.timeMonth.range(d3.timeMonth.floor(minDate), new Date(maxDate.getFullYear(), 12, 1));


            var svg = d3.select("#calendar-heatmap-body").selectAll("svg")
                .data(months)
                .enter().append("svg")
                .attr("class", "month")
                .attr("height", ((cellSize * 7) + (cellMargin * 8) + 20)) // the 20 is for the month labels
                .attr("width", function (d) {
                    var columns = weeksInMonth(d);
                    return ((cellSize * columns) + (cellMargin * (columns + 1)));
                })
                .append("g")

            svg.append("text")
                // .attr("class", "month-name")
                .attr("font-size", this.configs.Months_Text_Size)
                .attr("fill", this.configs.Months_Text_Color)
                .attr("y", (cellSize * 7) + (cellMargin * 8) + 12)
                .attr("x", function (d) {
                    var columns = weeksInMonth(d);
                    return (((cellSize * columns) + (cellMargin * (columns + 1))) / 2);
                })
                .attr("text-anchor", "middle")
                .text(function (d) {
                    return monthName(d);
                })

            var rect = svg.selectAll("rect.day")
                .data(function (d, i) {
                    return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth() + 1, 1));
                })
                .enter().append("rect")
                .attr("class", "day")
                .attr("width", cellSize)
                .attr("height", cellSize)
                .attr("rx", 2).attr("ry", 2) // rounded corners
                .attr("fill", this.configs.Day_Color_Range_Zero) // default light grey fill
                // .attr("fill", '#eaeaea') // default light grey fill
                .attr("y", function (d) {
                    return (day(d) * cellSize) + (day(d) * cellMargin) + cellMargin;
                })
                .attr("x", function (d) {
                    return ((week(d) - week(new Date(d.getFullYear(), d.getMonth(), 1))) * cellSize) + ((week(d) - week(new Date(d.getFullYear(), d.getMonth(), 1))) * cellMargin) + cellMargin;
                })
                .attr("date", d => d)
                .on("mouseover", function (d) {
                    eventBus.$emit("showTooltip", d)
                    // d3.select(this).classed('hover', true);
                })
                .on("mouseout", function (d) {
                    eventBus.$emit("hideTooltip", d)
                    // d3.select(this).classed('hover', false);
                })
                .datum(format);

            // rect.append("title")
            //     .text(function (d) {
            //         return titleFormat(new Date(d));
            //     });

            var lookup = d3.nest()
                .key(function (d) {
                    return d.day;
                })
                .rollup(function (leaves) {
                    return d3.sum(leaves, function (d) {
                        return parseInt(d.count);
                    });
                })
                .object(dateData);

            var scale = d3.scaleLinear()
                .domain([0, this.maxCount])
                .range([this.configs.Day_Color_Range_Zero, this.configs.Day_Color_Range_Max]);

            // console.log(d3.extent(dateData, function (d) {
            //     return parseInt(d.count);
            // }))

            rect.filter(function (d) {
                    return d in lookup;
                })
                .style("fill", function (d) {
                    // console.log(d)
                    // console.log(scale(lookup[d]))
                    return scale(lookup[d]);
                    // return d3.interpolatePuBu(scale(lookup[d]));
                })
                .select("title")
                .text(function (d) {
                    return titleFormat(new Date(d)) + ":  " + lookup[d];
                });

        }
    },
    watch: {
        documents() {

        }
    },
};

export default calendarHeatmapComponent;