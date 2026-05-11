import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: "postgresql://neondb_owner:npg_5KVcTapwH4IM@ep-tiny-hat-aq6v847m-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  }
})