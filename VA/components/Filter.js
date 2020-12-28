import eventBus from "../eventBus.js";

var filterComponent = {
    template: `
    <div class="filter-component">
        <p v-if="document==null" style="color:orange;">** No Document **</p>
        <div v-if="document!=null" id="filter-body" class="filter-body">
            <p v-if="configs.Show_Date_Filter">Date Range</p>
            <div class="date-picker" v-if="configs.Show_Date_Filter">
                <input id="dateTimePicker1" v-model="first_date" class="datepicker" v-on:blur="changeFirtDate($event)">
                <p>-</p>
                <input id="dateTimePicker2" v-model="second_date" class="datepicker" v-on:blur="changeSecondDate($event)">
                <button @click="updateDocument()">add filter</button>
            </div>
            
            <hr v-if="configs.Show_Date_Filter && configs.Show_Main_Filter">

            <p v-if="configs.Show_Main_Filter">Filters:</p>

            <div class="conjunto" v-if="configs.Show_Main_Filter">
                <select id="filter1" v-model="first_filter">
                    <option disabled value="">Filter by:</option>
                    <option value="SPEAKER">Speaker</option>
                    <option value="TOPIC">Topic</option>
                    <option value="title">Title</option>
                    <option v-for="key in document.attributes_keys" :value="key">{{key}}</option>
                </select>

                <select id="filter2" v-model="second_filter">
                    <option disabled value="">Choose one:</option>
                    <option v-for="val in second_options" :value="val">{{val}}</option>
                </select>

                <button @click="addFilter()">add filter</button>
            </div>
    
            
            <div class="filters" style="height: 20px" v-if="configs.Show_Main_Filter">
                <p v-for="filter in filters">{{filter.value}}<span @click="removeFilter(filter)" style="padding: 1px;margin-left: 2px;border: 1px solid black;cursor:pointer">X</span></p>
            </div>

            <div class="reset">
                <button @click="resetFilters()">Reset Filters</button>
            </div>
            
            
        </div>
    </div>
    `,
    props: {
        documents: Array,
        config: Object,
    },
    data() {
        return {
            configs: null,
            filtered_docs: null,
            document: null,
            first_filter: "",
            second_filter: "",
            second_options: "",
            speakers: [],
            filters: [],
            titles: [],
            first_date: "",
            second_date: "",
            count:0
        };
    },
    created() {
        eventBus.$on("setDocument", (documents, el) => {
            
            
            if (el !== this) {

                this.filtered_docs = JSON.parse(JSON.stringify(documents))

                this.filtered_docs.sort((b, a) => new Date(b.date) - new Date(a.date));

                

                // console.log(this.filtered_docs)

                this.document = null;

                this.filtered_docs.forEach((_doc) => {
                    if (this.document == null) {
                        this.document = Object.assign({}, _doc);
                        this.document.boundaries = [];
                        this.titles.push(_doc.title)
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
            }

            if (this.count == 0) {
                this.$nextTick(() => {
            
                    if (this.document != null && this.configs.Show_Date_Filter) {
                        let instance = new dtsel.DTS('#dateTimePicker1',  {
                            direction: 'BOTTOM',
                            // dateFormat: "dd-mm-yyyy",
                        }); 
                        let instance2 = new dtsel.DTS('#dateTimePicker2',  {
                            direction: 'BOTTOM',
                            // dateFormat: "dd-mm-yyyy",
                        }); 

                        this.second_date=this.documents[0].date
                        this.first_date=this.documents[this.documents.length-1].date
                    }
                })
                this.count++
            }
        })
    },
    async beforeMount() {
        if (this.config) {
            let configs = await import("./../../config_files/" + this.config.file);
            this.configs = configs.default;
        }
    },
    mounted() {
        this.$nextTick(() => {
            

            // instance = new dtsel.DTS('#dateTimePicker',  {
            //     direction: 'BOTTOM'
            // }); 
        })
        
    },
    methods: {
        resetFilters() {
            this.first_filter =""
            this.second_filter = ""
            this.filters = []
            this.second_options = ""
            if (this.configs.Show_Date_Filter) {
                this.second_date=this.documents[0].date
                this.first_date=this.documents[this.documents.length-1].date
            }
            if (this.configs.Show_Main_Filter) {
                document.querySelector("#filter1").selectedIndex = 0
                document.querySelector("#filter2").selectedIndex = 0
            }
            eventBus.$emit("setDocument", this.documents,this)
        },
        changeFirtDate(e) {
            this.first_date=e.target.value
        },
        changeSecondDate(e) {
            this.second_date=e.target.value
        },
        addFilter() {

            if (this.first_filter && this.second_filter) {
                if (this.first_filter == "SPEAKER") {
                    let found = this.filters.find(f => f.key === "speaker" && f.value === this.second_filter)
                    if (found == undefined) {
                        this.filters.push({
                            key: "speaker",
                            value: this.second_filter
                        })
                    }
                } else if (this.first_filter == "TOPIC") {
                    let found = this.filters.find(f => f.key === "topic" && f.value === this.second_filter)
                    if (found == undefined) {
                        this.filters.push({
                            key: "topic",
                            value: this.second_filter
                        })

                    }
                } else if (this.first_filter == "title") {
                    let found = this.filters.find(f => f.key === "title" && f.value === this.second_filter)
                    if (found == undefined) {
                        this.filters.push({
                            key: "title",
                            value: this.second_filter
                        })
                    }
                } else {
                    let found = this.filters.find(f => f.key === this.first_filter && f.value === this.second_filter)
                    if (found == undefined) {
                        this.filters.push({
                            key: this.first_filter,
                            value: this.second_filter
                        })
                    }
                }
            }

            this.updateDocument()
        },
        removeFilter(filter) {
            let _filter = this.filters.find(f => JSON.stringify(f) === JSON.stringify(filter));
            this.filters.splice(this.filters.indexOf(_filter), 1);

            this.updateDocument()
        },
        updateDocument() {
            // console.log("update document")
            

            if (this.filters.length > 0) {
                let list = []
                this.filters.forEach(filter => {

                    let aux = []
                    if (filter.key == "speaker") {
                        aux = this.documents.filter(doc => doc.speakers.filter(spk => spk.name == filter.value).length > 0)
                        list = [...new Set([...list, ...aux, ])];
                    } else if (filter.key == "topic") {
                        aux = this.documents.filter(doc => doc.topics.includes(filter.value))
                        list = [...new Set([...list, ...aux, ])];
                    } else if (filter.key == "title") {
                        aux = this.documents.filter(doc => doc.title == filter.value)
                        list = [...new Set([...list, ...aux, ])];
                    } else {
                        aux = this.documents.filter(doc => doc.speakers.filter(spk => {
                            if (Object.keys(spk.attributes[0]).includes(filter.key)) {
                                return spk.attributes[0][filter.key] == filter.value
                            }
                        }).length > 0)
                        list = [...new Set([...list, ...aux, ])];
                    }
                })

                this.filtered_docs = [...new Set([...list])]
            } else {
                this.filtered_docs = this.documents
            }

            if (this.configs.Show_Date_Filter) {
                let doccys = this.filtered_docs.filter(doc=> new Date(doc.date)>=new Date(this.first_date) && new Date(doc.date)<=new Date(this.second_date))
                eventBus.$emit("setDocument", doccys, this)
            } else {
                eventBus.$emit("setDocument", this.filtered_docs, this)
            }
            
            // console.log(doccys)
            // console.log(this.filtered_docs)

            
        }
    },
    watch: {
        first_filter(newVal, oldVal) {
            if (newVal == "SPEAKER") this.second_options = this.speakers
            else if (newVal == "TOPIC") this.second_options = this.document.topics
            else if (newVal == "title") this.second_options = this.titles
            else if(newVal){
                let x = this.document.attributes.filter(attr => attr.key == newVal)
                this.second_options = [...new Set([
                    ...x[0].values
                ])]
            }
        },
        first_date(newVal, oldVal) {
            // console.log(newVal+" - "+ oldVal)
            if (new Date(newVal) > new Date(this.second_date)) 
                d3.selectAll(".datepicker").style("border", "1px solid red")
            else {
                d3.selectAll(".datepicker").style("border", "1px solid #102e4a")
                // if(newVal!=oldVal && oldVal!=null)
                    // this.updateDocument()
            }  
        },
        second_date(newVal, oldVal) {
            if (new Date(newVal) < new Date(this.first_date))
                d3.selectAll(".datepicker").style("border", "1px solid red")
            else {
                d3.selectAll(".datepicker").style("border", "1px solid #102e4a")
                // if(newVal!=oldVal&& oldVal!=null)
                    // this.updateDocument()
            }
        }
    },
};

export default filterComponent;