<template>
  <v-card>
    <v-card-title>{{$t("Apps")}}</v-card-title>
    <v-data-table
      :headers="headers"
      :items="rows"
      :items-per-page="20"
      :loading="loading"
      
      class="elevation-1 ma-4"
    >
    <template v-slot:top>
      <v-toolbar
        flat
      >
        <v-btn
              color="primary"
              dark
              class="mb-2"
              @click="appUpload"
            >
              {{$t("App Upload")}}
            </v-btn>
      </v-toolbar>
    </template>
    <template v-slot:item.imageUrl="{ item }">
              <v-img
                max-height="40"
                max-width="40"
                :src="item.imageUrl"
              ></v-img>
            </template>
      <template v-slot:item.actions="{ item }">
             <v-icon small @click="rowClick(item)" class="mx-2"> mdi-pencil </v-icon>
              <v-icon small @click="deleteApp(item)" class="mx-2"> mdi-delete </v-icon>
            </template>
    </v-data-table>
    <v-dialog
      v-model="dialog"
      persistent
      max-width="290"
    >
      
      <v-card>
        <v-card-title >
          Delete {{deleteAppName}}
        </v-card-title>
        <v-card-text>
          {{$t("Are you sure you want to delete")}} {{deleteAppName}}?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="red darken-1"
            text
            @click="dialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="green darken-1"
            text
            @click="deleteOK"
          >
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbarSave" :timeout="2000">
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn color="blue" text v-bind="attrs" @click="snackbarSave = false">
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
  name: "LDAP",
  data: () => ({
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    dialog: false,
    deleteObj: null,
    deleteAppName: "",
    snackbarSave: false,
    snackbarText: "",
    appData,
  }),
  methods: {
    rowClick: function (val) {
      console.log(`rowClick: ${val.packageName}`);
      this.$router.push("/App/" + val.packageName );
    },
    deleteApp: function (val) {
      
      this.deleteObj = val;
      this.deleteAppName = val.appName;
      this.dialog = true;
    },
    deleteOK: function() {
      console.log(`deleteApp: ${this.deleteAppName}`);
      this.dialog = false;
      appUtils.delete({
        url: "api/apps/"+encodeURIComponent(this.deleteObj.packageName)
      }).then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Saved");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error")+" - "+response.data.message;
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    addLDAP: function () {
      this.$router.push("/LDAP/CREATELDAP" );
    },

    refresh: function () {
      appUtils
        .get({
          url: "api/apps",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.apps;
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
        href: "/#/",
        disabled: false,
      },
      {
        text: this.$t("Apps"),
        href: "/#/Apps",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    this.headers = [
            {
              text: this.$t("Icon"),
              value: "imageUrl",
              sortable: false
            },
            { text: this.$t("Name"), value: "appName" },
            { text: this.$t("Package"), value: "packageName" },
            { text: 'Actions', value: 'actions', sortable: false },
          ];
    this.refresh();
  },
};

export default page;
</script>