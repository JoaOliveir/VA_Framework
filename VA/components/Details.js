import eventBus from "../eventBus.js";

var detailsComponent = {
    template: `
    <div v-if="configs" class="details-component">
        <div v-if="configs.showHeader" class="details-header">
            <h3>{{configs.title}}</h3>
        </div>
        <p v-if="document==null" style="color:orange;">** No Document **</p>
        <div v-if="document!=null" id="details-body" class="details-body sc2">
            <!--<input type="checkbox" id="checkbox" v-model="checked">
            <label for="checkbox">Merge Documents</label>
            <hr>-->
            <div class="block">
                <h3>Title</h3>
                <p>{{document.title}}</p>
            </div>
            <div class="block">
                <h3>Date</h3>
                <p>{{document.date}}</p>
            </div>
            <div class="block">
                <h3>Description</h3>
                <p>{{document.meta_description}}</p>
            </div>
            <div class="block">
                <h3>Source</h3>
                <p>{{document.source}}</p>
            </div>
            <!--<div class="block">
                <h3>URL</h3>
                <a :href=document.url_canonical>{{document.url_canonical}}</a>
            </div>-->
            <div class="block">
                <h3>Keynoters</h3>
                <div id="keynoters" class="inside-block sc2">
                    <p class="keynoters" v-for="speaker in document.speakers" :speaker_id="speaker.id" 
                        @mouseover="hoverSpeaker(speaker.id)" @mouseleave="leaveSpeaker(speaker.id)"
                        @click="selectSpeaker(speaker.id)">{{speaker.name}}</p>
                </div>
            </div>
            <!--<h3>Attributes</h3>-->
            
            <div class="block">
                <h3>Topics</h3>
                <div class="inside-block sc2">
                    <p class="topics" v-for="topic in document.topics" :key="topic" :topic="topic" @click="selectTopic(topic)">{{topic}}</p>
                </div>
            </div>
            <!--<div class="block">
                <h3>Stances</h3>
                <div class="inside-block sc2">
                    <p class="stances" v-for="stance in document.stances" :key="stance" :stance="stance" @click="selectstance(stance)">{{stance}}</p>
                </div>
            </div>
            <div v-for="attribute in this.document.attributes" class="block">
                <h3>{{attribute.key}}</h3>
                <div class="inside-block sc2">
                    <p class="attributes" v-for="value in attribute.values" :value="value">{{value}}</p>
                </div>
            </div>
            <div class="block">
                <h3>Keywords</h3>
                <div class="inside-block sc2">
                    <p class="keywords" v-for="keyword in document.keywords" :key="keyword">{{keyword}}</p>
                </div>
            </div>-->
        </div>
        <div v-if="configs.showFooter && docs!=null" class="details-footer">
            <div class="open-docs" v-for="document in docs" :key="document._id" :name="document._id" type="details-footer-box" @click="selectDocument(document._id)" selected="false">
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
            speakers: null,
            selected_speaker: null,
            clicked: {
                id: null,
                type: null,
                node: null
            },
            selected_docs_: []
        };
    },
    created() {

        // eventBus.$on("selectDocument", doc_id => {
        //     this.$nextTick(() => {
        //         if (doc_id == null)
        //             this.document = null
        //         else {
        //             let _document = this.docs.find(doc => doc._id == doc_id)
        //             this.document = _document


        //             // let elements = document.querySelectorAll('[type=details-footer-box]');

        //             // elements.forEach(el => {
        //             //     el.setAttribute("selected", false)
        //             //     el.style.border = "1px solid lightgray"
        //             //     el.style.fontWeight = "normal"
        //             //     if (el.getAttribute("name") == doc_id) {
        //             //         if (el.getAttribute("selected") == "false" || el.getAttribute("selected") == "selected") {
        //             //             el.setAttribute("selected", true)
        //             //             el.style.fontWeight = "bold"
        //             //             el.style.border = "2px solid lightgray"
        //             //         } else {
        //             //             el.setAttribute("selected", false)
        //             //             el.style.fontWeight = "normal"
        //             //             el.style.border = "1px solid lightgray"
        //             //         }
        //             //     }
        //             // })
        //         }
        //     })
        // })

        eventBus.$on("addDocument", (doc_id) => {
            this.$nextTick(() => {
                let _document = this.documents.find((doc) => JSON.stringify(doc._id) === JSON.stringify(doc_id));
                this.selected_docs_.push(JSON.parse(JSON.stringify(_document)));
                this.selected_docs_.sort((b, a) => new Date(b.date) - new Date(a.date));

                this.document = null;


                this.selected_docs_.forEach((_doc) => {
                    if (this.document == null) {
                        this.document = Object.assign({}, _doc);
                        this.document.boundaries = [];

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

                        this.document.attributes.forEach(attr => {
                            attr.values = [
                                ...new Set(attr.values)
                            ]
                        })
                    } else {
                        _doc.annotations.nodes.forEach((_node) => {
                            let new_node = Object.assign({}, _node);

                            new_node.ranges[0] += 2 + this.document.body.length;
                            new_node.ranges[1] += 2 + this.document.body.length;
                            this.document.annotations.nodes.push(new_node);
                        });

                        _doc.speakers.forEach(spk => {
                            let count = 0
                            this.document.speakers.forEach(speaker => {
                                if (speaker.id == spk.id)
                                    count++
                            })
                            if (count == 0)
                                this.document.speakers.push(spk)
                        })

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

                        this.document.attributes.forEach(attr => {
                            attr.values = [
                                ...new Set(attr.values)
                            ]
                        })

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
            })
        });

        eventBus.$on("removeDocument", (doc_id) => {
            this.$nextTick(() => {
                let _document = this.selected_docs_.find((doc) => JSON.stringify(doc._id) === JSON.stringify(doc_id));
                this.selected_docs_.splice(this.selected_docs_.indexOf(_document), 1);


                let new_docs = []
                this.selected_docs_.forEach(_doc => {
                    if (this.documents.find((doc) => JSON.stringify(_doc._id) === JSON.stringify(doc._id))) {
                        let _document = JSON.parse(
                            JSON.stringify(this.documents.find((doc) => JSON.stringify(_doc._id) === JSON.stringify(doc._id)))
                        );
                        new_docs.push(_document);
                    }
                })
                this.selected_docs_ = JSON.parse(
                    JSON.stringify(new_docs)
                );
                this.selected_docs_.sort((b, a) => new Date(b.date) - new Date(a.date));

                this.document = null;
                this.selected_docs_.forEach((_doc) => {
                    if (this.document == null) {
                        this.document = Object.assign({}, _doc);
                        this.document.boundaries = [];

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

                        this.document.attributes.forEach(attr => {
                            attr.values = [
                                ...new Set(attr.values)
                            ]
                        })
                    } else {
                        _doc.annotations.nodes.forEach((_node) => {
                            let new_node = Object.assign({}, _node);

                            new_node.ranges[0] += 2 + this.document.body.length;
                            new_node.ranges[1] += 2 + this.document.body.length;
                            this.document.annotations.nodes.push(new_node);
                        });

                        _doc.speakers.forEach(spk => {
                            let count = 0
                            this.document.speakers.forEach(speaker => {
                                if (speaker.id == spk.id)
                                    count++
                            })
                            if (count == 0)
                                this.document.speakers.push(spk)
                        })

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

                        this.document.attributes.forEach(attr => {
                            attr.values = [
                                ...new Set(attr.values)
                            ]
                        })

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
            });
        });

        eventBus.$on("selectSpeaker", speaker_id => {
            this.clicked.id = speaker_id
            this.clicked.type = "SPEAKER"

            let elements = Array.from(document.querySelectorAll('[class=keynoters]'));
            elements.forEach(el => {
                if (el.getAttribute("speaker_id") == speaker_id) {
                    el.style.backgroundColor = "rgba(255,105,180,0.4)"
                    el.style.borderBottom = ""
                    el.style.fontWeight = "bold"
                } else {
                    el.style.backgroundColor = ""
                    el.style.borderBottom = ""
                    el.style.fontWeight = "normal"
                }
            })

            let topics = []
            this.document.annotations.nodes.forEach(node => {
                if (node.speaker_id == speaker_id) {
                    node.topics.forEach(_topic => {
                        topics.push(_topic)
                    })
                }

            })
            let elements2 = Array.from(document.querySelectorAll('[class=topics]'));
            elements2.forEach(el => {
                if (topics.includes(el.getAttribute("topic"))) {
                    el.style.backgroundColor = ""
                    el.style.borderBottom = "2px solid rgba(255,105,180,0.4)"
                    el.style.fontWeight = "bold"
                } else {
                    el.style.backgroundColor = ""
                    el.style.borderBottom = ""
                    el.style.fontWeight = "normal"
                }
            })
        })
        eventBus.$on("deselectSpeaker", () => {
            let elements = Array.from(document.querySelectorAll('[class=keynoters]'));

            elements.forEach(el => {
                el.style.backgroundColor = ""
                el.style.borderBottom = ""
                el.style.fontWeight = "normal"
            })

            let elements2 = Array.from(document.querySelectorAll('[class=topics]'));

            elements2.forEach(el => {
                el.style.backgroundColor = ""
                el.style.borderBottom = ""
                el.style.fontWeight = "normal"
            })

            this.clicked.id = null
            this.clicked.type = null
        })

        eventBus.$on("hoverSpeaker", speaker_id => {
            // let elements = Array.from(document.querySelectorAll('[class=keynoters]'));
            // elements.forEach(el => {

            //     if (this.clicked.type == "NODE") {
            //         if (el.getAttribute("speaker_id") != this.clicked.node.speaker_id && el.getAttribute("speaker_id") == speaker_id) {
            //             el.style.backgroundColor = "rgba(114, 188, 212, 0.3)"
            //             el.style.fontWeight = "bold"
            //         }
            //     } else if (this.clicked.type == "SPEAKER") {
            //         if (el.getAttribute("speaker_id") != this.clicked.id && el.getAttribute("speaker_id") == speaker_id) {
            //             el.style.backgroundColor = "rgba(114, 188, 212, 0.3)"
            //             el.style.fontWeight = "bold"
            //         }
            //     } else {
            //         if (el.getAttribute("speaker_id") == speaker_id) {
            //             el.style.backgroundColor = "rgba(114, 188, 212, 0.3)"
            //             el.style.fontWeight = "bold"
            //         }
            //     }
            // })
        })
        eventBus.$on("leaveSpeaker", () => {
            // let elements = Array.from(document.querySelectorAll('[class=keynoters]'));
            // elements.forEach(el => {
            //     if (this.clicked.type == "NODE") {
            //         if (el.getAttribute("speaker_id") != this.clicked.node.speaker_id) {
            //             el.style.backgroundColor = ""
            //             el.style.fontWeight = "normal"
            //         }
            //     } else if (this.clicked.type == "SPEAKER") {
            //         if (el.getAttribute("speaker_id") != this.clicked.id) {
            //             el.style.backgroundColor = ""
            //             el.style.fontWeight = "normal"
            //         }
            //     } else {
            //         el.style.backgroundColor = ""
            //         el.style.fontWeight = "normal"
            //     }
            // })
        })

        eventBus.$on("hoverNode", (node) => {
            // let elements = Array.from(document.querySelectorAll('[class=keynoters]'));
            // elements.forEach(el => {

            //     if (this.clicked.type == "NODE") {
            //         if (el.getAttribute("speaker_id") != this.clicked.node.speaker_id && el.getAttribute("speaker_id") == node.speaker_id) {
            //             el.style.backgroundColor = "rgba(114, 188, 212, 0.3)"
            //             el.style.fontWeight = "bold"
            //             el.scrollIntoView()
            //         }
            //     } else if (this.clicked.type == "SPEAKER") {
            //         if (el.getAttribute("speaker_id") != this.clicked.id && el.getAttribute("speaker_id") == node.speaker_id) {
            //             el.style.backgroundColor = "rgba(114, 188, 212, 0.3)"
            //             el.style.fontWeight = "bold"
            //             el.scrollIntoView()
            //         }
            //     } else {
            //         if (el.getAttribute("speaker_id") == node.speaker_id) {
            //             el.style.backgroundColor = "rgba(114, 188, 212, 0.3)"
            //             el.style.fontWeight = "bold"
            //             el.scrollIntoView()
            //         }
            //     }
            // })
        })
        eventBus.$on("leaveNode", (node) => {
            // let elements = Array.from(document.querySelectorAll('[class=keynoters]'));
            // elements.forEach(el => {
            //     if (this.clicked.type == "NODE") {
            //         if (el.getAttribute("speaker_id") != this.clicked.node.speaker_id) {
            //             el.style.backgroundColor = ""
            //             el.style.fontWeight = "normal"
            //         } else {
            //             el.scrollIntoView()
            //         }
            //     } else if (this.clicked.type == "SPEAKER") {
            //         if (el.getAttribute("speaker_id") != this.clicked.id) {
            //             el.style.backgroundColor = ""
            //             el.style.fontWeight = "normal"
            //         } else {
            //             el.scrollIntoView()
            //         }
            //     } else {
            //         el.style.backgroundColor = ""
            //         el.style.fontWeight = "normal"
            //     }
            // })
        })

        eventBus.$on("selectNode", node => {
            this.clicked.id = node.id
            this.clicked.type = "NODE"
            this.clicked.node = node

            let elements = document.querySelectorAll('[class=keynoters]');
            let els = Array.from(elements)
            els.forEach(el => {
                if (el.getAttribute("speaker_id") == node.speaker_id) {
                    el.style.backgroundColor = ""
                    el.style.borderBottom = "2px solid rgba(255, 105, 180, 0.4)"
                    el.style.fontWeight = "bold"
                } else {
                    el.style.backgroundColor = ""
                    el.style.borderBottom = ""
                    el.style.fontWeight = "normal"
                }
            })

            let elements2 = document.querySelectorAll('[class=topics]');
            let els2 = Array.from(elements2)
            els2.forEach(el => {
                if (node.topics.includes(el.getAttribute("topic"))) {
                    el.style.backgroundColor = ""
                    el.style.borderBottom = "2px solid rgba(255, 105, 180, 0.4)"
                    el.style.fontWeight = "bold"
                } else {
                    el.style.backgroundColor = ""
                    el.style.borderBottom = ""
                    el.style.fontWeight = "normal"
                }


            })
        })
        eventBus.$on("deselectNode", () => {
            let elements = Array.from(document.querySelectorAll('[class=keynoters]'));

            elements.forEach(el => {
                el.style.backgroundColor = ""
                el.style.borderBottom = ""
                el.style.fontWeight = "normal"
            })

            let elements2 = Array.from(document.querySelectorAll('[class=topics]'));

            elements2.forEach(el => {
                el.style.backgroundColor = ""
                el.style.borderBottom = ""
                el.style.fontWeight = "normal"
            })

            this.clicked.id = null
            this.clicked.type = null
            this.clicked.node = null
        })

        eventBus.$on("selectTopic", topic => {
            this.$nextTick(() => {
                this.clicked.id = topic
                this.clicked.type = "TOPIC"

                let elements = Array.from(document.querySelectorAll('[class=topics]'));
                elements.forEach(el => {
                    if (el.getAttribute("topic") == topic) {
                        el.style.backgroundColor = "rgba(255,105,180,0.4)"
                        el.style.borderBottom = ""
                        el.style.fontWeight = "bold"
                    } else {
                        el.style.backgroundColor = ""
                        el.style.borderBottom = ""
                        el.style.fontWeight = "normal"
                    }
                })

                let speakers = []
                this.document.annotations.nodes.forEach(node => {
                    node.topics.forEach(_topic => {
                        if (_topic == topic)
                            speakers.push(node.speaker_id)
                    })
                })
                let elements2 = Array.from(document.querySelectorAll('[class=keynoters]'));
                elements2.forEach(el => {
                    if (speakers.includes(el.getAttribute("speaker_id"))) {
                        el.style.backgroundColor = ""
                        el.style.borderBottom = "2px solid rgba(255,105,180,0.4)"
                        el.style.fontWeight = "bold"
                    } else {
                        el.style.backgroundColor = ""
                        el.style.borderBottom = ""
                        el.style.fontWeight = "normal"
                    }
                })
            })

        })
        eventBus.$on("deselectTopic", () => {
            let elements = Array.from(document.querySelectorAll('[class=topics]'));

            elements.forEach(el => {
                el.style.backgroundColor = ""
                el.style.borderBottom = ""
                el.style.fontWeight = "normal"
            })

            let elements2 = Array.from(document.querySelectorAll('[class=keynoters]'));
            elements2.forEach(el => {
                el.style.backgroundColor = ""
                el.style.borderBottom = ""
                el.style.fontWeight = "normal"
            })

            this.clicked.id = null
            this.clicked.type = null
        })

    },
    async beforeMount() {
        let configs = await import("./../../config_files/" + this.config.file);
        this.configs = configs.default;
    },
    mounted() {
        eventBus.$on("updateSpeakers", speakers => {
            this.speakers = speakers
        })
    },
    methods: {

        selectDocument(doc_id) {
            eventBus.$emit("selectDocument", doc_id);
        },
        selectSpeaker(speaker_id) {
            if (this.clicked.id == null || this.clicked.type != "SPEAKER")
                eventBus.$emit("selectSpeaker", speaker_id)
            else if (this.clicked.id == speaker_id)
                eventBus.$emit("deselectSpeaker")
            else {
                eventBus.$emit("deselectSpeaker")
                eventBus.$emit("selectSpeaker", speaker_id)
            }
        },
        selectTopic(topic) {
            if (this.clicked.id == null || this.clicked.type != "TOPIC")
                eventBus.$emit("selectTopic", topic)
            else if (this.clicked.id == topic)
                eventBus.$emit("deselectTopic")
            else {
                eventBus.$emit("deselectTopic")
                eventBus.$emit("selectTopic", topic)
            }
        },
        hoverSpeaker(speaker_id) {
            eventBus.$emit("hoverSpeaker", speaker_id, this)
        },
        leaveSpeaker(speaker_id) {
            eventBus.$emit("leaveSpeaker", this)
        }
    },
    watch: {
        document: {
            async handler(newVal, oldVal) {
                // eventBus.$emit("addDocument",newVal[0]._id)
            },
            deep: true,
        },
        documents: {
            async handler(newVal, oldVal) {
                this.docs = newVal
            },
            deep: true,
        },
    },
};

export default detailsComponent;