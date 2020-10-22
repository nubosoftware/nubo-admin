<template>

  <v-data-table
    :headers="headers"
    :items="rows"
    :server-items-length="totalItems"
    :items-per-page="5"
    :loading="loading"
    :options.sync="options"
    class="elevation-1"
    multi-sort
    @update:options="updateOptions"
  ></v-data-table>
  
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
import axios from "axios";

export default {
  name: "Profiles",
  data: () => ({
    headers: [
          {
            text: 'Last Name',
            align: 'start',
            sortable: true,
            value: 'lastName',
          },
          { text: 'First Name', value: 'firstName' },
          { text: 'Email', value: 'email' },
          { text: 'Username', value: 'userName' },
        ],
        rows: [
         
        ],
    totalItems: 0,
    loading: true,
    options: {},
    appData,
  }),
  methods: {
    
    updateOptions (options) {
      console.log('update:options', options);
      this.refresh();
    },
    
    refresh: function () {
      let limit = (this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 10000);
      let offset = (this.options.page - 1) * limit;
      axios({
        method: "post",
        url:
          "http://localhost:9080/http://labil.nubosoftware.com:8080/cp/getProfiles",
        data: {
          adminLoginToken: appData.adminLoginToken,
          offset: offset,
          limit: limit
        },
      })
        .then((response) => {
          
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.profiles;
            this.totalItems = response.data.totalItems;
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
  },
  created: function () {
    this.$emit("updatePage", "Profiles");
    //this.refresh();
  },
};
</script>