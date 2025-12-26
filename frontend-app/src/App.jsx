import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  LayoutDashboard, Package, TrendingUp, LogOut, ShoppingBag, Lock, User, Users, Trash2,
  Printer, Plus, Minus, X, ShoppingCart, Search, CreditCard, DollarSign,
  ClipboardList, FileSpreadsheet, Wallet, Archive, Edit, Calendar, Tag, Truck
} from 'lucide-react';
import { generarBoleta } from './utils/pdfGenerator';
import { Toaster, toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import './App.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [usuario, setUsuario] = useState(localStorage.getItem('usuario'));
  const [rolUsuario, setRolUsuario] = useState(localStorage.getItem('rol'));
  const [activeTab, setActiveTab] = useState('dashboard');

  const [productos, setProductos] = useState([])
  const [ventas, setVentas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [arqueos, setArqueos] = useState([])

  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [tipoComprobante, setTipoComprobante] = useState('TICKET');
  const [cliente, setCliente] = useState({ doc: '', nombre: '', direccion: '' });
  const [descuento, setDescuento] = useState(0);
  const [fechaAuditoria, setFechaAuditoria] = useState(new Date().toISOString().split('T')[0]);

  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', descripcion: '', precio: '', stock: '' })
  const [nuevoUsuario, setNuevoUsuario] = useState({ username: '', password: '', nombreCompleto: '', rol: 'VENDEDOR' })
  const [nuevoProveedor, setNuevoProveedor] = useState({ ruc: '', razonSocial: '', telefono: '', email: '', direccion: '' })
  const [arqueoData, setArqueoData] = useState("");
  const [idEditar, setIdEditar] = useState(null)
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [modal, setModal] = useState({ isOpen: false, title: '', msg: '', onConfirm: null });

  const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fechaFormateada = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);

  const authFetch = (url, options = {}) => {
    const headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
    if (options.method === 'POST' || options.method === 'PUT') headers['Content-Type'] = 'application/json';
    return fetch(url, { ...options, headers }).then(async response => {
      if (response.status === 401 || response.status === 403) {
        localStorage.clear(); setToken(null);
        toast.error("Sesión expirada");
        throw new Error("Sesión expirada");
      }
      return response;
    });
  }

  const cargarData = () => {
    if (!token) return;
    authFetch('http://localhost:8080/api/productos').then(res=>res.json()).then(setProductos).catch(()=>setProductos([]))
    authFetch('http://localhost:8080/api/productos/historial').then(res=>res.json()).then(setVentas).catch(()=>setVentas([]))
    authFetch('http://localhost:8080/api/arqueos').then(res=>res.json()).then(setArqueos).catch(()=>setArqueos([]))
    if (rolUsuario === 'ADMIN') {
      authFetch('http://localhost:8080/api/usuarios').then(res=>res.json()).then(setUsuarios).catch(()=>setUsuarios([]))
      authFetch('http://localhost:8080/api/productos/auditoria').then(res=>res.json()).then(setMovimientos).catch(()=>setMovimientos([]))
      authFetch('http://localhost:8080/api/proveedores').then(res=>res.json()).then(setProveedores).catch(()=>setProveedores([]))
    }
  }
  useEffect(() => { if (token) cargarData(); }, [token])

  const confirmarAccion = (title, msg, action) => { setModal({ isOpen: true, title, msg, onConfirm: () => { action(); setModal({ ...modal, isOpen: false }); } }); }

  const agregarAlCarrito = (p) => {
    const ex = carrito.find(i => i.id === p.id);
    if ((ex ? ex.cantidad : 0) + 1 > p.stock) return toast.error("Stock insuficiente");
    if (ex) setCarrito(carrito.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    else setCarrito([...carrito, { ...p, cantidad: 1 }]);
    toast.success("Agregado");
  };
  const restarDelCarrito = (id) => {
    const ex = carrito.find(i => i.id === id);
    if (ex.cantidad === 1) setCarrito(carrito.filter(i => i.id !== id));
    else setCarrito(carrito.map(i => i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i));
  };
  const eliminarDelCarrito = (id) => setCarrito(carrito.filter(item => item.id !== id));

  const handleDocInput = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    const limite = tipoComprobante === 'FACTURA' ? 11 : 8;
    if (valor.length <= limite) setCliente({ ...cliente, doc: valor });
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) return;
    if (tipoComprobante === 'FACTURA' && (cliente.doc.length !== 11 || !cliente.nombre)) return toast.error("RUC (11) y Razón Social requeridos");
    if (tipoComprobante === 'BOLETA' && cliente.doc.length !== 8) return toast.error("DNI (8) requerido");
    const subtotal = carrito.reduce((a,i)=>a+(i.precio*i.cantidad),0);
    const totalPagar = subtotal - descuento;
    if (totalPagar < 0) return toast.error("Descuento inválido");

    confirmarAccion("Confirmar Venta", `Total: S/ ${totalPagar.toFixed(2)}`, async () => {
      const t = toast.loading(`Procesando...`);
      try {
        for (const item of carrito) await authFetch(`http://localhost:8080/api/productos/${item.id}/venta?cantidad=${item.cantidad}`, { method: 'POST' });
        await generarBoleta(carrito, subtotal, Date.now().toString().slice(-6), tipoComprobante, cliente, descuento);
        setCarrito([]); setCliente({ doc: '', nombre: '', direccion: '' }); setTipoComprobante('TICKET'); setDescuento(0); cargarData(); toast.success("Venta Exitosa", { id: t });
      } catch { toast.error("Error", { id: t }); }
    });
  };

  const handleSubmitProducto = (e) => { e.preventDefault(); const p={...nuevoProducto, precio:parseFloat(nuevoProducto.precio), stock:parseInt(nuevoProducto.stock)}; const url=idEditar?`http://localhost:8080/api/productos/${idEditar}`:'http://localhost:8080/api/productos'; const m=idEditar?'PUT':'POST'; confirmarAccion("Guardar", "Confirmar cambios", ()=>toast.promise(authFetch(url,{method:m, body:JSON.stringify(p)}),{loading:'Guardando...', success:()=>{setNuevoProducto({nombre:'',descripcion:'',precio:'',stock:''});setIdEditar(null);cargarData();return 'Guardado'}, error:'Error'})); }
  const handleEliminarProducto = (id) => confirmarAccion("Eliminar", "¿Borrar?", () => authFetch(`http://localhost:8080/api/productos/${id}`,{method:'DELETE'}).then(()=>{cargarData();toast.success("Eliminado")}));
  const handleEditarProductoClick = (p) => { setIdEditar(p.id); setNuevoProducto(p); };

  const handleSubmitUsuario = (e) => { e.preventDefault(); confirmarAccion("Crear", "¿Nuevo usuario?", () => toast.promise(authFetch('http://localhost:8080/api/usuarios',{method:'POST', body:JSON.stringify(nuevoUsuario)}),{loading:'Creando...', success:()=>{setNuevoUsuario({username:'',password:'',nombreCompleto:'',rol:'VENDEDOR'});cargarData();return 'Usuario Creado'}, error:'Error'})); }
  const handleEliminarUsuario = (id) => confirmarAccion("Eliminar", "¿Borrar usuario?", () => authFetch(`http://localhost:8080/api/usuarios/${id}`,{method:'DELETE'}).then(()=>{cargarData();toast.success("Eliminado")}));
  const handleSubmitProveedor = (e) => { e.preventDefault(); confirmarAccion("Guardar", "¿Confirmar?", () => toast.promise(authFetch('http://localhost:8080/api/proveedores',{method:'POST', body:JSON.stringify(nuevoProveedor)}),{loading:'Guardando...', success:()=>{setNuevoProveedor({ruc:'',razonSocial:'',telefono:'',email:'',direccion:''});cargarData();return 'Proveedor Guardado'}, error:'Error'})); }
  const handleEliminarProveedor = (id) => confirmarAccion("Eliminar", "¿Borrar?", () => authFetch(`http://localhost:8080/api/proveedores/${id}`,{method:'DELETE'}).then(()=>{cargarData();toast.success("Eliminado")}));
  const realizarArqueo = (e) => { e.preventDefault(); confirmarAccion("Cerrar Caja", "¿Confirmar?", () => { const hoy = new Date().toLocaleDateString(); const totalSistema = ventas.filter(v => new Date(v.fecha).toLocaleDateString() === hoy).reduce((acc, v) => acc + (v.totalVenta||0), 0); toast.promise(authFetch('http://localhost:8080/api/arqueos', { method: 'POST', body: JSON.stringify({ montoSistema: totalSistema, montoReal: parseFloat(arqueoData), usuario: usuario }) }), { loading:'Guardando...', success:()=>{setArqueoData(""); cargarData(); return "Caja Cerrada"}, error:'Error'}); }); }
  const exportarExcel = () => confirmarAccion("Excel", "¿Descargar?", () => { const d=movimientos.filter(m=>m.fecha.startsWith(fechaAuditoria)); const ws=XLSX.utils.json_to_sheet(d); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Kardex"); XLSX.writeFile(wb, `Reporte_${fechaAuditoria}.xlsx`); });
  const handleLogin = (e) => { e.preventDefault(); fetch('http://localhost:8080/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginData) }).then(async r=>{if(!r.ok)throw new Error();return r.json()}).then(d=>{localStorage.setItem('token',d.token);localStorage.setItem('usuario',d.username);localStorage.setItem('rol',d.rol);setToken(d.token);setUsuario(d.username);setRolUsuario(d.rol);setActiveTab('dashboard');}).catch(()=>toast.error('Error Credenciales')); }
  const handleLogout = () => confirmarAccion("Salir", "¿Cerrar sesión?", () => { localStorage.clear(); setToken(null); });
  const handleReimprimir = (v) => confirmarAccion("Reimprimir", "¿Copia?", () => generarBoleta([{nombre:v.producto?.nombre||'X', cantidad:1, precio:v.totalVenta}], v.totalVenta, v.id, 'TICKET', {}, 0));

  if (!token) return (<div className="login-container"><Toaster position="bottom-right"/><div className="login-card animate-fade"><div style={{textAlign:'center',marginBottom:'30px'}}><div style={{background:'var(--primary)',width:'60px',height:'60px',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 15px',color:'white'}}><Package size={32}/></div><h2 style={{margin:0}}>ERP Calzados</h2></div><form onSubmit={handleLogin} style={{display:'grid',gap:'15px'}}><input placeholder="Usuario" value={loginData.username} onChange={e=>setLoginData({...loginData,username:e.target.value})}/><input type="password" placeholder="Contraseña" value={loginData.password} onChange={e=>setLoginData({...loginData,password:e.target.value})}/><button type="submit" className="btn-primary" style={{justifyContent:'center',padding:'12px'}}>Entrar</button></form></div></div>)

  /* --- VISTAS REFACTORIZADAS CON CLASES CSS --- */

  const DashboardView = () => {
    const safeVentas = Array.isArray(ventas)?ventas:[]; const total = safeVentas.reduce((s,v)=>s+(v.totalVenta||0),0);
    const dataGraf = safeVentas.reduce((acc,v)=>{const n=v.producto?.nombre||'X'; const f=acc.find(i=>i.name===n); if(f){f.t+=v.totalVenta}else{acc.push({name:n,t:v.totalVenta})} return acc},[]).sort((a,b)=>b.t-a.t).slice(0,5);
    return (
      <div className="view-container">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><h1 className="header-title">Panel de Control</h1><div className="header-subtitle">📅 {fechaFormateada}</div></div></div>
        <div className="dashboard-metrics"><div className="card" style={{borderLeft:'5px solid #2563eb'}}><div><p className="header-subtitle">Ingresos</p><h2>S/ {total.toFixed(2)}</h2></div></div><div className="card" style={{borderLeft:'5px solid #10b981'}}><div><p className="header-subtitle">Ventas</p><h2>{safeVentas.length}</h2></div></div><div className="card" style={{borderLeft:'5px solid #f59e0b'}}><div><p className="header-subtitle">Stock</p><h2>{Array.isArray(productos)?productos.reduce((a,p)=>a+(p.stock||0),0):0}</h2></div></div></div>
        <div className="dashboard-charts">
          <div className="card" style={{flex:2, display:'flex', flexDirection:'column'}}><h3>🔥 Top 5 Productos</h3><div style={{flex:1, minHeight:'0'}}><ResponsiveContainer width="100%" height="100%"><BarChart data={dataGraf} layout="vertical" margin={{top:5,right:30,left:40,bottom:5}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" hide/><YAxis type="category" dataKey="name" width={150} tick={{fontSize:12}}/><Tooltip/><Bar dataKey="t" fill="#2563eb" radius={[0,4,4,0]} barSize={30}/></BarChart></ResponsiveContainer></div></div>
          <div className="card card-scrollable"><div style={{padding:'15px', borderBottom:'1px solid #eee'}}><h3>Últimas Ventas</h3></div><div className="table-wrapper"><table className="tabla-usuarios"><tbody>{safeVentas.slice().reverse().slice(0,8).map(v=>(<tr key={v.id}><td><div>{v.producto?.nombre}</div><small style={{color:'#999'}}>{v.fecha?new Date(v.fecha).toLocaleDateString():'-'}</small></td><td style={{textAlign:'right'}}>S/ {(v.totalVenta||0).toFixed(2)}</td><td style={{textAlign:'center'}}><button onClick={()=>handleReimprimir(v)} style={{border:'none',background:'none',cursor:'pointer',color:'#64748b'}}><Printer size={16}/></button></td></tr>))}</tbody></table></div></div>
        </div>
      </div>
    )
  }

  const PosView = () => {
    const safeProductos = Array.isArray(productos)?productos:[]; const totalCarrito = carrito.reduce((a,i)=>a+(i.precio*i.cantidad),0); const totalPagar = totalCarrito - descuento;
    return (
      <div className="pos-container animate-fade">
        <div className="pos-catalog card" style={{padding:'20px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'15px'}}><div><h1 className="header-title">Punto de Venta</h1></div><div style={{position:'relative',width:'250px'}}><Search size={18} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#9ca3af'}}/><input placeholder="Buscar..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{padding:'10px 10px 10px 35px'}}/></div></div>
          <div className="pos-grid">{safeProductos.filter(p=>p.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(p=>(<div key={p.id} className="card product-card"><div className="product-info"><h3 className="product-name" title={p.nombre}>{p.nombre}</h3><p className="product-desc">{p.descripcion||'-'}</p></div><div className="product-actions"><div className="product-price-stock"><span className="product-price">S/ {p.precio}</span><span className="product-stock" style={{color:p.stock<5?'red':'green'}}>{p.stock} u.</span></div><div className="product-buttons">{p.stock>0?<button onClick={()=>agregarAlCarrito(p)} className="btn-primary" style={{flex:1,fontSize:'0.8rem',padding:'8px'}}><Plus size={14}/> Agregar</button>:<button disabled className="btn-primary" style={{flex:1,background:'#e2e8f0',color:'#94a3b8',padding:'8px'}}>Agotado</button>}</div></div></div>))}</div>
        </div>
        <div className="pos-cart card" style={{padding:0}}>
          <div style={{padding:'15px',borderBottom:'1px solid #e2e8f0'}}><h3 style={{margin:0,display:'flex',alignItems:'center',gap:'10px'}}><ShoppingCart size={20}/> Carrito</h3></div>
          <div style={{flex:1,overflowY:'auto',padding:'15px'}}>{carrito.length===0?<div style={{textAlign:'center',marginTop:'50px',color:'#94a3b8'}}><ShoppingBag size={48} style={{opacity:0.5}}/><p>Vacío</p></div>:<div style={{display:'flex',flexDirection:'column',gap:'10px'}}>{carrito.map(i=>(<div key={i.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:'10px',borderBottom:'1px dashed #e2e8f0'}}><div style={{flex:1}}><div style={{fontSize:'0.9rem',fontWeight:'600'}}>{i.nombre}</div><div style={{fontSize:'0.8rem',color:'#64748b'}}>S/ {i.precio} x {i.cantidad}</div></div><div style={{display:'flex',gap:'5px',alignItems:'center'}}><button onClick={()=>restarDelCarrito(i.id)} className="btn-icon-sm"><Minus size={14}/></button><b style={{fontSize:'0.9rem',minWidth:'20px',textAlign:'center'}}>{i.cantidad}</b><button onClick={()=>agregarAlCarrito(i)} className="btn-icon-sm"><Plus size={14}/></button><button onClick={()=>eliminarDelCarrito(i.id)} style={{border:'none',background:'none',color:'#ef4444',cursor:'pointer'}}><X size={16}/></button></div></div>))}</div>}</div>
          <div style={{padding:'15px',background:'#f8fafc',borderTop:'1px solid #e2e8f0',display:'flex',flexDirection:'column',gap:'10px'}}><div style={{display:'flex',gap:'5px',background:'#e2e8f0',padding:'4px',borderRadius:'8px'}}>{['TICKET','BOLETA','FACTURA'].map(t=>(<button key={t} onClick={()=>{setTipoComprobante(t);if(t==='TICKET')setCliente({doc:'',nombre:'',direccion:''})}} style={{flex:1,border:'none',padding:'6px',borderRadius:'6px',cursor:'pointer',fontSize:'0.7rem',fontWeight:'bold',background:tipoComprobante===t?'white':'transparent',color:tipoComprobante===t?'var(--primary)':'#64748b'}}>{t}</button>))}</div>{tipoComprobante!=='TICKET'&&<div className="animate-fade" style={{display:'flex',flexDirection:'column',gap:'8px'}}><div style={{position:'relative'}}><input placeholder={tipoComprobante==='FACTURA'?'RUC (11)':'DNI (8)'} value={cliente.doc} onChange={handleDocInput} style={{padding:'8px 8px 8px 30px',fontSize:'0.85rem'}}/><Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/></div><input placeholder="Nombre / Razón Social" value={cliente.nombre} onChange={e=>setCliente({...cliente,nombre:e.target.value})} style={{padding:'8px',fontSize:'0.8rem'}}/>{tipoComprobante==='FACTURA'&&<input placeholder="Dirección Fiscal" value={cliente.direccion} onChange={e=>setCliente({...cliente,direccion:e.target.value})} style={{padding:'8px',fontSize:'0.8rem'}}/>}</div>}<div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:'0.9rem',color:'#64748b'}}>Subtotal:</span><span style={{fontSize:'0.9rem',fontWeight:'600'}}>S/ {totalCarrito.toFixed(2)}</span></div><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:'0.9rem',color:'#ef4444',display:'flex',alignItems:'center',gap:'5px'}}><Tag size={14}/> Dscto:</span><input type="number" min="0" value={descuento} onChange={e=>setDescuento(Number(e.target.value))} style={{width:'80px',padding:'4px',textAlign:'right',borderColor:'#ef4444',color:'#ef4444',fontSize:'0.9rem',fontWeight:'bold'}} placeholder="0.00"/></div><div style={{display:'flex',justifyContent:'space-between',marginTop:'5px',fontWeight:'bold',fontSize:'1.2rem',color:'#0f172a'}}><span>Total</span><span>S/ {Math.max(0,totalPagar).toFixed(2)}</span></div><button onClick={procesarVenta} disabled={carrito.length===0} className="btn-primary" style={{width:'100%',justifyContent:'center',fontSize:'1rem'}}>{tipoComprobante==='TICKET'?'PAGAR RÁPIDO':'EMITIR COMPROBANTE'}</button></div>
        </div>
      </div>
    )
  }

  const InventarioView = () => {
    const safeProductos = Array.isArray(productos)?productos:[];
    return (
      <div className="view-split">
        <div className="card card-scrollable split-content">
          <div style={{padding:'20px',borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3 style={{margin:0}}>Inventario</h3><div style={{fontSize:'0.9rem',color:'#64748b'}}>{safeProductos.length} Prod.</div></div>
          <div className="table-wrapper"><table className="tabla-usuarios"><thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Acción</th></tr></thead><tbody>{safeProductos.map(p=>(<tr key={p.id}><td><div style={{fontWeight:'600'}}>{p.nombre}</div></td><td>S/ {p.precio.toFixed(2)}</td><td><span style={{padding:'4px 10px',borderRadius:'12px',fontSize:'0.75rem',fontWeight:'bold',background:p.stock<5?'#fee2e2':'#dcfce7',color:p.stock<5?'#ef4444':'#166534'}}>{p.stock} u.</span></td><td><div style={{display:'flex',gap:'5px'}}><button onClick={()=>{setIdEditar(p.id);setNuevoProducto(p)}} className="btn-icon-sm"><Edit size={14}/></button><button onClick={()=>handleEliminarProducto(p.id)} className="btn-icon-sm" style={{borderColor:'#fca5a5',color:'#ef4444'}}><Trash2 size={14}/></button></div></td></tr>))}</tbody></table></div>
        </div>
        <div className="card split-sidebar" style={{borderTop:'5px solid var(--primary)'}}>
          <h2 style={{margin:'0 0 20px 0',fontSize:'1.2rem',display:'flex',alignItems:'center',gap:'10px'}}><Archive size={20} className="text-primary"/> {idEditar?'Editar':'Nuevo'}</h2>
          <form onSubmit={handleSubmitProducto} style={{display:'grid',gap:'15px'}}>
            <input value={nuevoProducto.nombre} onChange={e=>setNuevoProducto({...nuevoProducto,nombre:e.target.value})} placeholder="Nombre" required/>
            <input value={nuevoProducto.descripcion} onChange={e=>setNuevoProducto({...nuevoProducto,descripcion:e.target.value})} placeholder="Descripción"/>
            <div style={{display:'flex',gap:'15px'}}><input type="number" step="0.01" value={nuevoProducto.precio} onChange={e=>setNuevoProducto({...nuevoProducto,precio:e.target.value})} placeholder="Precio" required/><input type="number" value={nuevoProducto.stock} onChange={e=>setNuevoProducto({...nuevoProducto,stock:e.target.value})} placeholder="Stock" required/></div>
            <div style={{display:'flex',gap:'10px'}}><button type="submit" className="btn-primary" style={{flex:1}}>{idEditar?'Actualizar':'Guardar'}</button>{idEditar&&<button type="button" onClick={()=>{setIdEditar(null);setNuevoProducto({nombre:'',descripcion:'',precio:'',stock:''})}} style={{padding:'10px',border:'1px solid #cbd5e1',background:'white',borderRadius:'8px',cursor:'pointer'}}>X</button>}</div>
          </form>
        </div>
      </div>
    )
  }

  const ProveedoresView = () => {
    return (
      <div className="view-split">
        <div className="card card-scrollable split-content">
          <div style={{padding:'20px',borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3 style={{margin:0}}>Proveedores</h3><div style={{fontSize:'0.9rem',color:'#64748b'}}>{proveedores.length} Prov.</div></div>
          <div className="table-wrapper"><table className="tabla-usuarios"><thead><tr><th>RUC</th><th>Razón Social</th><th>Contacto</th><th>Acción</th></tr></thead><tbody>{proveedores.map(p=>(<tr key={p.id}><td><span style={{fontFamily:'monospace',background:'#f1f5f9',padding:'4px 8px',borderRadius:'6px'}}>{p.ruc}</span></td><td><div style={{fontWeight:'600'}}>{p.razonSocial}</div><small style={{color:'#64748b'}}>{p.direccion}</small></td><td><div>{p.telefono}</div><small style={{color:'#64748b'}}>{p.email}</small></td><td><button onClick={()=>handleEliminarProveedor(p.id)} className="btn-icon-sm" style={{borderColor:'#fca5a5',color:'#ef4444'}}><Trash2 size={14}/></button></td></tr>))}</tbody></table></div>
        </div>
        <div className="card split-sidebar" style={{borderTop:'5px solid var(--primary)'}}>
          <h2 style={{margin:'0 0 20px 0',fontSize:'1.2rem',display:'flex',alignItems:'center',gap:'10px'}}><Truck size={20} className="text-primary"/> Nuevo Proveedor</h2>
          <form onSubmit={handleSubmitProveedor} style={{display:'grid',gap:'15px'}}>
            <input placeholder="RUC (11 dígitos)" value={nuevoProveedor.ruc} onChange={e=>setNuevoProveedor({...nuevoProveedor,ruc:e.target.value})} maxLength={11} required/>
            <input placeholder="Razón Social" value={nuevoProveedor.razonSocial} onChange={e=>setNuevoProveedor({...nuevoProveedor,razonSocial:e.target.value})} required/>
            <input placeholder="Dirección" value={nuevoProveedor.direccion} onChange={e=>setNuevoProveedor({...nuevoProveedor,direccion:e.target.value})}/>
            <div style={{display:'flex',gap:'15px'}}><input placeholder="Teléfono" value={nuevoProveedor.telefono} onChange={e=>setNuevoProveedor({...nuevoProveedor,telefono:e.target.value})}/><input placeholder="Email" value={nuevoProveedor.email} onChange={e=>setNuevoProveedor({...nuevoProveedor,email:e.target.value})}/></div>
            <button type="submit" className="btn-primary" style={{marginTop:'10px'}}>Guardar</button>
          </form>
        </div>
      </div>
    )
  }

  const CajaView = () => {
    const hoy = new Date().toLocaleDateString(); const ventasHoy = ventas.filter(v => new Date(v.fecha).toLocaleDateString() === hoy).reduce((acc, v) => acc + (v.totalVenta||0), 0);
    return (
      <div className="view-split">
        {rolUsuario==='ADMIN'&&<div className="card split-sidebar" style={{height:'fit-content'}}><h2 style={{margin:'0 0 20px 0',display:'flex',alignItems:'center',gap:'10px'}}><Wallet/> Cierre de Caja</h2><div style={{background:'#f0f9ff',padding:'15px',borderRadius:'12px',marginBottom:'20px',border:'1px solid #bae6fd'}}><div style={{color:'#0369a1',fontSize:'0.9rem',marginBottom:'5px'}}>Ventas Sistema ({hoy}):</div><div style={{fontSize:'2rem',fontWeight:'800',color:'#0284c7'}}>S/ {ventasHoy.toFixed(2)}</div></div><form onSubmit={realizarArqueo} style={{display:'grid',gap:'15px'}}><label style={{fontWeight:'600',color:'#475569'}}>Dinero Físico (Billetes):</label><input type="number" step="0.01" placeholder="0.00" value={arqueoData} onChange={e=>setArqueoData(e.target.value)} required style={{fontSize:'1.2rem',padding:'12px'}}/><button type="submit" className="btn-primary" style={{justifyContent:'center',padding:'14px',fontSize:'1rem'}}>Realizar Cierre</button></form></div>}
        <div className="card card-scrollable split-content"><div style={{padding:'20px',borderBottom:'1px solid #eee'}}><h3>Historial</h3></div><div className="table-wrapper"><table className="tabla-usuarios"><thead><tr><th>Fecha</th><th>Sistema</th><th>Real</th><th>Dif.</th><th>Usuario</th></tr></thead><tbody>{arqueos.map(a=>(<tr key={a.id}><td>{new Date(a.fecha).toLocaleString()}</td><td>S/ {a.montoSistema.toFixed(2)}</td><td>S/ {a.montoReal.toFixed(2)}</td><td style={{fontWeight:'bold',color:a.diferencia===0?'green':a.diferencia<0?'red':'blue'}}>{a.diferencia===0?'OK':`S/ ${a.diferencia.toFixed(2)}`}</td><td>{a.usuario}</td></tr>))}</tbody></table></div></div>
      </div>
    )
  }

  const UsersView = () => (
    <div className="view-split">
      <div className="card card-scrollable split-content"><div style={{padding:'15px',borderBottom:'1px solid #eee'}}><h3>Nómina</h3></div><div className="table-wrapper"><table className="tabla-usuarios"><thead><tr><th>User</th><th>Nombre</th><th>Rol</th><th>X</th></tr></thead><tbody>{usuarios.map(u=>(<tr key={u.id}><td>{u.username}</td><td>{u.nombreCompleto}</td><td>{u.rol}</td><td>{u.username!=='admin'&&<button onClick={()=>handleEliminarUsuario(u.id)} className="btn-icon-sm" style={{borderColor:'#fca5a5',color:'red'}}><Trash2 size={16}/></button>}</td></tr>))}</tbody></table></div></div>
      <div className="card split-sidebar" style={{height:'fit-content'}}><h3>Nuevo Usuario</h3><form onSubmit={handleSubmitUsuario} style={{display:'grid',gap:'10px'}}><input placeholder="Nombre" value={nuevoUsuario.nombreCompleto} onChange={e=>setNuevoUsuario({...nuevoUsuario,nombreCompleto:e.target.value})} required/><input placeholder="Usuario" value={nuevoUsuario.username} onChange={e=>setNuevoUsuario({...nuevoUsuario,username:e.target.value})} required/><input type="password" placeholder="Pass" value={nuevoUsuario.password} onChange={e=>setNuevoUsuario({...nuevoUsuario,password:e.target.value})} required/><select value={nuevoUsuario.rol} onChange={e=>setNuevoUsuario({...nuevoUsuario,rol:e.target.value})}><option value="VENDEDOR">Vendedor</option><option value="ADMIN">Admin</option></select><button className="btn-primary" style={{justifyContent:'center'}}>Crear</button></form></div>
    </div>
  )

  const KardexView = () => {
    const d = movimientos.filter(m => m.fecha.startsWith(fechaAuditoria));
    return (
      <div className="view-container">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><h1 className="header-title">Auditoría</h1></div><div style={{display:'flex',gap:'15px',alignItems:'center'}}><div className="date-selector-container"><Calendar size={18} color="#64748b"/><input type="date" value={fechaAuditoria} onChange={e => setFechaAuditoria(e.target.value)} className="input-date-styled"/></div><button onClick={exportarExcel} className="btn-primary" style={{background:'#10b981',padding:'10px 20px'}}><FileSpreadsheet size={18}/> Excel</button></div></div>
        <div className="card card-scrollable"><div className="table-wrapper"><table className="tabla-usuarios"><thead><tr><th>Hora</th><th>Tipo</th><th>Producto</th><th>Cant.</th><th>Usuario</th></tr></thead><tbody>{d.length>0?d.map(m=>(<tr key={m.id}><td style={{color:'#64748b',fontFamily:'monospace'}}>{new Date(m.fecha).toLocaleTimeString()}</td><td><span style={{padding:'4px 10px',borderRadius:'6px',fontSize:'0.75rem',fontWeight:'bold',background:m.tipo.includes('INGRESO')?'#dcfce7':'#fee2e2',color:m.tipo.includes('INGRESO')?'#166534':'#991b1b'}}>{m.tipo}</span></td><td>{m.producto}</td><td>{m.cantidad}</td><td>{m.usuario}</td></tr>)):<tr><td colSpan="5" style={{textAlign:'center',padding:'40px',color:'#9ca3af',fontStyle:'italic'}}>No hay movimientos registrados en esta fecha 📅</td></tr>}</tbody></table></div></div>
      </div>
    )
  }

  return (
    <div className="dashboard-layout"><Toaster position="bottom-right"/>{modal.isOpen&&<div className="modal-overlay"><div className="modal-box"><h3>{modal.title}</h3><p>{modal.msg}</p><div className="modal-actions"><button className="btn-cancel" onClick={()=>setModal({...modal,isOpen:false})}>Cancelar</button><button className="btn-confirm" onClick={modal.onConfirm}>Confirmar</button></div></div></div>}<nav className="sidebar"><div className="logo"><Package/> ERP Calzados</div><div className="nav-links"><button className={`nav-btn ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}><LayoutDashboard/> Panel</button><button className={`nav-btn ${activeTab==='inventario'?'active':''}`} onClick={()=>setActiveTab('inventario')}><ShoppingCart/> Venta</button>{rolUsuario==='ADMIN'&&<button className={`nav-btn ${activeTab==='gestion_productos'?'active':''}`} onClick={()=>setActiveTab('gestion_productos')}><Archive/> Inventario</button>}{rolUsuario==='ADMIN'&&<button className={`nav-btn ${activeTab==='proveedores'?'active':''}`} onClick={()=>setActiveTab('proveedores')}><Truck/> Proveedores</button>}<button className={`nav-btn ${activeTab==='caja'?'active':''}`} onClick={()=>setActiveTab('caja')}><Wallet/> Caja / Cierre</button>{rolUsuario==='ADMIN'&&<><button className={`nav-btn ${activeTab==='usuarios'?'active':''}`} onClick={()=>setActiveTab('usuarios')}><Users/> RRHH</button><button className={`nav-btn ${activeTab==='kardex'?'active':''}`} onClick={()=>setActiveTab('kardex')}><ClipboardList/> Auditoría</button></>}</div><div style={{marginTop:'auto',padding:'10px',background:'rgba(255,255,255,0.1)',borderRadius:'8px'}}><small style={{color:'#aaa'}}>{usuario}</small><button onClick={handleLogout} style={{marginTop:'5px',width:'100%',background:'transparent',border:'1px solid #ef4444',color:'#ef4444',borderRadius:'4px',cursor:'pointer'}}>Salir</button></div></nav><main className="main-content">{activeTab==='dashboard'&&DashboardView()}{activeTab==='inventario'&&PosView()}{activeTab==='gestion_productos'&&rolUsuario==='ADMIN'&&InventarioView()}{activeTab==='proveedores'&&rolUsuario==='ADMIN'&&ProveedoresView()}{activeTab==='caja'&&CajaView()}{activeTab==='usuarios'&&rolUsuario==='ADMIN'&&UsersView()}{activeTab==='kardex'&&rolUsuario==='ADMIN'&&KardexView()}</main></div>
  )
}

export default App