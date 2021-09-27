<template>
  <div class="indicator" :class="visible ? '' : 'invisible'">
    <span class="indicator-title">{{ indicator.name }}</span>
    <button @click="toggleVisibility">
      <i v-if="visible" class="gg-eye"></i>
      <i v-else class="gg-eye-alt"></i>
    </button>
    <button @click="remove">
      <i class="gg-close"></i>
    </button>
  </div>
</template>

<script>
import chartState from "../../state/chart.js";

export default {
  props: {
    indicator: {
      type: Object,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
  },

  methods: {
    toggleVisibility() {
      chartState.toggleVisibility(this.id);
    },

    remove() {
      chartState.removeIndicator(this.id);
    },
  },

  computed: {
    visible() {
      return this.indicator.visible;
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

.invisible {
  opacity: 0.5;
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
