<template>
  <v-card color="bg">
    <v-card-title>
      {{$t("Organization List")}}
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
              @click="addOrg"
            >
              {{$t("Add Organization")}}
            </v-btn>
      </v-toolbar>
    </template>
    <template v-slot:[`item.actions`]="{ item }">
      <v-icon small @click="$router.push('/Org/' + item.maindomain)" class="mx-2"> mdi-pencil </v-icon>
      <v-icon v-if="item.maindomain != appData.mainDomain" small @click="deleteOrgDialog(item)" class="mx-2"> mdi-delete </v-icon>
    </template>

    </v-data-table>
    
    <v-dialog v-model="dialogDeleteOrg" max-width="500px" color="bg">
          <v-card color="bg">
            <v-card-subtitle class="headline">{{$t('Are you sure you want to delete organization',{domain: deleteItem.maindomain })}}</v-card-subtitle>
            <v-card-text>{{$t('Warning: All data including profiles, apps, and configuration data will be deleted!')}}</v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="warning"  @click="dialogDeleteOrg = false">{{$t('Cancel')}}</v-btn>
              <v-btn color="error"  @click="deleteOrg()">{{$t('OK')}}</v-btn>
              <v-spacer></v-spacer>
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

  <!--<v-btn @click="refresh">Refresh</v-btn>
  
  
  
  -->
</template>



 <script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

let page = {
  name: "Orgs",
  data: () => ({
    headers: [],
    rows: [],
    dialog: false,
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    snackbarSave: false,
    snackbarText: "",
    dialogDeleteOrg: false,
    deleteItem: {},
    resetOrgsInAppData: false,
    appData
  }),
  methods: {
    addOrg: function() {
      /*this.dialog = true;
      this.refreshProfiles();*/
      this.$router.push('/Org/');

    },
    

    rowClick: function(val) {
      console.log(`rowClick: ${val.maindomain}`);
      this.$router.push('/Admin/' + val.maindomain);
      
    },
    deleteOrgDialog: function(item) {
        this.deleteItem = item;
        this.dialogDeleteOrg = true;
    },
    deleteOrg: function() {
      console.log(`Delete org: ${this.deleteItem.maindomain}`);
      this.dialogDeleteOrg = false;
      appUtils.delete({
        url: "api/orgs/"+encodeURIComponent(this.deleteItem.maindomain),
      }).then(response => {
          
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Organization removed");
            this.snackbarSave = true;
            this.resetOrgsInAppData = true;
            this.refresh();

          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error") + ` - ${response.data.message}`;
            this.snackbarSave = true;
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    },

    

    refresh: function() {
      appUtils
        .get({
          url: "api/orgs",
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.orgs;
            if (this.resetOrgsInAppData ) {
                appData.resetOrgs(this.rows);
            }
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
      text: appData.productName,
      to: "/",
      disabled: false,
    }, {
      text: this.$t("Organizations"),
      to: "/Orgs",
      disabled: false,
    }];
    this.$emit("updatePage", bcItems);
    this.headers = [
      {
        text: this.$t("Domain"),
        value: "maindomain"
      },
      { text: this.$t("Organization Name"), value: "orgname" },
      { text: this.$t('Actions'), value: 'actions', sortable: false }
    ];
    
    this.refresh();
  },
  watch: {
    
  }
};

export default page;
</script>