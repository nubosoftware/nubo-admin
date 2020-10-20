<template>
  <div class="about">
    <h1>This is an about page. Login: {{ appData.isLogin }}</h1>
  </div>
</template>

<script>

import appData from '../modules/appData';

export default {
  name: 'Home',
  data: () => ({ 
    appData
  })
}
</script>
