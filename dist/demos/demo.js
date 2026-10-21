import {initialState,validState,saveProduct,recordMovement,cancelMovement,metrics,currency} from './model.js';
const type=new URLSearchParams(location.search).get('app')==='zapateria'?'zapateria':'inventario';
const key=`deplox-demo-${type}-v1`;
const $=s=>document.querySelector(s);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=initialState(type),persistent=true;
try{const saved=JSON.parse(localStorage.getItem(key));if(validState(saved,type))state=saved;localStorage.setItem(key,JSON.stringify(state));}catch{persistent=false;}
document.body.classList.toggle('shoes',type==='zapateria');
$('#app-name').textContent=type==='zapateria'?'Zapatería':'Inventario';
document.title=`${type==='zapateria'?'Zapatería':'Inventario'} — Demo Deplox`;
if(!persistent){const note=document.createElement('p');note.className='storage-note';note.textContent='El navegador no permite guardar datos. Puedes probar la demo; los cambios durarán hasta cerrar esta página.';$('.content').prepend(note);}
let current='inicio',query='',filter='',toastTimer;
function notify(message,error=false){const toast=$('#toast');toast.textContent=message;toast.classList.toggle('error',error);toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,5500);}
function persist(){try{localStorage.setItem(key,JSON.stringify(state));}catch{notify('El cambio funciona durante esta sesión, pero el navegador no pudo guardarlo.',true);}}
const badge=p=>`<span class="pill ${p.stock===0?'zero':p.stock<=p.minimum?'low':''}">${p.stock===0?'Agotado':p.stock<=p.minimum?`Stock bajo (${p.stock})`:`${p.stock} disponibles`}</span>`;
const date=t=>new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(t.date));
const metric=(title,value,note)=>`<article class="metric"><span>${title}</span><strong>${value}</strong><small>${note}</small></article>`;
function intro(title,description,button=''){return `<div class="intro"><div><h2>${title}</h2><p>${description}</p></div>${button}</div>`;}
function navigate(page,focus=false){current=['inicio','productos','ventas','compras','reportes'].includes(page)?page:'inicio';query='';filter='';location.hash=current;render();if(focus)$('#view').focus();}
function render(){
  document.querySelectorAll('[data-page]').forEach(b=>{b.classList.toggle('active',b.dataset.page===current);if(b.dataset.page===current)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  $('#page-title').textContent={inicio:'Inicio',productos:'Productos',ventas:'Ventas',compras:'Compras',reportes:'Reportes'}[current];
  const view=$('#view'),m=metrics(state);
  if(current==='inicio'){
    view.innerHTML=intro('Tu operación, de un vistazo.','Explora la demo: registra una venta y observa cómo cambian tus existencias.','<button class="btn" data-new="sale">+ Nueva venta</button>')+`<div class="metrics">${metric('VENTAS REGISTRADAS',currency(m.sales),'Movimientos de esta demostración')}${metric('UNIDADES EN STOCK',m.units,`${state.products.length} referencias y variantes`)}${metric('STOCK BAJO',m.low,'Referencias por reponer')}${metric('SALDO POR COBRAR',currency(m.balance),'Ventas con abonos parciales')}</div><div class="dashboard-grid"><section class="card"><div class="card-title"><h3>Últimos movimientos</h3><button data-go="ventas">Ver ventas ↗</button></div>${state.transactions.length?state.transactions.slice(0,5).map(t=>`<div class="stock-row"><div><strong>${t.kind==='sale'?'Venta':'Compra'} · ${escape(t.productName)}</strong><small>${escape(t.person)} · ${date(t)}</small></div><span class="pill ${t.cancelled?'cancelled':''}">${t.cancelled?'Anulado':currency(t.total)}</span></div>`).join(''):'<div class="empty">Todavía no hay movimientos.<br>Registra tu primera venta para ver aquí el resultado.<br><button class="btn secondary" data-new="sale">Registrar venta</button></div>'}</section><section class="card"><div class="card-title"><h3>Necesitan reposición</h3><button data-go="productos">Ver productos ↗</button></div>${state.products.filter(p=>p.stock<=p.minimum).map(p=>`<div class="stock-row"><div><strong>${escape(p.name)}</strong><small>Talla ${escape(p.size)} · ${escape(p.reference)}</small></div>${badge(p)}</div>`).join('')||'<div class="empty">Todas tus referencias tienen stock suficiente.</div>'}</section></div><div class="help"><strong>Prueba un flujo completo</strong>1. Registra una compra para aumentar existencias. &nbsp; 2. Haz una venta con abono parcial. &nbsp; 3. Consulta el saldo y el margen en Reportes.<br>Los datos son ficticios. Puedes restablecer la demo cuando quieras.</div>`;
  }else if(current==='productos'){
    view.innerHTML=intro('Tu catálogo, organizado.',`${state.products.length} referencias registradas. ${type==='zapateria'?'Cada talla tiene su propio stock.':'Control de productos, tallas y colores.'}`,'<button class="btn" data-add>+ Nuevo producto</button>')+`<div class="toolbar"><input id="search" type="search" aria-label="Buscar producto" placeholder="Buscar por nombre o referencia…"><select id="stock-filter" aria-label="Filtrar existencias"><option value="">Todos los productos</option><option value="low">Stock bajo</option><option value="zero">Agotados</option></select></div><div class="card table-scroll"><table><thead><tr><th>Producto</th><th>Categoría</th><th>Talla / color</th><th class="right">P. venta</th><th>Existencias</th><th class="right">Acciones</th></tr></thead><tbody id="product-rows"></tbody></table></div><p class="note">Los precios se muestran en pesos colombianos. Cada referencia identifica una variante.</p>`;
    renderProducts();
    $('#search').addEventListener('input',e=>{query=e.target.value;renderProducts();});$('#stock-filter').addEventListener('change',e=>{filter=e.target.value;renderProducts();});
  }else if(current==='ventas'||current==='compras'){
    const kind=current==='ventas'?'sale':'purchase',sale=kind==='sale',rows=state.transactions.filter(t=>t.kind===kind);
    view.innerHTML=intro(sale?'Ventas que mueven tu negocio.':'Mantén tu inventario al día.',sale?'Registra ventas y abonos. Las existencias se actualizan al instante.':'Registra entradas de mercancía y aumenta las existencias disponibles.',`<button class="btn" data-new="${kind}">+ Nueva ${sale?'venta':'compra'}</button>`)+`<div class="card table-scroll"><table><thead><tr><th>Fecha / estado</th><th>${sale?'Cliente':'Proveedor'}</th><th>Producto</th><th>Cantidad</th><th class="right">Total</th>${sale?'<th class="right">Saldo</th>':''}<th>Acciones</th></tr></thead><tbody>${rows.length?rows.map(t=>`<tr><td>${date(t)}<small>${t.cancelled?'Anulado':'Registrado'}</small></td><td>${escape(t.person)}</td><td>${escape(t.productName)}</td><td>${t.quantity}</td><td class="right">${currency(t.total)}</td>${sale?`<td class="right">${t.cancelled?'—':currency(t.total-t.paid)}</td>`:''}<td><button class="table-action" data-cancel="${escape(t.id)}" ${t.cancelled?'disabled':''}>${t.cancelled?'Anulado':'Anular'}</button></td></tr>`).join(''):`<tr><td colspan="${sale?7:6}"><div class="empty">No hay ${sale?'ventas':'compras'} registradas. Crea un movimiento para comenzar.</div></td></tr>`}</tbody></table></div><p class="note">Anular ${sale?'una venta devuelve las unidades al inventario':'una compra retira las unidades ingresadas, si hay existencias suficientes'}.</p>`;
  }else{
    const sales=state.transactions.filter(t=>t.kind==='sale'&&!t.cancelled),groups=new Map();
    sales.forEach(t=>groups.set(t.productName,(groups.get(t.productName)||0)+t.total));
    const max=Math.max(1,...groups.values());
    view.innerHTML=intro('Decisiones con contexto.','Resumen de los movimientos que has registrado en esta demostración.','<button class="btn secondary" data-export>Descargar CSV ↓</button>')+`<div class="metrics">${metric('VENTAS',currency(m.sales),'Ventas activas de la demo')}${metric('MARGEN BRUTO',currency(m.profit),'Ventas menos costo de productos')}${metric('COMPRAS',currency(m.purchases),'Entradas de mercancía')}${metric('SALDO PENDIENTE',currency(m.balance),'Total vendido menos abonos')}</div><div class="dashboard-grid"><section class="card"><div class="card-title"><h3>Ventas por producto</h3></div><div class="report-bars">${groups.size?[...groups.entries()].sort((a,b)=>b[1]-a[1]).map(([name,total])=>`<div class="report-row"><span>${escape(name)}</span><div class="bar"><i style="width:${total/max*100}%"></i></div><strong>${currency(total)}</strong></div>`).join(''):'<p class="report-empty">Registra una venta para ver el desglose por producto.</p>'}</div></section><section class="card"><div class="card-title"><h3>Valor del inventario</h3></div><div class="stock-row"><span>Existencias a costo</span><strong>${currency(m.value)}</strong></div><div class="stock-row"><span>Unidades disponibles</span><strong>${m.units}</strong></div><div class="stock-row"><span>Referencias con stock bajo</span><strong>${m.low}</strong></div></section></div><p class="note">El margen bruto no incluye gastos operativos ni impuestos. Reporte ilustrativo con datos de la demo.</p>`;
  }
}
function renderProducts(){
  const rows=state.products.filter(p=>(`${p.name} ${p.reference} ${p.category}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')))&&(!filter||(filter==='zero'?p.stock===0:p.stock<=p.minimum)));
  $('#product-rows').innerHTML=rows.length?rows.map(p=>`<tr><td><span class="item-symbol">▦</span><div class="product-name"><strong>${escape(p.name)}</strong><small>${escape(p.reference)}</small></div></td><td>${escape(p.category)}</td><td>${escape(p.size||'—')} / ${escape(p.color||'—')}</td><td class="right">${currency(p.price)}</td><td>${badge(p)}</td><td class="right"><button class="table-action" data-edit="${escape(p.id)}" aria-label="Editar ${escape(p.name)} ${escape(p.size)}">Editar</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">No hay productos que coincidan con tu búsqueda.</td></tr>';
}
function openProduct(id){
  const form=$('#product-form');form.reset();form.querySelector('.form-error').textContent='';
  const product=state.products.find(p=>p.id===id)||{id:'',reference:'',name:'',category:'',size:'',color:'',price:0,cost:0,stock:0,minimum:5};
  for(const [key,value] of Object.entries(product)){if(form.elements.namedItem(key))form.elements.namedItem(key).value=value;}
  $('#product-title').textContent=id?'Editar producto':'Nuevo producto';$('#editor').showModal();
}
function updateTotal(resetPaid=false){
  const f=$('#movement-form'),p=state.products.find(p=>p.id===f.elements.productId.value),sale=f.elements.kind.value==='sale',quantity=Number(f.elements.quantity.value)||0,total=p?quantity*(sale?p.price:p.cost):0;
  if(resetPaid)f.elements.paid.value=total;
  f.elements.paid.max=total;
  $('#movement-total').textContent=p?`Total: ${currency(total)} · Existencias: ${p.stock} · ${sale?'Precio':'Costo'} por unidad: ${currency(sale?p.price:p.cost)}`:'Selecciona un producto.';
}
function openMovement(kind){
  const f=$('#movement-form');f.reset();f.querySelector('.form-error').textContent='';f.elements.kind.value=kind;
  $('#movement-title').textContent=kind==='sale'?'Nueva venta':'Nueva compra';
  $('#person-label').firstChild.textContent=kind==='sale'?'Cliente':'Proveedor';
  $('#paid-label').hidden=kind!=='sale';f.elements.paid.required=kind==='sale';f.elements.paid.disabled=kind!=='sale';
  f.elements.productId.innerHTML=state.products.map(p=>`<option value="${escape(p.id)}">${escape(p.name)} · ${escape(p.size)} · ${escape(p.reference)} (${p.stock} un.)</option>`).join('');
  updateTotal(true);$('#movement').showModal();
}
function confirmAction(title,message,action){
  const d=$('#confirmation');$('#confirm-title').textContent=title;$('#confirm-message').textContent=message;d.returnValue='';
  d.addEventListener('close',()=>{if(d.returnValue==='confirm')action();},{once:true});d.showModal();
}
$('#view').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.go)navigate(b.dataset.go,true);
  if(b.hasAttribute('data-add'))openProduct();
  if(b.dataset.edit)openProduct(b.dataset.edit);
  if(b.dataset.new)openMovement(b.dataset.new);
  if(b.dataset.cancel)confirmAction('¿Anular este movimiento?','La demo actualizará las existencias y conservará el movimiento marcado como anulado.',()=>{try{cancelMovement(state,b.dataset.cancel);persist();render();notify('Movimiento anulado. Existencias actualizadas.');}catch(error){notify(error.message,true);}});
  if(b.hasAttribute('data-export'))exportCSV();
});
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page,true)));
window.addEventListener('hashchange',()=>{const page=location.hash.slice(1);if(page!==current)navigate(page);});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('#product-form').addEventListener('submit',e=>{e.preventDefault();try{saveProduct(state,Object.fromEntries(new FormData(e.target)));persist();$('#editor').close();render();notify('Producto guardado.');}catch(error){e.target.querySelector('.form-error').textContent=error.message;}});
$('#movement-form').addEventListener('submit',e=>{e.preventDefault();try{recordMovement(state,Object.fromEntries(new FormData(e.target)));persist();$('#movement').close();render();notify('Movimiento registrado. Existencias y reportes actualizados.');}catch(error){e.target.querySelector('.form-error').textContent=error.message;}});
$('#movement-form').elements.productId.addEventListener('change',()=>updateTotal(true));
$('#movement-form').elements.quantity.addEventListener('input',()=>updateTotal(true));
$('#reset').addEventListener('click',()=>confirmAction('¿Restablecer la demo?','Se eliminarán solo los cambios de esta demostración y volverán los productos ficticios iniciales.',()=>{state=initialState(type);persist();render();notify('Demo restablecida.');}));
function exportCSV(){
  const cell=v=>{let s=String(v??'');if(/^[=+\-@\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  const rows=[['Fecha','Tipo','Producto','Cliente o proveedor','Cantidad','Total COP','Abono COP','Estado'],...state.transactions.map(t=>[t.date,t.kind==='sale'?'Venta':'Compra',t.productName,t.person,t.quantity,t.total,t.paid,t.cancelled?'Anulado':'Activo'])];
  const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=`deplox-demo-${type}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Reporte descargado.');
}
navigate(location.hash.slice(1)||'inicio');
