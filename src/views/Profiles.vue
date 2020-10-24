<template>
  <v-card>
    <v-card-title>
      {{$t("Profile List")}}
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
      :server-items-length="totalItems"
      :items-per-page="5"
      :loading="loading"
      :options.sync="options"
      :search="search"
      class="elevation-1"
      multi-sort
      @update:options="updateOptions"
    ></v-data-table>
  </v-card>

  <!--<v-btn @click="refresh">Refresh</v-btn>-->
</template>


<style>
@import "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons";
.loginOverlay {
  background: rgba(33, 150, 243, 0.3);
}

.photoCredit {
  position: absolute;
  bottom: 15px;
  right: 15px;
}
</style>

 <script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

let page = {
  name: "Profiles",
  data: () => ({
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    appData
  }),
  methods: {
    updateOptions(options) {
      console.log("update:options", options);
      this.refresh();
    },

    refresh: function() {
      let limit =
        this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 10000;
      let offset = (this.options.page - 1) * limit;
      appUtils
        .post({
          url: "cp/getProfiles",
          data: {
            adminLoginToken: appData.adminLoginToken,
            offset: offset,
            limit: limit,
            sortBy: this.options.sortBy,
            sortDesc: this.options.sortDesc,
            search: this.search
          }
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.profiles;
            this.totalItems = response.data.totalItems;
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
    this.$emit("updatePage", this.$t("Profiles"));
    this.headers = [
      {
        text: this.$t("Last Name"),
        value: "lastName"
      },
      { text: this.$t("First Name"), value: "firstName" },
      { text: this.$t("Email"), value: "email" }
    ];
    //this.refresh();
  },
  watch: {
    "search": function(newVal) {
      console.log(`search: ${newVal}`);
      if (newVal.length > 1 ||  newVal.length == 0 ) {
        this.refresh();
      }

    }
  }
};

export default page;
</script>