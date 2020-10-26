<template>
  <div
    
  > 
   <div class="float-left ma-2 text-h1">Test 1</div>
   <div class="float-right ma-2">Test 2</div>
  </div>
</template>

<script>
/*
<div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
*/
// @ is an alias to /src
//import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'Home',
  components: {
    //HelloWorld
  },
  created: function() {
    let bcItems = [{
      text: this.$t("control-panel"),
      href: "/#/",
      disabled: false,
    }];
    this.$emit("updatePage", bcItems);
  }
}
</script>
