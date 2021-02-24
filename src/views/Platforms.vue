<template>
  <v-card color="bg">
    <v-card-title>{{$t("Platforms")}}</v-card-title>
    <v-data-table
      :headers="headers"
      :items="rows"
      :items-per-page="20"
      :loading="loading"
      
      class="elevation-1 ma-4 bg"
    >
      <template v-slot:top>
        <v-toolbar
          flat
          color="bg"
        >
          <v-btn
                color="primary"
                dark
                class="mb-2"
                @click="startNew"
              >
                {{$t("Start New Platform")}}
              </v-btn>
        </v-toolbar>
      </template>
      <template v-slot:item.status="{ item }">
        <v-chip
          v-if="item.status == 'running'"
          class="ma-2"
          color="success"
          text-color="white"
        >
          {{$t("Running")}}
        </v-chip>
        <v-chip
          v-if="item.status == 'error'"
          class="ma-2"
          color="error"
          text-color="white"
        >
          {{$t("Error")}}
        </v-chip>
        <v-chip
          v-if="item.status == 'starting'"
          class="ma-2"
          color="warning"
          text-color="white"
        >
          {{$t("Starting")}}
        </v-chip>
        <v-chip
          v-if="item.status == 'stopping'"
          class="ma-2"
          color="warning"
          text-color="white"
        >
          {{$t("Stopping")}}
        </v-chip>
        <v-chip
          v-if="item.status == 'available'"
          class="ma-2"
          
          text-color="white"
        >
          {{$t("Available")}}
        </v-chip>
        <v-chip
          v-if="item.status == 'not_available'"
          class="ma-2"
          text-color="white"
        >
          {{$t("Not Available")}}
        </v-chip>
        
      </template>
      <template v-slot:item.actions="{ item }">
             <v-icon v-if="item.status == 'running'" small @click="stopCheck(item)" class="mx-2"> mdi-stop </v-icon>
             <v-icon v-if="item.status == 'available'" small @click="start(item)" class="mx-2"> mdi-play </v-icon>
            </template>
    </v-data-table>
    <v-dialog
      v-model="dialog"
      persistent
      max-width="290"
    >
      
      <v-card>
        <v-card-title >
          {{$t("Stop platform",{stopPlatID: stopPlatID})}}
        </v-card-title>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="red darken-1"
            text
            @click="dialog = false"
          >
            {{$t('Cancel')}}
          </v-btn>
          <v-btn
            color="green darken-1"
            text
            @click="stop"
          >
            {{$t('OK')}}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

let page = {
  name: "Platforms",
  data: () => ({
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    dialog: false,
    stopPlatID: 0,
    snackbarSave: false,
    snackbarText: "",
    appData,
  }),
  methods: {
    rowClick: function (val) {
      console.log(`rowClick: ${val.addomain}`);
      //this.$router.push("/LDAP/" + val.addomain );
    },
    stopCheck: function (val) {
      this.stopPlatID = val.platID;
      this.dialog = true;
    },
    scheduleLongOperCheck: function(notifToken,title) {
      console.log("scheduleLongOperCheck: "+notifToken);
      appUtils.get({
        url: "api/longOperations/"+notifToken,
      }).then((response) => {
          console.log(response.data);
          if (response.data.status == 50) {
            setTimeout(this.scheduleLongOperCheck,5000,notifToken,title);
          } else if (response.data.status == 1) {
            console.log("response.data.status == 1");
            this.$notification.success(response.data.message, { title:title, infiniteTimer: true ,showCloseIcn : true});
          } else {
            console.log("response.data.status != 1");
            this.$notification.error(response.data.message, { title:title, infiniteTimer: true ,showCloseIcn : true});
          }
      }).catch((error) => console.log(error));
    },
    stop: function() {
      console.log(`stop: ${this.stopPlatID}`);
      this.dialog = false;
      appUtils.delete({
        url: "api/platforms/"+this.stopPlatID,
      }).then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Stopping platform")+" "+this.stopPlatID;
            this.snackbarSave = true;
            if (response.data.notifToken) {
              this.scheduleLongOperCheck(response.data.notifToken,this.$t("Stopping platform")+" "+this.stopPlatID)
            }
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    startNew: function() {
      let starting = false;
      this.rows.forEach(item => {
        if (!starting && item.status == "available") {
          starting = true;
          this.start(item);
        }
      });
      if (!starting) {
        this.snackbarText = this.$t("Cannot find available platform");
        this.snackbarSave = true;
      }
    },
    start: function(item) {
      appUtils
        .put({
          url: "api/platforms/"+item.platID,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Starting platform")+" "+item.platID;
            this.snackbarSave = true;
            if (response.data.notifToken) {
              this.scheduleLongOperCheck(response.data.notifToken,this.$t("Starting platform")+" "+item.platID)
            }
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    refresh: function () {
      console.log("Platforms refresh. route: "+this.$route.name);
      if (this.$route.name != "Platforms") {
        return;
      }
      appUtils
        .get({
          url: "api/platforms",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.platforms;
            setTimeout(this.refresh,5000);
          } else {
            console.log(`status: ${response.data.status}`);
            this.rows = [];
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
  },
  created: function () {
    let bcItems = [
      {
        text: this.$t("control-panel"),
        to: "/",
        disabled: false,
      },
      {
        text: this.$t("Platforms"),
        to: "/Platforms",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    this.headers = [
      {
        text: this.$t("Platform ID"),
        value: "platID",
      },
      {
        text: this.$t("Status"),
        value: "status",
      },
      {
        text: this.$t("Sessions"),
        value: "sessions",
      },
      {
        text: this.$t("IP Address"),
        value: "platform_ip",
      },
      { text: 'Actions', value: 'actions', sortable: false }
    ];
    this.refresh();
    //
  },
};

export default page;
</script>