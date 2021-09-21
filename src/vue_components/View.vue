<template>
  <div id="app">
    <!-- Icons -->
    <Icons />

    <!-- View -->
    <div class="top-bar">
      <button @click="showModal" modal="indicators">Indicators</button>
    </div>
    <div ref="charts" class="charts"></div>

    <!-- Modal -->
    <div v-if="modal.length" class="modal">
      <div class="modal-box">
        <div class="modal-box-topbar">
          <h1>Modal</h1>
          <button @click="modal = ''" class="modal-box-close">
            <svg class="icon icon-cross">
              <use xlink:href="#icon-cross"></use>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Icons from "./Icons.vue";

export default {
  components: {
    Icons,
  },

  data: () => ({
    modal: "",
  }),

  methods: {
    showModal(e) {
      const id = e.srcElement.getAttribute("modal");
      this.modal = id;
    },
  },
};
</script>

<style scoped>
button {
  color: lightgray;
  background: transparent;
  border: 0;
}

#app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.top-bar {
  display: flex;
  width: 100%;
  height: 30px;
  background: #100033;
}

.charts {
  flex-grow: 1;
  position: relative;
  width: 100%;
  height: 100%;
}

.top-bar > button {
  background: transparent;
  color: lightgray;
  border: 0;
  padding: 0px 12px;
  cursor: pointer;
}

.top-bar > button:hover {
  background: rgb(58, 58, 58);
}

.modal {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  z-index: 100;
  pointer-events: none;
}

.modal-box {
  position: relative;
  max-height: 70vh;
  max-width: 30rem;
  overflow-y: auto;
  overflow-x: hidden;
  background: #100033;
  pointer-events: all;
}

.modal-box-topbar {
  display: flex;
  width: 100%;
  padding: 1rem;
  align-items: center;
  justify-content: center;
}

.modal-box-topbar h1 {
  line-height: 0;
  color: lightgray;
  flex-grow: 1;
}

.modal-box-close {
  cursor: pointer;
}

.modal-box-close svg {
  height: 100%;
  fill: lightgray;
  height: 22px;
  width: 22px;
}
</style>
