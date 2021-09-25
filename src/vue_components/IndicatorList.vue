<template>
  <div>
    <div
      v-for="indicatorId of indicatorIds"
      :key="indicatorId"
      class="indicator"
    >
      <span class="indicator-title">{{ indicators[indicatorId].name }}</span>
      <button>
        <i class="gg-eye"></i>
      </button>
      <button @click="() => remove(indicatorId)">
        <i class="gg-close"></i>
      </button>
    </div>
  </div>
</template>

<script>
import chartState from "../state/chart.js";

export default {
  props: {
    indicators: {
      type: Object,
      required: true,
    },
  },

  computed: {
    indicatorIds() {
      return Object.keys(this.indicators);
    },
  },

  methods: {
    remove(id) {
      chartState.removeIndicator(id);
    },
  },
};
</script>

<style scoped>
.indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.indicator-title {
  color: rgb(172, 172, 172);
}

.indicator button {
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  margin-left: 6px;
  color: rgb(172, 172, 172);
  cursor: pointer;
}

.indicator > button > i {
  transform: scale(-0.7);
}
</style>
