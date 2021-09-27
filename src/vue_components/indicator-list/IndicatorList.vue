<template>
  <div>
    <div v-for="indicatorId of indicatorIds" :key="indicatorId">
      <IndicatorListItem
        :indicator="indicators[indicatorId]"
        :id="indicatorId"
      />
    </div>
  </div>
</template>

<script>
import IndicatorListItem from "./IndicatorListItem.vue";

export default {
  components: {
    IndicatorListItem,
  },

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
};
</script>

<style scoped></style>
