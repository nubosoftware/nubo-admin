<template>
  <v-card>
    <v-card-title>
      {{$t("Group")}}
    </v-card-title>
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
    groupName: {},
    adDomain : {},
    appData
  }),
  methods: {
    


    refresh: function() {
    
      appUtils
        .post({
          url: "cp/getGroupDetails?groupName="+encodeURIComponent(this.groupName)+"&adDomain="+encodeURIComponent(this.adDomain),
          data: {
            adminLoginToken: appData.adminLoginToken
          }
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            //this.rows = response.data.groups;
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
      this.groupName = this.$route.params.groupName;
      this.adDomain = (this.$route.params.adDomain ? this.$route.params.adDomain : "");
    let bcItems = [{
      text: this.$t("control-panel"),
      href: "/#/",
      disabled: false,
    }, {
      text: this.$t("Groups"),
      href: "/#/Groups",
      disabled: false,
    }, {
        text: this.$route.params.groupName,
        href: "/#/Group/" + this.groupName+"/"+this.adDomain,
        disabled: false,
    }];
    this.$emit("updatePage", bcItems);
    this.headers = [
      {
        text: this.$t("Name"),
        value: "groupName"
      },
      {
          text: this.$t("Group Type"),
          value: "adDomain"
      }
     
    ];
    this.refresh();
  },
};

export default page;
</script>