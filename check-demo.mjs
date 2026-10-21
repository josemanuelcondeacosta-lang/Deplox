import assert from 'node:assert/strict';
import {initialState,recordMovement,cancelMovement,metrics,saveProduct,validState} from './dist/demos/model.js';
for(const type of ['zapateria','inventario']){
  const s=initialState(type),p=s.products[0],stock=p.stock;
  assert.ok(validState(s,type));
  const sale=recordMovement(s,{kind:'sale',productId:p.id,person:'Cliente demo',quantity:2,paid:1000});
  assert.equal(p.stock,stock-2);assert.equal(metrics(s).balance,sale.total-1000);
  const snap=JSON.stringify(s);
  assert.throws(()=>recordMovement(s,{kind:'sale',productId:p.id,person:'Cliente',quantity:p.stock+1,paid:0}));
  assert.throws(()=>recordMovement(s,{kind:'sale',productId:p.id,person:'Cliente',quantity:1.5,paid:0}));
  assert.throws(()=>recordMovement(s,{kind:'sale',productId:p.id,person:'Cliente',quantity:1,paid:p.price+1}));
  assert.equal(JSON.stringify(s),snap);
  cancelMovement(s,sale.id);assert.equal(p.stock,stock);assert.equal(metrics(s).sales,0);assert.equal(metrics(s).balance,0);
  assert.throws(()=>cancelMovement(s,sale.id));
  const purchase=recordMovement(s,{kind:'purchase',productId:p.id,person:'Proveedor demo',quantity:3});
  assert.equal(p.stock,stock+3);
  cancelMovement(s,purchase.id);assert.equal(p.stock,stock);
  const empty=s.products.find(p=>p.stock===0);
  const incoming=recordMovement(s,{kind:'purchase',productId:empty.id,person:'Proveedor',quantity:2});
  recordMovement(s,{kind:'sale',productId:empty.id,person:'Cliente',quantity:1,paid:0});
  assert.throws(()=>cancelMovement(s,incoming.id));assert.equal(empty.stock,1);
  saveProduct(s,{...p,id:'',reference:'NEW-DEMO',name:'Nuevo producto'});
  assert.equal(s.products.length,7);
  assert.throws(()=>saveProduct(s,{...p,id:'',reference:'NEW-DEMO'}));
  assert.ok(validState(JSON.parse(JSON.stringify(s)),type));
  console.log(`OK ${type}: ventas, abonos, stock, compras, anulaciones y productos`);
}
assert.notEqual(initialState('zapateria').products[0].name,initialState('inventario').products[0].name);
