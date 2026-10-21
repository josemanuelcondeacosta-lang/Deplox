export const currency = value => new Intl.NumberFormat('es-CO', {style:'currency',currency:'COP',maximumFractionDigits:0}).format(value);
export function initialState(type) {
  const shoes = type === 'zapateria';
  const rows = shoes ? [
    ['Tenis urbano','Calzado casual','38','Blanco',65000,120000,18],
    ['Tenis urbano','Calzado casual','39','Blanco',65000,120000,12],
    ['Sandalia clásica','Sandalias','37','Beige',35000,75000,4],
    ['Zapato formal','Calzado formal','40','Negro',80000,160000,9],
    ['Tenis deportivo','Deportivo','41','Azul',75000,145000,15],
    ['Bota urbana','Botas','39','Café',95000,185000,0]
  ] : [
    ['Camiseta básica','Ropa','M','Blanco',18000,42000,25],
    ['Jean clásico','Ropa','32','Azul',55000,110000,14],
    ['Reloj clásico','Accesorios','Única','Negro',65000,135000,8],
    ['Gorra urbana','Accesorios','Única','Beige',22000,48000,4],
    ['Tenis casual','Calzado','40','Blanco',70000,140000,10],
    ['Cinturón','Accesorios','Única','Café',20000,45000,0]
  ];
  return {version:1,type,products:rows.map((r,i)=>({id:`p${i+1}`,reference:`DEMO-${String(i+1).padStart(3,'0')}`,name:r[0],category:r[1],size:r[2],color:r[3],cost:r[4],price:r[5],stock:r[6],minimum:5})),transactions:[]};
}
export function validState(s,type) {
  return s?.version === 1 && s.type === type && Array.isArray(s.products) && s.products.length>0 && s.products.length<=500 && new Set(s.products.map(p=>p.id)).size===s.products.length && s.products.every(p=>['id','reference','name','category','size','color'].every(k=>typeof p[k]==='string') && ['price','cost','stock','minimum'].every(k=>Number.isFinite(p[k]) && p[k]>=0) && Number.isInteger(p.stock)) && Array.isArray(s.transactions) && s.transactions.length<=5000 && new Set(s.transactions.map(t=>t.id)).size===s.transactions.length && s.transactions.every(t=>['id','productId','productName','person','date'].every(k=>typeof t[k]==='string') && s.products.some(p=>p.id===t.productId) && ['sale','purchase'].includes(t.kind) && Number.isInteger(t.quantity) && t.quantity>0 && ['total','paid','cost'].every(k=>Number.isFinite(t[k])&&t[k]>=0) && t.paid<=t.total && Number.isFinite(Date.parse(t.date)));
}
export function saveProduct(state, input) {
  const product = {...input};
  for (const key of ['reference','name','category','size','color']) product[key]=String(product[key]??'').trim().slice(0,120);
  if (!product.reference || !product.name || !product.category) throw new Error('Completa referencia, nombre y categoría.');
  for (const key of ['cost','price','stock','minimum']) {
    if (product[key] === '' || !Number.isFinite(Number(product[key])) || Number(product[key])<0 || Number(product[key])>1000000000) throw new Error('Los precios y las existencias deben ser números positivos o cero.');
    product[key] = Number(product[key]);
  }
  if (!Number.isInteger(product.stock) || !Number.isInteger(product.minimum)) throw new Error('Las existencias deben ser números enteros.');
  if (state.products.some(p=>p.id!==product.id && p.reference.toLowerCase()===product.reference.toLowerCase())) throw new Error('Esa referencia ya existe. Usa otra para cada talla o variante.');
  const index=state.products.findIndex(p=>p.id===product.id);
  if (index<0) { if(state.products.length>=500) throw new Error('La demo admite hasta 500 productos.'); product.id=crypto.randomUUID(); state.products.push(product); }
  else state.products[index]=product;
  return product;
}
export function recordMovement(state, input) {
  const product=state.products.find(p=>p.id===input.productId);
  if (!product) throw new Error('Selecciona un producto.');
  if (!['sale','purchase'].includes(input.kind)) throw new Error('Movimiento no válido.');
  const quantity=Number(input.quantity);
  if (!Number.isInteger(quantity) || quantity<1 || quantity>1000000) throw new Error('Ingresa una cantidad entera mayor que cero.');
  if (input.kind==='sale' && quantity>product.stock) throw new Error(`Solo hay ${product.stock} unidades disponibles.`);
  if (state.transactions.length>=5000) throw new Error('Restablece la demo para registrar más movimientos.');
  const total=quantity*(input.kind==='sale'?product.price:product.cost);
  const paid=input.kind==='sale'?Number(input.paid):total;
  if (!Number.isFinite(paid) || paid<0 || paid>total) throw new Error('El abono debe estar entre cero y el total de la venta.');
  const person=String(input.person??'').trim().slice(0,120);
  if (!person) throw new Error(input.kind==='sale'?'Ingresa el nombre del cliente.':'Ingresa el nombre del proveedor.');
  const transaction={id:crypto.randomUUID(),kind:input.kind,productId:product.id,productName:`${product.name} · ${product.size}`,person,quantity,total,paid,cost:quantity*product.cost,date:new Date().toISOString(),cancelled:false};
  product.stock+=input.kind==='sale'?-quantity:quantity;
  state.transactions.unshift(transaction);
  return transaction;
}
export function cancelMovement(state,id) {
  const t=state.transactions.find(x=>x.id===id);
  if (!t || t.cancelled) throw new Error('El movimiento ya está anulado.');
  const p=state.products.find(x=>x.id===t.productId);
  if (t.kind==='purchase' && p.stock<t.quantity) throw new Error('No puedes anular esta compra: parte de sus unidades ya salió del inventario.');
  p.stock+=t.kind==='sale'?t.quantity:-t.quantity;
  t.cancelled=true;
}
export function metrics(state) {
  const active=state.transactions.filter(t=>!t.cancelled),sales=active.filter(t=>t.kind==='sale');
  return {units:state.products.reduce((a,p)=>a+p.stock,0),value:state.products.reduce((a,p)=>a+p.stock*p.cost,0),low:state.products.filter(p=>p.stock<=p.minimum).length,sales:sales.reduce((a,t)=>a+t.total,0),balance:sales.reduce((a,t)=>a+t.total-t.paid,0),profit:sales.reduce((a,t)=>a+t.total-t.cost,0),purchases:active.filter(t=>t.kind==='purchase').reduce((a,t)=>a+t.total,0)};
}
