<template>
  <a-modal destroyOnClose width="100%" wrap-class-name="modulation-modal">
    <div class="modal__header">
      <h1>
        {{ mode === "sync" ? "Transmission Sync" : "Transmission Progress" }}
      </h1>
      <h3>Modulation: {{ props.data.modulation }} bits/symbol</h3>
    </div>

    <div class="modal__body">
      <div class="body__transmitter" id="body__transmitter">
        <canvas id="transmitter-symbol"></canvas>
      </div>
    </div>

    <template #footer>
      <a-button
        v-if="mode === 'sync'"
        key="start"
        @click="handleStartTransmission()"
      >
        <template #icon><PlayCircleOutlined /></template>
        Start Transmission
      </a-button>

      <a-button key="submit" @click="handleCloseTransmission()">
        <template #icon><CloseCircleOutlined /></template>
        Close connection
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { PlayCircleOutlined, CloseCircleOutlined } from "@ant-design/icons-vue";

import IConnectionData from "../interfaces/IConnectionData";
import { onMounted, ref } from "vue";
import WONService from "../services/WONService";

interface Props {
  data: IConnectionData;
}

const props = defineProps<Props>();

const emit = defineEmits(["close"]);

onMounted(() => {
  console.log("ModulationModal", props.data);
  handleStartSync();
});

const mode = ref<"sync" | "progress">("sync");

function handleStartSync() {
  mode.value = "sync";
  WONService.drawConfigSymbol("#0000FF");
}

function handleStartTransmission() {
  mode.value = "progress";
  WONService.startModulation(props.data.payload, props.data.modulation);
}

function handleCloseTransmission() {
  WONService.moduRunning = false;
  emit("close");
}
</script>

<style lang="scss">
.modulation-modal {
  .ant-modal-content {
    background-color: black;
  }

  .modal__header {
    height: 50px;
    width: 100%;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    color: white;
    background-color: black;
  }

  .modal__body {
    width: 100%;
    height: calc(100% - 50px);

    display: flex;
    align-items: center;
    justify-content: center;

    background-color: black;

    .body__transmitter {
      width: 80%;
      height: 80%;

      overflow: hidden;
      border-radius: 4px;
      border: 1px solid #333;
    }
  }

  // Full Modal
  .ant-modal {
    max-width: 100%;

    top: 0;
    margin: 0;
    padding-bottom: 0;
  }
  .ant-modal-content {
    height: calc(100vh);

    display: flex;
    flex-direction: column;
  }
  .ant-modal-body {
    flex: 1;
  }
}
</style>
