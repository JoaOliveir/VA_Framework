//Import Vue.js
//development version, includes helpful console warnings
import "https://cdn.jsdelivr.net/npm/vue/dist/vue.js"

//production version, optimized for size and speed
// import "https://cdn.jsdelivr.net/npm/vue"

//Import D3.js
import "https://d3js.org/d3.v5.js"

//d3 tooltip lib
// import "./d3-tip.js"

//Import resize detector
import "./element-resize-detector.min.js"


//datePicker
import "./dtsel.js"

Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('-');
};


// import "https://cdn.jsdelivr.net/npm/d3-flextree@2.0.0/build/d3-flextree.min.js"

// var my_awesome_script = document.createElement('script');
// my_awesome_script.setAttribute('src', 'https://d3js.org/d3.v5.js');
// document.head.appendChild(my_awesome_script);

// var my_awesome_script_2 = document.createElement('script');
// my_awesome_script.setAttribute('src', 'https://cdn.jsdelivr.net/npm/d3-flextree@2.0.0/build/d3-flextree.min.js');
// document.head.appendChild(my_awesome_script_2);


//Append Stylesheet
var head = document.getElementsByTagName('head')[0];
var s = document.createElement('link');
s.setAttribute("rel", "stylesheet")
s.setAttribute('type', 'text/css');
s.setAttribute("href", "./VA/styles/styles.css")
head.appendChild(s);



import mapComponent from "./components/Argument_Map.js"
import textComponent from "./components/Text.js"
import networkComponent from "./components/Network_Graph.js"
// import timelineComponent from "./components/Timeline.js"
import detailsComponent from "./components/Details.js"
import minimapComponent from "./components/Minimap.js"
import calendarComponent from "./components/Calendar.js"
import donutChartComponent from "./components/Donut_Chart.js"
import fingerprintComponent from "./components/Fingerprint.js"
// import selectionComponent from "./components/Selection.js"
import positioningComponent from "./components/Positioning.js"
// import searchComponent from "./components/Search.js"
// import selectedDocumentsComponent from "./components/Selected_Documents.js"
import CalendarHeatmapComponent from "./components/Calendar_Heatmap.js"
import FilterComponent from "./components/Filter.js"

// import testComponent from "./VA/Test.js"

Vue.component("map-component", mapComponent)
Vue.component("text-component", textComponent)
Vue.component("network-component", networkComponent)
// Vue.component("timeline-component", timelineComponent)
Vue.component("details-component", detailsComponent)
Vue.component("minimap-component", minimapComponent)
Vue.component("calendar-component", calendarComponent)
Vue.component("donut-chart-component", donutChartComponent)
Vue.component("fingerprint-component", fingerprintComponent)
// Vue.component("selection-component", selectionComponent)
Vue.component("positioning-component", positioningComponent)
// Vue.component("search-component", searchComponent)
// Vue.component("selected-documents-component", selectedDocumentsComponent)
Vue.component("calendar-heatmap-component", CalendarHeatmapComponent)
Vue.component("filter-component", FilterComponent)

// Vue.component("test-component", testComponent)

import eventBus from './eventBus.js'

