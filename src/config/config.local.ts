import { IConfigOptions } from "../types"

let config: IConfigOptions = {
  version: '2.9.0',
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
    database: 'RAP2_DELOS_APP_LOCAL',
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },
    logging: false
  },
  redis: {},
  mail: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: '',
      pass: ''
    }
  },
  mailSender: '',
}

export default config