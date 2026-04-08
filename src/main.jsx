import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:24,fontFamily:"sans-serif"}}>
          <h2 style={{color:"#DC2626"}}>エラーが発生しました</h2>
          <p style={{color:"#64748B",fontSize:13}}>{String(this.state.error)}</p>
          <button onClick={() => { localStorage.clear(); location.reload(); }}
            style={{marginTop:12,padding:"8px 16px",background:"#3B82F6",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontSize:14}}>
            データをリセットして再起動
          </button>
          <button onClick={() => location.reload()}
            style={{marginTop:12,marginLeft:8,padding:"8px 16px",background:"white",color:"#334155",border:"1px solid #E2E8F0",borderRadius:8,cursor:"pointer",fontSize:14}}>
            再読み込み
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
