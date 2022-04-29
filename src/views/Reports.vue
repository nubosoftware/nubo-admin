<template>
  <v-card color="bg">
    <!--
    <v-list v-if="!reportCode || reportCode == ''" color="bg">
      <v-subheader>{{ $t("Reports") }}</v-subheader>
      <v-list-item-group v-model="selectedItem" color="primary">
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          @click="openReport(item)"
        >
          <v-list-item-icon>
            <v-icon v-text="item.icon"></v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title v-text="item.text"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>-->
    <v-card  
      color="bg"
      v-if="!reportCode || reportCode == ''"
    >
    <v-card-title>
        {{ $t("Reports") }}
      </v-card-title>
    <v-data-table
       color="bg"        
        :headers="reportsHeaders"
        :items="items"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        @click:row="openReport"
        class="ma-4 bg"
      >
      <template v-slot:item.text="{ item }">
        <v-icon v-text="item.icon"></v-icon> 
        &nbsp;&nbsp;{{ item.text}}                  
      </template>
      <template v-slot:item.icon="{ item }">
        <v-icon v-text="item.icon"></v-icon>                     
      </template>
    </v-data-table>
    </v-card>
    <v-card v-else color="bg">
      <v-card-title>
        {{ reportName }}
      </v-card-title>
      <v-card-title
        v-if="hasDateRange"
      >
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select             
              :items="dateRanges"
              :label="$t('Time Period')"              
              :value="selectedDateRange"
              @change="dateRangeChanged"
            ></v-select>
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-menu
             v-if="customdDateRange"
            v-model="fromMenu"
            :close-on-content-click="false"
            :nudge-right="40"
            transition="scale-transition"
            offset-y
            min-width="auto"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="fromDate"
                label="From"
                prepend-icon="mdi-calendar"
                readonly
                v-bind="attrs"
                v-on="on"                
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="fromDate"
              @input="fromMenu = false"
            ></v-date-picker>
            </v-menu>
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-menu
            v-if="customdDateRange"
            v-model="toMenu"
            :close-on-content-click="false"
            :nudge-right="40"
            transition="scale-transition"
            offset-y
            min-width="auto"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="toDate"
                label="To"
                prepend-icon="mdi-calendar"
                readonly
                v-bind="attrs"
                v-on="on"                
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="toDate"
              @input="toMenu = false"
            ></v-date-picker>
            </v-menu>
          </v-col>
        </v-row>        
      </v-card-title>
      <v-card-title>       
        <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn color="secondary" @click="downloadCSV()">
          {{ $t("Download CSV") }}
          <v-icon
              right
              dark
            >
              mdi-microsoft-excel
      </v-icon>
        </v-btn>
      </v-card-title>
      <v-card-title  v-if="hasChart" >
        
        <bar-chart :chart-data="chartData" :options="chartOptions" :width="1000" :height="300" ></bar-chart>
       
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading"
        :search="search"
        :options.sync="options"
        @update:options="updateOptions"       
        multi-sort        
        @current-items="getFiltered"
        class="ma-4 bg"
      >
      <template v-slot:item.Insert_Time="{ item }">
                      {{ moment(item.Insert_Time).format("LLL") }}
                    </template>
      <template v-slot:item.Start_Time="{ item }">
                      {{ moment(item.Start_Time).format("LLL") }}
                    </template>
      
     <template v-slot:item.End_Time="{ item }">
                      {{ moment(item.End_Time).format("LLL") }}
                    </template>

       <template v-slot:item.Session_Duration="{ item }">                    
                      {{ getHHMM(item.Session_Duration) }}
                    </template>
      <template v-slot:item.Event_Time="{ item }">
                      {{ moment(item.Event_Time).format("LLL") }}
                    </template>           
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbarSave" :timeout="2000">
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn color="info" text v-bind="attrs" @click="snackbarSave = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>
<style>
  .small {
    max-width: 600px;
    margin:  150px auto;    
  }
</style>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";
import BarChart from './charts/barChart';

const moment = require("moment");

