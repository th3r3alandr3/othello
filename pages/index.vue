<template>
    <div id="scene"></div>
    <div v-if="!close && states && states.gameEnded" id="defaultModal" tabindex="-1" aria-hidden="true" class="score-modal">
        <div class="wrapper">
            <!-- Modal content -->
            <div class="content">
                <!-- Modal header -->
                <div class="header">
                    <h3 class="title">
                        {{ states.endGameMessage }}
                    </h3>
                </div>
                <!-- Modal body -->
                <div class="body">
                    <p class="text">
                        Schwarz: {{ states.blackScore }}
                    </p>
                    <p class="text">
                        Weiß: {{ states.whiteScore }}
                    </p>
                </div>
                <!-- Modal footer -->
                <div class="footer">
                    <button data-modal-hide="defaultModal" type="button" class="button-restart" @click="othello.restart()">Neustarten</button>
                    <button data-modal-hide="defaultModal" type="button" class="button-cancel" @click="close = true">Schließen</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Othello from "~/TypeScript/Othello";
import {ref} from "vue";

let othello: Othello | null = null;
const states = ref() as Ref<any>;
const initialized = ref(false);
const close = ref(false);

onMounted(() => {
    othello = new Othello();
    initialized.value = true;
    states.value = othello.sates;
});

setInterval(() => {
    update();
}, 1000);

function update() {
    states.value = {};
    if (othello === null) {
        return;
    }
    states.value = othello.sates;
}

</script>

<style>
.score-modal {
    display: flex;
    overflow-y: auto;
    overflow-x: hidden;
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 50;
    padding: 1rem;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: calc(100% - 1rem);

    @media (min-width: 768px) {
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        height: 100%;
    }
}

.wrapper {
    position: relative;
    width: 100%;
    max-width: 42rem;
    height: 100%;

    @media (min-width: 768px) {
        height: auto;
    }
}

.content {
    position: relative;
    background-color: #fff;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.header {
    display: flex;
    padding: 1rem;
    justify-content: space-between;
    align-items: flex-start;
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    border-bottom-width: 1px;
}

.title {
    color: #111827;
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 600;
}

.body {
    padding: 1.5rem;
    margin-top: 1.5rem;
}

.text {
    color: #6b7280;
    font-size: 1rem;
    line-height: 1.5rem;
    line-height: 1.625;
}

.footer {
    display: flex;
    padding: 1.5rem;
    margin-left: 0.5rem;
    justify-content: flex-end;
    align-items: center;
    border-bottom-right-radius: 0.25rem;
    border-bottom-left-radius: 0.25rem;
    border-top-width: 1px;
    border-color: #e5e7eb;
}

.button-restart {
    padding-top: 0.625rem;
    padding-bottom: 0.625rem;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    background-color: #1d4ed8;
    color: #fff;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    text-align: center;
    border-radius: 0.5rem;

    :hover {
        background-color: #1e40af;
    }

}

.button-cancel {
    padding-top: 0.625rem;
    padding-bottom: 0.625rem;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    background-color: #fff;
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    border-radius: 0.5rem;
    border-width: 1px;
    border-color: #e5e7eb;

    :hover {
        background-color: #f3f4f6;
        color: #111827;
    }
}
</style>
