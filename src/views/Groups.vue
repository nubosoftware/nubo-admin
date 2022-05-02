<template>
  <v-card color="bg"> 
    <v-card-title>
      {{ $t("Groups") }}
      
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="rows"
      :items-per-page="10"
      :search="search"
      class="ma-4 bg"
      @click:row="rowClick"
    >
    <template v-slot:top>
        <v-toolbar flat color="bg">
          <v-btn 
            v-if="appData.checkPermission('/groups','w')"
            class="ma-4"
            color="primary" @click="$router.push('/Group/')">{{
            $t("New Group")
          }}</v-btn>
          <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
        </v-toolbar>
      </template>
    <template v-slot:[`item.adDomain`]="{ item }">
      <div v-if="item.groupName == 'All'">{{$t("Automatic")}}</div>
      <div v-else-if="item.adDomain == ''">{{$t("Manual")}}</div>
      <div v-else>{{$t("Active Directory")}}</div>
    </template>
    <template v-slot:[`item.actions`]="{ item }">
      <v-icon v-if="item.groupName != 'All' && appData.checkPermission('/groups','w')" small @click="deleteGroup(item,$event)" class="mx-2"> mdi-delete </v-icon>
    </template>
    </v-data-table>
    <v-dialog v-model="dialogDelete" max-width="500px" overlay-color="bg">
      <v-card color="bg">
        <v-card-title>{{ $t("Remove Group") }}</v-card-title>
        <v-card-subtitle class="mt-4">{{
          $t("Are you sure you want to remove the selected group?")
        }}</v-card-subtitle>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" @click="dialogDelete = false">{{
            $t("Cancel")
          }}</v-btn>
          <v-btn
            color="primary"
            @click="dialogDelete = false | removeGroup()"
            >{{ $t("Remove Group") }}</v-btn
          >
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbarSave" :timeout="2000">
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn
          color="primary"
          text
          v-bind="attrs"
          @click="snackbarSave = false"
        >
          {{$t("Close")}}
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

let page = {
  name: "Groups",
  data: () => ({
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    dialogDelete: false,
    removeItem: null,
    snackbarSave: false,
    snackbarText: "",
    appData
  }),
  methods: {
    rowClick: function(val) {
      console.log(`rowClick: ${val.groupName}`);
      this.$router.push("/Group/" + val.groupName + "/" + val.adDomain);
    },
    deleteGroup: function(val,event) {
      console.log(`deleteGroup: ${val.groupName} ${val.adDomain}`);
      event.stopPropagation();
      this.dialogDelete = true;
      this.removeItem = val;
      return false;
    },
    removeGroup : function() {
      let groupParam;
      if (this.removeItem.adDomain && this.removeItem.adDomain != "") {
        groupParam = `${this.removeItem.groupName}#${this.removeItem.adDomain}`;
      } else {
        groupParam = this.removeItem.groupName;
      }
      console.log("groupParam: "+groupParam);
      appUtils
        .delete({
          url: `api/groups/${encodeURIComponent(groupParam)}`
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Group removed");
            this.snackbarSave = true;
            this.dialogDelete = false;
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

    refresh: function() {
      appUtils
        .get({
          url: "api/groups"
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.groups;
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
    let bcItems = [
      {
        text: this.$t("control-panel"),
        to: "/",
        disabled: false
      },
      {
        text: this.$t("Groups"),
        to: "/Groups",
        disabled: false
      }
    ];
    this.$emit("updatePage", bcItems);
    this.headers = [
      {
        text: this.$t("Name"),
        value: "groupName"
      },
      {
        text: this.$t("Group Type"),
        value: "adDomain"
      },
      { text: this.$t('Actions'), value: 'actions', sortable: false }
    ];
    this.refresh();
  }
};

export default page;
</script>
