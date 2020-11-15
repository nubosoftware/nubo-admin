<template>
  <v-card color="bg">
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
      color="bg"
      :headers="headers"
      :items="rows"
      :server-items-length="totalItems"
      :items-per-page="5"
      :loading="loading"
      :options.sync="options"
      :search="search"
      class="ma-4 bg"
      multi-sort
      @update:options="updateOptions"
      @click:row="rowClick"
    ></v-data-table>
  </v-card>

  <!--<v-btn @click="refresh">Refresh</v-btn>-->
</template>


<style>

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

    rowClick: function(val) {
      console.log(`rowClick: ${val.email}`);
      this.$router.push("/Profile/"+val.email);
    },

    refresh: function() {
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
    let bcItems = [{
      text: this.$t("control-panel"),
      href: "/#/",
      disabled: false,
    }, {
      text: this.$t("Profiles"),
      href: "/#/Profiles",
      disabled: false,
    }];
    this.$emit("updatePage", bcItems);
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