import eventBus from "../eventBus.js";

var FingerprintComponent = {
    template: `
    <div v-if="configs" class="fingerprint-component">
        <div v-if="configs.showHeader" class="fingerprint-header">
            <h3>{{configs.title}}</h3>
        </div>
        <p v-if="document==null" style="color:orange;">** No Document **</p>
        <div v-if="configs.showDocumentTitle && document!=null" class="fingerprint-title">
            <h3>{{document.title}}</h3>
        </div>
        <div class="fingerprint-body" v-if="document!=null" id="fingerprint-body">
            
        </div>
        
        <div v-if="configs.showFooter && docs!=null" class="fingerprint-footer">
            <div class="open-docs" v-for="document in docs" :key="document._id" :name="document._id" type="fingerprint-footer-box" @click="selectDocument(document._id)" selected="false">
                {{document.title}}
            </div>
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
            square_size: 10,
            space_between_squares: 2,
            data_for_graph: [],
            selected_docs_: [],
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
                    this.prepareData();
                    this.drawChart();
                });
            });
        });

        eventBus.$on("addDocument", (doc_id) => {
            this.$nextTick(() => {
                let _document = this.documents.find(
                    (doc) => JSON.stringify(doc._id) === JSON.stringify(doc_id)
                );
                this.selected_docs_.push(JSON.parse(JSON.stringify(_document)));
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
                    this.prepareData();
                    this.drawChart();
                });
            });
        });

        eventBus.$on("removeDocument", (doc_id) => {
            this.$nextTick(() => {
                let _document = this.selected_docs_.find(
                    (doc) => JSON.stringify(doc._id) === JSON.stringify(doc_id)
                );
                this.selected_docs_.splice(this.selected_docs_.indexOf(_document), 1);

                let new_docs = [];
                this.selected_docs_.forEach((_doc) => {
                    if (
                        this.documents.find(
                            (doc) => JSON.stringify(_doc._id) === JSON.stringify(doc._id)
                        )
                    ) {
                        let _document = JSON.parse(
                            JSON.stringify(
                                this.documents.find(
                                    (doc) => JSON.stringify(_doc._id) === JSON.stringify(doc._id)
                                )
                            )
                        );
                        new_docs.push(_document);
                    }
                });
                this.selected_docs_ = JSON.parse(JSON.stringify(new_docs));
                this.selected_docs_.sort((b, a) => new Date(b.date) - new Date(a.date));

                this.document = null;
                this.selected_docs_.forEach((_doc) => {
                    if (this.document == null) {
                        this.document = Object.assign({}, _doc);
                        this.document.boundaries = [];

                        this.document.attributes_keys = [];
                        this.document.attributes = [];
                        this.document.speakers.forEach((spk) => {
                            spk.attributes.forEach((attr) => {
                                Object.keys(attr).forEach((key) => {
                                    if (!this.document.attributes_keys.includes(key)) {
                                        this.document.attributes_keys.push(key);
                                    }
                                });
                            });
                        });

                        this.document.attributes_keys.forEach((key) => {
                            this.document.speakers.forEach((spk) => {
                                if (this.document.attributes == []) {
                                    this.document.attributes.push({
                                        key: key,
                                        values: [spk.attributes[0][key]],
                                    });
                                } else {
                                    let count = 0;
                                    this.document.attributes.forEach((attr) => {
                                        if (attr.key == key && spk.attributes[0][key] != "NULL") {
                                            attr.values.push(spk.attributes[0][key]);
                                            count++;
                                        }
                                    });

                                    if (count == 0 && spk.attributes[0][key] != "NULL") {
                                        this.document.attributes.push({
                                            key: key,
                                            values: [spk.attributes[0][key]],
                                        });
                                    }
                                }
                            });
                        });

                        this.document.attributes.forEach((attr) => {
                            attr.values = [...new Set(attr.values)];
                        });
                    } else {
                        _doc.annotations.nodes.forEach((_node) => {
                            let new_node = Object.assign({}, _node);

                            new_node.ranges[0] += 2 + this.document.body.length;
                            new_node.ranges[1] += 2 + this.document.body.length;
                            this.document.annotations.nodes.push(new_node);
                        });

                        _doc.speakers.forEach((spk) => {
                            let count = 0;
                            this.document.speakers.forEach((speaker) => {
                                if (speaker.id == spk.id) count++;
                            });
                            if (count == 0) this.document.speakers.push(spk);
                        });

                        this.document.attributes_keys = [];
                        this.document.attributes = [];
                        this.document.speakers.forEach((spk) => {
                            spk.attributes.forEach((attr) => {
                                Object.keys(attr).forEach((key) => {
                                    if (!this.document.attributes_keys.includes(key)) {
                                        this.document.attributes_keys.push(key);
                                    }
                                });
                            });
                        });

                        this.document.attributes_keys.forEach((key) => {
                            this.document.speakers.forEach((spk) => {
                                if (this.document.attributes == []) {
                                    this.document.attributes.push({
                                        key: key,
                                        values: [spk.attributes[0][key]],
                                    });
                                } else {
                                    let count = 0;
                                    this.document.attributes.forEach((attr) => {
                                        if (attr.key == key && spk.attributes[0][key] != "NULL") {
                                            attr.values.push(spk.attributes[0][key]);
                                            count++;
                                        }
                                    });

                                    if (count == 0 && spk.attributes[0][key] != "NULL") {
                                        this.document.attributes.push({
                                            key: key,
                                            values: [spk.attributes[0][key]],
                                        });
                                    }
                                }
                            });
                        });

                        this.document.attributes.forEach((attr) => {
                            attr.values = [...new Set(attr.values)];
                        });

                        this.document.stances = [
                            ...new Set([...this.document.stances, ..._doc.stances]),
                        ];

                        this.document.topics = [
                            ...new Set([...this.document.topics, ..._doc.topics]),
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
                    if (this.document) {
                        this.prepareData();
                        this.drawChart();
                    }
                });
            });
        });
        // eventBus.$on("selectDocument", doc_id => {
        //     this.$nextTick(() => {
        //         window.addEventListener("mousemove", () => {
        //             const targetNode = document.querySelector(".fingerprint-component");

        //             this.component_width = targetNode.clientWidth;
        //             this.component_height = targetNode.clientHeight;
        //         });

        //         window.addEventListener("click", () => {
        //             const targetNode = document.querySelector(".fingerprint-component");

        //             this.component_width = targetNode.clientWidth;
        //             this.component_height = targetNode.clientHeight;
        //         });

        //         let _document = this.docs.find(doc => doc._id == doc_id)
        //         this.document = _document

        //         this.prepareData()

        //         this.drawChart()

        //         let elements = document.querySelectorAll('[type=fingerprint-footer-box]');

        //         elements.forEach(el => {
        //             el.setAttribute("selected", false)
        //             el.style.border = "1px solid lightgray"
        //             el.style.fontWeight = "normal"
        //             if (el.getAttribute("name") == doc_id) {
        //                 if (el.getAttribute("selected") == "false" || el.getAttribute("selected") == "selected") {
        //                     el.setAttribute("selected", true)
        //                     el.style.fontWeight = "bold"
        //                     el.style.border = "2px solid black"
        //                 } else {
        //                     el.setAttribute("selected", false)
        //                     el.style.fontWeight = "normal"
        //                     el.style.border = "1px solid lightgray"
        //                 }
        //             }
        //         })
        //     })

        // })
    },
    async beforeMount() {
        let configs = await import("./../../config_files/" + this.config.file);
        this.configs = configs.default;
        this.square_size = this.configs.square_size;
        this.space_between_squares = this.configs.space_between_squares;
    },
    async mounted() {},
    methods: {
        selectDocument(doc_id) {
            eventBus.$emit("selectDocument", doc_id);
        },
        prepareData() {
            this.data_for_graph = [];
            let width = document.getElementById("fingerprint-body").offsetWidth;
            let height = document.getElementById("fingerprint-body").offsetHeight;

            let x = 0;
            let y = 2;

            let splitted_text = this.document.body.split("\n");
            splitted_text.forEach((excerpt, index) => {
                let begin = this.document.body.indexOf(excerpt) - 10;
                let end = begin + excerpt.length + 10;

                let obj = {
                    id: this.document._id + "-" + index,
                    nodes: [],
                    topics: [],
                    speakers: [],
                    stances: [],
                };

                this.document.annotations.nodes.forEach((node) => {
                    if (node.ranges[0] >= begin && node.ranges[1] <= end) {
                        obj.nodes.push(node);

                        let speaker = obj.speakers.find((spk) => spk.id == node.speaker_id);
                        if (speaker) speaker.counter += 1;
                        else
                            obj.speakers.push({
                                id: node.speaker_id,
                                counter: 1,
                            });

                        node.topics.forEach((topic) => {
                            let _topic = obj.topics.find((tpc) => tpc.name == topic);
                            if (_topic) _topic.counter += 1;
                            else
                                obj.topics.push({
                                    name: topic,
                                    counter: 1,
                                });
                        });

                        node.stances.forEach((stance) => {
                            let _stance = obj.stances.find((stc) => stc - name == stance);
                            if (_stance) _stance.counter += 1;
                            else
                                obj.stances.push({
                                    name: stance,
                                    counter: 1,
                                });
                        });
                    }
                });

                if (x == 0) {
                    x += this.space_between_squares;
                } else {
                    x += this.square_size + this.space_between_squares;
                }

                if (x + 2 * this.square_size + this.space_between_squares >= width) {
                    y += this.square_size + this.space_between_squares;
                    x = this.space_between_squares;
                }

                obj.x = x;
                obj.y = y;

                this.data_for_graph.push(obj);
            });
            // console.log(this.data_for_graph)
        },
        drawChart() {
            this.$nextTick(() => {
                if (document.getElementById("fingerprint-svg"))
                    document.getElementById("fingerprint-svg").remove();

                let width = document.getElementById("fingerprint-body").offsetWidth;
                let height = document.getElementById("fingerprint-body").offsetHeight;

                // console.log(width)
                // console.log(height)

                let max = 0;
                this.data_for_graph.forEach((obj) => {
                    if (obj.nodes.length >= max) max = obj.nodes.length;
                });

                var color = d3
                    .scaleLinear()
                    .domain([0, max])
                    .range(["rgba(211,211,211,0.8)", "rgba(16, 46, 74, 0.8)"]);

                var container = d3
                    .select("#fingerprint-body")
                    .append("svg")
                    .attr("id", "fingerprint-svg")
                    .attr("width", width)
                    .attr("height", height);
                // var container = svg.append("g");

                // svg.call(
                //     d3.zoom()
                //     .scaleExtent([.1, 4])
                //     .on("zoom", () => {
                //         // console.log("zoom")
                //         container.attr("transform", d3.event.transform);
                //     })
                // );

                let x = 0;
                let y = 2;
                var node = container
                    .append("g")
                    .attr("class", "nodes")
                    .selectAll("g")
                    .data(this.data_for_graph)
                    .enter()
                    .append("rect")
                    .attr("id", (d) => d.id)
                    .attr("x", (d) => d.x)
                    .attr("y", (d) => d.y)
                    .attr("width", this.square_size)
                    .attr("height", this.square_size)
                    .attr("fill", (d) => color(d.nodes.length));
            });
        },
    },
    watch: {
        documents: {
            async handler(newVal, oldVal) {
                this.docs = newVal;
            },
            deep: true,
        },
        component_width() {
            // console.log("fingerprint width changed");
            this.drawChart();
        },
        component_height() {
            // console.log("fingerprint height changed");
            this.drawChart();
        },
    },
};

export default FingerprintComponent;