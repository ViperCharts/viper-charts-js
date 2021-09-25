<template>
  <div>
    <div
      v-for="instanceId of Object.keys(indicators)"
      :key="instanceId"
      class="indicator"
    >
      <span class="indicator-title">{{ indicators[instanceId].name }}</span>
      <button>
        <i class="gg-eye"></i>
      </button>
      <button>
        <i class="gg-close"></i>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    indicators: {
      type: Object,
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
