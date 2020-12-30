import eventBus from "../eventBus.js";

var textComponent = {
    template: `
    <div v-if="configs" class="text-component">
        <p v-if="document==null" style="color:orange;">** No Document **</p>
        <div id="text-body" class="text-body">
            <p v-if="document!=null" id="text" class="text sc2" v-html="body" />
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
            body: "",
            configs: null,
            speakers: null,
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
                    this.addAnnotations();
                });
            })
        });

        eventBus.$on("selectSpeaker", (speaker_id,vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = speaker_id
                this.clicked.type = "SPEAKER"

                let elements = Array.from(document.querySelectorAll('[class=text-annotation]'));

                elements.forEach(el => {
                    if (el.getAttribute("speaker_id") == speaker_id) {
                        if (this.configs.On_Node_Highlight[0] === "BACKGROUND_COLOR") {
                            el.style.backgroundColor = this.configs.On_Node_Highlight[1]
                            el.style.borderBottom = ""
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.On_Node_Highlight[0] === "UNDERLINE") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "3px solid " + this.configs.On_Node_Highlight[1]
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.On_Node_Highlight[0] === "FONT_COLOR") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "" 
                            el.style.color=this.configs.On_Node_Highlight[1]
                        }
                    } else {
                       if (this.configs.Annotation_Style[0] === "BACKGROUND_COLOR") {
                            el.style.backgroundColor = this.configs.Annotation_Style[1]
                            el.style.borderBottom = ""
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.Annotation_Style[0] === "UNDERLINE") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "3px solid " + this.configs.Annotation_Style[1]
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.Annotation_Style[0] === "FONT_COLOR") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "" 
                            el.style.color=this.configs.Annotation_Style[1]
                        }
                    }
                })
            }
        })
        eventBus.$on("deselectSpeaker", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = Array.from(document.querySelectorAll('[class=text-annotation]'));
                elements.forEach(el => {
                    if (this.configs.Annotation_Style[0] === "BACKGROUND_COLOR") {
                            el.style.backgroundColor = this.configs.Annotation_Style[1]
                            el.style.borderBottom = ""
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.Annotation_Style[0] === "UNDERLINE") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "3px solid " + this.configs.Annotation_Style[1]
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.Annotation_Style[0] === "FONT_COLOR") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "" 
                            el.style.color=this.configs.Annotation_Style[1]
                        }
                })

                this.clicked.id = null
                this.clicked.type = null
            }
        })

        eventBus.$on("selectTopic", (topic, vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                this.clicked.id = topic
                this.clicked.type = "TOPIC"

                let nodes = []
                this.document.annotations.nodes.forEach(node => {
                    if (node.topics.includes(topic))
                        nodes.push(node.id)
                })

                let elements = Array.from(document.querySelectorAll('[class=text-annotation]'));

                elements.forEach(el => {
                    if (nodes.includes(el.getAttribute("node_id"))) {
                        if (this.configs.On_Node_Highlight[0] === "BACKGROUND_COLOR") {
                            el.style.backgroundColor = this.configs.On_Node_Highlight[1]
                            el.style.borderBottom = ""
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.On_Node_Highlight[0] === "UNDERLINE") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "3px solid " + this.configs.On_Node_Highlight[1]
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.On_Node_Highlight[0] === "FONT_COLOR") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "" 
                            el.style.color=this.configs.On_Node_Highlight[1]
                        }
                    } else {
                        if (this.configs.Annotation_Style[0] === "BACKGROUND_COLOR") {
                            el.style.backgroundColor = this.configs.Annotation_Style[1]
                            el.style.borderBottom = ""
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.Annotation_Style[0] === "UNDERLINE") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "3px solid " + this.configs.Annotation_Style[1]
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.Annotation_Style[0] === "FONT_COLOR") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "" 
                            el.style.color=this.configs.Annotation_Style[1]
                        }
                    }
                })
            }
        })
        eventBus.$on("deselectTopic", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = Array.from(document.querySelectorAll('[class=text-annotation]'));
                elements.forEach(el => {
                    if (this.configs.Annotation_Style[0] === "BACKGROUND_COLOR") {
                            el.style.backgroundColor = this.configs.Annotation_Style[1]
                            el.style.borderBottom = ""
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.Annotation_Style[0] === "UNDERLINE") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "3px solid " + this.configs.Annotation_Style[1]
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.Annotation_Style[0] === "FONT_COLOR") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "" 
                            el.style.color=this.configs.Annotation_Style[1]
                        }
                })

                this.clicked.id = null
                this.clicked.type = null
            }
        })

        eventBus.$on("selectNode", (node, vue_el) => {
            if (this.configs.React_To.includes(vue_el.$el.id)||vue_el.$el.id===this.$el.id) {
                this.clicked.id = node.id
                this.clicked.type = "NODE"
                this.clicked.node = node

                let elements = document.querySelectorAll('[class=text-annotation]');
                let els = Array.from(elements)
                els.forEach(el => {
                    if (el.getAttribute("node_id") == node.id) {
                        if (this.configs.On_Node_Highlight[0] === "BACKGROUND_COLOR") {
                            el.style.backgroundColor = this.configs.On_Node_Highlight[1]
                            el.style.borderBottom = ""
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.On_Node_Highlight[0] === "UNDERLINE") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "3px solid " + this.configs.On_Node_Highlight[1]
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.On_Node_Highlight[0] === "FONT_COLOR") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "" 
                            el.style.color=this.configs.On_Node_Highlight[1]
                        }
                        
                        if(this.$el!=vue_el.$el && this.configs.Scroll_On_Selection)
                            el.scrollIntoView()
                    } else {
                        if (this.configs.Annotation_Style[0] === "BACKGROUND_COLOR") {
                            el.style.backgroundColor = this.configs.Annotation_Style[1]
                            el.style.borderBottom = ""
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.Annotation_Style[0] === "UNDERLINE") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "3px solid " + this.configs.Annotation_Style[1]
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.Annotation_Style[0] === "FONT_COLOR") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "" 
                            el.style.color=this.configs.Annotation_Style[1]
                        }
                    }
                })
            }
        })
        eventBus.$on("deselectNode", vue_el => {
            if (this.configs.React_To.includes(vue_el.$el.id) || vue_el.$el.id === this.$el.id) {
                let elements = Array.from(document.querySelectorAll('[class=text-annotation]'));

                elements.forEach(el => {
                    if (this.configs.Annotation_Style[0] === "BACKGROUND_COLOR") {
                        el.style.backgroundColor = this.configs.Annotation_Style[1]
                        el.style.borderBottom = ""
                        el.style.color = this.configs.Text_Font_Color
                    } else if (this.configs.Annotation_Style[0] === "UNDERLINE") {
                        el.style.backgroundColor = ""
                        el.style.borderBottom = "3px solid " + this.configs.Annotation_Style[1]
                        el.style.color = this.configs.Text_Font_Color
                    } else if (this.configs.Annotation_Style[0] === "FONT_COLOR") {
                        el.style.backgroundColor = ""
                        el.style.borderBottom = ""
                        el.style.color = this.configs.Annotation_Style[1]
                    }
                })

                this.clicked.id = null
                this.clicked.type = null
                this.clicked.node = null
            }
        })

        eventBus.$on("hoverNode", (node, component) => {
            if (component.$el == this.$el && this.configs.Show_Tooltip_On_Hover_Node) {
                this.tooltip =  d3.select("body").append("div")
                    .attr("class", "d3-tip")
                    .attr("v-if", "showTooltip")

                let speaker = this.document.speakers.find(spk => spk.id == node.speaker_id)

                let speaker_name = this.document.speakers.find(
                    (spk) => spk.id == node.speaker_id
                ).name;

                let doc = this.documents.filter(_doc => _doc.annotations.nodes.filter(_node => _node.id == node.id).length > 0)

                this.tooltip.html("<p></p><b>Document: </b>" + String(doc[0].title) +
                        "<p></p><b>Speaker: </b>" + String(speaker.name) +
                        "</p><p><b>Topic: </b> " + String(node.topics) + "</p>")
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

    },
    async beforeMount() {
        let configs = await import("./../../config_files/" + this.config.file);
        this.configs = configs.default;
    },
    async mounted() {

    },
    methods: {
        addAnnotations() {
            this.$nextTick(() => {
                let str_array = this.document.body.split("");

                this.document.annotations.nodes.forEach((node) => {

                    if (node.ranges.length > 0) {
                        let begin = node.ranges[0];
                        let end = node.ranges[1];
                        str_array[begin] =
                            "<span node_id=" +
                            node.id +
                            " speaker_id=" + node.speaker_id +
                            " class='text-annotation' >" +
                            str_array[begin];
                        str_array[end] += "</span>";
                    }
                });

                this.document.boundaries.forEach(boundary => {
                    str_array[boundary] = "<span style='font-weight=bold'>\n\n\n-----------------\n\n</span>"
                })

                this.body = str_array.join("");

                this.$nextTick(() => {
                    document.querySelectorAll("[class=text-annotation]").forEach(el => {


                        let _node = this.document.annotations.nodes.find(node => node.id == el.getAttribute("node_id"))

                        if (this.configs.Annotation_Style[0] === "BACKGROUND_COLOR") {
                            el.style.backgroundColor = this.configs.Annotation_Style[1]
                            el.style.borderBottom = ""
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.Annotation_Style[0] === "UNDERLINE") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "3px solid " + this.configs.Annotation_Style[1]
                            el.style.color=this.configs.Text_Font_Color
                        } else if (this.configs.Annotation_Style[0] === "FONT_COLOR") {
                            el.style.backgroundColor = ""
                            el.style.borderBottom = "" 
                            el.style.color=this.configs.Annotation_Style[1]
                        }

                        el.style.cursor = "pointer"
                        el.style.fontWeight = "bold"

                        el.onclick = () => this.selectNode(_node,this)


                        el.onmouseover = () => eventBus.$emit("hoverNode", _node, this)
                        el.onmouseout = () => eventBus.$emit("leaveNode", this)
                    })
                })
            })
        },

        selectDocument(doc_id) {
            eventBus.$emit("selectDocument", doc_id);
        },
        selectNode(node,vue_el) {
            if (this.clicked.id == null || this.clicked.type != "NODE")
                eventBus.$emit("selectNode", node,vue_el)
            else if (this.clicked.id == node.id)
                eventBus.$emit("deselectNode",vue_el)
            else {
                eventBus.$emit("deselectNode",vue_el)
                eventBus.$emit("selectNode", node,vue_el)
            }
        }
    },
    watch: {
        documents: {
            async handler(newVal, oldVal) {
                this.docs = newVal
            },
            deep: true,
        },
    },
};

export default textComponent;