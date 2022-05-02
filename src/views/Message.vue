<template>
  <v-container fill-height class="bg" fluid>
   
      <v-alert
      
     
      :type="statusColor"
      elevation="2"
      class="bg"
      prominent
      text
      width="5000"
    >
    
      {{message}}
   
    </v-alert>
   
  </v-container>
</template>

<script>

import appData from '../modules/appData';

export default {
  name: 'MessagePage',
  data: () => ({ 
    message: "",
    statusColor: "primary",
    appData
  }),
  created: function() {
    console.log(`Message: ${this.$route.query.message}`  );
    this.message = this.$route.query.message;
    if (this.$route.query.status == 0) {
      this.statusColor = "success";
    } else {
      this.statusColor = "error";
    }
  }
}
</script>
