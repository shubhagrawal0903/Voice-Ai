import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: "postgresql://postgres:123456@localhost:5432/vodex_calls",
  }
})
