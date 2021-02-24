<template>
  <v-card color="bg">
    <v-card-title>
      {{$t("Admin List")}}
      <v-spacer></v-spacer>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="rows"
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
              @click="addAdmin"
            >
              {{$t("Add Administrators")}}
            </v-btn>
      </v-toolbar>
    </template>
    <template v-slot:item.actions="{ item }">
      <v-icon v-if="item.email != appData.email" small @click="$router.push('/Admin/' + item.email)" class="mx-2"> mdi-pencil </v-icon>
      <v-icon v-if="item.email != appData.email" small @click="deleteAdmin(item)" class="mx-2"> mdi-delete </v-icon>
    </template>

    </v-data-table>
    <v-dialog
      v-model="dialog"
      overlay-color="bg"
      max-width="800px"
    >
    <v-card color="bg">
      <v-card-title>
      {{$t("Add Profiles")}}
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>
    <v-data-table
      :headers="profilesHeaders"
      :items="profilesRows"
      :loading="profilesLoading"
      
      class="elevation-1 ma-4 bg"

      :server-items-length="totalItems"
      :items-per-page="5"
      :options.sync="options"
      :search="search"
      @update:options="updateOptions"
      @click:row="rowClick"
      
    >
    </v-data-table>
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

  <!--<v-btn @click="refresh">Refresh</v-btn>
  
  
  
  -->
</template>



 <script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

let page = {
  name: "Profiles",
  data: () => ({
    headers: [],
    rows: [],
    dialog: false,
    profilesHeaders: [],
    profilesRows: [],
    profilesLoading: true,
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    snackbarSave: false,
    snackbarText: "",
    appData
  }),
  methods: {
    addAdmin: function() {
      this.dialog = true;
      this.refreshProfiles();

    },
    updateOptions(options) {
      console.log("update:options", options);
      this.refreshProfiles();
    },

    rowClick: function(val) {
      console.log(`rowClick: ${val.email}`);
      this.$router.push('/Admin/' + val.email);
      /*
      appUtils.put({
        url: "api/admins/"+encodeURIComponent(val.email),
      }).then(response => {
          
          console.log(response.data);
          if (response.data.status == 1) {
            this.dialog = false;
            this.snackbarText = this.$t("Admin added");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));*/
    },
    deleteAdmin: function(item) {
      console.log(`Delete admin: ${item.emil}`);
      appUtils.delete({
        url: "api/admins/"+encodeURIComponent(item.email),
      }).then(response => {
          
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Admin removed");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    },

    refreshProfiles: function() {
      this.profilesLoading = true;
      let limit =
        this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 10000;
      let offset = (this.options.page - 1) * limit;
      appUtils
        .post({
          url: "api/profiles",
          data: {
            adminFilter: "N",
            offset: offset,
            limit: limit,
            sortBy: this.options.sortBy,
            sortDesc: this.options.sortDesc,
            search: this.search
          }
        })
        .then(response => {
          this.profilesLoading = false;
          console.log(response.data);
          if (response.data.status == 1) {
            this.profilesRows = response.data.profiles;
            this.totalItems = response.data.totalItems;
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    },

    refresh: function() {
      appUtils
        .post({
          url: "api/profiles",
          data: {
            adminFilter: "Y"
          }
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.profiles;
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    }
  },
  created: function() {
    let bcItems = [{
      text: this.$t("control-panel"),
      to: "/",
      disabled: false,
    }, {
      text: this.$t("Administrators"),
      to: "/Admins",
      disabled: false,
    }];
    this.$emit("updatePage", bcItems);
    this.headers = [
      {
        text: this.$t("Last Name"),
        value: "lastName"
      },
      { text: this.$t("First Name"), value: "firstName" },
      { text: this.$t("Email"), value: "email" },
      { text: this.$t('Actions'), value: 'actions', sortable: false }
    ];
    this.profilesHeaders = [
      {
        text: this.$t("Last Name"),
        value: "lastName"
      },
      { text: this.$t("First Name"), value: "firstName" },
      { text: this.$t("Email"), value: "email" }
    ];
    this.refresh();
  },
  watch: {
    "search": function(newVal) {
      console.log(`search: ${newVal}`);
      if (newVal.length > 1 ||  newVal.length == 0 ) {
        this.refreshProfiles();
      }

    }
  }
};

export default page;
</script>