<template>
  <v-card>
    <v-card-title>
      {{ $t("Group") }}
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
      :headers="headers"
      :items="rows"
      :items-per-page="10"
      :loading="loading"
      :search="search"
      class="elevation-1"
      multi-sort
      show-select
      item-key="email"
      v-model="selected"
      @click:row="rowClick"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>{{ $t("Profiles") }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn color="primary" dark text @click="openAddProfiles">{{
            $t("Add Profiles")
          }}</v-btn>
          <v-btn
            color="primary"
            dark
            text
            @click="dialogDelete = true"
            :disabled="removeSelectedDisable"
            >{{ $t("Remove Selected Profiles") }}</v-btn
          >
        </v-toolbar>
      </template>
    </v-data-table>
    <v-dialog v-model="dialog" max-width="800px">
      <v-card>
        <v-card-title>
          {{ $t("Add Profiles") }}
          <v-spacer></v-spacer>
          <v-text-field
            v-model="searchProfiles"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
          ></v-text-field>
        </v-card-title>
        <v-data-table
          v-model="profilesSelected"
          :headers="profilesHeaders"
          :items="profilesRows"
          :loading="profilesLoading"
          class="elevation-1 ma-4"
          :server-items-length="totalItems"
          :items-per-page="5"
          :options.sync="options"
          :search="searchProfiles"
          show-select
          multi-sort
          item-key="email"
          @update:options="updateOptions"
        >
          <template v-slot:header.data-table-select> &nbsp; </template>
          <template v-slot:top>
            <v-toolbar flat>
              <v-btn
                color="primary"
                class="mb-2"
                @click="addSelected"
                v-bind:disabled="addSelectedDisabled"
                v-bind:loading="addSelectedLoading"
              >
                {{ $t("Assign Selected Profiles") }}
              </v-btn>
            </v-toolbar>
          </template>
        </v-data-table>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title>{{ $t("Remove Selected Profiles") }}</v-card-title>
        <v-card-subtitle class="mt-4">{{
          $t("Are you sure you want to remove the selected profiles?")
        }}</v-card-subtitle>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogDelete = false">{{
            $t("Cancel")
          }}</v-btn>
          <v-btn
            color="blue darken-1"
            text
            @click="dialogDelete = false | removeProfiles(selected)"
            >{{ $t("Remove Profiles") }}</v-btn
          >
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

let page = {
  name: "Group",
  data: () => ({
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    groupName: {},
    adDomain: {},
    appData,
    groupParam: "",
    selected: [],
    removeSelectedDisable: true,
    dialogDelete: false,
    // add profiles dialog
    dialog: false,
    profilesHeaders: [],
    profilesRows: [],
    profilesLoading: true,
    profilesSelected: [],
    searchProfiles: "",
    addSelectedDisabled: true,
    addSelectedLoading: false,

  }),
  methods: {
    openAddProfiles: function() {
      console.log("openAddProfiles");
      this.dialog = true;
      this.profilesSelected = [];      
      this.refreshProfiles();
    },
    addSelected: function() {
      this.addSelectedLoading = true;
      this.addProfiles(this.profilesSelected);
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
            offset: offset,
            limit: limit,
            sortBy: this.options.sortBy,
            sortDesc: this.options.sortDesc,
            search: this.search,
          },
        })
        .then((response) => {
          this.profilesLoading = false;
          console.log(response.data);
          if (response.data.status == 1) {
            this.profilesRows = response.data.profiles;
            this.totalItems = response.data.totalItems;
            /*let newSelected = [];
            this.profilesRows.forEach((element) => {
              if (this.allSelected[element.email]) {
                newSelected.push(element);
              }
            });
            this.profilesSelected = newSelected;*/
          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },

    updateOptions(options) {
      console.log("update:options", options);
      this.refreshProfiles();
    },
    rowClick: function(val) {
      console.log(`rowClick: ${val.email}`);
      this.$router.push("/Profile/" + val.email);
    },

    refresh: function() {
      console.log(`groupParam: ${this.groupParam}`);
      appUtils
        .get({
          url: "api/groups/" + encodeURIComponent(this.groupParam),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.profiles;
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    addProfiles: function(items) {
      if (!Array.isArray(items)) {
        items = [items];
      }
      let emailParams = "";
      items.forEach((item) => {
        let email;
        if (typeof item === "string") {
          email = item;
        } else {
          email = item.email;
        }
        emailParams += "&email=" + encodeURIComponent(email);
      });
      console.log(`addProfiles: ${emailParams}`);
      appUtils
        .get({
          url: `api/groups/${encodeURIComponent(
            this.groupParam
          )}/addProfiles?${emailParams}`,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1 || response.data.status == 0) {
            console.log(`status: ${response.data.status}`);
            this.addSelectedLoading = false;
            this.dialog = false;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.addSelectedLoading = false;
            //this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    removeProfiles: function(items) {
      if (!Array.isArray(items)) {
        items = [items];
      }
      let emailParams = "";
      items.forEach((item) => {
        let email;
        if (typeof item === "string") {
          email = item;
        } else {
          email = item.email;
        }
        emailParams += "&email=" + encodeURIComponent(email);
      });

      appUtils
        .get({
          url: `api/groups/${encodeURIComponent(
            this.groupParam
          )}/removeProfiles?${emailParams}`,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1 ) {
            console.log(`status: ${response.data.status}`);
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
  },
  created: function() {
    this.groupName = this.$route.params.groupName;
    this.adDomain = this.$route.params.adDomain
      ? this.$route.params.adDomain
      : "";

    if (this.adDomain && this.adDomain != "") {
      this.groupParam = `${this.groupName}#${this.adDomain}`;
    } else {
      this.groupParam = this.groupName;
    }
    let bcItems = [
      {
        text: this.$t("control-panel"),
        href: "/#/",
        disabled: false,
      },
      {
        text: this.$t("Groups"),
        href: "/#/Groups",
        disabled: false,
      },
      {
        text: this.$route.params.groupName,
        href: "/#/Group/" + this.groupName + "/" + this.adDomain,
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    this.headers = [
      {
        text: this.$t("First Name"),
        value: "firstName",
      },
      {
        text: this.$t("Last Name"),
        value: "lastName",
      },
      {
        text: this.$t("Email"),
        value: "email",
      },
    ];
    this.profilesHeaders = [
      {
        text: this.$t("Last Name"),
        value: "lastName",
      },
      { text: this.$t("First Name"), value: "firstName" },
      { text: this.$t("Email"), value: "email" },
    ];
    this.refresh();
  },
  watch: {
    selected: function(newVal) {
      console.log(`selected: ${JSON.stringify(newVal, null, 2)}`);
      this.removeSelectedDisable = newVal.length == 0;
    },
    profilesSelected: function(newVal) {
      console.log(`profilesSelected: ${JSON.stringify(newVal, null, 2)}`);
      this.addSelectedDisabled = newVal.length == 0;
    },
    searchProfiles: function(newVal) {
      console.log(`searchProfiles: ${JSON.stringify(newVal, null, 2)}`);
      this.refreshProfiles();
    },
  },
};

export default page;
</script>
