<template>
  <div class="container">
    <IndicatorList :indicators="indicators" class="indicator-list" />

    {{ indicators }}
    <div class="chart">
      <canvas class="main"></canvas>
      <canvas class="x-scale"></canvas>
      <canvas class="y-scale"></canvas>
    </div>
  </div>
</template>

<script>
import IndicatorList from "./indicator-list/IndicatorList.vue";

export default {
  components: {
    IndicatorList,
  },

  data: () => ({
    indicators: {},
  }),
};
</script>

<style scoped>
.container {
  position: relative;
  width: 100%;
  height: 100%;
}

.chart {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.main,
.x-scale,
.y-scale {
  position: absolute;
}

.main {
  top: 0;
  left: 0;
  width: calc(100% - 50px);
  height: calc(100% - 20px);
}

.x-scale {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20px;
}

.y-scale {
  right: 0;
  top: 0;
  width: 50px;
  height: 100%;
}
</style>