export default {
  name: "Home",
  components: {
      BarChart,    
    },
  data: () => ({
    selectedItem: -1,
    items: [],
    reportsHeaders: [],
    sortBy: "text",
    sortDesc: false,
    headers: [],
    rows: [],
    options: {},
    loading: true,
    snackbarSave: false,
    snackbarText: "",
    reportCode: null,
    search: "",
    moment,
    appData,
    filteredItems: "",
    hasDateRange: false,
    dateRanges: [],
    selectedDateRange: "",
    customdDateRange: false,
    fromDate: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substr(0, 10),
    fromMenu: false,
    toDate: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substr(0, 10),
    toMenu: false,
    hasChart: false,
    chartData: {},
    chartOptions: {
      responsive: true,
      aspectRatio: 2 // width/height
    },
  }),
  methods: {
    openReport: function (item) {
      console.log("Open report: " + item);
      //this.reportCode = item.reportCode;
      this.$router.push("/Report/" + item.reportCode);
      //this.refresh();
    },
    applyDateRange: function(val) {
      let item;
      for (const checkitem of this.dateRanges) {
        if (checkitem.value == val) {
          item = checkitem;
          break;
        }
      }
      if (!item) {
        console.error(`Error date range not found for value: ${val}`);
        return;
      }
      if (item.dvalue) {
        this.fromDate = item.dvalue.from;
        this.toDate = item.dvalue.to;
        this.customdDateRange = false;        
      } else {
        this.customdDateRange = true;
      }
      this.selectedDateRange = val;
      console.log(`applyDateRange. from ${this.fromDate}, to: ${this.toDate}, val: ${val}, selectedDateRange: ${this.selectedDateRange}`);
    },
    dateRangeChanged: function(val) {

       this.applyDateRange(val);
       this.refresh();
    },
    dateChanged: function() {
      if (this.customdDateRange) {
        this.refresh();
      }
    },
    updateOptions() {
      console.log(`Update options: ${JSON.stringify(this.options,null,2)}`);
      this.savePage();
    },
    getFiltered(arr){
      this.filteredItems = arr;
    },
    downloadCSV: function () {
      console.log("downloadCSV..");

      // remove old csv
      let node = document.querySelector("#download-csv");
      if (node) {
        document.body.removeChild( node );
      }
      let csv = "";

      let keysAmount = this.headers.length;
      let keysCounter = 0;
      this.headers.forEach((head) => {
        csv += head.text + (keysCounter + 1 < keysAmount ? "," : "");
        keysCounter++;
      });
      csv += "\r\n";

      // Loop the array of objects
      for (let row = 0; row < this.filteredItems.length; row++) {
        let keysAmount = Object.keys(this.filteredItems[row]).length;
        let keysCounter = 0;
        this.headers.forEach((head) => {
          let value = this.rows[row][head.value];
          console.log("head.value: "+head.value);
          if (head.value == "Insert_Time") {
            value = moment(value).format("LLL");
          }
          csv +=
            '"' + value + '"' + (keysCounter + 1 < keysAmount ? "," : "\r\n");
          keysCounter++;
        });
        keysCounter = 0;
      }

      // Once we are done looping, download the .csv by creating a link
      let link = document.createElement("a");
      link.id = "download-csv";
      link.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(csv)
      );
      link.setAttribute("download", this.reportName+".csv");
      document.body.appendChild(link);
      document.querySelector("#download-csv").click();

    },
    getHHMM: function(sec) {      
      return `${parseInt(sec/60)}:${(sec % 60).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })}`;
    },
    savePage: function () {
      //console.log(`options: ${JSON.stringify(this.options,null,2)}`);
      appUtils.savePageData(`report_${this.reportCode}`,this,['options','search','selectedDateRange','fromDate','toDate']);
    },
    refresh: function () {
      let bcItems = [
        {
          text: this.$t("control-panel"),
          to: "/",
          disabled: false,
        },
        {
          text: this.$t("Reports"),
          to: "/Reports",
          disabled: false,
        },
      ];
      if (!this.reportCode || this.reportCode == "") {
        this.$emit("updatePage", bcItems);
        return;
      }

      
      

      this.items.forEach((element) => {
        if (element.reportCode == this.reportCode) {
          this.reportName = element.text;
          this.hasDateRange = element.hasDateRange;
          this.hasChart = element.hasChart;
        }
      });
      let getParams = {};
      if (this.hasDateRange) {        
        if (!this.selectedDateRange) {
          this.selectedDateRange = this.dateRanges[3].value;
          this.applyDateRange(this.selectedDateRange);        
        }
        
        getParams = {
          from: this.fromDate,
          to:this.toDate
        };
      }
      bcItems.push({
        text: this.reportName,
        to: "/Report/" + this.reportCode,
        disabled: false,
      });
      this.$emit("updatePage", bcItems);
      this.loading = true;
      appUtils
        .get({
          url: "api/reports/" + this.reportCode,
          params: getParams
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.loading = false;
            this.rows = [];
            this.headers = [];
            response.data.headers.forEach((element) => {
              let key = element.replace(/ /g, "_");
              let item = {
                text: element,//key,//this.$t(element),
                value: key,
              };
              this.headers.push(item);
            });
            response.data.values.forEach((element) => {
              let item = {};
              element.forEach((value, index) => {
                let key = response.data.headers[index].replace(/ /g, "_");
                /*if (key == "Insert Time") {
                  value = moment(value).format("LLL");
                }*/
                item[key] = value;
              });
              this.rows.push(item);
            });
            if (this.hasChart) {
              this.chartOptions= {
                /*responsive: true,
                aspectRatio: 2,
                width: null,
                height: null,*/
                scales: {
                    yAxes: [{
                        ticks: {
                            suggestedMin: 0,
                            //suggestedMax: maxSession
                        }
                    }]
                }
              };
              let data = response.data.values.map((row) => row[1]);
              let labels = response.data.values.map((row) => row[0]);
              let colors = this.$vuetify.theme.themes.light;
              this.chartData = {
                datasets: [{
                    data: data,
                    backgroundColor: colors.primary,
                    label: this.headers[1].text,
                    fill: false,
                }],
                labels: labels,                              
              };
              this.height = 100;
              //console.log(`chartData: ${JSON.stringify(this.chartData,null,2)}`);
            }
            this.savePage();
                        
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");
          }
        })
        .catch((error) => {
          console.log(error);
          this.$router.push("/Login");
        });
    },
  },  
  watch:{
    $route (to){
      console.log(to);
      this.reportCode = to.params.reportCode;
      if (this.reportCode) {
        appUtils.loadPageData(`report_${this.reportCode}`,this);
        if (this.selectedDateRange) {
          this.applyDateRange(this.selectedDateRange);
        }
      }
      this.refresh();
    },
    toDate (val) {      
      if (this.customdDateRange) {
        console.log(`toDate watch: ${val}`);
        this.refresh();
      }
    },
    fromDate (val) {      
      if (this.customdDateRange) {
        console.log(`fromDate watch: ${val}`);
        this.refresh();
      }
    },
    search (val) {
      console.log(`search watch: ${val}`);
      this.savePage();
    }
  },
  created: function () {   
    this.reportCode = this.$route.params.reportCode;

    let nowDate = moment().format('YYYY-MM-DD');
    this.dateRanges = [
      { value: "this_day", text: "Today", dvalue: {from: nowDate, to: nowDate}},
      { value: "last_7_days", text: "Last 7 days", dvalue: {from: moment().subtract(7, 'days').format('YYYY-MM-DD'), to: nowDate}},
      { value: "this_month", text: "This month", dvalue: {from: moment().startOf('month').format('YYYY-MM-DD'), to: nowDate}},
      { value: "last_month", text: "Last month", dvalue: {from: moment().subtract(1, 'months').format('YYYY-MM-DD'), to: nowDate}},
      { value: "this_year", text: "This year", dvalue: {from: moment().startOf('year').format('YYYY-MM-DD'), to: nowDate}},
      { value: "last_12_months", text: "Last 12 months", dvalue: {from: moment().subtract(12, 'months').format('YYYY-MM-DD'), to: nowDate}},
      { value: "custom", text: "Custom" },
    ];

    if (this.reportCode) {
      appUtils.loadPageData(`report_${this.reportCode}`,this);
      if (this.selectedDateRange) {
          this.applyDateRange(this.selectedDateRange);
      }
    }
    
    this.reportsHeaders = [      
      { text: this.$t("Report"), value: "text" },     
    ];
    this.items = [
      {
        text: this.$t("Blocked/Disabled Logins"),
        icon: "mdi-account-off",
        reportCode: "8",
        hasDateRange: true,
        hasChart: false,
      },
      {
        text: this.$t("Active users"),
        icon: "mdi-account-check",
        reportCode: "3",
        hasDateRange: false,
      },
      { text: this.$t("App list by user"), icon: "mdi-apps", reportCode: "1" },
      {
        text: this.$t("Number of users per platform"),
        icon: "mdi-account-multiple-outline",
        reportCode: "2",
        hasDateRange: false,
      },
      {
        text: this.$t("App usage by user"),
        icon: "mdi-book-clock",
        reportCode: "4",
        hasDateRange: false,
      },
      {
        text: this.$t("Session Report"),
        icon: "mdi-clipboard-list-outline",
        reportCode: "5",
        hasDateRange: true,
      },
      {
        text: this.$t("Daily Active Sessions"),
        icon: "mdi-calendar-multiple-check",
        reportCode: "6",
        hasDateRange: true,
        hasChart: true,
      },
      {
        text: this.$t("Daily Active Users"),
        icon: "mdi-account-details",
        reportCode: "7",
        hasDateRange: true,
        hasChart: true,
      },
    ];
    

    
    this.refresh();
  },
};
</script>
