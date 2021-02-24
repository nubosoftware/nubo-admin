<template>
  <v-card color="bg">
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
    </v-list>
    <v-card v-else color="bg">
      <v-card-title>
        {{ reportName }}
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
      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading"
        class="ma-4 bg"
      >
      <template v-slot:item.Insert_Time="{ item }">
                      {{ moment(item.Insert_Time).format("LLL") }}
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

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

const moment = require("moment");

export default {
  name: "Home",

  data: () => ({
    selectedItem: -1,
    items: [],
    headers: [],
    rows: [],
    loading: true,
    snackbarSave: false,
    snackbarText: "",
    reportCode: null,
    moment,
    appData,
  }),
  methods: {
    openReport: function (item) {
      console.log("Open report: " + item);
      //this.reportCode = item.reportCode;
      this.$router.push("/Reports/" + item.reportCode);
      //this.refresh();
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
      for (let row = 0; row < this.rows.length; row++) {
        let keysAmount = Object.keys(this.rows[row]).length;
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
        }
      });
      bcItems.push({
        text: this.reportName,
        to: "/Reports/" + this.reportCode,
        disabled: false,
      });
      this.$emit("updatePage", bcItems);
      this.loading = true;
      appUtils
        .get({
          url: "api/reports/" + this.reportCode,
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
                text: key,//this.$t(element),
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
      this.refresh();
    }
  },
  created: function () {
    this.reportCode = this.$route.params.reportCode;

    this.items = [
      {
        text: this.$t("Active users"),
        icon: "mdi-account-check",
        reportCode: "3",
      },
      { text: this.$t("App list by user"), icon: "mdi-apps", reportCode: "1" },
      {
        text: this.$t("Number of users per platform"),
        icon: "mdi-account-multiple-outline",
        reportCode: "2",
      },
      {
        text: this.$t("App usage by user"),
        icon: "mdi-book-clock",
        reportCode: "4",
      },
    ];
    this.refresh();
  },
};
</script>
