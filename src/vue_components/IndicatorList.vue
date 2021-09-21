<template>
  <div>
    <div class="indicator">
      <span class="indicator-title"> Footprint </span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    indicators: {
      type: Array,
      required: true,
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
</style>
