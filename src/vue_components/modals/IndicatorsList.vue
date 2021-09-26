<template>
  <div>
    <h1>Data Types</h1>
    <div>
      <button
        v-for="(indicator, i) of series"
        :key="i"
        @click="() => addIndicator('series', i)"
      >
        {{ indicator.name }}
      </button>
    </div>
    <h1>Indicators</h1>
    <div>
      <button
        v-for="(indicator, i) of indicators"
        :key="i"
        @click="() => addIndicator('indicators', i)"
      >
        {{ indicator.name }}
      </button>
    </div>
  </div>
</template>

<script>
import IndicatorList from "../../components/indicators.js";

import chartState from "../../state/chart.js";

export default {
  data: () => ({
    series: IndicatorList.series,
    indicators: IndicatorList.indicators,
  }),

  methods: {
    addIndicator(type, index) {
      chartState.addIndicator(IndicatorList[type][index]);
      this.$emit("addIndicator", { type, index });
    },
  },
};
</script>

<style></style>
