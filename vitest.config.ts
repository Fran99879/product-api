import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    sequence: {
      concurrent: false,
    },
    // Los tests comparten una sola DB de Mongo y cada archivo hace
    // deleteMany() en beforeEach: en paralelo se pisan entre sí.
    fileParallelism: false,
  },
});
