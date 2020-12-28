import eventBus from "../eventBus.js";

var calendarComponent = {
    template: `
    <div v-if="configs" class="calendar-component">
        <div v-if="configs.showHeader" class="calendar-header">
            <h3>{{configs.title}}</h3>
        </div>
        <p v-if="document==null" style="color:orange;">** No Document **</p>
        <div v-if="document!=null" class="calendar-body">
            <div id="calendar" class="calendar">
                <div class="calendar-btn month-btn" @click="showMonths=!showMonths">
                    <span id="curMonth"></span>
                    <div v-show="showMonths" id="months" class="months dropdown"></div>
                </div>

                <div class="calendar-btn year-btn" @click="showYears=!showYears">
                    <span id="curYear"></span>
                    <div v-show="showYears" id="years" class="years dropdown"></div>
                </div>

                <div class="clear"></div>

                <div class="calendar-dates">
                    <div class="days">
                        <div class="day label">SUN</div>
                        <div class="day label">MON</div>
                        <div class="day label">TUE</div>
                        <div class="day label">WED</div>
                        <div class="day label">THU</div>
                        <div class="day label">FRI</div>
                        <div class="day label">SAT</div>

                        <div class="clear"></div>
                    </div>

                    <div id="calendarDays" class="days">
                    </div>
                </div>
            </div>
        </div>
        
        <div v-if="configs.showFooter && docs!=null" class="calendar-footer">
            <div class="open-docs" v-for="document in docs" :key="document._id" :name="document._id" type="calendar-footer-box" @click="selectDocument(document._id)" selected="false">
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
            months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            month: null,
            year: null,
            showMonths: false,
            showYears: false,
            docs_of_month: [],
            selected_docs_: []
        };
    },
    created() {
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
                    } else {
                        _doc.annotations.nodes.forEach((_node) => {
                            let new_node = Object.assign({}, _node);

                            new_node.ranges[0] += 2 + this.document.body.length;
                            new_node.ranges[1] += 2 + this.document.body.length;
                            this.document.annotations.nodes.push(new_node);
                        });

                        this.document._ids

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
                    this.loadCalendar()
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
                this.$nextTick(() => {
                    if (this.document) {
                        this.loadCalendar()
                    }
                });
            });
        });
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
        loadCalendar() {

            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            var startYear = 2000;
            var endYear = 2020;
            var month = 0;
            var year = 0;
            var selectedDays = new Array();
            var mousedown = false;
            var mousemove = false;


            function loadCalendarMonths(comp) {
                for (var i = 0; i < months.length; i++) {
                    var doc = document.createElement("div");
                    doc.innerHTML = months[i];
                    doc.classList.add("dropdown-item");

                    doc.onclick = (function () {
                        var selectedMonth = i;

                        return function () {
                            month = selectedMonth;
                            comp.month = month
                            document.getElementById("curMonth").innerHTML = months[month];
                            loadCalendarDays();
                            return month;
                        }
                    })();

                    document.getElementById("months").appendChild(doc);
                }
            }

            function loadCalendarYears(comp) {
                document.getElementById("years").innerHTML = "";

                for (var i = startYear; i <= endYear; i++) {
                    var doc = document.createElement("div");
                    doc.innerHTML = i;
                    doc.classList.add("dropdown-item");

                    doc.onclick = (function () {
                        var selectedYear = i;

                        return function () {
                            year = selectedYear;
                            comp.year = year
                            document.getElementById("curYear").innerHTML = year;
                            loadCalendarDays();
                            return year;
                        }
                    })();

                    document.getElementById("years").appendChild(doc);
                }
            }

            function loadCalendarDays() {
                document.getElementById("calendarDays").innerHTML = "";

                var tmpDate = new Date(year, month, 0);
                var num = daysInMonth(month, year);
                var dayofweek = tmpDate.getDay(); // find where to start calendar day of week

                for (var i = 0; i <= dayofweek; i++) {
                    var d = document.createElement("div");
                    d.classList.add("day");
                    d.classList.add("blank");
                    document.getElementById("calendarDays").appendChild(d);
                }

                for (var i = 0; i < num; i++) {
                    var tmp = i + 1;
                    var d = document.createElement("div");
                    d.id = "calendarday_" + tmp;
                    d.className = "day";
                    d.innerHTML = tmp;
                    d.dataset.day = tmp;

                    // d.addEventListener('click', function () {
                    //     this.classList.toggle('selected');

                    //     if (!selectedDays.includes(this.dataset.day))
                    //         selectedDays.push(this.dataset.day);

                    //     else
                    //         selectedDays.splice(selectedDays.indexOf(this.dataset.day), 1);
                    // });

                    // d.addEventListener('mousemove', function (e) {
                    //     e.preventDefault();
                    //     if (mousedown) {
                    //         this.classList.add('selected');

                    //         if (!selectedDays.includes(this.dataset.day))
                    //             selectedDays.push(this.dataset.day);
                    //     }
                    // });

                    // d.addEventListener('mousedown', function (e) {
                    //     e.preventDefault();
                    //     mousedown = true;
                    // });

                    // d.addEventListener('mouseup', function (e) {
                    //     e.preventDefault();
                    //     mousedown = false;
                    // });

                    document.getElementById("calendarDays").appendChild(d);
                }

                var clear = document.createElement("div");
                clear.className = "clear";
                document.getElementById("calendarDays").appendChild(clear);
            }

            function daysInMonth(month, year) {
                var d = new Date(year, month + 1, 0);
                return d.getDate();
            }

            var date = new Date(this.document.date);

            month = date.getMonth();
            year = date.getFullYear();
            document.getElementById("curMonth").innerHTML = months[month];
            document.getElementById("curYear").innerHTML = year;
            loadCalendarMonths(this);
            loadCalendarYears(this);
            loadCalendarDays();

            this.month = month;
            this.year = year;

            this.$nextTick(() => {
                this.selected_docs_.forEach(doc => {
                    let doc_date = new Date(doc.date);
                    // console.log(doc_date)
                    Array.from(document.getElementsByClassName("day")).forEach(cal_day => {
                        if (doc_date.getMonth() == this.month && doc_date.getDate() == cal_day.id.split("_")[1]) {
                            cal_day.style.backgroundColor = "#102e4a"
                            cal_day.style.color = "white"
                            cal_day.style.fontWeight = "bold"
                        }
                    })
                })
            })

        },

    },
    watch: {
        documents: {
            async handler(newVal, oldVal) {
                // this.document = newVal[0]
                eventBus.$emit("addDocument",newVal[0]._id)
                
            },
            deep: true,
        },
        document(newVal) {
            if (newVal != null) {
                // this.loadCalendar()
                // var date = new Date(this.document.date);

                // document.querySelectorAll('.day').forEach(el => {
                //     if (el.getAttribute("data-day") == date.getDate() && date.getMonth() == this.month && date.getFullYear() == this.year) {
                //         el.style.borderColor = "#102e4a"
                //         el.style.color = "#102e4a"
                //         el.style.fontWeight = "bold"
                //     } else {
                //         el.style.borderColor = "#102e4a"
                //         el.style.color = "#102e4a"
                //         el.style.fontWeight = "normal"
                //     }
                // })

                // this.$nextTick(() => {
                //     document.querySelectorAll('.docs_in_calendar').forEach(el => {
                //         if (el.getAttribute("doc_id") == this.document._id) {
                //             el.style.borderColor = "#102e4a"
                //             el.style.color = "#102e4a"
                //             el.style.fontWeight = "bold"
                //         } else {
                //             el.style.borderColor = "#102e4a"
                //             el.style.color = "#102e4a"
                //             el.style.fontWeight = "normal"
                //         }
                //     })
                // })
            }

        },
        month() {

            this.docs_of_month = []

            this.documents.forEach(_doc => {
                let doc_month = new Date(_doc.date).getMonth()
                let doc_year = new Date(_doc.date).getFullYear()
                if (doc_month == this.month && doc_year == this.year)
                    this.docs_of_month.push(_doc)
            })

            var date = new Date(this.document.date);

            document.querySelectorAll('.day').forEach(el => {
                if (el.getAttribute("data-day") == date.getDate() && date.getMonth() == this.month && date.getFullYear() == this.year) {
                    el.style.borderColor = "#102e4a"
                    el.style.color = "#102e4a"
                    el.style.fontWeight = "bold"
                } else {
                    el.style.borderColor = "#102e4a"
                    el.style.color = "#102e4a"
                    el.style.fontWeight = "normal"
                }
            })

            this.$nextTick(() => {
                document.querySelectorAll('.docs_in_calendar').forEach(el => {
                    if (el.getAttribute("doc_id") == this.document._id) {
                        el.style.borderColor = "#102e4a"
                        el.style.color = "#102e4a"
                        el.style.fontWeight = "bold"
                    } else {
                        el.style.borderColor = "#102e4a"
                        el.style.color = "#102e4a"
                        el.style.fontWeight = "normal"
                    }

                })
            })
        },
        year() {
            this.docs_of_month = []

            this.documents.forEach(_doc => {
                let doc_month = new Date(_doc.date).getMonth()
                let doc_year = new Date(_doc.date).getFullYear()
                if (doc_month == this.month && doc_year == this.year)
                    this.docs_of_month.push(_doc)
            })

            var date = new Date(this.document.date);

            document.querySelectorAll('.day').forEach(el => {
                if (el.getAttribute("data-day") == date.getDate() && date.getMonth() == this.month && date.getFullYear() == this.year) {
                    el.style.borderColor = "#102e4a"
                    el.style.color = "#102e4a"
                    el.style.fontWeight = "bold"
                } else {
                    el.style.borderColor = "#102e4a"
                    el.style.color = "#102e4a"
                    el.style.fontWeight = "normal"
                }
            })

            this.$nextTick(() => {
                document.querySelectorAll('.docs_in_calendar').forEach(el => {
                    if (el.getAttribute("doc_id") == this.document._id) {
                        el.style.borderColor = "#102e4a"
                        el.style.color = "#102e4a"
                        el.style.fontWeight = "bold"
                    } else {
                        el.style.borderColor = "#102e4a"
                        el.style.color = "#102e4a"
                        el.style.fontWeight = "normal"
                    }

                })
            })
        }

    },
};

export default calendarComponent;