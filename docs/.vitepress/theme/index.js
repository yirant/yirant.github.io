import DefaultTheme from 'vitepress/theme'
import MySQLTable from './components/MySQLTable.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('MySQLTable', MySQLTable)
  }
}