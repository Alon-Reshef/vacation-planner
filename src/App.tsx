import { AppProvider } from './context/AppContext'
import { AppRoutes } from './components/AppRoutes'

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
