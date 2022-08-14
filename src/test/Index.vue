<template>
  <div class="flex-col main">
    <myHeader />

    <HomePage class="flex-1 scrollbar" />

    <myFooter />
  </div>
</template>

<script>
//import { util } from "@/core";
import myHeader from "./components/header";
import myFooter from "./components/footer";
import HomePage from "./components/HomePage";

export default {
  components: {
    myHeader,
    myFooter,
    HomePage,
  },
  data() {
    return {
      screen: {},
    };
  },
  methods: {},
  created() {
    // const { width, height } = window.screen;
    const { innerWidth, innerHeight } = window;
    this.screen = {
      width: innerWidth,
      height: innerHeight,
    };
  },
};
</script>

<style>
.main {
  height: 100%;
}
</style>
