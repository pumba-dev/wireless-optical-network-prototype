<template>
  <a-layout class="main-session">
    <!-- Header -->
    <a-layout-header class="session__header">
      <div class="header__item">
        <img src="../assets/wireless-network.png" />
        <span> Wireless Optical Network - WON </span>
      </div>

      <div class="header__item">
        <a-button>
          <a href="https://www.pumbadev.com">Contact</a>
        </a-button>
        <a-button>
          <a
            href="https://github.com/pumba-dev/wireless-optical-network-prototype"
          >
            Repository
          </a>
        </a-button>
      </div>
    </a-layout-header>

    <!-- Content -->
    <a-layout-content>
      <MainContent />
    </a-layout-content>

    <!-- Footer -->
    <a-layout-footer class="session__footer">
      <a-button type="tertiary">
        <a href="www.pumbadev.com">
          WON Prototype © 2023 Created by Pumba Developer
        </a>
      </a-button>
    </a-layout-footer>
  </a-layout>
</template>

<script setup lang="ts">
import MainContent from "./MainContent.vue";
</script>

<style scoped lang="scss">
.main-session {
  width: 100%;
  height: 100vh;

  display: flex;
  flex-direction: column;

  .session__header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    background-color: #2e5eaa;

    .header__item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    img {
      width: 50px;
      height: 50px;
    }

    span {
      font-size: 1.5rem;
      font-weight: bold;
      margin-left: 10px;
      color: white;
    }
  }

  .session__footer {
    width: 100%;

    display: flex;
    align-items: center;
    justify-content: center;

    a {
      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
