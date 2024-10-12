<template>
  <a-modal destroyOnClose width="100%" wrap-class-name="modulation-modal">
    <div class="modal__header">
      <h1>Transmitting Data</h1>
    </div>

    <div class="modal__body">
      <div class="body__transmitter" id="body__transmitter">
        <canvas id="transmitter-symbol"></canvas>
      </div>
    </div>

    <template #footer>
      <a-button key="submit" type="primary" @click="$emit('close')">
        <template #icon><CloseCircleOutlined /></template>
        Close connection
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { AlertFilled, CloseCircleOutlined } from "@ant-design/icons-vue";

import IConnectionData from "../interfaces/IConnectionData";
import { onMounted } from "vue";
import WONService from "../services/WONService";

interface Props {
  data: IConnectionData;
}

const props = defineProps<Props>();

onMounted(() => {
  console.log("ModulationModal", props.data);
  WONService.startModulation(props.data.payload, props.data.modulation);
});
</script>

<style lang="scss">
.modulation-modal {
  .modal__header {
    height: 50px;
    width: 100%;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal__body {
    width: 100%;
    height: calc(100% - 50px);

    display: flex;
    align-items: center;
    justify-content: center;

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
