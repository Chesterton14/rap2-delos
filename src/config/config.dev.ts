import { IConfigOptions } from '../types'

const config: IConfigOptions = {
  version: 'v2.9.0',
  serve: {
    port: (process.env.SERVE_PORT && parseInt(process.env.SERVE_PORT)) || 8080,
    path: '',
  },
  keys: ['some secret hurr'],
  session: {
    key: 'rap2:sess',
  },
  db: {
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'RAP2_DELOS_APP',
    pool: {
      max: 10,
      min: 0,
      idle: 10000,
    },
    logging: false,
    dialectOptions: {
      connectTimeout: 20000,
    },
  },
  redis: {
    host: '127.0.0.1',
    port: 6379
  },
  mail: {
    host: process.env.MAIL_HOST ?? 'smtp.aliyun.com',
    port: process.env.MAIL_PORT ?? 465,
    secure: process.env.MAIL_SECURE ?? true,
    auth: {
      user: process.env.MAIL_USER ?? 'rap2org@service.alibaba.com',
      pass: process.env.MAIL_PASS ?? '',
    },
  },
  mailSender: process.env.MAIL_SENDER ?? 'rap2org@service.alibaba.com',
}

export default config