const vue_instance = new Vue({
    data() {
        return {
            // show_documents_box: false,
            el:null,
            documents: null,
            speakers: null,
            // colors: ["#7fe5f0", "#7fe5f0", "#5ac18e", "#f7347a", "#ffa500", "#ff7373"],
            // doc_selected: null,
            // open_docs: [],
            clicked: {
                id: null,
                type: null,
                node: null
            }
        }
    },
    created() {
        eventBus.$on("selectDocument", doc_id => {
            if (doc_id != null) {
                this.$nextTick(() => {
                    // let _document = this.documents.find(doc => doc._id == doc_id)

                    // let previous_speakers = this.speakers

                    // this.speakers = []

                    // _document.annotations.nodes.forEach(node => {

                    //     let _speaker = this.speakers.find(speaker => speaker.id == node.speaker_id)

                    //     if (_speaker) {
                    //         _speaker.count += 1
                    //     } else {
                    //         let found = _document.speakers.find(speaker => speaker.id == node.speaker_id)
                    //         found.count = 1
                    //         this.speakers.push(found)
                    //     }
                    // })

                    // function compare(a, b) {
                    //     if (a.count < b.count) {
                    //         return 1;
                    //     }
                    //     if (a.count > b.count) {
                    //         return -1;
                    //     }
                    //     return 0;
                    // }

                    // this.speakers.sort(compare);

                    // let i = 0
                    // this.speakers.forEach(speaker => {
                    //     if (i == 2) return
                    //     else {
                    //         if (previous_speakers) {
                    //             let old_speaker = previous_speakers.find(_speaker => _speaker.id == speaker.id)
                    //             if (old_speaker) {
                    //                 speaker.color = old_speaker.color
                    //             } else {
                    //                 let color = ""
                    //                 let flag = 1
                    //                 while (flag) {
                    //                     color = this.colors[Math.floor(Math.random() * this.colors.length)];
                    //                     let checker = this.speakers.find(_speaker => _speaker.color == color)
                    //                     if (checker) flag = 1
                    //                     else flag = 0
                    //                 }
                    //                 speaker.color = color
                    //             }
                    //         } else {
                    //             let color = ""
                    //             let flag = 1
                    //             while (flag) {
                    //                 color = this.colors[Math.floor(Math.random() * this.colors.length)];
                    //                 let checker = this.speakers.find(_speaker => _speaker.color == color)
                    //                 if (checker) flag = 1
                    //                 else flag = 0
                    //             }
                    //             speaker.color = color
                    //         }
                    //     }
                    //     i++
                    // })

                    // // console.log(this.speakers)

                    // // _document.speakers.forEach(speaker => {
                    // //     let speaker_obj = JSON.parse(JSON.stringify(speaker))
                    // //     let random_index = Math.floor(Math.random() * this.colors.length)
                    // //     speaker_obj.color = this.colors[random_index]
                    // //     this.colors.splice(random_index, 1);
                    // //     this.speakers.push(speaker_obj)
                    // // });


                    // eventBus.$emit("updateSpeakers", this.speakers)


                    this.$nextTick(() => {
                        this.$nextTick(() => {
                            if (this.clicked.type == "SPEAKER")
                                eventBus.$emit("selectSpeaker", this.clicked.id)
                            else if (this.clicked.type == "TOPIC")
                                eventBus.$emit("selectTopic", this.clicked.id)
                            else if (this.clicked.type == "NODE") {
                                eventBus.$emit("deselectSpeaker")
                                eventBus.$emit("deselectTopic")
                                eventBus.$emit("deselectNode")
                            }
                        })
                    })
                })
            }

        })

        eventBus.$on("selectSpeaker", speaker_id => {
            this.clicked.id = speaker_id
            this.clicked.type = "SPEAKER"
        })
        eventBus.$on("deselectSpeaker", () => {
            this.clicked.id = null
            this.clicked.type = null
        })

        eventBus.$on("selectTopic", topic => {
            this.clicked.id = topic
            this.clicked.type = "TOPIC"
        })
        eventBus.$on("deselectTopic", () => {
            this.clicked.id = null
            this.clicked.type = null
        })

        eventBus.$on("selectNode", node => {
            this.clicked.id = node.id
            this.clicked.type = "NODE"
        })
        eventBus.$on("deselectNode", () => {
            this.clicked.id = null
            this.clicked.type = null
        })
    },
    mounted() {
        // eventBus.$on("updateSelectedDocument", doc => {
        //     this.doc_selected = doc
        // })



        // fetchAsync(`http://localhost:8000/api/document`).then(documents => {
        //     this.available_documents = documents
        //     // this.available_documents = documents.sort((a, b) => new Date(a.date) - new Date(b.date))
        // }).catch(err => console.log(err))
    },
    methods: {
        setDocuments(docs) {
            this.documents = docs
        }
        // toggleDocumentsBox() {
        //     this.show_documents_box = !this.show_documents_box
        // }
        // openDocument(el, doc) {

        //     el.target.disabled = true
        //     this.doc_selected = doc;
        //     this.open_docs.push(this.doc_selected)
        //     const index = this.available_documents.indexOf(doc);
        //     if (index > -1) {
        //         this.available_documents.splice(index, 1);
        //     }
        //     eventBus.$emit("updateOpenDocs", this.open_docs)
        // }
    },
    watch: {
        // open_docs: {
        //     async handler(newVal, oldVal) {
        //         eventBus.$emit("updateOpenDocs", newVal)
        //     },
        //     deep: true,
        // },
        // doc_selected: {
        //     async handler(newVal, oldVal) {
        //         eventBus.$emit("updateSelectedDocument", newVal)
        //     },
        //     deep: true,
        // // },
        // el: {
        //     async handler(newVal, oldVal) {
        //         eventBus.$emit("updateEl", newVal)
        //     },
        //     deep: true,
        // },
        documents: {
            async handler(newVal, oldVal) {
                if (newVal != oldVal) {
                    // eventBus.$emit("addDocument", newVal[5]._id)
                    eventBus.$emit("setDocument", newVal, this)
                }
            },
            deep: true,
        },

    }
});

// vue_instance.$mount(vue_instance.el);

export default vue_instance