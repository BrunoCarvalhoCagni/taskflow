import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

// Interface para tipar a resposta da API (Boa prática com TS)
interface PingResponse {
  message: string
  status: string
}

function App() {
  // Usando React Query para buscar os dados do Go
  const { data, isLoading, error } = useQuery<PingResponse>({
    queryKey: ['ping'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8080/ping')
      console.log("response.data", response.data)
      return response.data
    },
  })

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-blue-500/30 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          TaskFlow Fullstack
        </h1>

        {isLoading && (
          <div className="animate-pulse text-blue-300">Conectando ao backend...</div>
        )}

        {error && (
          <div className="text-red-400 bg-red-900/20 p-3 rounded">
            Erro ao conectar: Verifique se o Go está rodando!
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <p className="text-emerald-400 font-mono text-lg italic">
              "{data.message}"
            </p>
            <div className="text-sm text-slate-400 border-t border-slate-700 pt-4">
              Status: <span className="text-slate-200">{data.status}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App